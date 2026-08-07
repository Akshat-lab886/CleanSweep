import { v4 as uuid } from 'uuid'
import * as path from 'path'
import { Worker } from 'worker_threads'
import * as os from 'os'
import { getFileStat, globFiles } from '../../utils/fsUtils'
import type { DuplicateGroup, ScanProgress, ScannedItem } from '../../../shared/types'
import { logger } from '../../utils/logger'

export class DuplicateFinderService {
  private cancelled = false

  async findDuplicates(
    scanPaths: string[],
    options: {
      minSizeBytes: number
      includeHidden: boolean
    },
    onProgress: (progress: ScanProgress) => void
  ): Promise<DuplicateGroup[]> {
    this.cancelled = false

    // PHASE 1: Collect all files
    onProgress({
      phase: 'indexing',
      percentage: 0,
      filesScanned: 0,
      totalFound: 0,
      currentPath: 'Collecting files...',
    })

    const allFiles = await this.collectAllFiles(scanPaths, options)

    if (this.cancelled) return []

    // PHASE 2: Group by size
    onProgress({
      phase: 'analyzing',
      percentage: 20,
      filesScanned: allFiles.length,
      totalFound: 0,
      currentPath: 'Grouping by size...',
    })

    const sizeGroups = await this.groupBySize(allFiles)
    const candidates = Object.values(sizeGroups)
      .filter(group => group.length > 1)
      .flat()

    if (candidates.length === 0) return []
    if (this.cancelled) return []

    // PHASE 3: Hash candidates with workers
    onProgress({
      phase: 'hashing',
      percentage: 30,
      filesScanned: allFiles.length,
      totalFound: 0,
      currentPath: `Hashing ${candidates.length} candidate files...`,
    })

    const hashes = await this.hashFilesWithWorkers(candidates, (hashed, total) => {
      onProgress({
        phase: 'hashing',
        percentage: 30 + Math.round((hashed / total) * 65),
        filesScanned: hashed,
        totalFound: 0,
        currentPath: `Hashing file ${hashed} of ${total}...`,
      })
    })

    if (this.cancelled) return []

    // PHASE 4: Group by hash
    const hashGroups: Record<string, string[]> = {}
    for (const [filePath, hash] of Object.entries(hashes)) {
      if (hash === 'ERROR') continue
      if (!hashGroups[hash]) hashGroups[hash] = []
      hashGroups[hash].push(filePath)
    }

    // Build DuplicateGroup results
    const groups: DuplicateGroup[] = []
    for (const [hash, files] of Object.entries(hashGroups)) {
      if (files.length < 2) continue

      const fileItems = await Promise.all(
        files.map(async (f) => {
          const stat = await getFileStat(f)
          return {
            id: uuid(),
            path: f,
            size: stat?.size || 0,
            type: 'file' as const,
            lastModified: stat?.lastModified || 0,
            lastAccessed: stat?.lastAccessed || 0,
            category: 'duplicates' as const,
            description: 'Duplicate file',
            safeToDelete: true,
          }
        })
      )

      const fileSize = fileItems[0]?.size || 0
      groups.push({
        id: uuid(),
        hash,
        files: fileItems,
        wastedSpace: fileSize * (files.length - 1),
      })
    }

    onProgress({
      phase: 'complete',
      percentage: 100,
      filesScanned: allFiles.length,
      totalFound: groups.length,
      currentPath: '',
    })

    return groups.sort((a, b) => b.wastedSpace - a.wastedSpace)
  }

  cancel() {
    this.cancelled = true
  }

  private async collectAllFiles(
    paths: string[],
    options: { minSizeBytes: number; includeHidden: boolean }
  ): Promise<string[]> {
    const allFiles: string[] = []

    for (const scanPath of paths) {
      const files = await globFiles('**/*', {
        cwd: scanPath,
        absolute: true,
        dot: options.includeHidden,
        onlyFiles: true,
      }).catch(() => [])

      allFiles.push(...files)
    }

    // Filter by minimum size
    const filtered: string[] = []
    for (const f of allFiles) {
      const stat = await getFileStat(f)
      if (stat && stat.size >= options.minSizeBytes) {
        filtered.push(f)
      }
    }

    return filtered
  }

  private async groupBySize(files: string[]): Promise<Record<string, string[]>> {
    const groups: Record<string, string[]> = {}

    for (const file of files) {
      const stat = await getFileStat(file)
      if (!stat) continue

      const sizeKey = stat.size.toString()
      if (!groups[sizeKey]) groups[sizeKey] = []
      groups[sizeKey].push(file)
    }

    return groups
  }

  private async hashFilesWithWorkers(
    files: string[],
    onProgress: (hashed: number, total: number) => void
  ): Promise<Record<string, string>> {
    const cpuCount = Math.min(4, os.cpus().length)
    const chunkSize = Math.ceil(files.length / cpuCount)
    const chunks: string[][] = []

    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize))
    }

    let totalHashed = 0
    const results: Record<string, string> = {}

    // For now, use simple synchronous hashing (worker threads require compiled JS)
    // In production, this would use the hashWorker.ts
    const crypto = await import('crypto')
    const fs = await import('fs')

    for (const file of files) {
      if (this.cancelled) break

      try {
        const hash = crypto.createHash('sha256')
        const stream = fs.createReadStream(file, { highWaterMark: 64 * 1024 })

        for await (const chunk of stream) {
          hash.update(chunk as Buffer)
        }

        results[file] = hash.digest('hex')
        totalHashed++
        onProgress(totalHashed, files.length)
      } catch {
        results[file] = 'ERROR'
        totalHashed++
        onProgress(totalHashed, files.length)
      }
    }

    return results
  }
}
