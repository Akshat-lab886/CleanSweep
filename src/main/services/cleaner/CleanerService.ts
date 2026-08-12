import { v4 as uuid } from 'uuid'
import * as fs from 'fs/promises'
import * as path from 'path'
import { app } from 'electron'
import type { ScannedItem, HistoryEntry } from '../../../shared/types'
import { QuarantineService } from '../config/QuarantineService'
import { logger } from '../../utils/logger'

export class CleanerService {
  private historyPath: string

  constructor(private quarantineService: QuarantineService) {
    const userData = app.getPath('userData')
    this.historyPath = path.join(userData, 'clean-history.json')
  }

  async previewClean(items: ScannedItem[]): Promise<ScannedItem[]> {
    // Filter only safe-to-delete items
    return items.filter(item => item.safeToDelete)
  }

  async executeClean(
    items: ScannedItem[],
    useQuarantine: boolean
  ): Promise<{ freed: number; count: number; failed: number }> {
    // Filter to only safe-to-delete items
    const safeItems = items.filter(item => item.safeToDelete)
    const unsafeCount = items.length - safeItems.length

    if (useQuarantine) {
      // Use quarantine service
      const result = await this.quarantineService.quarantineItems(safeItems, 'User initiated clean')
      const freed = result.succeeded.reduce((sum, entry) => sum + entry.size, 0)

      // Record history
      await this.addHistory({
        type: 'quick-clean',
        filesProcessed: result.succeeded.length,
        spaceFreed: freed,
        details: `Moved ${result.succeeded.length} items to quarantine (${unsafeCount} skipped as unsafe)`,
      })

      return {
        freed,
        count: result.succeeded.length,
        failed: result.failed.length + unsafeCount,
      }
    }

    // Use system trash
    const result = await this.quarantineService.trashItems(safeItems)
    const freed = result.succeeded.reduce((sum, item) => sum + item.size, 0)

    // Record history
    await this.addHistory({
      type: 'quick-clean',
      filesProcessed: result.succeeded.length,
      spaceFreed: freed,
      details: `Moved ${result.succeeded.length} items to system trash (${unsafeCount} skipped as unsafe)`,
    })

    return {
      freed,
      count: result.succeeded.length,
      failed: result.failed.length + unsafeCount,
    }
  }

  async getHistory(): Promise<HistoryEntry[]> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private async addHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const history = await this.getHistory()
      history.unshift({
        id: uuid(),
        timestamp: Date.now(),
        ...entry,
      })

      // Keep last 100 entries
      const trimmed = history.slice(0, 100)
      await fs.writeFile(this.historyPath, JSON.stringify(trimmed, null, 2), 'utf-8')
    } catch (err) {
      logger.warn('CleanerService', `Failed to write history: ${err}`)
    }
  }
}
