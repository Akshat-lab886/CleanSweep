import { v4 as uuid } from 'uuid'
import * as path from 'path'
import * as fs from 'fs/promises'
import { PlatformService } from '../system/PlatformService'
import { isPathAccessible } from '../../utils/fsUtils'
import { CATEGORY_LABELS } from '../../../shared/constants'
import type { ScanResult, ScanProgress, ScannedItem, ScanCategory, ScanOptions } from '../../../shared/types'
import glob from 'fast-glob'

export class DeepScanService {
  private cancelled = false
  private whitelist: string[] = []

  constructor(private platformService: PlatformService) {}

  async deepScan(
    options: ScanOptions,
    onProgress: (progress: ScanProgress) => void,
    whitelist: string[]
  ): Promise<ScanResult[]> {
    this.cancelled = false
    this.whitelist = whitelist

    const startTime = Date.now()
    const resultsMap = new Map<ScanCategory, ScannedItem[]>()
    const includeHidden = options.includeHidden ?? false
    const minFileSizeBytes = options.minFileSizeBytes ?? 0
    const excludedExtensions = options.excludedExtensions ?? []
    const maxDepth = options.maxDepth ?? 10

    // Get deep scan paths - standard locations plus user custom paths
    const locations = this.getDeepScanPaths()
    const customPaths = (options.customPaths || []).filter(p => p.trim().length > 0)

    // Add custom paths as their own category
    const allLocations = [
      ...locations,
      ...customPaths.map(p => ({ path: p, category: 'system-junk' as ScanCategory, label: 'Custom Path' })),
    ]

    let totalScanned = 0
    let lastProgressTime = 0

    for (let i = 0; i < allLocations.length; i++) {
      if (this.cancelled) break

      const location = allLocations[i]
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
          percentage: Math.min(99, Math.round((i / allLocations.length) * 100)),
        })
      }

      // Special handling for ~/Library/Caches: enumerate sub-folders independently
      let items: ScannedItem[] = []
      if (location.path.endsWith('/Caches') || location.path.endsWith('\\Caches')) {
        items = await this.scanAppCachesIndependently(
          expandedPath,
          location.category,
          location.label,
          includeHidden,
          minFileSizeBytes,
          excludedExtensions,
          maxDepth
        )
      } else {
        items = await this.scanLocationDeep(
          expandedPath,
          location.category,
          location.label,
          includeHidden,
          minFileSizeBytes,
          excludedExtensions,
          maxDepth
        )
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

  cancel(): void {
    this.cancelled = true
  }

  private getDeepScanPaths(): Array<{ path: string; category: ScanCategory; label: string }> {
    if (this.platformService.isMac()) {
      return [
        // System & User Caches (deeper)
        { path: '~/Library/Caches', category: 'system-junk', label: 'User Application Caches' },
        { path: '/Library/Caches', category: 'system-junk', label: 'System Library Caches' },

        // Developer & Build Junk
        { path: '~/Library/Developer/Xcode/DerivedData', category: 'app-leftovers', label: 'Xcode DerivedData' },
        { path: '~/Library/Developer/Xcode/Archives', category: 'app-leftovers', label: 'Xcode Archives' },
        { path: '~/Library/Developer/Xcode/iOS Device Logs', category: 'logs', label: 'iOS Device Logs' },
        { path: '~/Library/Caches/CocoaPods', category: 'system-junk', label: 'CocoaPods Cache' },
        { path: '~/.npm/_cacache', category: 'system-junk', label: 'NPM Package Cache' },
        { path: '~/.npm/_logs', category: 'logs', label: 'NPM Execution Logs' },
        { path: '~/Library/Caches/Yarn', category: 'system-junk', label: 'Yarn Cache' },
        { path: '~/.cache/pnpm', category: 'system-junk', label: 'PNPM Package Store' },
        { path: '~/Library/Caches/Homebrew', category: 'system-junk', label: 'Homebrew Downloads' },
        { path: '~/.gradle/caches', category: 'system-junk', label: 'Gradle Build Caches' },
        { path: '~/Library/Caches/pip', category: 'system-junk', label: 'Python Pip Cache' },

        // Application & Diagnostic Logs
        { path: '~/Library/Logs', category: 'logs', label: 'User Application Logs' },
        { path: '~/Library/Logs/DiagnosticReports', category: 'logs', label: 'Diagnostic Crash Reports' },
        { path: '/Library/Logs', category: 'logs', label: 'System Logs' },
        { path: '~/Library/Application Support/CrashReporter', category: 'logs', label: 'Crash Reporter Data' },

        // App Saved States & Communication Caches
        { path: '~/Library/Saved Application State', category: 'app-leftovers', label: 'Saved App States' },
        { path: '~/Library/Application Support/Slack/Service Worker/CacheStorage', category: 'browser-cache', label: 'Slack Cache' },
        { path: '~/Library/Application Support/discord/Cache', category: 'browser-cache', label: 'Discord Cache' },
        { path: '~/Library/Application Support/Microsoft/Teams/Cache', category: 'browser-cache', label: 'Teams Cache' },

        // Temporary Files & System Trash
        { path: '/private/tmp', category: 'temp-files', label: 'System Temp Items' },
        { path: '/var/tmp', category: 'temp-files', label: 'Var Temp Items' },
        { path: '~/.Trash', category: 'trash', label: 'System Trash Bin' },

        // Additional deep scan locations
        { path: '~/Library/Application Support/Google/Chrome/Default/Cache', category: 'browser-cache', label: 'Chrome Cache' },
        { path: '~/Library/Application Support/Google/Chrome/Default/Code Cache', category: 'browser-cache', label: 'Chrome Code Cache' },
        { path: '~/Library/Application Support/Firefox/Profiles', category: 'browser-cache', label: 'Firefox Profiles' },
        { path: '~/Library/Application Support/com.apple.Safari', category: 'browser-cache', label: 'Safari Cache' },
        { path: '~/Library/WebKit', category: 'browser-cache', label: 'WebKit Data Store' },
        { path: '~/Library/Containers/com.apple.Safari/Data/Library/Caches', category: 'browser-cache', label: 'Safari Container Cache' },
        { path: '~/Library/Preferences/ByHost', category: 'system-junk', label: 'Preference ByHost' },
        { path: '~/Library/Application Support/com.apple.TCC', category: 'privacy', label: 'TCC Database' },
      ]
    }

    if (this.platformService.isWindows()) {
      return [
        { path: '%TEMP%', category: 'temp-files', label: 'User Temporary Files' },
        { path: '%SystemRoot%\\Temp', category: 'temp-files', label: 'Windows System Temp' },
        { path: '%LOCALAPPDATA%\\Temp', category: 'temp-files', label: 'Local AppData Temp' },
        { path: '%LOCALAPPDATA%\\CrashDumps', category: 'logs', label: 'Windows Crash Dumps' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\WER', category: 'logs', label: 'Error Reporting Logs' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\INetCache', category: 'browser-cache', label: 'INet Web Cache' },
        { path: '%USERPROFILE%\\.npm\\_cacache', category: 'system-junk', label: 'NPM Cache' },
        { path: '%USERPROFILE%\\.gradle\\caches', category: 'system-junk', label: 'Gradle Cache' },
        { path: '%LOCALAPPDATA%\\pip\\Cache', category: 'system-junk', label: 'Pip Package Cache' },
        { path: '%APPDATA%\\Microsoft\\Windows\\Recent', category: 'privacy', label: 'Recent Documents History' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer', category: 'system-junk', label: 'Explorer Thumbnails' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\Caches', category: 'system-junk', label: 'Windows Cache' },
        { path: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache', category: 'browser-cache', label: 'Chrome Cache' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache', category: 'browser-cache', label: 'Edge Cache' },
      ]
    }

    return []
  }

  // Scan Application Caches independently so EACCES on one system folder doesn't skip app caches
  private async scanAppCachesIndependently(
    cachesDir: string,
    category: ScanCategory,
    label: string,
    includeHidden: boolean,
    minFileSizeBytes: number,
    excludedExtensions: string[],
    maxDepth: number
  ): Promise<ScannedItem[]> {
    const allItems: ScannedItem[] = []

    try {
      const subEntries = await fs.readdir(cachesDir, { withFileTypes: true }).catch(() => [])

      const appFolders = subEntries
        .filter((entry) => entry.isDirectory() && (includeHidden || !entry.name.startsWith('.')))
        .map((entry) => path.join(cachesDir, entry.name))

      for (const appFolder of appFolders) {
        if (this.cancelled) break
        if (this.isWhitelisted(appFolder)) continue

        const folderItems = await this.scanLocationDeep(
          appFolder,
          category,
          `${path.basename(appFolder)} Cache`,
          includeHidden,
          minFileSizeBytes,
          excludedExtensions,
          maxDepth
        )
        allItems.push(...folderItems)
      }
    } catch {
      // Ignore root readdir failure
    }

    return allItems
  }

  private async scanLocationDeep(
    dirPath: string,
    category: ScanCategory,
    label: string,
    includeHidden: boolean,
    minFileSizeBytes: number,
    excludedExtensions: string[],
    maxDepth: number
  ): Promise<ScannedItem[]> {
    try {
      const entries = await glob('**/*', {
        cwd: dirPath,
        absolute: true,
        dot: includeHidden,
        stats: true,
        onlyFiles: true,
        suppressErrors: true,
        deep: maxDepth,
      })

      const items: ScannedItem[] = []

      for (const entry of entries) {
        if (this.cancelled) break
        const filePath = entry.path
        if (this.isWhitelisted(filePath)) continue

        const stat = entry.stats
        const size = stat ? stat.size : 0

        if (size < minFileSizeBytes) continue

        const ext = path.extname(filePath).toLowerCase()
        if (excludedExtensions.includes(ext)) continue

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
