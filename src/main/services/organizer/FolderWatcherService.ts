import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import chokidar, { FSWatcher } from 'chokidar'
import { v4 as uuidv4 } from 'uuid'
import type { WatchFolder, OrganizerRule, ScannedItem } from '../../../shared/types'
import { ConfigService } from '../config/ConfigService'
import { RulesEngine } from './RulesEngine'
import { FileOrganizerService } from './FileOrganizerService'

export class FolderWatcherService {
  private watchers: Map<string, FSWatcher> = new Map()
  private watchFolders: WatchFolder[] = []
  private configService: ConfigService
  private rulesEngine: RulesEngine
  private fileOrganizerService: FileOrganizerService
  private onActivityCallback?: (data: { file: string; watchFolder: string; action: string; timestamp: number }) => void
  private configPath: string

  constructor(configService: ConfigService, rulesEngine: RulesEngine, fileOrganizerService: FileOrganizerService) {
    this.configService = configService
    this.rulesEngine = rulesEngine
    this.fileOrganizerService = fileOrganizerService
    this.configPath = path.join(app.getPath('userData'), 'watchFolders.json')
  }

  async loadFromConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8')
      this.watchFolders = JSON.parse(data)

      // Restart all enabled watchers
      for (const folder of this.watchFolders) {
        if (folder.enabled) {
          await this.startWatcher(folder)
        }
      }
    } catch {
      this.watchFolders = []
    }
  }

  async saveToConfig(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.watchFolders, null, 2))
  }

  setOnActivityCallback(callback: (data: { file: string; watchFolder: string; action: string; timestamp: number }) => void): void {
    this.onActivityCallback = callback
  }

  async addWatchFolder(sourcePath: string, ruleIds: string[], enabled: boolean = true): Promise<WatchFolder> {
    const folder: WatchFolder = {
      id: uuidv4(),
      sourcePath,
      enabled,
      ruleIds,
      createdAt: Date.now(),
    }

    this.watchFolders.push(folder)
    await this.saveToConfig()

    if (enabled) {
      await this.startWatcher(folder)
    }

    return folder
  }

  async removeWatchFolder(id: string): Promise<void> {
    const folder = this.watchFolders.find(f => f.id === id)
    if (folder) {
      await this.stopWatcher(id)
      this.watchFolders = this.watchFolders.filter(f => f.id !== id)
      await this.saveToConfig()
    }
  }

  async toggleWatchFolder(id: string, enabled: boolean): Promise<void> {
    const folder = this.watchFolders.find(f => f.id === id)
    if (folder) {
      folder.enabled = enabled
      await this.saveToConfig()

      if (enabled) {
        await this.startWatcher(folder)
      } else {
        await this.stopWatcher(id)
      }
    }
  }

  listWatchFolders(): WatchFolder[] {
    return [...this.watchFolders]
  }

  private async startWatcher(folder: WatchFolder): Promise<void> {
    if (this.watchers.has(folder.id)) {
      return
    }

    try {
      const watcher = chokidar.watch(folder.sourcePath, {
        depth: 0, // Only top-level files
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
      })

      watcher.on('add', async (filePath) => {
        await this.handleFileAdded(filePath, folder)
      })

      this.watchers.set(folder.id, watcher)
    } catch (error) {
      console.error(`Failed to start watcher for ${folder.sourcePath}:`, error)
    }
  }

  private async stopWatcher(id: string): Promise<void> {
    const watcher = this.watchers.get(id)
    if (watcher) {
      await watcher.close()
      this.watchers.delete(id)
    }
  }

  private async handleFileAdded(filePath: string, folder: WatchFolder): Promise<void> {
    try {
      // Get file stats
      const stats = await fs.stat(filePath)

      const fileInfo = {
        path: filePath,
        name: path.basename(filePath),
        nameWithoutExt: path.parse(filePath).name,
        extension: path.extname(filePath).toLowerCase(),
        size: stats.size,
        created: stats.birthtimeMs,
        modified: stats.mtimeMs,
      }

      // Evaluate rules
      const allRules = await this.configService.getRules()
      const folderRules = allRules.filter(r => folder.ruleIds.includes(r.id))
      const result = this.rulesEngine.evaluate(fileInfo, folderRules)

      if (result) {
        // Execute the action
        await this.fileOrganizerService.executeOrganize([{
          id: uuidv4(),
          sourcePath: filePath,
          destinationPath: result.destination,
          action: result.rule.action,
          ruleName: result.rule.name,
          willOverwrite: false,
        }], 'rename')

        // Notify activity
        if (this.onActivityCallback) {
          this.onActivityCallback({
            file: filePath,
            watchFolder: folder.id,
            action: result.rule.action,
            timestamp: Date.now(),
          })
        }
      }
    } catch (error) {
      console.error(`Failed to handle file ${filePath}:`, error)
    }
  }

  async destroy(): Promise<void> {
    for (const [id] of this.watchers) {
      await this.stopWatcher(id)
    }
  }
}
