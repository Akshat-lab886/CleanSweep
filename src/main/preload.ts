import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/ipcChannels'
import type {
  ScanProgress,
  ScanResult,
  ScannedItem,
  DuplicateGroup,
  OrganizerRule,
  OrganizePreviewItem,
  RenamePattern,
  RenamePreviewItem,
  WatchFolder,
  DiskNode,
  DiskDrive,
  AppInfo,
  StartupItem,
  QuarantineEntry,
  AppConfig,
  HistoryEntry,
  ScheduleTask,
  IPCResponse,
} from '../shared/types'

// Type for IPC channel keys
type IPCChannelKey = keyof typeof IPC_CHANNELS

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('cleanSweepAPI', {
  // Scanner
  scanner: {
    quickScan: (options?: { customPaths?: string[] }) =>
      ipcRenderer.invoke(IPC_CHANNELS.QUICK_SCAN, options) as Promise<IPCResponse<ScanResult[]>>,
    deepScan: (options?: { customPaths?: string[] }) =>
      ipcRenderer.invoke(IPC_CHANNELS.DEEP_SCAN, options) as Promise<IPCResponse<ScanResult[]>>,
    browserScan: (browsers: string[], options: Record<string, boolean>) =>
      ipcRenderer.invoke(IPC_CHANNELS.BROWSER_SCAN, { browsers, options }) as Promise<IPCResponse<ScanResult[]>>,
    cancelScan: () => ipcRenderer.send(IPC_CHANNELS.CANCEL_SCAN),
    onProgress: (callback: (progress: ScanProgress) => void) => {
      const handler = (_event: IpcRendererEvent, data: ScanProgress) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_PROGRESS, handler)
    },
  },

  // Cleaner
  cleaner: {
    previewClean: (items: ScannedItem[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.PREVIEW_CLEAN, items) as Promise<IPCResponse<ScannedItem[]>>,
    executeClean: (items: ScannedItem[], useQuarantine: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_CLEAN, { items, useQuarantine }) as Promise<IPCResponse<{ freed: number; count: number; failed: number }>>,
    getHistory: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY) as Promise<IPCResponse<HistoryEntry[]>>,
  },

  // Duplicates
  duplicates: {
    findDuplicates: (paths: string[], options: { minSizeBytes: number; includeHidden: boolean }) =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_DUPLICATES, { paths, options }) as Promise<IPCResponse<DuplicateGroup[]>>,
    findPhotoDuplicates: (paths: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_PHOTO_DUPLICATES, paths) as Promise<IPCResponse<DuplicateGroup[]>>,
    deleteDuplicates: (items: ScannedItem[], useQuarantine: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.DELETE_DUPLICATES, { items, useQuarantine }) as Promise<IPCResponse<{ freed: number; count: number }>>,
    onProgress: (callback: (progress: ScanProgress) => void) => {
      const handler = (_event: IpcRendererEvent, data: ScanProgress) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.DUPLICATES_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DUPLICATES_PROGRESS, handler)
    },
  },

  // Organizer
  organizer: {
    previewOrganize: (source: string, rules: OrganizerRule[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.PREVIEW_ORGANIZE, { source, rules }) as Promise<IPCResponse<OrganizePreviewItem[]>>,
    executeOrganize: (items: OrganizePreviewItem[], strategy: 'skip' | 'rename' | 'overwrite') =>
      ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_ORGANIZE, { items, strategy }) as Promise<IPCResponse<{ succeeded: number; failed: number; skipped: number }>>,
    getRules: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_RULES) as Promise<IPCResponse<OrganizerRule[]>>,
    saveRules: (rules: OrganizerRule[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVE_RULES, rules) as Promise<IPCResponse<void>>,
    renamePreview: (files: string[], pattern: RenamePattern) =>
      ipcRenderer.invoke(IPC_CHANNELS.RENAME_PREVIEW, { files, pattern }) as Promise<IPCResponse<RenamePreviewItem[]>>,
    renameExecute: (items: RenamePreviewItem[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.RENAME_EXECUTE, items) as Promise<IPCResponse<{ succeeded: number; failed: number }>>,
  },

  // Watcher
  watcher: {
    addWatchFolder: (folder: WatchFolder) =>
      ipcRenderer.invoke(IPC_CHANNELS.ADD_WATCH_FOLDER, folder) as Promise<IPCResponse<void>>,
    removeWatchFolder: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.REMOVE_WATCH_FOLDER, id) as Promise<IPCResponse<void>>,
    listWatchFolders: () =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_WATCH_FOLDERS) as Promise<IPCResponse<WatchFolder[]>>,
    onActivity: (callback: (data: { file: string; watchFolder: string; action: string; timestamp: number }) => void) => {
      const handler = (_event: IpcRendererEvent, data: any) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.WATCHER_ACTIVITY, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WATCHER_ACTIVITY, handler)
    },
  },

  // Disk
  disk: {
    analyzeDisk: (dirPath: string, maxDepth?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYZE_DISK, { dirPath, maxDepth }) as Promise<IPCResponse<DiskNode>>,
    getDrives: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_DRIVES) as Promise<IPCResponse<DiskDrive[]>>,
    findLargeFiles: (dirPath: string, minSizeBytes: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_LARGE_FILES, { dirPath, minSizeBytes }) as Promise<IPCResponse<ScannedItem[]>>,
    findEmptyFolders: (dirPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_EMPTY_FOLDERS, dirPath) as Promise<IPCResponse<string[]>>,
    findOldFiles: (dirPath: string, olderThanDays: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.FIND_OLD_FILES, { dirPath, olderThanDays }) as Promise<IPCResponse<ScannedItem[]>>,
  },

  // Apps
  apps: {
    listApps: () =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_APPS) as Promise<IPCResponse<AppInfo[]>>,
    uninstallApp: (appId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.UNINSTALL_APP, appId) as Promise<IPCResponse<void>>,
    getStartupItems: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_STARTUP_ITEMS) as Promise<IPCResponse<StartupItem[]>>,
    toggleStartupItem: (id: string, enabled: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_STARTUP_ITEM, { id, enabled }) as Promise<IPCResponse<void>>,
  },

  // Quarantine
  quarantine: {
    listQuarantine: () =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_QUARANTINE) as Promise<IPCResponse<QuarantineEntry[]>>,
    restoreItem: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.RESTORE_QUARANTINE, id) as Promise<IPCResponse<void>>,
    purgeAll: () =>
      ipcRenderer.invoke(IPC_CHANNELS.PURGE_QUARANTINE) as Promise<IPCResponse<{ count: number; freed: number }>>,
  },

  // Config
  config: {
    getConfig: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG) as Promise<IPCResponse<AppConfig>>,
    setConfig: (config: Partial<AppConfig>) =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_CONFIG, config) as Promise<IPCResponse<void>>,
    getWhitelist: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_WHITELIST) as Promise<IPCResponse<string[]>>,
    addToWhitelist: (path: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ADD_TO_WHITELIST, path) as Promise<IPCResponse<void>>,
    removeFromWhitelist: (path: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.REMOVE_FROM_WHITELIST, path) as Promise<IPCResponse<void>>,
  },

  // System
  system: {
    getSystemStats: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_STATS) as Promise<IPCResponse<{
        platform: string
        arch: string
        totalRAM: number
        freeRAM: number
        usedRAM: number
        cpuModel: string
        cpuUsage: number
        uptime: number
      }>>,
    getDiskUsage: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_DISK_USAGE) as Promise<IPCResponse<DiskDrive[]>>,
    optimizeMemory: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OPTIMIZE_MEMORY) as Promise<IPCResponse<void>>,
  },

  // Scheduler
  scheduler: {
    getSchedules: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_SCHEDULES) as Promise<IPCResponse<ScheduleTask[]>>,
    createSchedule: (task: ScheduleTask) =>
      ipcRenderer.invoke(IPC_CHANNELS.CREATE_SCHEDULE, task) as Promise<IPCResponse<ScheduleTask>>,
    deleteSchedule: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DELETE_SCHEDULE, id) as Promise<IPCResponse<void>>,
    toggleSchedule: (id: string, enabled: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_SCHEDULE, { id, enabled }) as Promise<IPCResponse<void>>,
  },

  // Dialog
  dialog: {
    openFolder: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OPEN_FOLDER) as Promise<IPCResponse<string | null>>,
    openFile: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE) as Promise<IPCResponse<string[]>>,
  },

  // Window
  window: {
    setTitle: (title: string) => ipcRenderer.send(IPC_CHANNELS.SET_TITLE, title),
  },
})
