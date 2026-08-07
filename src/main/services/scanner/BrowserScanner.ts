import { v4 as uuid } from 'uuid'
import * as path from 'path'
import { PlatformService } from '../system/PlatformService'
import { getFileStat, globFiles, isPathAccessible, listDirectory } from '../../utils/fsUtils'
import type { ScanResult, ScanProgress, ScannedItem } from '../../../shared/types'
import { logger } from '../../utils/logger'

export class BrowserScanner {
  constructor(private platformService: PlatformService) {}

  async scanBrowsers(
    enabledBrowsers: string[],
    options: {
      clearCache: boolean
      clearCookies: boolean
      clearHistory: boolean
      clearDownloadHistory: boolean
    },
    onProgress: (progress: ScanProgress) => void
  ): Promise<ScanResult[]> {
    const browserPaths = this.platformService.getBrowserPaths()
    const results: ScanResult[] = []
    let scanned = 0
    const total = enabledBrowsers.length

    for (const browserId of enabledBrowsers) {
      const paths = browserPaths[browserId]
      if (!paths) continue

      onProgress({
        phase: 'indexing',
        filesScanned: scanned,
        totalFound: results.flatMap(r => r.items).length,
        currentPath: `Scanning ${browserId}...`,
        percentage: Math.round((scanned / total) * 100),
      })

      const items: ScannedItem[] = []

      for (const browserPath of paths) {
        const expandedPaths = await this.expandBrowserPath(browserPath.cachePath)

        for (const cachePath of expandedPaths) {
          if (!(await isPathAccessible(cachePath))) continue

          const cacheItems = await this.getFilesInDir(cachePath, 'browser-cache')
          items.push(...cacheItems)
        }
      }

      if (items.length > 0) {
        results.push({
          id: uuid(),
          category: 'browser-cache',
          categoryLabel: `${this.getBrowserName(browserId)} Cache`,
          items,
          totalSize: items.reduce((sum, i) => sum + i.size, 0),
          scanDuration: 0,
        })
      }

      scanned++
    }

    return results
  }

  private async expandBrowserPath(pattern: string): Promise<string[]> {
    if (!pattern.includes('*')) {
      const expanded = this.platformService.expandPath(pattern)
      return [expanded]
    }

    // Handle glob patterns (for Firefox profiles)
    const parts = pattern.split('*')
    const basePath = this.platformService.expandPath(parts[0])

    try {
      const profileDirs = await listDirectory(path.dirname(basePath))
      return profileDirs
        .filter(d => !path.basename(d).startsWith('.'))
        .map(d => path.join(d, parts[1] || ''))
        .filter(p => p)
    } catch {
      return []
    }
  }

  private getBrowserName(id: string): string {
    const names: Record<string, string> = {
      chrome: 'Google Chrome',
      firefox: 'Mozilla Firefox',
      safari: 'Safari',
      edge: 'Microsoft Edge',
      brave: 'Brave Browser',
      opera: 'Opera',
    }
    return names[id] || id
  }

  private async getFilesInDir(
    dirPath: string,
    category: 'browser-cache'
  ): Promise<ScannedItem[]> {
    const files = await globFiles('**/*', {
      cwd: dirPath,
      absolute: true,
      dot: true,
      onlyFiles: true,
    }).catch(() => [])

    const items: ScannedItem[] = []

    for (const file of files.slice(0, 10000)) {
      const stat = await getFileStat(file)
      if (!stat || stat.isDirectory) continue

      items.push({
        id: uuid(),
        path: file,
        size: stat.size,
        type: 'file',
        lastModified: stat.lastModified,
        lastAccessed: stat.lastAccessed,
        category,
        description: 'Browser cache file',
        safeToDelete: true,
      })
    }

    return items
  }
}
