import { ipcMain, BrowserWindow, dialog, shell, app } from 'electron'
import { IPC_CHANNELS } from '../shared/ipcChannels'
import { safeHandle } from './utils/ipcHelper'
import { ConfigService } from './services/config/ConfigService'
import { QuarantineService } from './services/config/QuarantineService'
import { PlatformService } from './services/system/PlatformService'
import { SystemStatsService } from './services/system/SystemStatsService'
import { ScannerService } from './services/scanner/ScannerService'
import { BrowserScanner } from './services/scanner/BrowserScanner'
import { DuplicateFinderService } from './services/duplicates/DuplicateFinderService'
import { RulesEngine } from './services/organizer/RulesEngine'
import { FileOrganizerService } from './services/organizer/FileOrganizerService'
import { BulkRenamerService } from './services/organizer/BulkRenamerService'
import { DiskAnalyzerService } from './services/disk/DiskAnalyzerService'
import { AppManagerService } from './services/apps/AppManagerService'
import { StartupManagerService } from './services/apps/StartupManagerService'
import { FolderWatcherService } from './services/organizer/FolderWatcherService'
import type { ScanProgress, ScannedItem, OrganizerRule, RenamePattern, WatchFolder } from '../shared/types'
import { v4 as uuidv4 } from 'uuid'

let mainWindow: BrowserWindow | null = null

// Service instances
const configService = new ConfigService()
const quarantineService = new QuarantineService()
const platformService = new PlatformService()
const systemStatsService = new SystemStatsService()
const scannerService = new ScannerService(platformService)
const browserScanner = new BrowserScanner(platformService)
const duplicateFinderService = new DuplicateFinderService()
const rulesEngine = new RulesEngine()
const fileOrganizerService = new FileOrganizerService(rulesEngine)
const folderWatcherService = new FolderWatcherService(configService, rulesEngine, fileOrganizerService)
const bulkRenamerService = new BulkRenamerService()
const diskAnalyzerService = new DiskAnalyzerService()
const appManagerService = new AppManagerService()
const startupManagerService = new StartupManagerService()

folderWatcherService.setOnActivityCallback((activity) => {
  mainWindow?.webContents.send(IPC_CHANNELS.WATCHER_ACTIVITY, activity)
})

