import { v4 as uuid } from 'uuid'
import * as path from 'path'
import * as fs from 'fs/promises'
import { PlatformService } from '../system/PlatformService'
import { isPathAccessible } from '../../utils/fsUtils'
import { CATEGORY_LABELS } from '../../../shared/constants'
import type { ScanResult, ScanProgress, ScannedItem, ScanCategory } from '../../../shared/types'
import { logger } from '../../utils/logger'
import glob from 'fast-glob'

export class ScannerService {
  private cancelled = false
  private whitelist: string[] = []

  constructor(private platformService: PlatformService) {}

  async quickScan(
    options: { customPaths?: string[] },
    onProgress: (progress: ScanProgress) => void,
    whitelist: string[]
  ): Promise<ScanResult[]> {
    this.cancelled = false
    this.whitelist = whitelist
    const startTime = Date.now()
    const resultsMap = new Map<ScanCategory, ScannedItem[]>()
    const locations = this.platformService.getCommonScanPaths()

    let totalScanned = 0
    let lastProgressTime = 0

    // Process top locations with isolated sub-directory scanning for Application Caches
    for (let i = 0; i < locations.length; i++) {
      if (this.cancelled) break

      const location = locations[i]
      const expandedPath = this.platformService.expandPath(location.path)
      const accessible = await isPathAccessible(expandedPath)

      if (!accessible) continue

      const now = Date.now()
      if (now - lastProgressTime > 80) {
        lastProgressTime = now
        onProgress({
          phase: 'indexing',
          filesScanned: totalScanned,
          totalFound: Array.from(resultsMap.values()).reduce((sum, items) => sum + items.length, 0),
          currentPath: expandedPath,
          percentage: Math.min(99, Math.round((i / locations.length) * 100)),
        })
      }

      // Special handling for ~/Library/Caches: enumerate sub-folders independently
      let items: ScannedItem[] = []
      if (location.path.endsWith('/Caches') || location.path.endsWith('\\Caches')) {
        items = await this.scanAppCachesIndependently(expandedPath, location.category, location.label)
      } else {
        items = await this.scanLocationFast(expandedPath, location.category, location.label)
      }

      if (items.length === 0) continue
      totalScanned += items.length

      for (const item of items) {
        if (!resultsMap.has(item.category)) {
          resultsMap.set(item.category, [])
        }
        resultsMap.get(item.category)!.push(item)
      }
    }

    const duration = (Date.now() - startTime) / 1000
    const finalResults: ScanResult[] = []

    resultsMap.forEach((items, category) => {
      finalResults.push({
        id: uuid(),
        category,
        categoryLabel: CATEGORY_LABELS[category] || category,
        items,
        totalSize: items.reduce((sum, item) => sum + item.size, 0),
        scanDuration: duration,
      })
    })

    onProgress({
      phase: 'complete',
      filesScanned: totalScanned,
      totalFound: totalScanned,
      currentPath: '',
      percentage: 100,
    })

    return finalResults
  }

  async deepScan(
    options: { customPaths?: string[] },
    onProgress: (progress: ScanProgress) => void,
    whitelist: string[]
  ): Promise<ScanResult[]> {
    return this.quickScan(options, onProgress, whitelist)
  }

  cancel(): void {
    this.cancelled = true
  }

  // Scan Application Caches independently so EACCES on one system folder doesn't skip app caches
  private async scanAppCachesIndependently(
    cachesDir: string,
    category: ScanCategory,
    label: string
  ): Promise<ScannedItem[]> {
    const allItems: ScannedItem[] = []

    try {
      const subEntries = await fs.readdir(cachesDir, { withFileTypes: true }).catch(() => [])

      const appFolders = subEntries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => path.join(cachesDir, entry.name))

      for (const appFolder of appFolders) {
        if (this.cancelled) break
        if (this.isWhitelisted(appFolder)) continue

        const folderItems = await this.scanLocationFast(appFolder, category, `${path.basename(appFolder)} Cache`)
        allItems.push(...folderItems)
      }
    } catch {
      // Ignore root readdir failure
    }

    return allItems
  }

  private async scanLocationFast(
    dirPath: string,
    category: ScanCategory,
    label: string
  ): Promise<ScannedItem[]> {
    try {
      const entries = await glob('**/*', {
        cwd: dirPath,
        absolute: true,
        dot: true,
        stats: true,
        onlyFiles: true,
        suppressErrors: true,
        deep: 5,
      })

      const items: ScannedItem[] = []

      for (const entry of entries) {
        if (this.cancelled) break
        const filePath = entry.path
        if (this.isWhitelisted(filePath)) continue

        const stat = entry.stats
        const size = stat ? stat.size : 0

        const isSafe = this.isSafeToDelete(filePath)

        items.push({
          id: uuid(),
          path: filePath,
          size,
          type: 'file',
          lastModified: stat ? stat.mtimeMs : Date.now(),
          lastAccessed: stat ? stat.atimeMs : Date.now(),
          category,
          description: `${label} file`,
          safeToDelete: isSafe,
        })
      }

      return items
    } catch {
      return []
    }
  }

  private isWhitelisted(filePath: string): boolean {
    return this.whitelist.some(w => filePath === w || filePath.startsWith(w + path.sep))
  }

  // Ironclad Safety Guard: Strict protection rules to protect critical user files & system configs
  private isSafeToDelete(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/')

    // 1. Never delete macOS & Windows system core
    const systemProtected = [
      '/System/',
      '/usr/bin/',
      '/usr/sbin/',
      '/bin/',
      '/sbin/',
      '/etc/',
      '/var/db/',
      'C:/Windows/',
      'C:/Program Files/',
      'C:/Program Files (x86)/',
    ]
    if (systemProtected.some(p => normalized.includes(p))) return false

    // 2. Never delete User Credentials, Keys & Preferences
    const securityProtected = [
      '/.ssh/',
      '/.aws/',
      '/.kube/',
      '/.gnupg/',
      '/.keychain',
      '~/Library/Keychains/',
      '/Library/Keychains/',
      '~/Library/Preferences/',
      '/.git/',
      '/.env',
    ]
    if (securityProtected.some(p => normalized.includes(p))) return false

    // 3. Never delete User Documents, Code Workspaces, & Media
    const userWorkspaceProtected = [
      '/Documents/',
      '/Desktop/',
      '/Pictures/',
      '/Movies/',
      '/Music/',
      '/Projects/',
      '/Developer/',
      '/iCloud Drive/',
      '/Dropbox/',
      '/OneDrive/',
      '/Google Drive/',
    ]
    if (userWorkspaceProtected.some(p => normalized.includes(p))) return false

    // 4. Never delete active lock files
    if (normalized.endsWith('.lock') || normalized.endsWith('.lck') || normalized.includes('SingletonLock')) {
      return false
    }

    return true
  }
}
