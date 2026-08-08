import { v4 as uuid } from 'uuid'
import * as path from 'path'
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

    // Process locations in parallel batches of 5 for maximum SSD read speed
    const batchSize = 5
    for (let i = 0; i < locations.length; i += batchSize) {
      if (this.cancelled) break

      const batch = locations.slice(i, i + batchSize)
      const batchPromises = batch.map(async (location) => {
        if (this.cancelled) return []

        const expandedPath = this.platformService.expandPath(location.path)
        const accessible = await isPathAccessible(expandedPath)

        if (!accessible) return []

        // Stream progress notification
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

        return this.scanLocationFast(expandedPath, location.category, location.label)
      })

      const batchResults = await Promise.all(batchPromises)

      for (const items of batchResults) {
        if (items.length === 0) continue
        totalScanned += items.length

        for (const item of items) {
          if (!resultsMap.has(item.category)) {
            resultsMap.set(item.category, [])
          }
          resultsMap.get(item.category)!.push(item)
        }
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

  private async scanLocationFast(
    dirPath: string,
    category: ScanCategory,
    label: string
  ): Promise<ScannedItem[]> {
    try {
      // Use fast-glob with stats: true to retrieve file sizes and modification times directly from fast readdir
      const entries = await glob('**/*', {
        cwd: dirPath,
        absolute: true,
        dot: true,
        stats: true,
        onlyFiles: true,
        suppressErrors: true,
        deep: 6, // Cap depth to 6 levels to avoid infinite symlinks
      })

      const items: ScannedItem[] = []

      for (const entry of entries) {
        if (this.cancelled) break
        const filePath = entry.path
        if (this.isWhitelisted(filePath)) continue

        const stat = entry.stats
        const size = stat ? stat.size : 0

        items.push({
          id: uuid(),
          path: filePath,
          size,
          type: 'file',
          lastModified: stat ? stat.mtimeMs : Date.now(),
          lastAccessed: stat ? stat.atimeMs : Date.now(),
          category,
          description: `${label} file`,
          safeToDelete: this.isSafeToDelete(filePath),
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

  private isSafeToDelete(filePath: string): boolean {
    const dangerPatterns = ['/System/', '/usr/bin/', '/bin/', 'C:\\Windows\\System32', '/Library/KernelExtensions']
    return !dangerPatterns.some(p => filePath.includes(p))
  }
}
