import * as path from 'path'
import * as fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import { getFileStat, globFiles, listDirectory, formatBytes } from '../../utils/fsUtils'
import type { DiskNode, ScannedItem } from '../../../shared/types'
import { logger } from '../../utils/logger'

export class DiskAnalyzerService {
  async analyzePath(
    dirPath: string,
    maxDepth: number = 3,
    onProgress: (scanned: number) => void
  ): Promise<DiskNode> {
    return this.buildTree(dirPath, 0, maxDepth, onProgress)
  }

  private async buildTree(
    dirPath: string,
    depth: number,
    maxDepth: number,
    onProgress: (n: number) => void
  ): Promise<DiskNode> {
    const stat = await getFileStat(dirPath)
    const name = path.basename(dirPath) || dirPath

    if (!stat?.isDirectory || depth >= maxDepth) {
      return {
        name,
        path: dirPath,
        size: stat?.size || 0,
        type: 'file',
        extension: path.extname(dirPath),
      }
    }

    let entries: string[] = []
    try {
      const names = await fs.readdir(dirPath)
      entries = names.map(n => path.join(dirPath, n))
    } catch {
      return { name, path: dirPath, size: 0, type: 'directory' }
    }

    const children: DiskNode[] = []
    let totalSize = 0

    for (const entry of entries) {
      if (this.shouldSkip(entry)) continue
      const child = await this.buildTree(entry, depth + 1, maxDepth, onProgress)
      totalSize += child.size
      children.push(child)
      onProgress(children.length)
    }

    // Sort children by size descending
    children.sort((a, b) => b.size - a.size)

    return {
      name,
      path: dirPath,
      size: totalSize,
      type: 'directory',
      children: children.slice(0, 100), // Max 100 children per node
    }
  }

  private shouldSkip(filePath: string): boolean {
    const skipPatterns = ['/proc/', '/sys/', '/dev/', 'node_modules', '.git', 'C:\\Windows\\WinSxS']
    return skipPatterns.some(p => filePath.includes(p))
  }

  async findLargeFiles(dirPath: string, minSizeBytes: number): Promise<ScannedItem[]> {
    const files = await globFiles('**/*', {
      cwd: dirPath,
      absolute: true,
      onlyFiles: true,
      dot: true,
    }).catch(() => [])

    const results: ScannedItem[] = []

    for (const f of files) {
      const stat = await getFileStat(f)
      if (stat && stat.size >= minSizeBytes) {
        results.push({
          id: uuid(),
          path: f,
          size: stat.size,
          type: 'file',
          lastModified: stat.lastModified,
          lastAccessed: stat.lastAccessed,
          category: 'large-files',
          description: `Large file (${formatBytes(stat.size)})`,
          safeToDelete: false,
        })
      }
    }

    return results.sort((a, b) => b.size - a.size).slice(0, 1000)
  }

  async findEmptyFolders(dirPath: string): Promise<string[]> {
    const emptyFolders: string[] = []
    const dirs = await globFiles('**/', {
      cwd: dirPath,
      absolute: true,
      onlyDirectories: true,
    }).catch(() => [])

    for (const dir of dirs) {
      const entries = await listDirectory(dir)
      if (entries.length === 0) {
        emptyFolders.push(dir)
      }
    }

    return emptyFolders
  }

  async findOldFiles(dirPath: string, olderThanDays: number): Promise<ScannedItem[]> {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    const files = await globFiles('**/*', {
      cwd: dirPath,
      absolute: true,
      onlyFiles: true,
    }).catch(() => [])

    const results: ScannedItem[] = []

    for (const f of files) {
      const stat = await getFileStat(f)
      if (stat && stat.lastAccessed < cutoffTime) {
        results.push({
          id: uuid(),
          path: f,
          size: stat.size,
          type: 'file',
          lastModified: stat.lastModified,
          lastAccessed: stat.lastAccessed,
          category: 'old-files',
          description: `Not accessed in ${olderThanDays}+ days`,
          safeToDelete: false,
        })
      }
    }

    return results.sort((a, b) => a.lastAccessed - b.lastAccessed)
  }
}
