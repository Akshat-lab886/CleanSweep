import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import { glob } from 'fast-glob'

export async function getFileStat(filePath: string): Promise<{
  size: number
  lastModified: number
  lastAccessed: number
  isDirectory: boolean
  isFile: boolean
} | null> {
  try {
    const stats = await fs.stat(filePath)
    return {
      size: stats.size,
      lastModified: stats.mtimeMs,
      lastAccessed: stats.atimeMs,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
    }
  } catch {
    return null
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch {
    return 0
  }
}

export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0
  const queue: string[] = [dirPath]

  while (queue.length > 0) {
    const current = queue.pop()!
    try {
      const entries = await fs.readdir(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        try {
          if (entry.isDirectory()) {
            queue.push(fullPath)
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath)
            totalSize += stats.size
          }
        } catch {
          // Skip files we can't read
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  return totalSize
}

export async function listDirectory(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries.map(e => path.join(dirPath, e.name))
  } catch {
    return []
  }
}

export async function globFiles(pattern: string, options?: any): Promise<string[]> {
  try {
    const results = await glob(pattern, { ...options, objectMode: false })
    return results as unknown as string[]
  } catch {
    return []
  }
}

export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.rm(filePath, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

export async function moveFile(from: string, to: string): Promise<boolean> {
  try {
    await ensureDir(path.dirname(to))
    await fs.rename(from, to)
    return true
  } catch {
    // Try copy + delete for cross-device moves
    try {
      await fs.copyFile(from, to)
      await fs.rm(from)
      return true
    } catch {
      return false
    }
  }
}

export async function copyFile(from: string, to: string): Promise<boolean> {
  try {
    await ensureDir(path.dirname(to))
    await fs.copyFile(from, to)
    return true
  } catch {
    return false
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function isPathAccessible(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fsSync.constants.R_OK)
    return true
  } catch {
    return false
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}
