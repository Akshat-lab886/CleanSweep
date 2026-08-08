import * as fs from 'fs/promises'
import * as path from 'path'
import { app, shell } from 'electron'
import { v4 as uuid } from 'uuid'
import type { ScannedItem, QuarantineEntry, ScanCategory } from '../../../shared/types'
import { getFileStat, ensureDir, moveFile } from '../../utils/fsUtils'
import { logger } from '../../utils/logger'

export class QuarantineService {
  private quarantinePath: string
  private manifestPath: string

  constructor() {
    const userData = app.getPath('userData')
    this.quarantinePath = path.join(userData, 'quarantine')
    this.manifestPath = path.join(this.quarantinePath, 'manifest.json')
    this.init()
  }

  async trashItem(filePath: string): Promise<boolean> {
    try {
      await shell.trashItem(filePath)
      return true
    } catch (err) {
      logger.warn('QuarantineService', `Failed to move ${filePath} to System Trash: ${err}`)
      // Fallback to force remove if trashItem fails
      try {
        await fs.rm(filePath, { recursive: true, force: true })
        return true
      } catch {
        return false
      }
    }
  }

  async trashItems(items: ScannedItem[]): Promise<{ succeeded: ScannedItem[]; failed: Array<{ item: ScannedItem; error: string }> }> {
    const succeeded: ScannedItem[] = []
    const failed: Array<{ item: ScannedItem; error: string }> = []

    for (const item of items) {
      const ok = await this.trashItem(item.path)
      if (ok) {
        succeeded.push(item)
      } else {
        failed.push({ item, error: 'Failed to move to Trash' })
      }
    }

    return { succeeded, failed }
  }

  private async init(): Promise<void> {
    await ensureDir(this.quarantinePath)
  }

  async getManifest(): Promise<QuarantineEntry[]> {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private async saveManifest(manifest: QuarantineEntry[]): Promise<void> {
    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  }

  async quarantineItem(item: ScannedItem, reason: string): Promise<QuarantineEntry> {
    const id = uuid()
    const quarantineFilename = `${uuid()}${path.extname(item.path)}`
    const quarantineFilePath = path.join(this.quarantinePath, quarantineFilename)

    // Copy to quarantine
    try {
      await fs.copyFile(item.path, quarantineFilePath)
    } catch {
      // Try with directories
      try {
        await fs.cp(item.path, quarantineFilePath, { recursive: true })
      } catch (err) {
        throw new Error(`Failed to copy to quarantine: ${err}`)
      }
    }

    // Delete original
    try {
      await fs.rm(item.path, { recursive: true, force: true })
    } catch (err) {
      logger.warn('QuarantineService', `Failed to delete original: ${err}`)
    }

    // Create entry
    const entry: QuarantineEntry = {
      id,
      originalPath: item.path,
      quarantinePath: quarantineFilePath,
      filename: path.basename(item.path),
      size: item.size,
      deletedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      reason,
      category: item.category,
      restorable: true,
    }

    // Update manifest
    const manifest = await this.getManifest()
    manifest.push(entry)
    await this.saveManifest(manifest)

    return entry
  }

  async quarantineItems(
    items: ScannedItem[],
    reason: string
  ): Promise<{
    succeeded: QuarantineEntry[]
    failed: Array<{ item: ScannedItem; error: string }>
  }> {
    const succeeded: QuarantineEntry[] = []
    const failed: Array<{ item: ScannedItem; error: string }> = []

    for (const item of items) {
      try {
        const entry = await this.quarantineItem(item, reason)
        succeeded.push(entry)
      } catch (err) {
        failed.push({
          item,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return { succeeded, failed }
  }

  async restoreItem(entryId: string): Promise<void> {
    const manifest = await this.getManifest()
    const entryIndex = manifest.findIndex(e => e.id === entryId)

    if (entryIndex === -1) {
      throw new Error('Entry not found')
    }

    const entry = manifest[entryIndex]

    // Ensure original directory exists
    await ensureDir(path.dirname(entry.originalPath))

    // Move back
    let destPath = entry.originalPath
    const exists = await getFileStat(entry.originalPath)
    if (exists) {
      // Append suffix if file already exists
      const ext = path.extname(entry.originalPath)
      const base = path.basename(entry.originalPath, ext)
      const dir = path.dirname(entry.originalPath)
      destPath = path.join(dir, `${base}_restored${ext}`)
    }

    await moveFile(entry.quarantinePath, destPath)

    // Remove from manifest
    manifest.splice(entryIndex, 1)
    await this.saveManifest(manifest)
  }

  async purgeExpired(): Promise<number> {
    const manifest = await this.getManifest()
    const now = Date.now()
    const toPurge = manifest.filter(e => e.expiresAt < now)

    for (const entry of toPurge) {
      try {
        await fs.rm(entry.quarantinePath, { recursive: true, force: true })
      } catch {}
    }

    const remaining = manifest.filter(e => e.expiresAt >= now)
    await this.saveManifest(remaining)

    return toPurge.length
  }

  async purgeAll(): Promise<number> {
    const manifest = await this.getManifest()
    const count = manifest.length

    for (const entry of manifest) {
      try {
        await fs.rm(entry.quarantinePath, { recursive: true, force: true })
      } catch {}
    }

    await this.saveManifest([])
    return count
  }

  async getTotalSize(): Promise<number> {
    const manifest = await this.getManifest()
    return manifest.reduce((sum, e) => sum + e.size, 0)
  }
}
