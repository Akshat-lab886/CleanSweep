import type { AppConfig, ScanCategory } from './types'

// App constants
export const APP_NAME = 'CleanSweep'
export const APP_VERSION = '1.1.0'

// Browser list
export const BROWSER_LIST = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera'] as const

// Default configuration
export const DEFAULT_CONFIG: AppConfig = {
  version: APP_VERSION,
  general: {
    launchAtStartup: false,
    minimizeToTray: true,
    language: 'en',
    theme: 'system',
    showNotifications: true,
    lowDiskAlertThresholdGB: 10,
  },
  scan: {
    includeHidden: false,
    includeSystem: false,
    minFileSizeBytes: 0,
    customPaths: [],
    excludedExtensions: [],
  },
  quarantine: {
    enabled: true,
    retentionDays: 7,
    maxSizeGB: 5,
  },
  cleaner: {
    browsers: {
      chrome: {
        enabled: true,
        clearCache: true,
        clearCookies: false,
        clearHistory: false,
        clearDownloadHistory: false,
        clearPasswords: false,
        cookieWhitelist: [],
      },
      firefox: {
        enabled: true,
        clearCache: true,
        clearCookies: false,
        clearHistory: false,
        clearDownloadHistory: false,
        clearPasswords: false,
        cookieWhitelist: [],
      },
      safari: {
        enabled: true,
        clearCache: true,
        clearCookies: false,
        clearHistory: false,
        clearDownloadHistory: false,
        clearPasswords: false,
        cookieWhitelist: [],
      },
      edge: {
        enabled: true,
        clearCache: true,
        clearCookies: false,
        clearHistory: false,
        clearDownloadHistory: false,
        clearPasswords: false,
        cookieWhitelist: [],
      },
      brave: {
        enabled: true,
        clearCache: true,
        clearCookies: false,
        clearHistory: false,
        clearDownloadHistory: false,
        clearPasswords: false,
        cookieWhitelist: [],
      },
      opera: {
        enabled: true,
        clearCache: true,
        clearCookies: false,
        clearHistory: false,
        clearDownloadHistory: false,
        clearPasswords: false,
        cookieWhitelist: [],
      },
    },
    systemJunk: {
      caches: true,
      logs: true,
      tempFiles: true,
      trash: true,
    },
  },
  organizer: {
    conflictStrategy: 'rename',
    defaultDestination: '~/Organized',
  },
  ui: {
    density: 'comfortable',
    accentColor: '#3b82f6',
    sidebarCollapsed: false,
  },
}

// Category labels
export const CATEGORY_LABELS: Record<ScanCategory, string> = {
  'system-junk': 'System Junk',
  'browser-cache': 'Browser Cache',
  logs: 'Log Files',
  'temp-files': 'Temporary Files',
  'app-leftovers': 'App Leftovers',
  'large-files': 'Large Files',
  'old-files': 'Old Files',
  duplicates: 'Duplicate Files',
  trash: 'Trash',
  privacy: 'Privacy Data',
}

// File type categories
export const FILE_TYPE_CATEGORIES: Record<string, string> = {
  // Images
  '.jpg': 'Images',
  '.jpeg': 'Images',
  '.png': 'Images',
  '.gif': 'Images',
  '.bmp': 'Images',
  '.svg': 'Images',
  '.webp': 'Images',
  '.heic': 'Images',
  '.ico': 'Images',

  // Videos
  '.mp4': 'Videos',
  '.avi': 'Videos',
  '.mov': 'Videos',
  '.mkv': 'Videos',
  '.wmv': 'Videos',
  '.flv': 'Videos',
  '.webm': 'Videos',
  '.m4v': 'Videos',

  // Audio
  '.mp3': 'Audio',
  '.wav': 'Audio',
  '.flac': 'Audio',
  '.aac': 'Audio',
  '.ogg': 'Audio',
  '.m4a': 'Audio',
  '.wma': 'Audio',

  // Documents
  '.pdf': 'Documents',
  '.doc': 'Documents',
  '.docx': 'Documents',
  '.txt': 'Documents',
  '.rtf': 'Documents',
  '.odt': 'Documents',
  '.pages': 'Documents',

  // Spreadsheets
  '.xls': 'Spreadsheets',
  '.xlsx': 'Spreadsheets',
  '.csv': 'Spreadsheets',
  '.ods': 'Spreadsheets',
  '.numbers': 'Spreadsheets',

  // Presentations
  '.ppt': 'Presentations',
  '.pptx': 'Presentations',
  '.odp': 'Presentations',
  '.key': 'Presentations',

  // Archives
  '.zip': 'Archives',
  '.rar': 'Archives',
  '.7z': 'Archives',
  '.tar': 'Archives',
  '.gz': 'Archives',
  '.bz2': 'Archives',

  // Code
  '.js': 'Code',
  '.jsx': 'Code',
  '.ts': 'Code',
  '.tsx': 'Code',
  '.py': 'Code',
  '.java': 'Code',
  '.cpp': 'Code',
  '.c': 'Code',
  '.cs': 'Code',
  '.go': 'Code',
  '.rs': 'Code',
  '.rb': 'Code',
  '.php': 'Code',
  '.swift': 'Code',
  '.kt': 'Code',
  '.html': 'Code',
  '.css': 'Code',
  '.scss': 'Code',
  '.less': 'Code',
  '.json': 'Code',
  '.xml': 'Code',
  '.yaml': 'Code',
  '.yml': 'Code',
  '.md': 'Code',
  '.sql': 'Code',
  '.sh': 'Code',
  '.bash': 'Code',
  '.zsh': 'Code',

  // Disk images
  '.dmg': 'Disk Images',
  '.iso': 'Disk Images',
  '.img': 'Disk Images',

  // Fonts
  '.ttf': 'Fonts',
  '.otf': 'Fonts',
  '.woff': 'Fonts',
  '.woff2': 'Fonts',
}

// Size units
export const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const