export function registerAllHandlers(window: BrowserWindow) {
  mainWindow = window
  folderWatcherService.loadFromConfig()

  // ========== CONFIG HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, safeHandle(async () => {
    return configService.getConfig()
  }))

  ipcMain.handle(IPC_CHANNELS.SET_CONFIG, safeHandle(async (_, config) => {
    await configService.setConfig(config)
  }))

  ipcMain.handle(IPC_CHANNELS.GET_WHITELIST, safeHandle(async () => {
    return configService.getWhitelist()
  }))

  ipcMain.handle(IPC_CHANNELS.ADD_TO_WHITELIST, safeHandle(async (_, itemPath: string) => {
    await configService.addToWhitelist(itemPath)
  }))

  ipcMain.handle(IPC_CHANNELS.REMOVE_FROM_WHITELIST, safeHandle(async (_, itemPath: string) => {
    await configService.removeFromWhitelist(itemPath)
  }))

  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, safeHandle(async () => {
    return configService.getHistory()
  }))

  // ========== QUARANTINE HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.LIST_QUARANTINE, safeHandle(async () => {
    return quarantineService.getManifest()
  }))

  ipcMain.handle(IPC_CHANNELS.RESTORE_QUARANTINE, safeHandle(async (_, id: string) => {
    await quarantineService.restoreItem(id)
  }))

  ipcMain.handle(IPC_CHANNELS.PURGE_QUARANTINE, safeHandle(async () => {
    const count = await quarantineService.purgeAll()
    return { count, freed: await quarantineService.getTotalSize() }
  }))

  // ========== SYSTEM STATS HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.GET_SYSTEM_STATS, safeHandle(async () => {
    return systemStatsService.getSystemStats()
  }))

  ipcMain.handle(IPC_CHANNELS.GET_DISK_USAGE, safeHandle(async () => {
    return systemStatsService.getDiskUsage()
  }))

  ipcMain.handle(IPC_CHANNELS.OPTIMIZE_MEMORY, safeHandle(async () => {
    systemStatsService.optimizeMemory()
  }))

  // ========== SCANNER HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.QUICK_SCAN, safeHandle(async (_, options) => {
    const whitelist = await configService.getWhitelist()
    const progressCallback = (progress: ScanProgress) => {
      mainWindow?.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress)
    }
    return scannerService.quickScan(options || {}, progressCallback, whitelist)
  }))

  ipcMain.handle(IPC_CHANNELS.DEEP_SCAN, safeHandle(async (_, options) => {
    const whitelist = await configService.getWhitelist()
    const progressCallback = (progress: ScanProgress) => {
      mainWindow?.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress)
    }
    return scannerService.deepScan(options || {}, progressCallback, whitelist)
  }))

  ipcMain.handle(IPC_CHANNELS.BROWSER_SCAN, safeHandle(async (_, { browsers, options }) => {
    const progressCallback = (progress: ScanProgress) => {
      mainWindow?.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress)
    }
    return browserScanner.scanBrowsers(browsers, options, progressCallback)
  }))

  ipcMain.on(IPC_CHANNELS.CANCEL_SCAN, () => {
    scannerService.cancel()
    duplicateFinderService.cancel()
  })

  // ========== CLEANER HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.EXECUTE_CLEAN, safeHandle(async (_, { items, useQuarantine }) => {
    let freed = 0
    let count = 0
    let failed = 0

    if (useQuarantine) {
      const result = await quarantineService.quarantineItems(items, 'manual-clean')
      freed = result.succeeded.reduce((sum, e) => sum + e.size, 0)
      count = result.succeeded.length
      failed = result.failed.length
    } else {
      // Direct delete (not recommended, but supported)
      for (const item of items) {
        try {
          await import('fs/promises').then(fs => fs.rm(item.path, { recursive: true }))
          freed += item.size
          count++
        } catch {
          failed++
        }
      }
    }

    // Add to history
    await configService.addHistoryEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'quick-clean',
      filesProcessed: count,
      spaceFreed: freed,
      details: `Cleaned ${count} files`,
    })

    return { freed, count, failed }
  }))

  // ========== DUPLICATES HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.FIND_DUPLICATES, safeHandle(async (_, { paths, options }) => {
    const progressCallback = (progress: ScanProgress) => {
      mainWindow?.webContents.send(IPC_CHANNELS.DUPLICATES_PROGRESS, progress)
    }
    return duplicateFinderService.findDuplicates(paths, options, progressCallback)
  }))

  ipcMain.handle(IPC_CHANNELS.FIND_PHOTO_DUPLICATES, safeHandle(async (_, paths) => {
    const progressCallback = (progress: ScanProgress) => {
      mainWindow?.webContents.send(IPC_CHANNELS.DUPLICATES_PROGRESS, progress)
    }
    return duplicateFinderService.findDuplicates(paths, { minSizeBytes: 10240, includeHidden: false }, progressCallback)
  }))

  ipcMain.handle(IPC_CHANNELS.DELETE_DUPLICATES, safeHandle(async (_, { items, useQuarantine }) => {
    const result = await quarantineService.quarantineItems(items, 'duplicate-removal')
    return {
      freed: result.succeeded.reduce((sum, e) => sum + e.size, 0),
      count: result.succeeded.length,
    }
  }))

  // ========== ORGANIZER HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.GET_RULES, safeHandle(async () => {
    return configService.getRules()
  }))

  ipcMain.handle(IPC_CHANNELS.SAVE_RULES, safeHandle(async (_, rules: OrganizerRule[]) => {
    await configService.saveRules(rules)
  }))

  ipcMain.handle(IPC_CHANNELS.PREVIEW_ORGANIZE, safeHandle(async (_, { source, rules }) => {
    const config = await configService.getConfig()
    return fileOrganizerService.previewOrganize(source, rules, config.organizer.conflictStrategy)
  }))

  ipcMain.handle(IPC_CHANNELS.EXECUTE_ORGANIZE, safeHandle(async (_, { items, strategy }) => {
    const result = await fileOrganizerService.executeOrganize(items, strategy)
    await configService.addHistoryEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'organize',
      filesProcessed: result.succeeded,
      spaceFreed: 0,
      details: `Organized ${result.succeeded} files`,
    })
    return result
  }))

  ipcMain.handle(IPC_CHANNELS.RENAME_PREVIEW, safeHandle(async (_, { files, pattern }: { files: string[]; pattern: RenamePattern }) => {
    return bulkRenamerService.previewRename(files, pattern)
  }))

  ipcMain.handle(IPC_CHANNELS.RENAME_EXECUTE, safeHandle(async (_, items) => {
    const result = await bulkRenamerService.executeRename(items)
    await configService.addHistoryEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'rename',
      filesProcessed: result.succeeded,
      spaceFreed: 0,
      details: `Renamed ${result.succeeded} files`,
    })
    return result
  }))

  // ========== WATCHER HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.ADD_WATCH_FOLDER, safeHandle(async (_, folder: WatchFolder) => {
    return folderWatcherService.addWatchFolder(folder.sourcePath, folder.ruleIds, folder.enabled)
  }))

  ipcMain.handle(IPC_CHANNELS.REMOVE_WATCH_FOLDER, safeHandle(async (_, id: string) => {
    await folderWatcherService.removeWatchFolder(id)
  }))

  ipcMain.handle(IPC_CHANNELS.LIST_WATCH_FOLDERS, safeHandle(async () => {
    return folderWatcherService.listWatchFolders()
  }))

  // ========== DISK HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.ANALYZE_DISK, safeHandle(async (_, { dirPath, maxDepth = 3 }) => {
    const progressCallback = (scanned: number) => {
      mainWindow?.webContents.send('cs:disk:progress', { scanned })
    }
    return diskAnalyzerService.analyzePath(dirPath, maxDepth, progressCallback)
  }))

  ipcMain.handle(IPC_CHANNELS.GET_DRIVES, safeHandle(async () => {
    return systemStatsService.getDiskUsage()
  }))

  ipcMain.handle(IPC_CHANNELS.FIND_LARGE_FILES, safeHandle(async (_, { dirPath, minSizeBytes }) => {
    return diskAnalyzerService.findLargeFiles(dirPath, minSizeBytes)
  }))

  ipcMain.handle(IPC_CHANNELS.FIND_EMPTY_FOLDERS, safeHandle(async (_, dirPath: string) => {
    return diskAnalyzerService.findEmptyFolders(dirPath)
  }))

  ipcMain.handle(IPC_CHANNELS.FIND_OLD_FILES, safeHandle(async (_, { dirPath, olderThanDays }) => {
    return diskAnalyzerService.findOldFiles(dirPath, olderThanDays)
  }))

  // ========== APPS HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.LIST_APPS, safeHandle(async () => {
    return appManagerService.listApps()
  }))

  ipcMain.handle(IPC_CHANNELS.UNINSTALL_APP, safeHandle(async (_, appId: string) => {
    const apps = await appManagerService.listApps()
    const app = apps.find(a => a.id === appId)
    if (app) {
      await appManagerService.uninstallApp(app)
    }
  }))

  ipcMain.handle(IPC_CHANNELS.GET_STARTUP_ITEMS, safeHandle(async () => {
    return startupManagerService.getStartupItems()
  }))

  ipcMain.handle(IPC_CHANNELS.TOGGLE_STARTUP_ITEM, safeHandle(async (_, { id, enabled }) => {
    const items = await startupManagerService.getStartupItems()
    const item = items.find(i => i.id === id)
    if (item) {
      await startupManagerService.toggleStartupItem(item, enabled)
    }
  }))

  // ========== SCHEDULER HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.GET_SCHEDULES, safeHandle(async () => {
    return configService.getSchedules()
  }))

  ipcMain.handle(IPC_CHANNELS.CREATE_SCHEDULE, safeHandle(async (_, task) => {
    const schedules = await configService.getSchedules()
    schedules.push(task)
    await configService.saveSchedules(schedules)
    return task
  }))

  ipcMain.handle(IPC_CHANNELS.DELETE_SCHEDULE, safeHandle(async (_, id: string) => {
    const schedules = await configService.getSchedules()
    const filtered = schedules.filter(s => s.id !== id)
    await configService.saveSchedules(filtered)
  }))

  ipcMain.handle(IPC_CHANNELS.TOGGLE_SCHEDULE, safeHandle(async (_, { id, enabled }) => {
    const schedules = await configService.getSchedules()
    const schedule = schedules.find(s => s.id === id)
    if (schedule) {
      schedule.enabled = enabled
      await configService.saveSchedules(schedules)
    }
  }))

  // ========== DIALOG HANDLERS ==========
  ipcMain.handle(IPC_CHANNELS.OPEN_FOLDER, safeHandle(async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder',
    })
    return result.canceled ? null : result.filePaths[0]
  }))

  ipcMain.handle(IPC_CHANNELS.OPEN_FILE, safeHandle(async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      title: 'Select Files',
    })
    return result.canceled ? [] : result.filePaths
  }))

  // ========== WINDOW HANDLERS ==========
  ipcMain.on(IPC_CHANNELS.SET_TITLE, (_, title: string) => {
    mainWindow?.setTitle(title)
  })
}
