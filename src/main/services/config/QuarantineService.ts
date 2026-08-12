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
    // Fire-and-forget init; callers can await init() if needed
    void this.init()
  }

  async init(): Promise<void> {
    try {
      await ensureDir(this.quarantinePath)
      // Clean up expired entries on startup
      await this.purgeExpired()
    } catch (err) {
      logger.warn('QuarantineService', `Init failed: ${err}`)
    }
  }

  async trashItem(filePath: string): Promise<boolean> {
    try {
      await shell.trashItem(filePath)
      return true
    } catch (err) {
      logger.warn('QuarantineService', `Failed to move ${filePath} to System Trash: ${err}`)
      // Do NOT permanently delete as a fallback - this is dangerous.
      // Return false so the caller knows the item could not be trashed.
      return false
    }
  }

  async trashItems(items: ScannedItem[]): Promise<{ succeeded: ScannedItem[]; failed: Array<{ item: ScannedItem; error: string }> }> {
    const succeeded: ScannedItem[] = []
    const failed: Array<{ item: ScannedItem; error: string }> = []

    // High-performance parallel pool chunking (15 concurrent trash operations)
    const chunkSize = 15
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      const results = await Promise.all(
        chunk.map(async (item) => {
          const ok = await this.trashItem(item.path)
          return { item, ok }
        })
      )

      for (const res of results) {
        if (res.ok) {
          succeeded.push(res.item)
        } else {
          failed.push({ item: res.item, error: 'Failed to move to Trash' })
        }
      }
    }

    return { succeeded, failed }
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

    try {
      await fs.copyFile(item.path, quarantineFilePath)
    } catch {
      try {
        await fs.cp(item.path, quarantineFilePath, { recursive: true })
      } catch (err) {
        throw new Error(`Failed to copy to quarantine: ${err}`)
      }
    }

    try {
      await fs.rm(item.path, { recursive: true, force: true })
    } catch (err) {
      logger.warn('QuarantineService', `Failed to delete original: ${err}`)
    }

    const entry: QuarantineEntry = {
      id,
      originalPath: item.path,
      quarantinePath: quarantineFilePath,
      filename: path.basename(item.path),
      size: item.size,
      deletedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      reason,
      category: item.category,
      restorable: true,
    }

    const manifest = await this.getManifest()
    manifest.push(entry)
    await this.saveManifest(manifest)

    return entry
  }

  async quarantineItems(items: ScannedItem[], reason: string): Promise<{ succeeded: QuarantineEntry[]; failed: Array<{ item: ScannedItem; error: string }> }> {
    const succeeded: QuarantineEntry[] = []
    const failed: Array<{ item: ScannedItem; error: string }> = []

    for (const item of items) {
      try {
        const entry = await this.quarantineItem(item, reason)
        succeeded.push(entry)
      } catch (err) {
        failed.push({ item, error: (err as Error).message })
      }
    }

    return { succeeded, failed }
  }

  async restoreItem(id: string): Promise<void> {
    const manifest = await this.getManifest()
    const entry = manifest.find(e => e.id === id)

    if (!entry) throw new Error('Quarantine entry not found')

    let targetPath = entry.originalPath
    if (await getFileStat(targetPath)) {
      const ext = path.extname(targetPath)
      const base = path.basename(targetPath, ext)
      targetPath = path.join(path.dirname(targetPath), `${base}_restored${ext}`)
    }

    await ensureDir(path.dirname(targetPath))
    await moveFile(entry.quarantinePath, targetPath)

    const updated = manifest.filter(e => e.id !== id)
    await this.saveManifest(updated)
  }

  async purgeAll(): Promise<number> {
    const manifest = await this.getManifest()
    let count = 0

    for (const entry of manifest) {
      try {
        await fs.rm(entry.quarantinePath, { recursive: true, force: true })
        count++
      } catch {}
    }

    await this.saveManifest([])
    return count
  }

  async getTotalSize(): Promise<number> {
    const manifest = await this.getManifest()
    return manifest.reduce((sum, e) => sum + e.size, 0)
  }

  // Purge expired quarantine entries
  async purgeExpired(): Promise<number> {
    const manifest = await this.getManifest()
    const now = Date.now()
    const active = manifest.filter(e => e.expiresAt > now)
    const expired = manifest.filter(e => e.expiresAt <= now)

    if (expired.length > 0) {
      for (const entry of expired) {
        try {
          await fs.rm(entry.quarantinePath, { recursive: true, force: true })
        } catch {
          // Ignore individual failures
        }
      }
      await this.saveManifest(active)
      logger.info('QuarantineService', `Purged ${expired.length} expired quarantine entries`)
    }

    return expired.length
  }
}
