import { v4 as uuid } from 'uuid'
import * as path from 'path'
import { PlatformService } from '../system/PlatformService'
import { getFileStat, getDirectorySize, globFiles, isPathAccessible } from '../../utils/fsUtils'
import { CATEGORY_LABELS } from '../../../shared/constants'
import type { ScanResult, ScanProgress, ScannedItem, ScanCategory } from '../../../shared/types'
import { logger } from '../../utils/logger'

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
    const results: ScanResult[] = []
    const locations = this.platformService.getCommonScanPaths()

    let totalScanned = 0
    const total = locations.length

    for (let i = 0; i < locations.length; i++) {
      if (this.cancelled) break

      const location = locations[i]

      onProgress({
        phase: 'indexing',
        filesScanned: totalScanned,
        totalFound: results.flatMap(r => r.items).length,
        currentPath: location.path,
        percentage: Math.round((i / total) * 100),
      })

      const expandedPath = this.platformService.expandPath(location.path)
      const accessible = await isPathAccessible(expandedPath)

      if (!accessible) {
        logger.info('ScannerService', `Skipping inaccessible path: ${expandedPath}`)
        continue
      }

      const items = await this.scanLocation(expandedPath, location.category)
      totalScanned += items.length

      if (items.length > 0) {
        const existingResult = results.find(r => r.category === location.category)
        if (existingResult) {
          existingResult.items.push(...items)
          existingResult.totalSize += items.reduce((sum, i) => sum + i.size, 0)
        } else {
          results.push({
            id: uuid(),
            category: location.category,
            categoryLabel: CATEGORY_LABELS[location.category],
            items,
            totalSize: items.reduce((sum, i) => sum + i.size, 0),
            scanDuration: 0,
          })
        }
      }
    }

    onProgress({
      phase: 'complete',
      filesScanned: totalScanned,
      totalFound: results.flatMap(r => r.items).length,
      currentPath: '',
      percentage: 100,
    })

    return results
  }

  async deepScan(
    options: { customPaths?: string[] },
    onProgress: (progress: ScanProgress) => void,
    whitelist: string[]
  ): Promise<ScanResult[]> {
    // Deep scan includes quick scan + additional locations
    const quickResults = await this.quickScan(options, onProgress, whitelist)

    // Add deep scan specific items here (larger file search, etc)

    return quickResults
  }

  cancel(): void {
    this.cancelled = true
  }

  private async scanLocation(dirPath: string, category: ScanCategory): Promise<ScannedItem[]> {
    const items: ScannedItem[] = []

    try {
      const files = await globFiles('**/*', {
        cwd: dirPath,
        absolute: true,
        dot: true,
        followSymbolicLinks: false,
        onlyFiles: false,
      })

      for (const filePath of files) {
        if (this.cancelled) break
        if (this.isWhitelisted(filePath)) continue

        const stat = await getFileStat(filePath)
        if (!stat) continue

        items.push({
          id: uuid(),
          path: filePath,
          size: stat.isDirectory ? await getDirectorySize(filePath) : stat.size,
          type: stat.isDirectory ? 'directory' : 'file',
          lastModified: stat.lastModified,
          lastAccessed: stat.lastAccessed,
          category,
          description: this.getItemDescription(filePath, category),
          safeToDelete: this.isSafeToDelete(filePath, category),
        })
      }
    } catch (error) {
      logger.warn('ScannerService', `Cannot scan ${dirPath}: ${error}`)
    }

    return items
  }

  private isWhitelisted(filePath: string): boolean {
    return this.whitelist.some(w => filePath === w || filePath.startsWith(w + path.sep))
  }

  private getItemDescription(filePath: string, category: ScanCategory): string {
    const descriptions: Record<ScanCategory, string> = {
      'system-junk': 'System cache file',
      'browser-cache': 'Browser cached data',
      'logs': 'Log file',
      'temp-files': 'Temporary file',
      'app-leftovers': 'Orphaned app data',
      'large-files': 'Large file',
      'old-files': 'Old unused file',
      'duplicates': 'Duplicate file',
      'trash': 'Deleted file in Trash',
      'privacy': 'Privacy data',
    }
    return descriptions[category] || 'System file'
  }

  private isSafeToDelete(filePath: string, category: ScanCategory): boolean {
    // Never mark as safe if path contains dangerous system directories
    const dangerPatterns = ['/System/', '/usr/bin/', '/bin/', 'C:\\Windows\\System32']
    if (dangerPatterns.some(p => filePath.includes(p))) return false

    // Trash, temp files, logs, and browser cache are generally safe
    if (['trash', 'temp-files', 'logs', 'browser-cache'].includes(category)) return true

    return true
  }
}
