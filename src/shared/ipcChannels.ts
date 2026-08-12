// IPC Channel constants
export const IPC_CHANNELS = {
  // Scanner channels
  QUICK_SCAN: 'cs:scanner:quick-scan',
  DEEP_SCAN: 'cs:scanner:deep-scan',
  BROWSER_SCAN: 'cs:scanner:browser-scan',
  CANCEL_SCAN: 'cs:scanner:cancel',
  SCAN_PROGRESS: 'cs:scanner:progress',

  // Cleaner channels
  PREVIEW_CLEAN: 'cs:cleaner:preview',
  EXECUTE_CLEAN: 'cs:cleaner:execute',
  GET_HISTORY: 'cs:cleaner:get-history',

  // Duplicates channels
  FIND_DUPLICATES: 'cs:duplicates:find',
  FIND_PHOTO_DUPLICATES: 'cs:duplicates:find-photos',
  DELETE_DUPLICATES: 'cs:duplicates:delete',
  DUPLICATES_PROGRESS: 'cs:duplicates:progress',

  // Organizer channels
  PREVIEW_ORGANIZE: 'cs:organizer:preview',
  EXECUTE_ORGANIZE: 'cs:organizer:execute',
  GET_RULES: 'cs:organizer:get-rules',
  SAVE_RULES: 'cs:organizer:save-rules',
  RENAME_PREVIEW: 'cs:organizer:rename-preview',
  RENAME_EXECUTE: 'cs:organizer:rename-execute',

  // Watcher channels
  ADD_WATCH_FOLDER: 'cs:watcher:add',
  REMOVE_WATCH_FOLDER: 'cs:watcher:remove',
  LIST_WATCH_FOLDERS: 'cs:watcher:list',
  WATCHER_ACTIVITY: 'cs:watcher:activity',

  // Disk channels
  ANALYZE_DISK: 'cs:disk:analyze',
  GET_DRIVES: 'cs:disk:get-drives',
  FIND_LARGE_FILES: 'cs:disk:large-files',
  FIND_EMPTY_FOLDERS: 'cs:disk:empty-folders',
  FIND_OLD_FILES: 'cs:disk:old-files',

  // Apps channels
  LIST_APPS: 'cs:apps:list',
  UNINSTALL_APP: 'cs:apps:uninstall',
  GET_STARTUP_ITEMS: 'cs:apps:get-startup',
  TOGGLE_STARTUP_ITEM: 'cs:apps:toggle-startup',

  // Quarantine channels
  LIST_QUARANTINE: 'cs:quarantine:list',
  RESTORE_QUARANTINE: 'cs:quarantine:restore',
  PURGE_QUARANTINE: 'cs:quarantine:purge',
  PURGE_EXPIRED_QUARANTINE: 'cs:quarantine:purge-expired',

  // Config channels
  GET_CONFIG: 'cs:config:get',
  SET_CONFIG: 'cs:config:set',
  GET_WHITELIST: 'cs:config:get-whitelist',
  ADD_TO_WHITELIST: 'cs:config:add-whitelist',
  REMOVE_FROM_WHITELIST: 'cs:config:remove-whitelist',

  // System channels
  GET_SYSTEM_STATS: 'cs:system:get-stats',
  GET_DISK_USAGE: 'cs:system:disk-usage',
  OPTIMIZE_MEMORY: 'cs:system:optimize-memory',

  // Scheduler channels
  GET_SCHEDULES: 'cs:scheduler:get',
  CREATE_SCHEDULE: 'cs:scheduler:create',
  DELETE_SCHEDULE: 'cs:scheduler:delete',
  TOGGLE_SCHEDULE: 'cs:scheduler:toggle',

  // Dialog channels
  OPEN_FOLDER: 'cs:dialog:open-folder',
  OPEN_FILE: 'cs:dialog:open-file',

  // Window channels
  SET_TITLE: 'cs:window:set-title',
} as const
