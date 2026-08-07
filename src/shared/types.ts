// Platform types
export type Platform = 'darwin' | 'win32'

// Scan categories
export type ScanCategory =
  | 'system-junk'
  | 'browser-cache'
  | 'logs'
  | 'temp-files'
  | 'app-leftovers'
  | 'large-files'
  | 'old-files'
  | 'duplicates'
  | 'trash'
  | 'privacy'

// Scanned item
export interface ScannedItem {
  id: string
  path: string
  size: number
  type: 'file' | 'directory'
  lastModified: number
  lastAccessed: number
  category: ScanCategory
  description: string
  safeToDelete: boolean
}

// Scan result
export interface ScanResult {
  id: string
  category: ScanCategory
  categoryLabel: string
  items: ScannedItem[]
  totalSize: number
  scanDuration: number
}

// Scan progress
export interface ScanProgress {
  phase: 'indexing' | 'analyzing' | 'hashing' | 'complete'
  filesScanned: number
  totalFound: number
  currentPath: string
  percentage: number
}

// Duplicate group
export interface DuplicateGroup {
  id: string
  hash: string
  files: ScannedItem[]
  wastedSpace: number
}

// Rule condition
export type RuleConditionField = 'name' | 'extension' | 'size' | 'created' | 'modified'
export type RuleConditionOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'matches'

export interface RuleCondition {
  id: string
  field: RuleConditionField
  operator: RuleConditionOperator
  value: string
}

// Organizer rule
export type RuleAction = 'move' | 'copy' | 'rename' | 'delete'

export interface OrganizerRule {
  id: string
  name: string
  enabled: boolean
  conditions: RuleCondition[]
  logicOperator: 'AND' | 'OR'
  action: RuleAction
  destination: string
  namingPattern?: string
  priority: number
}

// Watch folder
export interface WatchFolder {
  id: string
  sourcePath: string
  enabled: boolean
  ruleIds: string[]
  createdAt: number
}

// Quarantine entry
export interface QuarantineEntry {
  id: string
  originalPath: string
  quarantinePath: string
  filename: string
  size: number
  deletedAt: number
  expiresAt: number
  reason: string
  category: ScanCategory
  restorable: boolean
}

// App info
export interface AppInfo {
  id: string
  name: string
  path: string
  size: number
  version: string
  bundleId?: string
  publisher?: string
  installDate?: number
  lastUsed?: number
}

// Startup item
export interface StartupItem {
  id: string
  name: string
  path: string
  enabled: boolean
  type: string
  impact: 'low' | 'medium' | 'high'
}

// Disk drive
export interface DiskDrive {
  name: string
  mountPoint: string
  total: number
  used: number
  free: number
  type: 'internal' | 'external' | 'network'
}

// Disk node (for treemap)
export interface DiskNode {
  name: string
  path: string
  size: number
  type: 'file' | 'directory'
  children?: DiskNode[]
  extension?: string
}

// History entry
export interface HistoryEntry {
  id: string
  timestamp: number
  type: 'quick-clean' | 'deep-clean' | 'duplicate-remove' | 'organize' | 'rename' | 'uninstall'
  filesProcessed: number
  spaceFreed: number
  details: string
}

// Schedule task
export interface ScheduleTask {
  id: string
  name: string
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string // "HH:MM"
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  taskType: 'quick-clean' | 'deep-clean' | 'organize'
  lastRun?: number
  nextRun?: number
}

// App configuration
export interface AppConfig {
  version: string
  general: {
    launchAtStartup: boolean
    minimizeToTray: boolean
    language: string
    theme: 'light' | 'dark' | 'system'
    showNotifications: boolean
    lowDiskAlertThresholdGB: number
  }
  scan: {
    includeHidden: boolean
    includeSystem: boolean
    minFileSizeBytes: number
    customPaths: string[]
    excludedExtensions: string[]
  }
  quarantine: {
    enabled: boolean
    retentionDays: number
    maxSizeGB: number
  }
  cleaner: {
    browsers: {
      [key: string]: {
        enabled: boolean
        clearCache: boolean
        clearCookies: boolean
        clearHistory: boolean
        clearDownloadHistory: boolean
        clearPasswords: boolean
        cookieWhitelist: string[]
      }
    }
    systemJunk: { [key: string]: boolean }
  }
  organizer: {
    conflictStrategy: 'skip' | 'rename' | 'overwrite'
    defaultDestination: string
  }
  ui: {
    density: 'compact' | 'comfortable'
    accentColor: string
    sidebarCollapsed: boolean
  }
}

// IPC response wrapper
export type IPCResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; recoverable: boolean } }

// Organize preview item
export interface OrganizePreviewItem {
  id: string
  sourcePath: string
  destinationPath: string
  action: RuleAction | 'skip'
  ruleName: string
  willOverwrite: boolean
}

// Rename pattern
export interface RenamePattern {
  replaceText?: string
  replaceWith?: string
  addPrefix?: string
  addSuffix?: string
  caseChange?: 'upper' | 'lower' | 'title' | 'none'
  numberSequentially?: boolean
  numberPadding?: number
  numberPosition?: 'prefix' | 'suffix'
  template?: string
  changeExtension?: string
}

// Rename preview item
export interface RenamePreviewItem {
  id: string
  originalPath: string
  originalName: string
  newName: string
  newPath: string
  hasConflict: boolean
}
