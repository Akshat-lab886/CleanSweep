import type {
  ScanProgress,
  ScanResult,
  ScanOptions,
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
} from '../../shared/types'

declare global {
  interface Window {
    cleanSweepAPI: {
      scanner: {
        quickScan: (options?: ScanOptions) => Promise<IPCResponse<ScanResult[]>>
        deepScan: (options?: ScanOptions) => Promise<IPCResponse<ScanResult[]>>
        browserScan: (browsers: string[], options: Record<string, boolean>) => Promise<IPCResponse<ScanResult[]>>
        cancelScan: () => void
        onProgress: (callback: (progress: ScanProgress) => void) => () => void
      }
      cleaner: {
        previewClean: (items: ScannedItem[]) => Promise<IPCResponse<ScannedItem[]>>
        executeClean: (items: ScannedItem[], useQuarantine: boolean) => Promise<IPCResponse<{ freed: number; count: number; failed: number }>>
        getHistory: () => Promise<IPCResponse<HistoryEntry[]>>
      }
      duplicates: {
        findDuplicates: (paths: string[], options: { minSizeBytes: number; includeHidden: boolean }) => Promise<IPCResponse<DuplicateGroup[]>>
        findPhotoDuplicates: (paths: string[]) => Promise<IPCResponse<DuplicateGroup[]>>
        deleteDuplicates: (items: ScannedItem[], useQuarantine: boolean) => Promise<IPCResponse<{ freed: number; count: number }>>
        onProgress: (callback: (progress: ScanProgress) => void) => () => void
      }
      organizer: {
        previewOrganize: (source: string, rules: OrganizerRule[]) => Promise<IPCResponse<OrganizePreviewItem[]>>
        executeOrganize: (items: OrganizePreviewItem[], strategy: 'skip' | 'rename' | 'overwrite') => Promise<IPCResponse<{ succeeded: number; failed: number; skipped: number }>>
        getRules: () => Promise<IPCResponse<OrganizerRule[]>>
        saveRules: (rules: OrganizerRule[]) => Promise<IPCResponse<void>>
        renamePreview: (files: string[], pattern: RenamePattern) => Promise<IPCResponse<RenamePreviewItem[]>>
        renameExecute: (items: RenamePreviewItem[]) => Promise<IPCResponse<{ succeeded: number; failed: number }>>
      }
      watcher: {
        addWatchFolder: (folder: WatchFolder) => Promise<IPCResponse<void>>
        removeWatchFolder: (id: string) => Promise<IPCResponse<void>>
        listWatchFolders: () => Promise<IPCResponse<WatchFolder[]>>
        onActivity: (callback: (data: { file: string; watchFolder: string; action: string; timestamp: number }) => void) => () => void
      }
      disk: {
        analyzeDisk: (dirPath: string, maxDepth?: number) => Promise<IPCResponse<DiskNode>>
        getDrives: () => Promise<IPCResponse<DiskDrive[]>>
        findLargeFiles: (dirPath: string, minSizeBytes: number) => Promise<IPCResponse<ScannedItem[]>>
        findEmptyFolders: (dirPath: string) => Promise<IPCResponse<string[]>>
        findOldFiles: (dirPath: string, olderThanDays: number) => Promise<IPCResponse<ScannedItem[]>>
      }
      apps: {
        listApps: () => Promise<IPCResponse<AppInfo[]>>
        uninstallApp: (appId: string) => Promise<IPCResponse<void>>
        getStartupItems: () => Promise<IPCResponse<StartupItem[]>>
        toggleStartupItem: (id: string, enabled: boolean) => Promise<IPCResponse<void>>
      }
      quarantine: {
        listQuarantine: () => Promise<IPCResponse<QuarantineEntry[]>>
        restoreItem: (id: string) => Promise<IPCResponse<void>>
        purgeAll: () => Promise<IPCResponse<{ count: number; freed: number }>>
      }
      config: {
        getConfig: () => Promise<IPCResponse<AppConfig>>
        setConfig: (config: Partial<AppConfig>) => Promise<IPCResponse<void>>
        getWhitelist: () => Promise<IPCResponse<string[]>>
        addToWhitelist: (path: string) => Promise<IPCResponse<void>>
        removeFromWhitelist: (path: string) => Promise<IPCResponse<void>>
      }
      system: {
        getSystemStats: () => Promise<IPCResponse<{
          platform: string
          arch: string
          totalRAM: number
          freeRAM: number
          usedRAM: number
          cpuModel: string
          cpuUsage: number
          uptime: number
        }>>
        getDiskUsage: () => Promise<IPCResponse<DiskDrive[]>>
        optimizeMemory: () => Promise<IPCResponse<void>>
      }
      scheduler: {
        getSchedules: () => Promise<IPCResponse<ScheduleTask[]>>
        createSchedule: (task: Omit<ScheduleTask, 'id'>) => Promise<IPCResponse<ScheduleTask>>
        deleteSchedule: (id: string) => Promise<IPCResponse<void>>
        toggleSchedule: (id: string, enabled: boolean) => Promise<IPCResponse<void>>
      }
      dialog: {
        openFolder: () => Promise<IPCResponse<string | null>>
        openFile: () => Promise<IPCResponse<string[]>>
      }
      window: {
        setTitle: (title: string) => void
      }
    }
  }
}

export {}
