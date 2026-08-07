Prompts.md — CleanSweep
Markdown

# Prompts.md — CleanSweep Vibe Coding Agent Instructions
## Single-Pass, Loop Until Done Strategy

---

## CONTEXT BLOCK (Paste this if agent loses context)
Project: CleanSweep — Cross-platform desktop cleaner + file organizer
Stack: Electron 28 + React 18 + TypeScript 5 + Vite + Zustand + Tailwind CSS
Main process (src/main/): All file system ops, Node.js only
Renderer (src/renderer/): React UI only, zero direct fs access
Shared (src/shared/): Types + constants used by both
IPC: contextBridge in preload.ts — NEVER use nodeIntegration: true
Storage: Local JSON files in AppData/Application Support — no DB, no cloud
Safety: Files NEVER hard-deleted — always QuarantineService first
Platforms: macOS (darwin) + Windows (win32) from one codebase

text


---

## HOW TO USE

1. Give the agent the FILE MANIFEST below — it knows what to build
2. Give prompts ONE PHASE AT A TIME
3. After each phase: run → test → fix → next phase
4. Use DEBUG prompts if something breaks
5. Final prompt tells agent to loop build→test→debug until done

---

---
# PHASE 1 — Foundation & Shell
---

## PROMPT 1.1 — Scaffold + Types + IPC + Layout
Build the complete CleanSweep Electron app foundation in one shot.

STACK: Electron 28, React 18, TypeScript 5, Vite 5, Zustand 4,
Tailwind CSS 3, React Router 6, lucide-react, clsx,
@radix-ui/react-dialog, @radix-ui/react-progress,
@radix-ui/react-scroll-area, @tanstack/react-virtual

--- PROJECT STRUCTURE ---
cleansweep/
├── package.json
├── tsconfig.json / tsconfig.main.json / tsconfig.renderer.json
├── vite.config.ts
├── tailwind.config.js
├── electron-builder.json
├── src/
│ ├── main/
│ │ ├── index.ts ← BrowserWindow, app lifecycle
│ │ ├── preload.ts ← contextBridge API
│ │ ├── ipcHandlers.ts ← ALL ipc channel stubs
│ │ ├── trayManager.ts ← System tray
│ │ └── utils/
│ │ ├── fsUtils.ts ← All fs helpers
│ │ ├── logger.ts ← File logger (userData/logs/)
│ │ └── ipcHelper.ts ← safeHandle wrapper
│ ├── renderer/
│ │ ├── index.html
│ │ ├── main.tsx
│ │ ├── App.tsx
│ │ ├── router.tsx ← HashRouter + all routes
│ │ ├── types/electron.d.ts ← window.cleanSweepAPI types
│ │ ├── stores/
│ │ │ ├── uiStore.ts ← theme, sidebar, toasts
│ │ │ └── settingsStore.ts ← config, whitelist
│ │ ├── hooks/
│ │ │ ├── useIPC.ts
│ │ │ ├── useIPCEvent.ts
│ │ │ └── usePlatform.ts
│ │ ├── components/
│ │ │ └── layout/
│ │ │ ├── Sidebar.tsx
│ │ │ ├── TopBar.tsx
│ │ │ └── MainLayout.tsx
│ │ ├── pages/ ← All placeholder pages
│ │ └── styles/globals.css
│ └── shared/
│ ├── ipcChannels.ts
│ ├── types.ts
│ └── constants.ts

--- MAIN PROCESS (src/main/index.ts) ---

BrowserWindow: 1200x800, min 900x600
webPreferences: nodeIntegration:false, contextIsolation:true,
sandbox:false, preload: path to preload.js
Load Vite dev URL in dev, dist/index.html in prod
Single instance lock (second instance → focus existing window)
Call registerAllHandlers(mainWindow) after ready
Set app.setAppUserModelId('com.cleansweep.app') on Windows
--- SHARED TYPES (src/shared/types.ts) ---
Export ALL these interfaces:
Platform = 'darwin' | 'win32'
ScanCategory = 'system-junk'|'browser-cache'|'logs'|'temp-files'
|'app-leftovers'|'large-files'|'old-files'|'duplicates'|'trash'|'privacy'
ScannedItem { id, path, size, type, lastModified, lastAccessed,
category, description, safeToDelete }
ScanResult { id, category, categoryLabel, items, totalSize, scanDuration }
ScanProgress { phase:'indexing'|'analyzing'|'hashing'|'complete',
filesScanned, totalFound, currentPath, percentage }
DuplicateGroup { id, hash, files:ScannedItem[], wastedSpace }
RuleCondition { id, field, operator, value }
OrganizerRule { id, name, enabled, conditions, logicOperator,
action, destination, namingPattern, priority }
WatchFolder { id, sourcePath, enabled, ruleIds, createdAt }
QuarantineEntry { id, originalPath, quarantinePath, filename,
size, deletedAt, expiresAt, reason, restorable }
AppInfo { id, name, path, size, version, bundleId?, publisher? }
StartupItem { id, name, path, enabled, type, impact }
DiskDrive { name, mountPoint, total, used, free }
DiskNode { name, path, size, type, children?, extension? }
HistoryEntry { id, timestamp, type, filesProcessed, spaceFreed, details }
ScheduleTask { id, name, enabled, frequency, time, taskType, lastRun?, nextRun? }
AppConfig { version, general{launchAtStartup,minimizeToTray,theme,
showNotifications,lowDiskAlertThresholdGB}, scan{includeHidden,
includeSystem,minFileSizeBytes,customPaths,excludedExtensions},
quarantine{enabled,retentionDays,maxSizeGB},
cleaner{browsers,systemJunk}, organizer{conflictStrategy},
ui{density,accentColor} }
IPCResponse<T> = {success:true,data:T} | {success:false,error:{code,message,recoverable}}
OrganizePreviewItem { id, sourcePath, destinationPath, action, ruleName, willOverwrite }
RenamePattern { replaceText?,replaceWith?,addPrefix?,addSuffix?,
caseChange?,numberSequentially?,numberPadding?,numberPosition?,template? }
RenamePreviewItem { id, originalPath, originalName, newName, newPath, hasConflict }

--- SHARED IPC CHANNELS (src/shared/ipcChannels.ts) ---
Export IPC_CHANNELS object with:
scanner: QUICK_SCAN, DEEP_SCAN, BROWSER_SCAN, CANCEL_SCAN, SCAN_PROGRESS
cleaner: EXECUTE_CLEAN, GET_HISTORY
duplicates: FIND_DUPLICATES, DELETE_DUPLICATES, DUPLICATES_PROGRESS
organizer: PREVIEW_ORGANIZE, EXECUTE_ORGANIZE, GET_RULES, SAVE_RULES,
RENAME_PREVIEW, RENAME_EXECUTE
watcher: ADD_WATCH_FOLDER, REMOVE_WATCH_FOLDER, LIST_WATCH_FOLDERS,
WATCHER_ACTIVITY
disk: ANALYZE_DISK, GET_DRIVES, FIND_LARGE_FILES, FIND_EMPTY_FOLDERS,
FIND_OLD_FILES
apps: LIST_APPS, UNINSTALL_APP, GET_STARTUP_ITEMS, TOGGLE_STARTUP_ITEM
quarantine: LIST_QUARANTINE, RESTORE_QUARANTINE, PURGE_QUARANTINE
config: GET_CONFIG, SET_CONFIG, GET_WHITELIST, ADD_TO_WHITELIST,
REMOVE_FROM_WHITELIST
system: GET_SYSTEM_STATS, GET_DISK_USAGE, OPTIMIZE_MEMORY
scheduler: GET_SCHEDULES, CREATE_SCHEDULE, DELETE_SCHEDULE, TOGGLE_SCHEDULE
dialog: OPEN_FOLDER, OPEN_FILE
window: SET_TITLE

--- SHARED CONSTANTS (src/shared/constants.ts) ---
DEFAULT_CONFIG: AppConfig (sensible defaults)
CATEGORY_LABELS: Record<ScanCategory, string>
FILE_TYPE_CATEGORIES: map extensions to Image/Video/Audio/Document/Archive/Code/Other
BROWSER_LIST: ['chrome','firefox','safari','edge','brave','opera']

--- PRELOAD (src/main/preload.ts) ---
Expose window.cleanSweepAPI via contextBridge with namespaces:
scanner.quickScan(opts) → invoke
scanner.cancelScan() → send
scanner.onProgress(cb) → on listener, returns cleanup fn
cleaner.executeClean(items, useQuarantine) → invoke
cleaner.getHistory() → invoke
duplicates.findDuplicates(paths, opts) → invoke
duplicates.deleteDuplicates(items, useQuarantine) → invoke
duplicates.onProgress(cb) → on listener, returns cleanup fn
organizer.previewOrganize(src, rules) → invoke
organizer.executeOrganize(src, rules) → invoke
organizer.getRules() / saveRules(rules) → invoke
organizer.renamePreview(files, pattern) / renameExecute → invoke
watcher.add/remove/list → invoke
watcher.onActivity(cb) → on listener, returns cleanup fn
disk.analyzeDisk(path) / getDrives() / findLargeFiles / findEmptyFolders
/ findOldFiles → invoke
apps.listApps() / uninstallApp / getStartupItems / toggleStartupItem → invoke
quarantine.list/restore/purge → invoke
config.getConfig/setConfig/getWhitelist/addToWhitelist/removeFromWhitelist → invoke
system.getSystemStats/getDiskUsage/optimizeMemory → invoke
scheduler.get/create/delete/toggle → invoke
dialog.openFolder() / openFile() → invoke (uses electron dialog)
window.setTitle(title) → send

NEVER expose raw ipcRenderer. Subscription fns must return cleanup fn.

--- IPC HANDLER STUBS (src/main/ipcHandlers.ts) ---
Register ALL channels above as stubs returning {success:true, data:null}
Use safeHandle wrapper from ipcHelper.ts:
safeHandle wraps ipcMain.handle in try/catch
On success: return {success:true, data:result}
On error: return {success:false, error:{code,message,recoverable:true}}
Export registerAllHandlers(mainWindow: BrowserWindow)

--- FS UTILS (src/main/utils/fsUtils.ts) ---
Export async functions (all handle errors gracefully, never throw):
getFileStat(path) → {size,lastModified,lastAccessed,isDirectory,isFile} | null
getDirectorySize(path) → number (recursive, skip errors)
listDirectory(path) → string[] (full paths)
deleteFile(path) → boolean
moveFile(from, to) → boolean (rename first, fallback copy+delete)
copyFile(from, to) → boolean
ensureDir(path) → void
isPathAccessible(path) → boolean
formatBytes(bytes, decimals?) → string ("2.5 GB")

--- LOGGER (src/main/utils/logger.ts) ---
Singleton. Writes JSON lines to userData/logs/app-YYYY-MM.log
Methods: info/warn/error(module, message, data?)
Console.log in dev mode. 10MB cap, monthly rotation.
Export: logger singleton

--- LAYOUT & UI ---
src/renderer/components/layout/Sidebar.tsx:
240px wide, collapsible to 64px icon-only
Nav items with lucide icons: Dashboard(/), Cleaner(/cleaner),
Duplicates(/duplicates), Organizer(/organizer), Disk(/disk),
Apps(/apps), Scheduler(/scheduler), Quarantine(/quarantine),
Settings(/settings)
Active item highlight with blue-500 accent
Collapse toggle at bottom, state in localStorage
Smooth 200ms transitions

src/renderer/components/layout/TopBar.tsx:
48px height, page title, theme toggle (sun/moon), notification bell

src/renderer/components/layout/MainLayout.tsx:
Sidebar left + TopBar top + scrollable content area
Light: bg-gray-50/sidebar bg-white / Dark: bg-gray-950/bg-gray-900

--- STORES ---
uiStore.ts: theme('light'|'dark'|'system'), sidebarCollapsed,
activeModal, toasts[]. Actions: setTheme (apply to documentElement),
toggleSidebar, addToast(msg,type), removeToast(id)
settingsStore.ts: config:AppConfig|null, whitelist:string[], loading.
Actions: loadConfig, updateConfig, addToWhitelist, removeFromWhitelist
Call loadConfig() in App.tsx on mount.

--- HOOKS ---
useIPC.ts: wraps IPC call, returns {data,loading,error}, unwraps IPCResponse
useIPCEvent.ts: subscribes to push events, auto-cleanup on unmount
usePlatform.ts: returns {isMac, isWindows, platformName,
finderName:'Finder'|'Explorer', trashName:'Trash'|'Recycle Bin'}

--- PLACEHOLDER PAGES ---
Create simple placeholder for all 9 pages showing icon + title +
"Feature coming soon" — just enough to verify routing works.

--- ROUTER ---
HashRouter (required for Electron file:// protocol)
All routes wrapped in MainLayout

--- TRAY (src/main/trayManager.ts) ---
System tray icon with menu: Open CleanSweep, Quick Scan, Quit
On macOS: menu bar. Windows: notification area.

After completing all of this, the app should:
✓ Launch showing sidebar with all nav items
✓ Click each nav → correct placeholder page
✓ Theme toggle works (dark/light)
✓ Sidebar collapses to icon-only
✓ Zero TypeScript errors
✓ Zero console errors

text


---

---
# PHASE 2 — Storage, Config & Platform Services
---

## PROMPT 2.1 — Config, Quarantine, Platform & System Stats
Add all backend services to the CleanSweep Electron project.
All files are in src/main/services/

--- CONFIG SERVICE (services/config/ConfigService.ts) ---
Singleton. All data in app.getPath('userData'):
config.json, whitelist.json, history.json, rules.json, schedules.json

Methods (all async):
getConfig(): read → merge with DEFAULT_CONFIG → return AppConfig
setConfig(partial): deep merge → atomic write (write .tmp → rename)
getWhitelist(): string[] ([] if missing)
addToWhitelist(path) / removeFromWhitelist(path)
getRules(): OrganizerRule[] / saveRules(rules)
getHistory(): HistoryEntry[] / addHistoryEntry(entry) [max 500, trim oldest]
getSchedules(): ScheduleTask[] / saveSchedules(tasks)

Private: readJSON<T>(path), writeJSON(path, data) [atomic], ensureDir(path)

--- QUARANTINE SERVICE (services/config/QuarantineService.ts) ---
Quarantine dir: userData/quarantine/
Manifest: userData/quarantine/manifest.json

Methods:
getManifest(): QuarantineEntry[]
quarantineItem(item: ScannedItem, reason: string): Promise<QuarantineEntry>
→ copy to quarantine with UUID filename → delete original → update manifest
quarantineItems(items, reason): Promise<{succeeded, failed}>
restoreItem(id): find entry → ensureDir(originalDir) → move back → remove from manifest
purgeExpired(): delete files where expiresAt < now, return count
purgeAll(): delete all quarantine files, reset manifest
getTotalSize(): sum manifest sizes

--- PLATFORM SERVICE (services/system/PlatformService.ts) ---
isMac() / isWindows()
expandPath(input): ~ → homedir, %VAR% → process.env.VAR, $VAR → env
getCommonScanPaths(): Array<{path, category:ScanCategory, label}>

MAC scan paths:
~/Library/Caches → system-junk
~/Library/Logs → logs
/private/tmp → temp-files
~/Library/Application Support/CrashReporter → logs
~/.Trash → trash
~/Library/Application Support → app-leftovers

WINDOWS scan paths:
%TEMP% → temp-files
%SystemRoot%\Temp → temp-files
%LOCALAPPDATA%\Microsoft\Windows\INetCache → browser-cache
%LOCALAPPDATA%\CrashDumps → logs
%APPDATA%\Microsoft\Windows\Recent → privacy

getBrowserPaths(): Record<browserId, Array<{cachePath, profileGlob?}>>

MAC browser paths:
chrome: ~/Library/Application Support/Google/Chrome/Default/Cache
firefox: ~/Library/Application Support/Firefox/Profiles → glob */cache2
safari: ~/Library/Caches/com.apple.Safari
edge: ~/Library/Application Support/Microsoft Edge/Default/Cache
brave: ~/Library/Application Support/BraveSoftware/Brave-Browser/Default/Cache

WINDOWS browser paths:
chrome: %LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache
firefox: %APPDATA%\Mozilla\Firefox\Profiles → glob */cache2
edge: %LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache
brave: %LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Cache

--- SYSTEM STATS SERVICE (services/system/SystemStatsService.ts) ---
getSystemStats(): { platform, arch, totalRAM, freeRAM, usedRAM,
cpuModel, cpuUsage, uptime }
getDiskUsage(): Promise<DiskDrive[]>
macOS: parse 'df -k' output
Windows: run 'wmic logicaldisk get size,freespace,caption'
Return [] on failure
optimizeMemory(): call global.gc() if available

--- WIRE UP IPC HANDLERS ---
Replace stubs in ipcHandlers.ts with real implementations:
GET_CONFIG → configService.getConfig()
SET_CONFIG → configService.setConfig(data)
GET_WHITELIST → configService.getWhitelist()
ADD_TO_WHITELIST → configService.addToWhitelist(path)
REMOVE_FROM_WHITELIST → configService.removeFromWhitelist(path)
GET_HISTORY → configService.getHistory()
LIST_QUARANTINE → quarantineService.getManifest()
RESTORE_QUARANTINE → quarantineService.restoreItem(id)
PURGE_QUARANTINE → quarantineService.purgeAll()
GET_SYSTEM_STATS → systemStatsService.getSystemStats()
GET_DISK_USAGE → systemStatsService.getDiskUsage()
OPTIMIZE_MEMORY → systemStatsService.optimizeMemory()
OPEN_FOLDER → dialog.showOpenDialog({properties:['openDirectory']})
OPEN_FILE → dialog.showOpenDialog({properties:['openFile'], multiSelections:true})
SET_TITLE → mainWindow.setTitle(title)

Install: uuid, fast-glob

text


---

---
# PHASE 3 — Scanner Engine + Cleaner UI
---

## PROMPT 3.1 — Scanner Service + Browser Scanner + Cleaner UI
Build the complete scanning engine and the Cleaner page UI.

--- SCANNER SERVICE (src/main/services/scanner/ScannerService.ts) ---
Uses: fast-glob, PlatformService, fsUtils, QuarantineService

class ScannerService:
private cancelled = false

async quickScan(options, onProgress, whitelist): Promise<ScanResult[]>
Loop through platformService.getCommonScanPaths()
For each: expandPath → check accessible → scanLocation()
Group results by category
Emit throttled progress (max 1 event per 100ms)
Return ScanResult[]

async scanLocation(dirPath, category): Promise<ScannedItem[]>
Use fast-glob('**/*', {cwd, absolute:true, dot:true, followSymlinks:false})
For each file: getFileStat → build ScannedItem
Skip whitelisted paths
Wrap in try/catch — never crash on EACCES
Cap at 10,000 files per location

cancel(): set cancelled = true

private isWhitelisted(path, whitelist): boolean
private isSafeToDelete(path, category): boolean
Danger patterns: /System/, /usr/bin/, C:\Windows\System32
Safe categories: trash, temp-files, logs, browser-cache

REGISTER:
QUICK_SCAN → scannerService.quickScan(opts, progressCb, whitelist)
progressCb sends: mainWindow.webContents.send(SCAN_PROGRESS, progress)
CANCEL_SCAN → scannerService.cancel()
EXECUTE_CLEAN → quarantineService.quarantineItems(items, 'manual-clean')
then configService.addHistoryEntry(...)
returns {freed: number, count: number, failed: number}

--- BROWSER SCANNER (src/main/services/scanner/BrowserScanner.ts) ---
async scanBrowsers(enabledBrowsers, onProgress): Promise<ScanResult[]>
For each browser: get paths from platformService.getBrowserPaths()
Expand Firefox glob patterns (profiles with *)
Get all files in cache dirs → build ScannedItems
Return ScanResult[] with categoryLabel = "[Browser] Cache"

REGISTER: BROWSER_SCAN → browserScanner.scanBrowsers(browsers, progressCb)

--- PRIVACY SCANNER addition to ScannerService ---
async getPrivacyItems(): Promise<ScanResult[]>
macOS items: ~/.bash_history, ~/.zsh_history,
~/Library/Application Support/Quick Look
Windows items: %APPDATA%\Microsoft\Windows\Recent,
%LOCALAPPDATA%\Microsoft\Windows\Explorer (thumbcache_*.db)
Return as ScanResult with category:'privacy'

--- RENDERER STORES ---
src/renderer/stores/scanStore.ts (Zustand):
state: status('idle'|'scanning'|'complete'|'error'),
scanType, progress, results:ScanResult[],
selectedItemIds:Set<string>, errorMessage
computed: totalSelectedSize, totalFoundSize (useMemo)
actions:
startQuickScan(): subscribe to onProgress → invoke quickScan
→ on complete set results + auto-select all safeToDelete items
startBrowserScan()
cancelScan()
toggleItemSelection(id) / toggleCategorySelection(cat, bool)
selectAll() / deselectAll()
executeClean(useQuarantine): invoke EXECUTE_CLEAN with selected items
→ on success add to history, clear results, show toast
clearResults()

--- CLEANER PAGE UI ---
src/renderer/pages/Cleaner/CleanerHome.tsx

THREE VIEWS based on scanStore.status:

IDLE VIEW:
Centered layout. Two action cards:
Card 1: "Quick Clean" → lightning icon, "Scan common junk", Start button
Card 2: "Browser Clean" → globe icon, browser toggle list, Start button
Below: safety note about quarantine

SCANNING VIEW:
Animated spinning icon, current scan type title,
Current path being scanned (right-truncated to 60 chars),
@radix-ui/react-progress bar, percentage, files found count,
Cancel button

RESULTS VIEW (two-column):
LEFT (40%): Category cards (ScanCategoryCard component)
Each: checkbox, icon, label, file count, size, proportion bar
Select All / Deselect All buttons
Summary: "X items, Y GB selected"
RIGHT (60%): Virtual file list (@tanstack/react-virtual)
Each item: checkbox, file icon (by ext), filename, size, path
Sort tabs: Size / Name / Date
Search filter input (debounced 300ms)
BOTTOM BAR (fixed):
"X items • Y GB" | "Add to Whitelist" | "Cancel" | "Clean" (primary)

POST-CLEAN SUCCESS SCREEN:
Large ✓ icon, "You freed X GB!", file count,
"Undo (restore from quarantine)" link, Done button

Create shared components:
src/renderer/components/shared/ScanCategoryCard.tsx
src/renderer/components/shared/FileListItem.tsx (React.memo)
src/renderer/components/shared/ConfirmDialog.tsx (radix dialog)
src/renderer/components/shared/Toast.tsx
src/renderer/components/ui/Skeleton.tsx (pulse animation)
src/renderer/components/ui/EmptyState.tsx (icon+title+desc+action)
src/renderer/components/ui/ErrorState.tsx (title+desc+retry)

Toast system: uiStore has toasts[], addToast(msg,type), removeToast(id)
Render ToastContainer in App.tsx. Auto-dismiss 4s.

text


---

---
# PHASE 4 — Duplicate Finder
---

## PROMPT 4.1 — Duplicate Engine + UI
Build duplicate file detection with worker threads and complete UI.

--- WORKER THREAD (src/main/workers/hashWorker.ts) ---
Receives via workerData: {files:string[], algorithm:'sha256'}
For each file: crypto.createHash → fs.createReadStream (64KB chunks)
→ hash.update → digest hex
parentPort.postMessage({type:'progress', file}) per file
parentPort.postMessage({type:'complete', results:Record<string,string>})
Errors: set results[file] = 'ERROR', post {type:'error', file}

--- DUPLICATE FINDER SERVICE ---
(src/main/services/duplicates/DuplicateFinderService.ts)
private cancelled = false

async findDuplicates(scanPaths, options, onProgress): Promise<DuplicateGroup[]>

PHASE 1 - Collect files:
fast-glob all files in scanPaths, filter by minSizeBytes
Emit progress: phase:'indexing'

PHASE 2 - Group by size:
Group file paths by their byte size
Keep only groups with 2+ files (eliminates ~90% immediately)
If 0 candidates: return []
Emit progress: phase:'analyzing'

PHASE 3 - Hash candidates with workers:
Split candidates into chunks (one per CPU core, max 4 workers)
Spawn Worker threads with hashWorker.js
Collect results, merge, emit progress: phase:'hashing' with %

PHASE 4 - Group by hash:
Build DuplicateGroup[] for hashes with 2+ files
wastedSpace = fileSize × (count - 1)
Sort by wastedSpace descending

cancel(): set cancelled = true, terminate active workers

REGISTER:
FIND_DUPLICATES → duplicateFinderService.findDuplicates(...)
emit DUPLICATES_PROGRESS events during scan
DELETE_DUPLICATES → quarantineService.quarantineItems(items, 'duplicate-removal')
CANCEL_SCAN → also calls duplicateFinderService.cancel()

--- RENDERER ---
src/renderer/stores/duplicatesStore.ts (Zustand):
state: status, progress, groups:DuplicateGroup[],
selectedItemIds:Set<string>, scanPaths:string[], minSizeBytes
computed: totalWastedSpace, totalSelectedSize
actions:
setScanPaths / setMinSize / startScan / cancelScan
toggleItem(id)
autoSelectKeepNewest(): per group sort by lastModified DESC,
select all except first → update selectedItemIds
autoSelectKeepOldest(): sort ASC, select all except first
selectAll() / deselectAll()
deleteSelected(useQuarantine)

src/renderer/pages/Duplicates/DuplicatesHome.tsx

IDLE VIEW:
Title + icon. Scan configuration:

Folder picker (chips with X to remove, uses dialog.openFolder IPC)
Defaults: ~/Downloads, ~/Documents, ~/Desktop
Min size dropdown: Any/1KB/100KB/1MB/10MB
Include hidden toggle
Start Scan button
SCANNING VIEW: Phase-aware progress (shows current phase name),
animated bar, cancel button

RESULTS VIEW:
Header: "X groups found • Y GB wasted"
Smart selection row: "Keep Newest" | "Keep Oldest" | "Select All" | "Deselect All"

Virtualized group list (@tanstack/react-virtual):
Each DuplicateGroupCard (collapsible):
Header: file count, size each, wasted space, first 8 chars of hash
Expanded: file rows with checkbox, icon, name, path, size,
modified date, "KEEP" badge on recommended keep (newest file)
Default: first 10 groups expanded, rest collapsed

Bottom bar: "X files selected • Y GB" | "Delete Selected" button

Confirm dialog: "Delete X files? Frees Y GB. Files go to Quarantine."
Requires "I've reviewed my selection" checkbox to enable Delete button

Success screen after delete: ✓ + freed space

src/renderer/pages/Duplicates/DuplicateGroupCard.tsx (collapsible card)

text


---

---
# PHASE 5 — File Organizer & Bulk Renamer
---

## PROMPT 5.1 — Rules Engine + Organizer + Renamer
Build the file organization rules engine, organizer service,
bulk renamer, and complete organizer UI.

--- RULES ENGINE (src/main/services/organizer/RulesEngine.ts) ---
evaluate(fileInfo, rules): {rule, destination, newName} | null
Sort by priority, find first enabled matching rule

matchesRule(fileInfo, rule): AND/OR logic across conditions

evaluateCondition(fileInfo, condition): boolean
Fields: name(nameWithoutExt), extension, size, modified(timestamp)
Operators: contains,equals,startsWith,endsWith,greaterThan,lessThan,matches(regex)
All string comparisons case-insensitive. Regex wrapped in try/catch.

resolveDestination(fileInfo, template): string
Replace: {year}{month}{day}{ext}{type}{name}
{type} → getTypeCategory(ext) → Images/Videos/Audio/Documents/Archives/Code/Other

applyNamingPattern(fileInfo, pattern): string
Replace: {name}{ext}{year}{month}{day}{counter:001}

FileInfo interface: {path,name,nameWithoutExt,extension,size,created,modified}

--- FILE ORGANIZER SERVICE ---
(src/main/services/organizer/FileOrganizerService.ts)

async previewOrganize(sourcePath, rules, conflictStrategy):
Promise<OrganizePreviewItem[]>
fast-glob top-level files in sourcePath (depth 0, onlyFiles)
For each: buildFileInfo → rulesEngine.evaluate()
Build OrganizePreviewItem: {id, sourcePath, destinationPath,
action, ruleName, willOverwrite}
action:'skip' if no rule matches

async executeOrganize(previewItems, conflictStrategy):
Promise<{succeeded, failed, skipped}>
For each non-skip item:
Handle conflict (skip/rename/overwrite)
findNonConflictingPath for 'rename': append " (1)", " (2)" etc
ensureDir(destDir) → moveFile or copyFile
Log errors, never throw

private buildFileInfo(filePath): FileInfo | null

REGISTER:
PREVIEW_ORGANIZE → fileOrganizerService.previewOrganize(src, rules, strategy)
EXECUTE_ORGANIZE → fileOrganizerService.executeOrganize(items, strategy)
GET_RULES → configService.getRules()
SAVE_RULES → configService.saveRules(rules)

--- BULK RENAMER (src/main/services/organizer/BulkRenamerService.ts) ---
previewRename(filePaths, pattern): RenamePreviewItem[]
Apply in order: replaceText, addPrefix, addSuffix,
caseChange(upper/lower/title), numberSequentially(pad to 3 digits),
template({name}{ext}{year}{month}{day}{counter})
Return original + new name side by side

async executeRename(items): Promise<{succeeded, failed}>
fs.promises.rename each item

REGISTER: RENAME_PREVIEW, RENAME_EXECUTE

--- WATCH FOLDER SERVICE ---
(src/main/services/organizer/FolderWatcherService.ts)
Install: chokidar

private watchers: Map<string, FSWatcher>
addWatchFolder(folder): start chokidar watcher, depth:0,
awaitWriteFinish:{stabilityThreshold:2000}
On 'add' event: buildFileInfo → rulesEngine.evaluate → execute move
→ send WATCHER_ACTIVITY event to renderer
removeWatchFolder(id): watcher.close(), remove from map
listWatchFolders(): WatchFolder[]
loadFromConfig(): called on startup, restarts all enabled watchers

REGISTER: ADD_WATCH_FOLDER, REMOVE_WATCH_FOLDER, LIST_WATCH_FOLDERS

--- ORGANIZER UI ---
src/renderer/stores/organizerStore.ts (Zustand):
rules, sourcePath, previewItems, status, result
Actions: loadRules, saveRules, addRule, updateRule, deleteRule,
setSourcePath, runPreview, executeOrganize

src/renderer/pages/Organizer/OrganizerHome.tsx (3 tabs):

TAB 1 - Auto Organizer:
LEFT PANEL: Rules list
Each rule card: drag handle(visual), toggle, name, conditions summary,
action+destination, Edit/Delete buttons
"Add Rule" button
PRESET RULES section (click to add):
"Sort by File Type" → images→Images/, videos→Videos/, docs→Documents/
"Sort by Date" → {year}/{month}/ folder structure
"Archive Old Files" → files >1yr modified → Archive/
"Organize Screenshots" → name contains 'screenshot' → Screenshots/
Empty state with helpful text

RIGHT PANEL: Run section
Source folder picker (browse button → openFolder IPC)
Conflict strategy dropdown
"Preview" button → show preview table
Preview table: Source | Action (color-coded) | Destination | Rule
green=move, blue=copy, gray=skip, red=overwrite warning
Summary: "X will move, Y skip"
"Execute" button (disabled until preview run)

RULE EDITOR MODAL (src/renderer/components/organizer/RuleEditorModal.tsx):
Rule name input
Conditions list: [Field dropdown][Operator dropdown][Value input][Remove]
"Add Condition" button
AND/OR logic toggle
Action dropdown + Destination input with browse button
Variable chips: click to insert {year}{month}{type}{ext}{name}
Naming pattern input (when action=rename)
Save / Cancel buttons

TAB 2 - Bulk Renamer:
TOP: Drop zone + multi-file picker. Show selected files (virtualized list)
MIDDLE: Operation cards (toggleable, applied in order):
Find & Replace, Add Prefix, Add Suffix, Change Case,
Number Files, Use Template
RIGHT/BELOW: Live preview table (Original Name | New Name)
Green valid, red conflict. File type icons.
BOTTOM: "X files to rename" | "Rename All" button

TAB 3 - Watch Folders:
List of active WatchFolder cards:
Source path, Active/Inactive dot, Rule count, Enable toggle, Delete
"Add Watch Folder" button → folder picker + rule selector
Recent activity log (last 20 entries from WATCHER_ACTIVITY events)

text


---

---
# PHASE 6 — Disk Analyzer, Apps & Remaining Pages
---

## PROMPT 6.1 — Disk + Apps + Dashboard + Settings + Scheduler + Quarantine UI
Build all remaining features and pages.

Install: recharts, d3, @types/d3, node-cron, @types/node-cron, chokidar

--- DISK ANALYZER SERVICE ---
(src/main/services/disk/DiskAnalyzerService.ts)

async analyzePath(dirPath, maxDepth=3, onProgress): Promise<DiskNode>
Recursive buildTree: at each dir read children, recurse up to maxDepth
Sort children by size DESC, cap at 100 per node
Skip: /proc/, /sys/, node_modules, .git, C:\Windows\WinSxS
Emit progress every 50 dirs processed
On error at any node: return {name, path, size:0, type:'directory'}

async findLargeFiles(dirPath, minSizeBytes): Promise<ScannedItem[]>
fast-glob all files → filter by size → sort DESC → return top 1000

async findEmptyFolders(dirPath): Promise<string[]>
glob all directories → filter where readdir returns []

async findOldFiles(dirPath, olderThanDays): Promise<ScannedItem[]>
cutoff = now - days×24×60×60×1000
glob files → filter by lastAccessed < cutoff → sort by lastAccessed ASC

REGISTER: ANALYZE_DISK (emit progress events), FIND_LARGE_FILES,
FIND_EMPTY_FOLDERS, FIND_OLD_FILES

--- DISK ANALYZER UI ---
src/renderer/pages/Disk/DiskAnalyzer.tsx (4 tabs):

TAB 1 - Disk Map:
Drive selector chips (from getDiskUsage: name, used/total, % bar)
D3 TreeMap (src/renderer/components/disk/TreeMap.tsx):
Props: data:DiskNode, width, height, onDrillDown:(node)=>void
d3.treemap() with squarify tiling
Color by file type (use FILE_TYPE_CATEGORIES)
Labels: name + formatBytes, hidden if rect < 40px
Hover tooltip: name, size, % of parent
Click to drill down
Breadcrumb nav: Drive > Folder > Subfolder (Back button)
Stats row: Total / Used / Free colored segments

TAB 2 - Large Files:
Size threshold selector: >100MB / >500MB / >1GB / Custom
Folder picker + Scan button
Results table: icon | Name | Size | Location | Date
Actions: Open Location (shell.showItemInFolder) | Delete (quarantine)

TAB 3 - Old Files:
"Not accessed in" dropdown: 6mo/1yr/2yr/Custom
Folder picker + Scan button
Results table, "Last Accessed" date prominent

TAB 4 - Empty Folders:
Folder picker + Find button
Checklist of empty folder paths
"Delete Selected" button

--- APP MANAGER SERVICE ---
(src/main/services/apps/AppManagerService.ts)

async listApps(): Promise<AppInfo[]>

macOS: read /Applications + ~/Applications for .app bundles
Parse Info.plist XML to get: CFBundleName, CFBundleShortVersionString,
CFBundleIdentifier using regex: <key>KEY</key>\s*<string>VAL</string>
getDirectorySize() for each app
Sort by size DESC

Windows: execSync PowerShell:
Get-ItemProperty 'HKLM:...\Uninstall*','HKCU:...\Uninstall*' |
Where-Object {$_.DisplayName} |
Select DisplayName,DisplayVersion,InstallLocation,Publisher |
ConvertTo-Json -Compress
timeout: 10000ms, encoding:'utf-8'
Parse JSON, return AppInfo[]

async uninstallApp(appInfo): Promise<void>
macOS: shell.trashItem(appInfo.path)
Windows: shell.openExternal('ms-settings:appsfeatures')

REGISTER: LIST_APPS, UNINSTALL_APP

--- STARTUP MANAGER SERVICE ---
(src/main/services/apps/StartupManagerService.ts)

async getStartupItems(): Promise<StartupItem[]>

macOS: read ~/Library/LaunchAgents/*.plist
Parse Label and Program keys from plist XML
enabled = !content.includes('<key>Disabled</key>')

Windows: execSync PowerShell:
Get-CimInstance Win32_StartupCommand |
Select Name,Command,Location | ConvertTo-Json -Compress
timeout:5000

async toggleStartupItem(item, enabled): Promise<void>
macOS: shell.openExternal('x-apple.systempreferences:...')
Windows: shell.openPath('ms-settings:startupapps')
(Opens system UI — direct editing too risky for v1)

REGISTER: GET_STARTUP_ITEMS, TOGGLE_STARTUP_ITEM

--- APPS UI ---
src/renderer/pages/Apps/AppsHome.tsx (2 tabs):

TAB 1 - Installed Apps:
Loading: Skeleton cards (10 of them)
Search bar (debounced 300ms, filter by name)
Sort: Size(default) / Name
Virtualized list: App cards showing icon(generic),name,version,size bar
Click → right panel: full path, version, Open button, Uninstall button
Uninstall confirm dialog: "This will trash [AppName]. Continue?"

TAB 2 - Startup Items:
List: name, type badge, path (truncated), impact badge (Low/Med/High),
Enable/Disable toggle (opens system settings with explanation toast)
Info banner: "Changes require restart. CleanSweep opens system settings for safety."

--- SCHEDULER SERVICE ---
(src/main/services/scheduler/SchedulerService.ts)
private jobs: Map<string, ScheduledTask>

async loadAndStartAll(): void
getSchedules() → startJob() for each enabled task

startJob(task): void
Convert to cron: daily→"MM HH * * *", weekly→"MM HH * * DOW",
monthly→"MM HH DOM * *"
nodeCron.schedule(expr, () => runTask(task))

async runTask(task): void
quickScan silently → quarantine results (silent, no UI interruption)
Update task.lastRun → saveSchedules
Send notification if enabled in config

createTask/deleteTask/toggleTask → manage jobs Map + persist

Call loadAndStartAll() in index.ts after app ready (with 5s delay).
REGISTER: GET_SCHEDULES, CREATE_SCHEDULE, DELETE_SCHEDULE, TOGGLE_SCHEDULE

--- DASHBOARD ---
src/renderer/pages/Dashboard/Dashboard.tsx

Load on mount: getHistory, getDiskUsage, getSystemStats (poll every 5s)

LAYOUT (CSS grid):
Row 1 - Health Score card (full width):
Circular progress (0-100), color: green≥80/yellow≥50/red<50
Score = 100 - penalties:
last scan >7 days: -10
last junk scan found >1GB: -15
quarantine >1GB: -5
Label: "Great shape"/"Needs attention"
"Run Quick Scan" button if score < 70

Row 2 - 3 cards:
"Space Freed": all-time sum from history.
Recharts BarChart: last 7 days daily freed
"Disk Usage": per drive donut chart (recharts PieChart),
warning red if >85% full
"Last Scan": date/time, items found, size, "Scan Now" button

Row 3 - 2 cards:
"Quick Actions": 6 buttons grid with icons:
Quick Clean, Find Duplicates, Organize, Analyze Disk,
Browser Clean, Empty Quarantine
onClick → navigate to correct page
"Recent Activity": last 10 history entries
icon + type + size freed + relative date ("2 days ago")

Bottom stats bar: RAM bar, CPU%, storage bars (update every 5s)

--- SETTINGS ---
src/renderer/pages/Settings/SettingsHome.tsx
Left nav (sections) + right content layout:

General: theme radio, launch at startup toggle, minimize to tray toggle,
notifications toggle, low disk threshold input

Scanning: include hidden toggle, include system toggle (with warning),
min file size slider (0-100MB), custom paths list, excluded extensions tags

Safety: quarantine toggle (warn if disabling), retention days slider (1-30),
max quarantine size input, confirm before clean toggle

Whitelist: list of excluded paths, "Add Path" button (folder picker),
remove X button per entry

Browser: table of browsers × settings (enabled/cache/cookies/history/passwords)
all as toggles

About: logo, version, "Check for Updates" button,
"Open Logs Folder" button (shell.showItemInFolder(logsPath))
"Export Logs" button

Persist all changes immediately via setConfig IPC.

--- QUARANTINE UI ---
src/renderer/pages/Quarantine/QuarantineHome.tsx

Header: "Quarantine" + stats row (X files, Y GB, oldest date)
Toolbar: "Restore All" | "Empty Quarantine" (red, confirm dialog)
Filter: All / Last 7 days / Last 30 days

Virtualized list (QuarantineEntry rows):
Checkbox, file type icon, filename, original location (truncated+tooltip),
size, deleted date, "Expires in X days" or "Expired" (red)
"Restore" icon button per row

Bulk action bar (when items checked): Restore Selected | Delete Selected

Empty state: Shield icon + "Quarantine is empty" + explanation

--- GLOBAL IMPROVEMENTS ---

Add React.lazy() + Suspense for DiskAnalyzer and AppsHome pages
Add useDebounce hook (src/renderer/hooks/useDebounce.ts, 300ms)
Apply React.memo to: FileListItem, ScanCategoryCard, DuplicateGroupCard
Add keyboard shortcuts in main process:
Cmd/Ctrl+1-5 → navigate pages (send IPC event to renderer)
Escape → cancel active scan
Native notifications (Electron Notification API):
After scheduled scan: "CleanSweep cleaned Y GB"
Low disk (<threshold): "Your disk is almost full" (once per day)
Right-click context menu on file items:
"Open File Location" (shell.showItemInFolder)
"Copy Path" (clipboard.writeText)
"Add to Whitelist"
"Delete File" (quarantine)
Expose via IPC: 'cs:menu:show-file-context'
Welcome screen (src/renderer/pages/Welcome/WelcomePage.tsx):
Check config.firstRun on App.tsx mount
3 steps: Welcome → Permissions (macOS: Full Disk Access instructions,
Windows: ready) → Quick setup checkboxes → First scan or Skip
Set config.firstRun = false after completing
text


---

---
# PHASE 7 — Polish & Packaging
---

## PROMPT 7.1 — Polish + Packaging + Loop Until Done
Apply all final polish and set up production packaging.
Then enter build→test→debug loop until the app is fully working.

--- POLISH ---

LOADING SKELETONS
Every page that fetches data: show Skeleton component while loading
Skeleton variants: line(w,h), card(w,h), circle(size)
Apply to: Dashboard, Apps list, Quarantine list, History

ANIMATIONS (src/renderer/styles/animations.css)
@keyframes: fadeIn, slideInRight, pulse, spin
Page transitions: fadeIn 200ms on route change
Tab switches: fadeIn 150ms
Dashboard numbers: count up from 0 to final value on mount
Use requestAnimationFrame counter hook

VIRTUAL SCROLLING AUDIT
Ensure @tanstack/react-virtual is used for ALL lists >100 items:
Cleaner file list, Duplicate groups, Large files, Apps, Quarantine
If missing anywhere, add it now.

PROGRESS THROTTLING AUDIT
All progress callbacks in main process:
Add 100ms throttle if not already present:
let lastEmit = 0
if (Date.now() - lastEmit >= 100) { emit(); lastEmit = Date.now(); }

SYSTEM TRAY COMPLETION
Tray menu click "Quick Scan": run scan silently,
show native notification when done
Tray menu shows "Last cleaned: [relative date]"

DRAG AND DROP
DuplicatesHome idle view: accept file drop
BulkRenamer: accept file drop
ondragover: e.preventDefault(), highlight drop zone
ondrop: extract e.dataTransfer.files paths

UPDATE BANNER (src/renderer/components/ui/UpdateBanner.tsx)
Show at top of app when update available
"v1.1.0 available" + Download button + progress + Restart button

--- PACKAGING ---

electron-builder.json:
{
"appId": "com.cleansweep.app",
"productName": "CleanSweep",
"directories": { "output": "release" },
"files": ["dist//*", "dist-electron//*"],
"asar": true,
"compression": "maximum",
"mac": {
"target": [{"target":"dmg","arch":["x64","arm64"]}],
"category": "public.app-category.utilities",
"hardenedRuntime": true,
"entitlements": "assets/entitlements.mac.plist",
"entitlementsInherit": "assets/entitlements.mac.plist",
"minimumSystemVersion": "12.0"
},
"dmg": {
"window": {"width":540,"height":380},
"contents": [
{"x":140,"y":200,"type":"file"},
{"x":400,"y":200,"type":"link","path":"/Applications"}
]
},
"win": {
"target": [{"target":"nsis","arch":["x64"]}],
"requestedExecutionLevel": "asInvoker"
},
"nsis": {
"oneClick": false,
"allowToChangeInstallationDirectory": true,
"createDesktopShortcut": true,
"createStartMenuShortcut": true
},
"publish": null
}

assets/entitlements.mac.plist:

<?xml version="1.0" encoding="UTF-8"?> <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>com.apple.security.cs.allow-jit</key><true/>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
<key>com.apple.security.files.user-selected.read-write</key><true/>
<key>com.apple.security.files.downloads.read-write</key><true/>
<key>com.apple.security.temporary-exception.files.absolute-path.read-write</key>
<array><string>/private/tmp/</string><string>/var/folders/</string></array>
</dict></plist>

package.json scripts:
"dev": "vite"
"build": "tsc --noEmit && vite build && tsc -p tsconfig.main.json"
"build:mac": "npm run build && electron-builder --mac"
"build:win": "npm run build && electron-builder --win"
"build:all": "npm run build && electron-builder -mw"

--- LOOP UNTIL DONE INSTRUCTION ---

After applying all polish and packaging config, enter this loop:

LOOP:
STEP 1 - BUILD:
Run: npm run build
Fix ALL TypeScript errors before continuing
Run: npm run dev
Fix any runtime errors

STEP 2 - TEST macOS:
Package: npm run build:mac
Install .dmg in macOS simulator/VM
Test every feature in this checklist:

text

CORE:
□ App launches < 3 seconds, no console errors
□ All 9 sidebar nav items work
□ Dark/light theme toggle persists
□ Sidebar collapses/expands
□ Config persists across restarts
□ Welcome screen shows on first launch
□ System tray icon appears with menu

CLEANER:
□ Quick scan finds junk files (at least in /tmp and ~/Library/Caches)
□ Progress bar updates smoothly
□ Cancel stops scan
□ Category cards show correct sizes
□ Select/deselect all works
□ Clean moves files to quarantine (not hard delete)
□ Success screen shows correct GB freed
□ Browser scan finds Chrome/Firefox cache

DUPLICATES:
□ Folder picker works
□ Scan finds actual duplicates (create test duplicates first)
□ Worker threads don't block UI
□ Keep Newest auto-select works correctly
□ Delete moves to quarantine

ORGANIZER:
□ Add rule with extension condition works
□ Preview shows correct file movements
□ Execute moves files correctly
□ Conflict handling (skip/rename) works
□ Bulk rename live preview updates
□ Rename actually renames files on disk
□ Watch folder: drop file → auto moved

DISK:
□ TreeMap renders for selected drive
□ Click to drill down works
□ Breadcrumb navigation works
□ Large files scan returns results
□ Empty folders found correctly

APPS:
□ Apps list loads and shows sizes
□ Search filters correctly
□ Startup items list loads

DASHBOARD:
□ Health score calculates correctly
□ Disk usage shows all drives
□ Quick actions navigate correctly
□ Stats update every 5 seconds

QUARANTINE:
□ All items listed correctly
□ Restore returns file to original path
□ Empty quarantine works with confirmation

SETTINGS:
□ All toggles persist
□ Whitelist add/remove works
□ Browser settings persist
STEP 3 - TEST Windows:
Package: npm run build:win
Install .exe in Windows VM (use VirtualBox/VMware with Win 10/11)
Run same checklist above with Windows-specific items:
□ Path expansion works (%TEMP%, %APPDATA%, %LOCALAPPDATA%)
□ Apps list reads from registry via PowerShell
□ Startup items reads from WMI
□ Temp file scan finds %TEMP% files
□ No path separator errors (/ vs )
□ Installer creates Start Menu + Desktop shortcuts
□ Uninstaller works cleanly

STEP 4 - DEBUG:
For each failing test item:
a. Add console.log to identify the failing service/component
b. Check if it's a platform path issue (most Windows bugs are)
c. Check if it's an IPC channel mismatch
d. Check if it's a TypeScript type error that slipped through
e. Fix the root cause (not a band-aid)
f. Re-run only the affected test items

STEP 5 - EVALUATE:
If ALL checkboxes pass on BOTH platforms → DONE. Ship it.
If any checkboxes fail → go to STEP 1 (loop again)

DO NOT STOP until all checkboxes pass on both platforms.
DO NOT skip checklist items.
DO NOT mark done if there are console errors.

When fully done, output:
"✅ CleanSweep v1.0.0 is ready for release"
macOS: release/[version]/CleanSweep-[version].dmg
Windows: release/[version]/CleanSweep Setup [version].exe

text


---

---
# DEBUG PROMPTS — Use When Broken
---

## DEBUG A — IPC Broken
Debug CleanSweep IPC. Check in order, fix all issues:

preload.ts: contextBridge.exposeInMainWorld('cleanSweepAPI', ...)
All channels use exact strings from IPC_CHANNELS
Subscription fns return cleanup function
index.ts: contextIsolation:true, nodeIntegration:false,
preload path points to compiled .js not .ts
ipcHandlers.ts: uses ipcMain.handle (not ipcMain.on) for invoke calls
registerAllHandlers called after app.whenReady()
electron.d.ts: window.cleanSweepAPI fully typed
Quick test: in Dashboard useEffect call config.getConfig() and log result
Fix all found issues.
text


## DEBUG B — Scanner Returns Nothing
Debug CleanSweep scanner returning empty results:

Log expandPath() output for each scan location
Log isPathAccessible() result for each expanded path
Test fast-glob directly: glob('**/*', {cwd:'/private/tmp', absolute:true})
Check whitelist isn't accidentally filtering everything
Verify try/catch wraps ALL glob and fs calls (EACCES must not crash)
On macOS: check if app needs Full Disk Access in System Preferences
Show user a dialog if denied, explaining how to grant it
On Windows: verify %TEMP% expansion returns actual path
Fix root cause, verify /tmp (macOS) or %TEMP% (Windows) returns files.
text


## DEBUG C — UI Freezing During Scan
Debug CleanSweep UI freeze during scans:

Find ALL synchronous fs calls: statSync, readdirSync, readFileSync
Replace with async equivalents (fs.promises.*)
Verify worker threads are actually spawned for hashing
Add: console.log('Worker spawned for', chunk.length, 'files')
Add progress throttle if missing:
let lastEmit = 0
if (Date.now() - lastEmit >= 100) { emit(progress); lastEmit = Date.now(); }
Check React: wrap FileListItem, ScanCategoryCard in React.memo
Verify useVirtualizer is applied to the results list
Run React DevTools Profiler, fix components rendering >16ms
Fix all, verify UI stays at 60fps during active scan.
text


## DEBUG D — Windows Path Errors
Debug CleanSweep Windows path issues:

PlatformService.expandPath: test these expand correctly:
'%TEMP%' → C:\Users[user]\AppData\Local\Temp
'%APPDATA%' → C:\Users[user]\AppData\Roaming
'%LOCALAPPDATA%' → C:\Users[user]\AppData\Local
'~' → C:\Users[user]
Implementation: replace %VAR% with process.env['VAR']
replace ~ with os.homedir()
Path.join uses correct separator on Windows (path.join handles this)
fast-glob on Windows: use forward slashes in patterns,
let fast-glob handle conversion. Pass {cwd} with backslashes.
PowerShell commands timeout or return empty:
Add -ErrorAction SilentlyContinue to PS commands
Verify encoding:'utf-8' and timeout:10000
Check electron-builder.json has win target configured
Fix all, retest on Windows VM.
text


---

## FILE MANIFEST — Everything You Need to Build
These are ALL the files. Build them all. Do not stop until complete.

CONFIGURATION:
package.json
tsconfig.json
tsconfig.main.json
tsconfig.renderer.json
vite.config.ts
tailwind.config.js
postcss.config.js
electron-builder.json
.eslintrc.cjs
.gitignore
assets/entitlements.mac.plist

MAIN PROCESS:
src/main/index.ts
src/main/preload.ts
src/main/ipcHandlers.ts
src/main/trayManager.ts
src/main/utils/fsUtils.ts
src/main/utils/logger.ts
src/main/utils/ipcHelper.ts
src/main/workers/hashWorker.ts
src/main/services/config/ConfigService.ts
src/main/services/config/QuarantineService.ts
src/main/services/system/PlatformService.ts
src/main/services/system/SystemStatsService.ts
src/main/services/scanner/ScannerService.ts
src/main/services/scanner/BrowserScanner.ts
src/main/services/duplicates/DuplicateFinderService.ts
src/main/services/organizer/RulesEngine.ts
src/main/services/organizer/FileOrganizerService.ts
src/main/services/organizer/BulkRenamerService.ts
src/main/services/organizer/FolderWatcherService.ts
src/main/services/disk/DiskAnalyzerService.ts
src/main/services/apps/AppManagerService.ts
src/main/services/apps/StartupManagerService.ts
src/main/services/scheduler/SchedulerService.ts

SHARED:
src/shared/types.ts
src/shared/ipcChannels.ts
src/shared/constants.ts

RENDERER — Core:
src/renderer/index.html
src/renderer/main.tsx
src/renderer/App.tsx
src/renderer/router.tsx
src/renderer/types/electron.d.ts
src/renderer/styles/globals.css
src/renderer/styles/animations.css

RENDERER — Stores:
src/renderer/stores/uiStore.ts
src/renderer/stores/settingsStore.ts
src/renderer/stores/scanStore.ts
src/renderer/stores/duplicatesStore.ts
src/renderer/stores/organizerStore.ts

RENDERER — Hooks:
src/renderer/hooks/useIPC.ts
src/renderer/hooks/useIPCEvent.ts
src/renderer/hooks/usePlatform.ts
src/renderer/hooks/useDebounce.ts

RENDERER — Layout:
src/renderer/components/layout/Sidebar.tsx
src/renderer/components/layout/TopBar.tsx
src/renderer/components/layout/MainLayout.tsx

RENDERER — Shared Components:
src/renderer/components/shared/ScanCategoryCard.tsx
src/renderer/components/shared/FileListItem.tsx
src/renderer/components/shared/ConfirmDialog.tsx
src/renderer/components/shared/Toast.tsx
src/renderer/components/ui/Skeleton.tsx
src/renderer/components/ui/EmptyState.tsx
src/renderer/components/ui/ErrorState.tsx
src/renderer/components/ui/UpdateBanner.tsx

RENDERER — Organizer Components:
src/renderer/components/organizer/RuleEditorModal.tsx
src/renderer/components/organizer/ConditionRow.tsx
src/renderer/components/organizer/PreviewTable.tsx
src/renderer/components/organizer/RenameOperations.tsx

RENDERER — Disk Components:
src/renderer/components/disk/TreeMap.tsx

RENDERER — Pages:
src/renderer/pages/Welcome/WelcomePage.tsx
src/renderer/pages/Dashboard/Dashboard.tsx
src/renderer/pages/Cleaner/CleanerHome.tsx
src/renderer/pages/Duplicates/DuplicatesHome.tsx
src/renderer/pages/Duplicates/DuplicateGroupCard.tsx
src/renderer/pages/Organizer/OrganizerHome.tsx
src/renderer/pages/Disk/DiskAnalyzer.tsx
src/renderer/pages/Apps/AppsHome.tsx
src/renderer/pages/Scheduler/SchedulerHome.tsx
src/renderer/pages/Quarantine/QuarantineHome.tsx
src/renderer/pages/Settings/SettingsHome.tsx

TOTAL: 62 files

text


---

## EXECUTION ORDER
Phase 1 Prompt 1.1 → test launch + nav
Phase 2 Prompt 2.1 → test config persists + disk usage
Phase 3 Prompt 3.1 → test scan finds files + clean works
Phase 4 Prompt 4.1 → test duplicates found + deleted to quarantine
Phase 5 Prompt 5.1 → test rules + organizer + renamer work
Phase 6 Prompt 6.1 → test all remaining pages
Phase 7 Prompt 7.1 → build + test both platforms + loop until ✅





this is so long can you make it medium length but still keeping the context what was in long one and after this file what i have to do like just give all the files and tell : these are files you will ned to build this , complete the project and dont stop until its done fully and test it in a emulator of a mac and windows , loop until the work is done just loop build -> test -> debug .


claude-sonnet-4-6
Prompts.md — CleanSweep Vibe Coding Prompts
Markdown

# Prompts.md — CleanSweep: Phased AI Coding Agent Prompts
## Strategy: Ship Fast, Ship Safe, Minimal Bugs
### Total Phases: 8 | Total Prompts: ~60

---

## ⚡ HOW TO USE THIS FILE

1. Give prompts to your coding agent ONE AT A TIME
2. Wait for completion + test before moving to next prompt
3. Each prompt is self-contained with full context
4. If agent gets confused, use the [CONTEXT RESET] block before the prompt
5. Never skip a prompt — each builds on the previous
6. After every phase, do the manual test checklist

---

## 🔁 CONTEXT RESET BLOCK
(Paste this before any prompt if the agent loses context)

"""
Project: CleanSweep — Cross-platform desktop cleaner + file organizer app
Stack: Electron 28 + React 18 + TypeScript 5 + Vite + Zustand + Tailwind CSS
Architecture: 
  - src/main/ → Electron main process (Node.js, all file system ops)
  - src/renderer/ → React app (UI only, no direct fs access)
  - src/shared/ → Types and constants shared between both
  - IPC via contextBridge in preload.ts (NEVER use nodeIntegration)
  - All data stored locally as JSON files in AppData/Application Support
  - No database, no cloud, no telemetry
Platform: macOS (darwin) + Windows (win32) from single codebase
Safety rule: Files are NEVER permanently deleted without going through
             QuarantineService first (moved to quarantine folder)
"""

---

---
# ═══════════════════════════════════════════════
# PHASE 1: PROJECT FOUNDATION & SHELL
# Goal: Working Electron+React app with navigation
# Estimated time: 1-2 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 1.1 — Project Scaffolding

"""
Create a new Electron 28 + React 18 + TypeScript 5 + Vite project 
called "cleansweep" with the following exact structure:

PROJECT STRUCTURE TO CREATE:
cleansweep/
├── package.json
├── tsconfig.json
├── tsconfig.main.json  
├── tsconfig.renderer.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── src/
│   ├── main/
│   │   ├── index.ts          (Electron main entry)
│   │   └── preload.ts        (contextBridge setup - empty shell)
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── styles/
│   │       └── globals.css
│   └── shared/
│       ├── types.ts          (empty, just exports {})
│       ├── ipcChannels.ts    (empty, just exports {})
│       └── constants.ts      (empty, just exports {})

PACKAGE.JSON requirements:
- electron: ^28.0.0
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.0
- zustand: ^4.4.7
- typescript: ^5.3.0
- vite: ^5.0.0
- vite-plugin-electron: ^0.28.0
- vite-plugin-electron-renderer: ^0.14.0
- electron-builder: ^24.9.0
- tailwindcss: ^3.4.0
- @types/react: ^18.2.0
- @types/node: ^20.10.0
- concurrently: ^8.2.0
- cross-env: ^7.0.3

SCRIPTS in package.json:
- "dev": "vite"
- "build": "tsc && vite build"
- "package:mac": "npm run build && electron-builder --mac"
- "package:win": "npm run build && electron-builder --win"
- "preview": "vite preview"

VITE CONFIG:
- Use vite-plugin-electron for main process
- Use vite-plugin-electron-renderer for renderer
- Output: dist-electron for main, dist for renderer

MAIN PROCESS (src/main/index.ts):
- Create BrowserWindow: width 1200, height 800, minWidth 900, minHeight 600
- webPreferences: nodeIntegration: false, contextIsolation: true, 
  sandbox: false, preload: path to preload.ts
- Load vite dev server URL in dev, load dist/index.html in prod
- Handle app ready, window-all-closed, activate events properly
- macOS: do not quit when all windows closed

TAILWIND:
- Configure content paths for src/renderer/**/*.{tsx,ts,jsx,js}
- Add dark mode: 'class'

Make the app launch with a simple white screen that says 
"CleanSweep Loading..." to verify setup works.
Do NOT add any complex features yet.
"""

---

## PROMPT 1.2 — Shared Types & IPC Channels

"""
In the existing CleanSweep Electron+React+TypeScript project,
populate the shared files with all the types and constants we need.

FILE: src/shared/ipcChannels.ts
Create and export a const object IPC_CHANNELS with these exact string values:

SCANNER channels:
  QUICK_SCAN: 'cs:scanner:quick-scan'
  DEEP_SCAN: 'cs:scanner:deep-scan'
  BROWSER_SCAN: 'cs:scanner:browser-scan'
  CANCEL_SCAN: 'cs:scanner:cancel'
  SCAN_PROGRESS: 'cs:scanner:progress'

CLEANER channels:
  PREVIEW_CLEAN: 'cs:cleaner:preview'
  EXECUTE_CLEAN: 'cs:cleaner:execute'
  GET_HISTORY: 'cs:cleaner:get-history'

DUPLICATES channels:
  FIND_DUPLICATES: 'cs:duplicates:find'
  FIND_PHOTO_DUPLICATES: 'cs:duplicates:find-photos'
  DELETE_DUPLICATES: 'cs:duplicates:delete'
  DUPLICATES_PROGRESS: 'cs:duplicates:progress'

ORGANIZER channels:
  PREVIEW_ORGANIZE: 'cs:organizer:preview'
  EXECUTE_ORGANIZE: 'cs:organizer:execute'
  GET_RULES: 'cs:organizer:get-rules'
  SAVE_RULES: 'cs:organizer:save-rules'
  RENAME_PREVIEW: 'cs:organizer:rename-preview'
  RENAME_EXECUTE: 'cs:organizer:rename-execute'

WATCHER channels:
  ADD_WATCH_FOLDER: 'cs:watcher:add'
  REMOVE_WATCH_FOLDER: 'cs:watcher:remove'
  LIST_WATCH_FOLDERS: 'cs:watcher:list'
  WATCHER_ACTIVITY: 'cs:watcher:activity'

DISK channels:
  ANALYZE_DISK: 'cs:disk:analyze'
  GET_DRIVES: 'cs:disk:get-drives'
  FIND_LARGE_FILES: 'cs:disk:large-files'
  FIND_EMPTY_FOLDERS: 'cs:disk:empty-folders'
  FIND_OLD_FILES: 'cs:disk:old-files'

APPS channels:
  LIST_APPS: 'cs:apps:list'
  UNINSTALL_APP: 'cs:apps:uninstall'
  GET_STARTUP_ITEMS: 'cs:apps:get-startup'
  TOGGLE_STARTUP_ITEM: 'cs:apps:toggle-startup'

QUARANTINE channels:
  LIST_QUARANTINE: 'cs:quarantine:list'
  RESTORE_QUARANTINE: 'cs:quarantine:restore'
  PURGE_QUARANTINE: 'cs:quarantine:purge'

CONFIG channels:
  GET_CONFIG: 'cs:config:get'
  SET_CONFIG: 'cs:config:set'
  GET_WHITELIST: 'cs:config:get-whitelist'
  ADD_TO_WHITELIST: 'cs:config:add-whitelist'
  REMOVE_FROM_WHITELIST: 'cs:config:remove-whitelist'

SYSTEM channels:
  GET_SYSTEM_STATS: 'cs:system:get-stats'
  GET_DISK_USAGE: 'cs:system:disk-usage'
  OPTIMIZE_MEMORY: 'cs:system:optimize-memory'

SCHEDULER channels:
  GET_SCHEDULES: 'cs:scheduler:get'
  CREATE_SCHEDULE: 'cs:scheduler:create'
  DELETE_SCHEDULE: 'cs:scheduler:delete'
  TOGGLE_SCHEDULE: 'cs:scheduler:toggle'

FILE: src/shared/types.ts
Export these TypeScript interfaces and types:

export type Platform = 'darwin' | 'win32';

export type ScanCategory = 
  | 'system-junk' | 'browser-cache' | 'logs' 
  | 'temp-files' | 'app-leftovers' | 'large-files' 
  | 'old-files' | 'duplicates' | 'trash' | 'privacy';

export interface ScannedItem {
  id: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  lastModified: number; // timestamp
  lastAccessed: number; // timestamp
  category: ScanCategory;
  description: string;
  safeToDelete: boolean;
}

export interface ScanResult {
  id: string;
  category: ScanCategory;
  categoryLabel: string;
  items: ScannedItem[];
  totalSize: number;
  scanDuration: number;
}

export interface ScanProgress {
  phase: 'indexing' | 'analyzing' | 'hashing' | 'complete';
  filesScanned: number;
  totalFound: number;
  currentPath: string;
  percentage: number;
}

export interface DuplicateGroup {
  id: string;
  hash: string;
  files: ScannedItem[];
  wastedSpace: number;
}

export type RuleConditionField = 
  'name' | 'extension' | 'size' | 'created' | 'modified';

export type RuleConditionOperator = 
  'contains' | 'equals' | 'startsWith' | 'endsWith' 
  | 'greaterThan' | 'lessThan' | 'matches';

export interface RuleCondition {
  id: string;
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

export type RuleAction = 'move' | 'copy' | 'rename' | 'delete';

export interface OrganizerRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: RuleCondition[];
  logicOperator: 'AND' | 'OR';
  action: RuleAction;
  destination: string;
  namingPattern?: string;
  priority: number;
}

export interface WatchFolder {
  id: string;
  sourcePath: string;
  enabled: boolean;
  ruleIds: string[];
  createdAt: number;
}

export interface QuarantineEntry {
  id: string;
  originalPath: string;
  quarantinePath: string;
  filename: string;
  size: number;
  deletedAt: number;
  expiresAt: number;
  reason: string;
  category: ScanCategory;
  restorable: boolean;
}

export interface AppInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  version: string;
  bundleId?: string; // macOS
  publisher?: string; // Windows
  installDate?: number;
  lastUsed?: number;
}

export interface StartupItem {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  type: string;
  impact: 'low' | 'medium' | 'high';
}

export interface DiskDrive {
  name: string;
  mountPoint: string;
  total: number;
  used: number;
  free: number;
  type: 'internal' | 'external' | 'network';
}

export interface DiskNode {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  children?: DiskNode[];
  extension?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'quick-clean' | 'deep-clean' | 'duplicate-remove' 
      | 'organize' | 'rename' | 'uninstall';
  filesProcessed: number;
  spaceFreed: number;
  details: string;
}

export interface ScheduleTask {
  id: string;
  name: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // "HH:MM"
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  taskType: 'quick-clean' | 'deep-clean' | 'organize';
  lastRun?: number;
  nextRun?: number;
}

export interface AppConfig {
  version: string;
  general: {
    launchAtStartup: boolean;
    minimizeToTray: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
    showNotifications: boolean;
    lowDiskAlertThresholdGB: number;
  };
  scan: {
    includeHidden: boolean;
    includeSystem: boolean;
    minFileSizeBytes: number;
    customPaths: string[];
    excludedExtensions: string[];
  };
  quarantine: {
    enabled: boolean;
    retentionDays: number;
    maxSizeGB: number;
  };
  cleaner: {
    browsers: {
      [key: string]: {
        enabled: boolean;
        clearCache: boolean;
        clearCookies: boolean;
        clearHistory: boolean;
        clearDownloadHistory: boolean;
        clearPasswords: boolean;
        cookieWhitelist: string[];
      };
    };
    systemJunk: { [key: string]: boolean };
  };
  organizer: {
    conflictStrategy: 'skip' | 'rename' | 'overwrite';
    defaultDestination: string;
  };
  ui: {
    density: 'compact' | 'comfortable';
    accentColor: string;
    sidebarCollapsed: boolean;
  };
}

export type IPCResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; recoverable: boolean } };

FILE: src/shared/constants.ts
Export:
- APP_NAME = 'CleanSweep'
- APP_VERSION = '1.0.0'
- DEFAULT_CONFIG: AppConfig (sensible defaults for all fields)
- BROWSER_LIST = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera']
- CATEGORY_LABELS: Record<ScanCategory, string> with human-readable labels
- FILE_TYPE_CATEGORIES: Record mapping extensions to category names like
  Images, Videos, Audio, Documents, Archives, Code, etc.
- SIZE_UNITS helper array: ['B', 'KB', 'MB', 'GB', 'TB']
"""

---

## PROMPT 1.3 — Main Layout & Navigation Shell

"""
In the CleanSweep Electron+React+TypeScript project, build the 
complete app shell with sidebar navigation and routing.
Do NOT implement any actual feature logic yet — just the navigation
shell with placeholder page components.

INSTALL these additional packages:
- lucide-react: ^0.300.0
- clsx: ^2.0.0
- @radix-ui/react-tooltip: ^1.0.7
- @radix-ui/react-dialog: ^1.0.5
- @radix-ui/react-progress: ^1.0.3
- @radix-ui/react-toggle: ^1.0.3
- @radix-ui/react-scroll-area: ^1.0.5

CREATE src/renderer/components/layout/Sidebar.tsx:
A left sidebar (240px wide, collapsible to 64px icon-only mode) with:
- App logo + name "CleanSweep" at top
- Navigation items with icons (lucide-react), labels, and active state:
  * Dashboard (LayoutDashboard icon) → path: /
  * Cleaner (Sparkles icon) → path: /cleaner
  * Duplicates (Copy icon) → path: /duplicates  
  * Organizer (FolderOpen icon) → path: /organizer
  * Disk Analyzer (PieChart icon) → path: /disk
  * Apps (AppWindow icon) → path: /apps
  * Scheduler (Clock icon) → path: /scheduler
  * Quarantine (Shield icon) → path: /quarantine
  * Settings (Settings icon) → path: /settings
- Collapse toggle button at bottom
- "Pro" badge next to Scheduler nav item
- Show active route with accent color highlight
- Smooth transition animation on collapse
- Store collapsed state in localStorage

CREATE src/renderer/components/layout/TopBar.tsx:
A top bar (48px tall) with:
- Current page title (dynamic, based on route)
- Page subtitle/description
- Right side: theme toggle button (sun/moon icon), 
  notification bell icon (placeholder)
- Bottom border separator

CREATE src/renderer/components/layout/MainLayout.tsx:
Wrapper that combines Sidebar + TopBar + main content area:
- Sidebar on left
- TopBar at top of content area
- Main content area (scrollable) taking remaining space
- Apply correct background colors for light/dark mode

CREATE src/renderer/stores/uiStore.ts (Zustand):
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  activeModal: string | null
  setTheme: (theme: ...) => void
  toggleSidebar: () => void
  openModal: (id: string) => void
  closeModal: () => void
}
Apply theme class to document.documentElement on theme change.
Listen to system theme changes when theme is 'system'.

CREATE placeholder pages (each just shows icon + title + 
"Coming Soon" description in the center):
- src/renderer/pages/Dashboard/Dashboard.tsx
- src/renderer/pages/Cleaner/CleanerHome.tsx
- src/renderer/pages/Duplicates/DuplicatesHome.tsx
- src/renderer/pages/Organizer/OrganizerHome.tsx
- src/renderer/pages/Disk/DiskAnalyzer.tsx
- src/renderer/pages/Apps/AppsHome.tsx
- src/renderer/pages/Scheduler/SchedulerHome.tsx
- src/renderer/pages/Quarantine/QuarantineHome.tsx
- src/renderer/pages/Settings/SettingsHome.tsx

CREATE src/renderer/router.tsx:
Use react-router-dom v6 with BrowserRouter (use HashRouter for Electron).
Map all routes to their page components.
Wrap all routes in MainLayout.

UPDATE src/renderer/App.tsx to use the router.

STYLING REQUIREMENTS:
- Use Tailwind CSS throughout
- Color scheme: 
  Light: bg-gray-50, sidebar bg-white, border-gray-200
  Dark: bg-gray-950, sidebar bg-gray-900, border-gray-800
- Accent color: blue-500 for active/highlight states
- All transitions: duration-200 ease-in-out
- The app should look clean and modern like CleanMyMac/CCleaner
"""

---

## PROMPT 1.4 — Preload & IPC Foundation

"""
In the CleanSweep Electron project, set up the secure IPC 
communication bridge between main process and renderer.

UPDATE src/main/preload.ts:
Use contextBridge.exposeInMainWorld to expose 'cleanSweepAPI' object.
Import IPC_CHANNELS from shared/ipcChannels.ts.

The exposed API should have these namespaces, each calling 
ipcRenderer.invoke() for request-response OR ipcRenderer.on() 
for event subscriptions:

window.cleanSweepAPI = {
  scanner: {
    quickScan: (options) => invoke(QUICK_SCAN, options),
    deepScan: (options) => invoke(DEEP_SCAN, options),
    browserScan: (options) => invoke(BROWSER_SCAN, options),
    cancelScan: () => send(CANCEL_SCAN),
    onProgress: (callback) => {
      // subscribe to progress events, return cleanup function
    }
  },
  cleaner: {
    previewClean: (items) => invoke(PREVIEW_CLEAN, items),
    executeClean: (items, useQuarantine) => invoke(EXECUTE_CLEAN, ...),
    getHistory: () => invoke(GET_HISTORY),
  },
  duplicates: {
    findDuplicates: (paths, options) => invoke(FIND_DUPLICATES, ...),
    findPhotoDuplicates: (paths) => invoke(FIND_PHOTO_DUPLICATES, paths),
    deleteDuplicates: (items, useQuarantine) => invoke(DELETE_DUPLICATES, ...),
    onProgress: (callback) => { ... return cleanup fn }
  },
  organizer: {
    previewOrganize: (source, rules) => invoke(PREVIEW_ORGANIZE, ...),
    executeOrganize: (source, rules) => invoke(EXECUTE_ORGANIZE, ...),
    getRules: () => invoke(GET_RULES),
    saveRules: (rules) => invoke(SAVE_RULES, rules),
    renamePreview: (files, pattern) => invoke(RENAME_PREVIEW, ...),
    renameExecute: (files, pattern) => invoke(RENAME_EXECUTE, ...),
  },
  watcher: {
    addWatchFolder: (folder) => invoke(ADD_WATCH_FOLDER, folder),
    removeWatchFolder: (id) => invoke(REMOVE_WATCH_FOLDER, id),
    listWatchFolders: () => invoke(LIST_WATCH_FOLDERS),
    onActivity: (callback) => { ... return cleanup fn }
  },
  disk: {
    analyzeDisk: (path) => invoke(ANALYZE_DISK, path),
    getDrives: () => invoke(GET_DRIVES),
    findLargeFiles: (path, minSizeBytes) => invoke(FIND_LARGE_FILES, ...),
    findEmptyFolders: (path) => invoke(FIND_EMPTY_FOLDERS, path),
    findOldFiles: (path, olderThanDays) => invoke(FIND_OLD_FILES, ...),
  },
  apps: {
    listApps: () => invoke(LIST_APPS),
    uninstallApp: (appId) => invoke(UNINSTALL_APP, appId),
    getStartupItems: () => invoke(GET_STARTUP_ITEMS),
    toggleStartupItem: (id, enabled) => invoke(TOGGLE_STARTUP_ITEM, ...),
  },
  quarantine: {
    listQuarantine: () => invoke(LIST_QUARANTINE),
    restoreItem: (id) => invoke(RESTORE_QUARANTINE, id),
    purgeAll: () => invoke(PURGE_QUARANTINE),
  },
  config: {
    getConfig: () => invoke(GET_CONFIG),
    setConfig: (config) => invoke(SET_CONFIG, config),
    getWhitelist: () => invoke(GET_WHITELIST),
    addToWhitelist: (path) => invoke(ADD_TO_WHITELIST, path),
    removeFromWhitelist: (path) => invoke(REMOVE_FROM_WHITELIST, path),
  },
  system: {
    getSystemStats: () => invoke(GET_SYSTEM_STATS),
    getDiskUsage: () => invoke(GET_DISK_USAGE),
    optimizeMemory: () => invoke(OPTIMIZE_MEMORY),
  },
  scheduler: {
    getSchedules: () => invoke(GET_SCHEDULES),
    createSchedule: (task) => invoke(CREATE_SCHEDULE, task),
    deleteSchedule: (id) => invoke(DELETE_SCHEDULE, id),
    toggleSchedule: (id, enabled) => invoke(TOGGLE_SCHEDULE, ...),
  }
}

For onProgress and onActivity subscription functions:
- Add listener with ipcRenderer.on()
- Return a cleanup function that calls ipcRenderer.removeListener()
- Example:
  onProgress: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on(SCAN_PROGRESS, handler)
    return () => ipcRenderer.removeListener(SCAN_PROGRESS, handler)
  }

CREATE src/main/utils/ipcHelper.ts:
Export a safeHandle function that wraps ipcMain.handle with try/catch
and returns IPCResponse<T> (from shared/types.ts):
- On success: { success: true, data: result }
- On error: { success: false, error: { code, message, recoverable } }
- Log all errors to console in development

CREATE src/renderer/hooks/useIPC.ts:
A React hook that:
- Calls an IPC function and unwraps IPCResponse<T>
- Returns { data, loading, error }
- Handles the success/failure unwrapping automatically
- Example usage: const { data, loading } = useIPC(() => 
  window.cleanSweepAPI.config.getConfig())

Also create src/renderer/hooks/useIPCEvent.ts:
A React hook for subscribing to IPC push events (like scan progress):
- Takes event subscription function (like scanner.onProgress)
- Takes callback
- Automatically cleans up on unmount with useEffect return

Add TypeScript global declaration for window.cleanSweepAPI.
Create src/renderer/types/electron.d.ts that declares the 
window.cleanSweepAPI type using the types from shared/types.ts.

CREATE src/main/ipcHandlers.ts:
A shell file that registers ALL IPC channels as stubs that return
{ success: true, data: null } for now.
Import safeHandle and IPC_CHANNELS.
Export a function registerAllHandlers(app) that registers every channel.
Call this from src/main/index.ts.

IMPORTANT: Every IPC handler must use safeHandle wrapper.
IMPORTANT: Never expose raw ipcRenderer to renderer - only through preload.
"""

---

## ✅ PHASE 1 MANUAL TEST CHECKLIST
□ App launches without errors
□ All 9 sidebar navigation items visible
□ Clicking each nav item changes the page
□ Sidebar collapses to icon-only mode
□ Dark mode toggle works
□ Window is resizable with 900x600 minimum
□ No TypeScript errors (run: npx tsc --noEmit)
□ No console errors on launch

text


---

---
# ═══════════════════════════════════════════════
# PHASE 2: CONFIG, STORAGE & MAIN SERVICES CORE
# Goal: Local storage working, config loading/saving
# Estimated time: 2-3 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 2.1 — Config & Storage Service

"""
In the CleanSweep Electron project, build the local storage layer.
All data is stored as JSON files — NO database.

INSTALL packages:
- electron-store is NOT needed - we'll use fs directly for full control
- uuid: ^9.0.0
- @types/uuid: ^9.0.0

CREATE src/main/services/config/ConfigService.ts:

class ConfigService (export as singleton):

Properties:
- configPath: string (path to config.json in userData directory)
- whitelistPath: string (path to whitelist.json)
- historyPath: string (path to history.json, max 500 entries)
- rulesPath: string (path to rules.json)
- schedulesPath: string (path to schedules.json)

Methods (all async):

getConfig(): Promise<AppConfig>
  - Read config.json, parse JSON
  - If missing, create with DEFAULT_CONFIG and return it
  - Merge with DEFAULT_CONFIG to handle missing fields (deep merge)

setConfig(config: Partial<AppConfig>): Promise<void>
  - Deep merge with existing config
  - Write to config.json atomically (write to .tmp file first, then rename)

getWhitelist(): Promise<string[]>
  - Read whitelist.json, return array of paths
  - Return [] if file missing

addToWhitelist(itemPath: string): Promise<void>
  - Read current whitelist, add path if not already present, save

removeFromWhitelist(itemPath: string): Promise<void>
  - Filter out the path, save

getRules(): Promise<OrganizerRule[]>
  - Read rules.json
  - Return [] if missing

saveRules(rules: OrganizerRule[]): Promise<void>
  - Validate each rule has required fields
  - Save to rules.json

getHistory(): Promise<HistoryEntry[]>
  - Read history.json
  - Return [] if missing

addHistoryEntry(entry: HistoryEntry): Promise<void>
  - Add to history array
  - Keep only last 500 entries (trim oldest)
  - Save

getSchedules(): Promise<ScheduleTask[]>
  - Read schedules.json, return [] if missing

saveSchedules(schedules: ScheduleTask[]): Promise<void>

Private helpers:
- readJSON<T>(filePath: string): Promise<T | null>
- writeJSON(filePath: string, data: unknown): Promise<void>
  (atomic write: write to .tmp, rename to final)
- ensureDir(dirPath: string): Promise<void>

On construction:
- Set configPath to: app.getPath('userData') + '/config.json'
- Set whitelistPath to: app.getPath('userData') + '/whitelist.json'
- etc.
- Call ensureDir on userData directory

CREATE src/main/services/config/QuarantineService.ts:

class QuarantineService:

Properties:
- quarantinePath: string (userData/quarantine/)
- manifestPath: string (userData/quarantine/manifest.json)

Methods (all async):

getManifest(): Promise<QuarantineEntry[]>
  - Read manifest.json, return [] if missing

quarantineItem(item: ScannedItem, reason: string): Promise<QuarantineEntry>
  - Generate UUID for entry
  - Generate UUID for quarantine filename (to avoid naming conflicts)
  - Copy original file/directory to quarantine folder with UUID filename
  - If successful, delete the original
  - Create QuarantineEntry object
  - Add to manifest
  - Return entry

quarantineItems(items: ScannedItem[], reason: string): Promise<{
  succeeded: QuarantineEntry[];
  failed: Array<{item: ScannedItem; error: string}>;
}>
  - Process each item, collect successes and failures

restoreItem(entryId: string): Promise<void>
  - Find entry in manifest
  - Ensure original directory exists (mkdir -p)
  - Move file back from quarantine to original path
  - Handle conflict: if file already exists at original path, 
    append _restored suffix
  - Remove from manifest

purgeExpired(): Promise<number>
  - Find entries where expiresAt < Date.now()
  - Delete files from quarantine folder
  - Remove from manifest
  - Return count of purged items

purgeAll(): Promise<void>
  - Delete all files in quarantine folder
  - Reset manifest to []

getTotalSize(): Promise<number>
  - Sum sizes from manifest

CREATE src/main/services/Logger.ts:

class Logger (singleton):
- logPath: userData/logs/app-YYYY-MM.log
- Methods: info(module, message, data?), warn(...), error(...)
- Format: JSON per line with timestamp, level, module, message
- Rotate monthly (new file each month)
- Cap at 10MB, delete oldest lines if exceeded
- In development, also console.log
- Export as singleton: export const logger = new Logger()

REGISTER IPC handlers in src/main/ipcHandlers.ts:
Replace the config-related stubs with real implementations:
- GET_CONFIG → configService.getConfig()
- SET_CONFIG → configService.setConfig(data)
- GET_WHITELIST → configService.getWhitelist()
- ADD_TO_WHITELIST → configService.addToWhitelist(path)
- REMOVE_FROM_WHITELIST → configService.removeFromWhitelist(path)
- GET_HISTORY → configService.getHistory()
- LIST_QUARANTINE → quarantineService.getManifest()
- RESTORE_QUARANTINE → quarantineService.restoreItem(id)
- PURGE_QUARANTINE → quarantineService.purgeAll()

CREATE src/renderer/stores/settingsStore.ts (Zustand):
interface SettingsStore:
  config: AppConfig | null
  whitelist: string[]
  loading: boolean
  
  loadConfig: () => Promise<void>  
    (calls window.cleanSweepAPI.config.getConfig())
  updateConfig: (partial: Partial<AppConfig>) => Promise<void>
  addToWhitelist: (path: string) => Promise<void>
  removeFromWhitelist: (path: string) => Promise<void>

Call loadConfig() on app startup in App.tsx useEffect.
"""

---

## PROMPT 2.2 — Platform Detection & System Stats

"""
In the CleanSweep Electron project, build the platform detection 
layer and system statistics service.

CREATE src/main/services/system/PlatformService.ts:

export class PlatformService {

  getPlatform(): Platform {
    return process.platform as Platform;
  }

  isMac(): boolean { return process.platform === 'darwin'; }
  isWindows(): boolean { return process.platform === 'win32'; }

  expandPath(inputPath: string): string {
    // Replace ~ with os.homedir()
    // Replace %VARIABLE% with process.env.VARIABLE on Windows
    // Replace $VARIABLE with process.env.VARIABLE on Mac
    // Use path.resolve() at end
  }

  getUserDataPath(): string {
    // Use app.getPath('userData')
  }

  getCommonScanPaths(): Array<{path: string; category: ScanCategory; label: string}> {
    if (this.isMac()) return MAC_SCAN_PATHS;
    if (this.isWindows()) return WINDOWS_SCAN_PATHS;
    return [];
  }

  getBrowserPaths(): Record<string, {
    name: string;
    cachePath: string;
    historyPath: string;
    cookiePath: string;
    dataPath: string;
  }[]> {
    // Return browser data paths for current platform
    // Each browser can have multiple profile paths
  }
}

Define MAC_SCAN_PATHS array with these locations:
[
  { path: '~/Library/Caches', category: 'system-junk', label: 'System Caches' },
  { path: '~/Library/Logs', category: 'logs', label: 'Application Logs' },
  { path: '/private/tmp', category: 'temp-files', label: 'Temporary Files' },
  { path: '~/Library/Application Support/CrashReporter', 
    category: 'logs', label: 'Crash Reports' },
  { path: '~/.Trash', category: 'trash', label: 'Trash' },
  { path: '~/Downloads', category: 'large-files', label: 'Downloads Folder' },
  { path: '~/Library/Application Support', 
    category: 'app-leftovers', label: 'App Support Files' },
  { path: '/Library/Logs', category: 'logs', label: 'System Logs' },
]

Define MAC_BROWSER_PATHS:
Chrome: ~/Library/Application Support/Google/Chrome/Default/Cache
Firefox: ~/Library/Application Support/Firefox/Profiles/*/cache2
Safari: ~/Library/Caches/com.apple.Safari
Edge: ~/Library/Application Support/Microsoft Edge/Default/Cache
Brave: ~/Library/Application Support/BraveSoftware/Brave-Browser/Default/Cache

Define WINDOWS_SCAN_PATHS:
[
  { path: '%TEMP%', category: 'temp-files', label: 'User Temp Files' },
  { path: '%SystemRoot%\\Temp', category: 'temp-files', label: 'System Temp Files' },
  { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\INetCache', 
    category: 'browser-cache', label: 'IE/Edge Cache' },
  { path: '%LOCALAPPDATA%\\Temp', category: 'temp-files', label: 'Local Temp Files' },
  { path: '%LOCALAPPDATA%\\CrashDumps', category: 'logs', label: 'Crash Dumps' },
  { path: '%USERPROFILE%\\Downloads', category: 'large-files', label: 'Downloads' },
  { path: '%APPDATA%\\Microsoft\\Windows\\Recent', 
    category: 'privacy', label: 'Recent Files List' },
]

Define WINDOWS_BROWSER_PATHS:
Chrome: %LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache
Firefox: %APPDATA%\Mozilla\Firefox\Profiles\*\cache2
Edge: %LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache
Brave: %LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Cache

CREATE src/main/services/system/SystemStatsService.ts:

import os from 'os'
import { execSync } from 'child_process'

export class SystemStatsService {

  getSystemStats(): {
    platform: string;
    arch: string;
    totalRAM: number;
    freeRAM: number;
    usedRAM: number;
    cpuModel: string;
    cpuUsage: number;
    uptime: number;
  } {
    return {
      platform: process.platform,
      arch: process.arch,
      totalRAM: os.totalmem(),
      freeRAM: os.freemem(),
      usedRAM: os.totalmem() - os.freemem(),
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      cpuUsage: this.getCPUUsage(),
      uptime: os.uptime(),
    };
  }

  getDiskUsage(): Promise<DiskDrive[]> {
    // On macOS: parse 'df -k' command output
    // On Windows: use 'wmic logicaldisk get size,freespace,caption'
    // Parse output and return DiskDrive array
    // Handle errors gracefully, return [] on failure
  }

  private getCPUUsage(): number {
    // Sample CPU usage over 100ms
    // Return percentage 0-100
  }

  optimizeMemory(): void {
    // macOS: No direct way, suggest to user
    // Windows: We can call EmptyWorkingSet via a PowerShell script
    // For v1: just run gc() and return
    if (global.gc) global.gc();
  }
}

REGISTER in ipcHandlers.ts:
- GET_SYSTEM_STATS → systemStatsService.getSystemStats()
- GET_DISK_USAGE → systemStatsService.getDiskUsage()
- OPTIMIZE_MEMORY → systemStatsService.optimizeMemory()

CREATE src/renderer/stores/systemStore.ts (Zustand):
- systemStats: SystemStats | null
- diskDrives: DiskDrive[]
- loading: boolean
- fetchSystemStats: () => Promise<void>
- fetchDiskUsage: () => Promise<void>
Poll systemStats every 5 seconds when Dashboard is visible.
"""

---

## ✅ PHASE 2 MANUAL TEST CHECKLIST
□ Config file created in userData directory on first launch
□ Config survives app restart (persisted to disk)
□ Whitelist add/remove works
□ No crashes when userData directory doesn't exist yet
□ Platform correctly detected (check console)
□ System stats return valid numbers
□ Disk usage returns at least one drive
□ Quarantine directory created automatically
□ Logger creates log file in userData/logs/

text


---

---
# ═══════════════════════════════════════════════
# PHASE 3: SCANNER ENGINE & CLEANER
# Goal: Working quick scan + safe clean with quarantine
# Estimated time: 3-4 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 3.1 — File System Utilities & Scanner Core

"""
In the CleanSweep Electron project, build the file system 
utility layer and the core scanner engine.

INSTALL packages:
- fast-glob: ^3.3.2
- @types/fast-glob is included

CREATE src/main/utils/fsUtils.ts:

Export these utility functions (all async, all handle errors gracefully):

getFileSize(filePath: string): Promise<number>
  - Returns file size in bytes
  - Returns 0 if error (file locked, no permission, etc.)

getDirectorySize(dirPath: string): Promise<number>
  - Recursively sum all file sizes in directory
  - Skip files that throw errors (permission denied etc.)
  - Use fast iteration, not recursive function calls (use a queue)

getFileStat(filePath: string): Promise<{
  size: number; 
  lastModified: number; 
  lastAccessed: number;
  isDirectory: boolean;
  isFile: boolean;
} | null>
  - Returns null on any error

listDirectory(dirPath: string): Promise<string[]>
  - Returns array of full paths of direct children
  - Returns [] on error

globFiles(pattern: string, options?: {}): Promise<string[]>
  - Wrapper around fast-glob
  - Handle errors, return []

deleteFile(filePath: string): Promise<boolean>
  - Try to delete file/directory
  - Returns true on success, false on failure
  - For directories: use fs.rm with recursive: true
  - Never throw, always return boolean

moveFile(from: string, to: string): Promise<boolean>
  - Ensure destination directory exists
  - Try fs.rename first (fast, same filesystem)
  - If rename fails (cross-device), fall back to copy+delete
  - Returns boolean

copyFile(from: string, to: string): Promise<boolean>
  - Ensure destination directory exists
  - Copy, return boolean

ensureDir(dirPath: string): Promise<void>
  - fs.mkdir with recursive: true, ignore EEXIST errors

formatBytes(bytes: number, decimals = 2): string
  - Convert bytes to human readable: "2.5 GB", "450 KB", etc.
  - Export this for use in renderer too (put in shared/utils.ts)

isPathAccessible(filePath: string): Promise<boolean>
  - Try fs.access with R_OK flag
  - Return boolean

expandGlob(pattern: string, basePath: string): string[]
  - For glob patterns like */cache2, expand them
  - Use fast-glob sync for simple cases

CREATE src/main/services/scanner/ScannerService.ts:

This is the core scanner. It must emit progress events via 
a callback (not EventEmitter) so we can send to renderer via IPC.

export class ScannerService {
  private cancelled = false;
  private whitelist: string[] = [];

  constructor(private platformService: PlatformService) {}

  async quickScan(
    options: { customPaths?: string[] },
    onProgress: (progress: ScanProgress) => void,
    whitelist: string[]
  ): Promise<ScanResult[]> {
    
    this.cancelled = false;
    this.whitelist = whitelist;
    const results: ScanResult[] = [];
    const locations = this.platformService.getCommonScanPaths();
    
    let totalScanned = 0;
    const total = locations.length;
    
    for (let i = 0; i < locations.length; i++) {
      if (this.cancelled) break;
      
      const location = locations[i];
      
      onProgress({
        phase: 'indexing',
        filesScanned: totalScanned,
        totalFound: results.flatMap(r => r.items).length,
        currentPath: location.path,
        percentage: Math.round((i / total) * 100),
      });

      const expandedPath = this.platformService.expandPath(location.path);
      const accessible = await isPathAccessible(expandedPath);
      if (!accessible) continue;

      const items = await this.scanLocation(expandedPath, location.category);
      totalScanned += items.length;

      if (items.length > 0) {
        const existingResult = results.find(r => r.category === location.category);
        if (existingResult) {
          existingResult.items.push(...items);
          existingResult.totalSize += items.reduce((sum, i) => sum + i.size, 0);
        } else {
          results.push({
            id: uuid(),
            category: location.category,
            categoryLabel: CATEGORY_LABELS[location.category],
            items,
            totalSize: items.reduce((sum, i) => sum + i.size, 0),
            scanDuration: 0,
          });
        }
      }
    }

    onProgress({
      phase: 'complete',
      filesScanned: totalScanned,
      totalFound: results.flatMap(r => r.items).length,
      currentPath: '',
      percentage: 100,
    });

    return results;
  }

  cancel(): void {
    this.cancelled = true;
  }

  private async scanLocation(
    dirPath: string, 
    category: ScanCategory
  ): Promise<ScannedItem[]> {
    const items: ScannedItem[] = [];

    try {
      // Use fast-glob to get all files
      const files = await globFiles('**/*', {
        cwd: dirPath,
        absolute: true,
        dot: true,
        followSymbolicLinks: false,
        onlyFiles: false,
        deep: category === 'trash' ? 1 : undefined,
      });

      for (const filePath of files) {
        if (this.cancelled) break;
        if (this.isWhitelisted(filePath)) continue;
        
        const stat = await getFileStat(filePath);
        if (!stat) continue;

        items.push({
          id: uuid(),
          path: filePath,
          size: stat.isDirectory 
            ? await getDirectorySize(filePath) 
            : stat.size,
          type: stat.isDirectory ? 'directory' : 'file',
          lastModified: stat.lastModified,
          lastAccessed: stat.lastAccessed,
          category,
          description: this.getItemDescription(filePath, category),
          safeToDelete: this.isSafeToDelete(filePath, category),
        });
      }
    } catch (error) {
      // Log and continue — never crash on permission errors
      logger.warn('ScannerService', `Cannot scan ${dirPath}: ${error}`);
    }

    return items;
  }

  private isWhitelisted(filePath: string): boolean {
    return this.whitelist.some(w => 
      filePath === w || filePath.startsWith(w + '/')
    );
  }

  private getItemDescription(filePath: string, category: ScanCategory): string {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    // Return human-readable description based on category and file type
    const descriptions: Record<ScanCategory, string> = {
      'system-junk': 'System cache file',
      'browser-cache': 'Browser cached data',
      'logs': 'Log file',
      'temp-files': 'Temporary file',
      'app-leftovers': 'Orphaned app data',
      'large-files': 'Large file',
      'old-files': 'Old unused file',
      'duplicates': 'Duplicate file',
      'trash': 'Deleted file in Trash',
      'privacy': 'Privacy data',
    };
    return descriptions[category] || 'System file';
  }

  private isSafeToDelete(filePath: string, category: ScanCategory): boolean {
    // Never mark as safe if path contains: /System/, /usr/, /bin/
    const dangerPatterns = ['/System/', '/usr/bin/', '/bin/', 
      'C:\\Windows\\System32'];
    if (dangerPatterns.some(p => filePath.includes(p))) return false;
    
    // Trash and temp files are always safe
    if (['trash', 'temp-files', 'logs', 'browser-cache'].includes(category)) 
      return true;
    
    return true; // Default safe, user can review
  }
}

REGISTER in ipcHandlers.ts:
- QUICK_SCAN channel:
  1. Get whitelist from configService
  2. Create scannerService
  3. Set up progress emitter that sends IPC events to renderer:
     mainWindow.webContents.send(SCAN_PROGRESS, progress)
  4. Call scannerService.quickScan(...)
  5. Return results

- CANCEL_SCAN channel:
  scannerService.cancel()
"""

---

## PROMPT 3.2 — Browser & Privacy Scanner

"""
In the CleanSweep Electron project, add browser cache scanning
and privacy cleaning to the ScannerService.

CREATE src/main/services/scanner/BrowserScanner.ts:

export class BrowserScanner {
  constructor(private platformService: PlatformService) {}

  async scanBrowsers(
    enabledBrowsers: string[],
    options: {
      clearCache: boolean;
      clearCookies: boolean;
      clearHistory: boolean;
      clearDownloadHistory: boolean;
    },
    onProgress: (progress: ScanProgress) => void
  ): Promise<ScanResult[]> {
    
    const browserPaths = this.platformService.getBrowserPaths();
    const results: ScanResult[] = [];
    let scanned = 0;
    const total = enabledBrowsers.length;

    for (const browserId of enabledBrowsers) {
      const paths = browserPaths[browserId];
      if (!paths) continue;

      onProgress({
        phase: 'indexing',
        filesScanned: scanned,
        totalFound: results.flatMap(r => r.items).length,
        currentPath: `Scanning ${browserId}...`,
        percentage: Math.round((scanned / total) * 100),
      });

      const items: ScannedItem[] = [];

      for (const browserPath of paths) {
        // Expand glob patterns (for Firefox profiles with *)
        const expandedPaths = await this.expandBrowserPath(
          browserPath.cachePath
        );
        
        for (const cachePath of expandedPaths) {
          if (!await isPathAccessible(cachePath)) continue;
          
          const cacheItems = await this.getFilesInDir(
            cachePath, 'browser-cache'
          );
          items.push(...cacheItems);
        }
      }

      if (items.length > 0) {
        results.push({
          id: uuid(),
          category: 'browser-cache',
          categoryLabel: `${this.getBrowserName(browserId)} Cache`,
          items,
          totalSize: items.reduce((sum, i) => sum + i.size, 0),
          scanDuration: 0,
        });
      }

      scanned++;
    }

    return results;
  }

  private async expandBrowserPath(pattern: string): Promise<string[]> {
    // Handle paths with * glob (Firefox profiles)
    if (!pattern.includes('*')) {
      const expanded = this.platformService.expandPath(pattern);
      return [expanded];
    }
    
    // Use fast-glob to expand
    const expanded = this.platformService.expandPath(
      pattern.split('*')[0]
    );
    const profileDirs = await listDirectory(expanded).catch(() => []);
    return profileDirs.map(d => 
      path.join(d, pattern.split('*')[1].replace(/^\//, ''))
    );
  }

  private getBrowserName(id: string): string {
    const names: Record<string, string> = {
      chrome: 'Google Chrome',
      firefox: 'Mozilla Firefox',
      safari: 'Safari',
      edge: 'Microsoft Edge',
      brave: 'Brave Browser',
      opera: 'Opera',
    };
    return names[id] || id;
  }

  private async getFilesInDir(
    dirPath: string, 
    category: ScanCategory
  ): Promise<ScannedItem[]> {
    // Get all files recursively, return as ScannedItems
    // Cap at 10,000 files per browser for performance
    const files = await globFiles('**/*', {
      cwd: dirPath,
      absolute: true,
      dot: true,
      onlyFiles: true,
    }).catch(() => []);

    const items: ScannedItem[] = [];
    for (const file of files.slice(0, 10000)) {
      const stat = await getFileStat(file);
      if (!stat || stat.isDirectory) continue;
      items.push({
        id: uuid(),
        path: file,
        size: stat.size,
        type: 'file',
        lastModified: stat.lastModified,
        lastAccessed: stat.lastAccessed,
        category,
        description: 'Browser cache file',
        safeToDelete: true,
      });
    }
    return items;
  }
}

CREATE src/main/services/scanner/PrivacyCleaner.ts:

export class PrivacyCleaner {
  constructor(private platformService: PlatformService) {}

  async getPrivacyItems(): Promise<ScanResult[]> {
    const items: ScannedItem[] = [];

    if (this.platformService.isMac()) {
      await this.addMacPrivacyItems(items);
    } else {
      await this.addWindowsPrivacyItems(items);
    }

    if (items.length === 0) return [];

    return [{
      id: uuid(),
      category: 'privacy',
      categoryLabel: 'Privacy Data',
      items,
      totalSize: items.reduce((s, i) => s + i.size, 0),
      scanDuration: 0,
    }];
  }

  private async addMacPrivacyItems(items: ScannedItem[]) {
    const privacyPaths = [
      { 
        path: '~/Library/Application Support/Quick Look', 
        label: 'Quick Look Cache' 
      },
      { 
        path: '~/.bash_history', 
        label: 'Bash History' 
      },
      { 
        path: '~/.zsh_history', 
        label: 'Zsh History' 
      },
    ];

    for (const p of privacyPaths) {
      const expanded = this.platformService.expandPath(p.path);
      const stat = await getFileStat(expanded);
      if (!stat) continue;
      
      items.push({
        id: uuid(),
        path: expanded,
        size: stat.isDirectory 
          ? await getDirectorySize(expanded) 
          : stat.size,
        type: stat.isDirectory ? 'directory' : 'file',
        lastModified: stat.lastModified,
        lastAccessed: stat.lastAccessed,
        category: 'privacy',
        description: p.label,
        safeToDelete: true,
      });
    }
  }

  private async addWindowsPrivacyItems(items: ScannedItem[]) {
    const privacyPaths = [
      {
        path: '%APPDATA%\\Microsoft\\Windows\\Recent',
        label: 'Recent Files List',
      },
      {
        path: '%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer',
        label: 'Thumbnail Cache',
      },
    ];

    for (const p of privacyPaths) {
      const expanded = this.platformService.expandPath(p.path);
      const stat = await getFileStat(expanded);
      if (!stat) continue;
      items.push({
        id: uuid(),
        path: expanded,
        size: stat.isDirectory ? await getDirectorySize(expanded) : stat.size,
        type: stat.isDirectory ? 'directory' : 'file',
        lastModified: stat.lastModified,
        lastAccessed: stat.lastAccessed,
        category: 'privacy',
        description: p.label,
        safeToDelete: true,
      });
    }
  }
}

REGISTER new IPC channels:
- BROWSER_SCAN → browserScanner.scanBrowsers(...)
"""

---

## PROMPT 3.3 — Cleaner UI (Scan + Results + Clean Flow)

"""
In the CleanSweep Electron project, build the complete Cleaner 
UI module. This is the most important user-facing feature.

CREATE src/renderer/stores/scanStore.ts (Zustand):

interface ScanStore {
  // Scan state
  status: 'idle' | 'scanning' | 'complete' | 'error';
  scanType: 'quick' | 'deep' | 'browser' | null;
  progress: ScanProgress | null;
  results: ScanResult[];
  errorMessage: string | null;
  
  // Selection state
  selectedItemIds: Set<string>;
  
  // Computed
  totalSelectedSize: number;
  totalFoundSize: number;
  
  // Actions
  startQuickScan: () => Promise<void>;
  startBrowserScan: () => Promise<void>;
  cancelScan: () => void;
  toggleItemSelection: (itemId: string) => void;
  toggleCategorySelection: (category: ScanCategory, selected: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  executeClean: (useQuarantine: boolean) => Promise<{
    freed: number;
    count: number;
    failed: number;
  }>;
  clearResults: () => void;
}

For startQuickScan:
1. Set status to 'scanning'
2. Subscribe to progress events
3. Call window.cleanSweepAPI.scanner.quickScan({})
4. On complete: set results, status = 'complete', auto-select all safe items
5. Cleanup progress subscription
6. On error: set status = 'error', errorMessage

For executeClean:
1. Get all selected items from results
2. Call window.cleanSweepAPI.cleaner.executeClean(items, useQuarantine)
3. Clear results, reset to idle

CREATE src/renderer/pages/Cleaner/CleanerHome.tsx:

This is the main cleaner page with THREE views based on scanStore.status:

VIEW 1: IDLE STATE (status === 'idle')
Layout: Centered content with:
- Large icon (Sparkles or Wand2 from lucide)
- Title: "Clean Your Mac/PC" (platform-aware)
- Subtitle: "Remove junk files, browser cache, and temporary files"
- Two main action cards side by side:
  Card 1: "Quick Clean"
    - Lightning icon
    - "Scan common junk locations"  
    - Estimated time: "~30 seconds"
    - Primary button: "Start Quick Scan"
  Card 2: "Browser Clean"
    - Globe icon
    - "Clear browser cache and history"
    - "Select which browsers to clean"
    - Secondary button: "Scan Browsers"
- Below cards: small text "All deletions go to quarantine first. 
  Nothing is permanently deleted without your review."

VIEW 2: SCANNING STATE (status === 'scanning')
Layout: 
- Large animated icon (spinning/pulsing Sparkles)
- Current scan type as title
- Current file path being scanned (truncated to 60 chars from right)
- Progress bar (use @radix-ui/react-progress)
- Percentage text
- "Files found: X" counter
- "Cancel" button (secondary, small)

VIEW 3: RESULTS STATE (status === 'complete')
Layout: Two-column:
LEFT COLUMN (40% width): Category list
- Each category as a card showing:
  - Category icon and label
  - Number of files
  - Total size (human readable)  
  - Checkbox to select/deselect whole category
  - Colored size bar showing proportion of total
- "Select All" / "Deselect All" buttons at top
- Summary at bottom: "X items selected, Y GB"

RIGHT COLUMN (60% width): File list for selected category
- Virtualized list (@tanstack/react-virtual)
- Each item: checkbox, filename, size, path (truncated)
- Sort by: size, name, date (tabs)
- Search/filter input

BOTTOM ACTION BAR (fixed bottom):
- Left: "X items selected • Y GB to free"
- Right: 
  - "Add to Whitelist" button (for selected items)
  - "Cancel" button (clear results)
  - "Move to Quarantine" PRIMARY button

INSTALL: @tanstack/react-virtual: ^3.0.0

After clean completes: Show a success toast/modal:
- Confetti-like animation or large checkmark
- "🎉 You freed X GB!"
- "X files cleaned"
- "Undo (restore from quarantine)" button
- "Done" button

CREATE src/renderer/components/shared/ProgressBar.tsx:
Custom animated progress bar component using @radix-ui/react-progress.

CREATE src/renderer/components/shared/FileListItem.tsx:
Reusable file list item with checkbox, icon (by file type), 
name, size, path.

CREATE src/renderer/components/shared/ScanCategoryCard.tsx:
Category summary card with checkbox, icon, label, count, size, 
size proportion bar.

CREATE src/renderer/components/shared/ConfirmDialog.tsx:
Reusable confirmation dialog using @radix-ui/react-dialog.
Props: title, description, confirmLabel, onConfirm, onCancel, danger?

CREATE src/renderer/components/shared/Toast.tsx:
Simple toast notification component.
Use a Zustand toastStore with: 
  addToast(message, type: 'success'|'error'|'info'), removeToast(id)
Render toasts in App.tsx overlay.
Auto-dismiss after 4 seconds.
"""

---

## ✅ PHASE 3 MANUAL TEST CHECKLIST
□ Quick scan starts and shows progress
□ Progress bar updates in real-time
□ Cancel button stops scan mid-way
□ Results show categories with sizes
□ Checkboxes work for individual items and categories
□ "Select All" / "Deselect All" works
□ File count and total size update as you check/uncheck
□ "Move to Quarantine" button triggers clean
□ After clean: success screen shows correct GB freed
□ Quarantine manager shows cleaned files
□ Restore from quarantine returns file to original location
□ Browser scan finds Chrome/Firefox cache
□ Whitelisted paths don't appear in results
□ No crash on paths that don't exist
□ No crash on permission-denied paths

text


---

---
# ═══════════════════════════════════════════════
# PHASE 4: DUPLICATE FINDER
# Goal: Working duplicate file detection with UI
# Estimated time: 3-4 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 4.1 — Duplicate Detection Engine

"""
In the CleanSweep Electron project, build the duplicate file 
finder engine using worker threads for performance.

INSTALL packages:
- No new packages needed (use built-in crypto and worker_threads)

CREATE src/main/workers/hashWorker.ts:
This runs in a Worker Thread. It receives a list of file paths 
and computes SHA-256 hashes for each.

import { workerData, parentPort, isMainThread } from 'worker_threads'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

interface WorkerInput {
  files: string[]
  algorithm: 'sha256' | 'md5'
}

async function run() {
  const { files, algorithm } = workerData as WorkerInput
  const results: Record<string, string> = {}
  
  for (const filePath of files) {
    try {
      const hash = crypto.createHash(algorithm)
      const stream = fs.createReadStream(filePath, { 
        highWaterMark: 64 * 1024 
      })
      
      for await (const chunk of stream) {
        hash.update(chunk as Buffer)
      }
      
      results[filePath] = hash.digest('hex')
      parentPort!.postMessage({ type: 'progress', file: filePath })
    } catch {
      results[filePath] = 'ERROR'
      parentPort!.postMessage({ type: 'error', file: filePath })
    }
  }
  
  parentPort!.postMessage({ type: 'complete', results })
}

run()

CREATE src/main/services/duplicates/DuplicateFinderService.ts:

import { Worker } from 'worker_threads'
import os from 'os'

export class DuplicateFinderService {
  private cancelled = false;

  async findDuplicates(
    scanPaths: string[],
    options: {
      minSizeBytes: number;
      includeHidden: boolean;
    },
    onProgress: (progress: ScanProgress) => void
  ): Promise<DuplicateGroup[]> {
    
    this.cancelled = false;

    // PHASE 1: Collect all files
    onProgress({ phase: 'indexing', percentage: 0, 
      filesScanned: 0, totalFound: 0, currentPath: 'Collecting files...' });
    
    const allFiles = await this.collectAllFiles(scanPaths, options);
    
    if (this.cancelled) return [];

    // PHASE 2: Group by size (eliminates 90%+ of candidates)
    onProgress({ phase: 'analyzing', percentage: 20, 
      filesScanned: allFiles.length, totalFound: 0, 
      currentPath: 'Grouping by size...' });
    
    const sizeGroups = this.groupBySize(allFiles);
    const candidates = Object.values(sizeGroups)
      .filter(group => group.length > 1)
      .flat();

    if (candidates.length === 0) return [];
    if (this.cancelled) return [];

    // PHASE 3: Hash only candidates
    onProgress({ phase: 'hashing', percentage: 30, 
      filesScanned: allFiles.length, totalFound: 0, 
      currentPath: `Hashing ${candidates.length} candidate files...` });

    const hashes = await this.hashFilesWithWorkers(
      candidates,
      (hashed, total) => {
        onProgress({
          phase: 'hashing',
          percentage: 30 + Math.round((hashed / total) * 65),
          filesScanned: hashed,
          totalFound: 0,
          currentPath: `Hashing file ${hashed} of ${total}...`,
        });
      }
    );

    if (this.cancelled) return [];

    // PHASE 4: Group by hash
    const hashGroups: Record<string, string[]> = {};
    for (const [filePath, hash] of Object.entries(hashes)) {
      if (hash === 'ERROR') continue;
      if (!hashGroups[hash]) hashGroups[hash] = [];
      hashGroups[hash].push(filePath);
    }

    // Build DuplicateGroup results
    const groups: DuplicateGroup[] = [];
    for (const [hash, files] of Object.entries(hashGroups)) {
      if (files.length < 2) continue;

      const fileItems = await Promise.all(files.map(async (f) => {
        const stat = await getFileStat(f);
        return {
          id: uuid(),
          path: f,
          size: stat?.size || 0,
          type: 'file' as const,
          lastModified: stat?.lastModified || 0,
          lastAccessed: stat?.lastAccessed || 0,
          category: 'duplicates' as ScanCategory,
          description: 'Duplicate file',
          safeToDelete: true,
        };
      }));

      const fileSize = fileItems[0]?.size || 0;
      groups.push({
        id: uuid(),
        hash,
        files: fileItems,
        wastedSpace: fileSize * (files.length - 1),
      });
    }

    onProgress({ phase: 'complete', percentage: 100, 
      filesScanned: allFiles.length, 
      totalFound: groups.length, currentPath: '' });

    // Sort by wasted space descending
    return groups.sort((a, b) => b.wastedSpace - a.wastedSpace);
  }

  cancel() { this.cancelled = true; }

  private async collectAllFiles(
    paths: string[], 
    options: { minSizeBytes: number; includeHidden: boolean }
  ): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const scanPath of paths) {
      const files = await globFiles('**/*', {
        cwd: scanPath,
        absolute: true,
        dot: options.includeHidden,
        onlyFiles: true,
      }).catch(() => []);
      
      allFiles.push(...files);
    }
    
    // Filter by minimum size
    const filtered: string[] = [];
    for (const f of allFiles) {
      const stat = await getFileStat(f);
      if (stat && stat.size >= options.minSizeBytes) {
        filtered.push(f);
      }
    }
    
    return filtered;
  }

  private groupBySize(files: string[]): Record<string, string[]> {
    // We need sizes, but we already filtered by size above
    // Group by file size using stat cache
    // Return Record<sizeString, filePaths[]>
    // Implementation: use a Map for grouping
  }

  private async hashFilesWithWorkers(
    files: string[],
    onProgress: (hashed: number, total: number) => void
  ): Promise<Record<string, string>> {
    
    // Split files into chunks for worker threads
    const cpuCount = Math.min(4, os.cpus().length);
    const chunkSize = Math.ceil(files.length / cpuCount);
    const chunks: string[][] = [];
    
    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }

    let totalHashed = 0;
    const results: Record<string, string> = {};

    await Promise.all(chunks.map(chunk => 
      new Promise<void>((resolve, reject) => {
        const workerPath = path.join(__dirname, '../workers/hashWorker.js');
        const worker = new Worker(workerPath, {
          workerData: { files: chunk, algorithm: 'sha256' }
        });

        worker.on('message', (msg) => {
          if (msg.type === 'progress') {
            totalHashed++;
            onProgress(totalHashed, files.length);
          }
          if (msg.type === 'complete') {
            Object.assign(results, msg.results);
            resolve();
          }
        });

        worker.on('error', reject);
      })
    ));

    return results;
  }
}

REGISTER in ipcHandlers.ts:
- FIND_DUPLICATES → duplicateFinderService.findDuplicates(...)
  (emit progress events via mainWindow.webContents.send)
- DELETE_DUPLICATES → use quarantineService to quarantine selected items
- CANCEL_SCAN handler also calls duplicateFinderService.cancel()
"""

---

## PROMPT 4.2 — Duplicate Finder UI

"""
In the CleanSweep Electron project, build the Duplicate Finder 
UI with scan controls, results display, and smart selection.

CREATE src/renderer/stores/duplicatesStore.ts (Zustand):

interface DuplicatesStore {
  status: 'idle' | 'scanning' | 'complete' | 'error';
  progress: ScanProgress | null;
  groups: DuplicateGroup[];
  selectedItemIds: Set<string>;
  scanPaths: string[];
  minSizeBytes: number;
  
  // Computed
  totalWastedSpace: number;
  totalSelectedSize: number;
  selectedGroupsCount: number;
  
  setScanPaths: (paths: string[]) => void;
  setMinSize: (bytes: number) => void;
  startScan: () => Promise<void>;
  cancelScan: () => void;
  
  // Selection helpers
  toggleItem: (itemId: string) => void;
  autoSelectKeepNewest: () => void;   // In each group, keep newest, select rest
  autoSelectKeepOldest: () => void;   // In each group, keep oldest, select rest
  autoSelectKeepLargerPath: () => void; // Keep the one in "better" location
  selectAll: () => void;
  deselectAll: () => void;
  
  deleteSelected: (useQuarantine: boolean) => Promise<void>;
}

For autoSelectKeepNewest:
- For each group, sort files by lastModified descending
- Mark all except first as selected
- Update selectedItemIds Set

CREATE src/renderer/pages/Duplicates/DuplicatesHome.tsx:

VIEW 1: IDLE
- Title: "Find Duplicate Files"
- Large icon (Copy)
- Description text
- SCAN CONFIGURATION section:
  * "Scan Location" — folder picker button 
    (use window.showOpenFilePicker or IPC call to open dialog)
    Show selected paths as chips with X to remove
    Default: ['~/Downloads', '~/Documents', '~/Desktop']
  * "Minimum file size" — dropdown: Any, 1 KB, 100 KB, 1 MB, 10 MB, 100 MB
  * "Include hidden files" toggle
- "Start Scan" primary button

IMPORTANT: Add folder picker IPC:
  In preload: expose dialog: { openFolder: () => invoke('cs:dialog:open-folder') }
  In ipcHandlers: 
    ipcMain.handle('cs:dialog:open-folder', () => 
      dialog.showOpenDialog({ properties: ['openDirectory'] })
    )

VIEW 2: SCANNING
- Similar to cleaner scan progress UI
- Show phase: "Collecting files..." / "Grouping by size..." / "Hashing files..."
- Animated progress bar
- "Cancel" button

VIEW 3: RESULTS
HEADER:
- "Found X duplicate groups • Y GB wasted space"
- Smart selection buttons row:
  * "Keep Newest" (auto-selects files to delete, keeping newest in each group)
  * "Keep Oldest"  
  * "Select All"
  * "Deselect All"

GROUPS LIST (virtualized):
Each DuplicateGroup card:
- Header: "X files • [filesize] each • [total wasted] wasted"
  with file type icon and hash (first 8 chars)
- Expandable: click to show/collapse files in group
- Each file row: 
  * Checkbox (checked = will be deleted)
  * File icon
  * Filename (bold)
  * Full path (muted, truncated)
  * Size
  * Last modified date
  * "KEEP" badge on the recommended keep item (auto-detected as newest)
- Default: expanded for first 10 groups, collapsed for rest

BOTTOM BAR:
- "X files selected for deletion • Y GB"
- "Delete Selected" button (shows confirm dialog)

CONFIRM DIALOG for deletion:
- "Delete X duplicate files?"
- "This will free Y GB"
- "Files will be moved to Quarantine for 7 days before permanent deletion"
- Checkbox: "I've reviewed my selection"
- "Delete" (danger) / "Cancel" buttons

After deletion: success screen with freed space.

CREATE src/renderer/pages/Duplicates/DuplicateGroupCard.tsx:
The individual group card component (collapsible).

INSTALL: Use a simple accordion implementation 
(no library needed, just useState for expanded state).
"""

---

## ✅ PHASE 4 MANUAL TEST CHECKLIST
□ Folder picker dialog opens correctly
□ Scan starts and shows multi-phase progress
□ Progress updates are smooth (not jumpy)
□ Cancel stops scan
□ Groups are correctly identified (test with known duplicate files)
□ "Keep Newest" correctly marks older files for deletion
□ All selection states work correctly
□ File preview in groups shows correct paths
□ Deletion moves to quarantine (not permanent delete)
□ Freed space number is accurate
□ UI handles 0 duplicates found gracefully
□ UI handles 1000+ groups without freezing (virtualization)
□ No crash when scanning paths that don't exist

text


---

---
# ═══════════════════════════════════════════════
# PHASE 5: FILE ORGANIZER & BULK RENAMER
# Goal: Rules engine, auto-sort, rename with preview
# Estimated time: 4-5 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 5.1 — Rules Engine & Organizer Service

"""
In the CleanSweep Electron project, build the file organization 
rules engine and file organizer service.

CREATE src/main/services/organizer/RulesEngine.ts:

export class RulesEngine {
  
  evaluate(
    fileInfo: FileInfo, 
    rules: OrganizerRule[]
  ): { rule: OrganizerRule; destination: string; newName: string | null } | null {
    
    // Sort rules by priority
    const sorted = [...rules]
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    for (const rule of sorted) {
      if (this.matchesRule(fileInfo, rule)) {
        return {
          rule,
          destination: this.resolveDestination(fileInfo, rule.destination),
          newName: rule.namingPattern 
            ? this.applyPattern(fileInfo, rule.namingPattern) 
            : null,
        };
      }
    }
    return null;
  }

  private matchesRule(fileInfo: FileInfo, rule: OrganizerRule): boolean {
    const results = rule.conditions.map(c => 
      this.evaluateCondition(fileInfo, c)
    );
    
    if (rule.logicOperator === 'AND') return results.every(Boolean);
    if (rule.logicOperator === 'OR') return results.some(Boolean);
    return false;
  }

  private evaluateCondition(
    fileInfo: FileInfo, 
    condition: RuleCondition
  ): boolean {
    const value = this.getFieldValue(fileInfo, condition.field);
    const condVal = condition.value.toLowerCase();
    const fieldVal = value.toLowerCase();

    switch (condition.operator) {
      case 'contains': return fieldVal.includes(condVal);
      case 'equals': return fieldVal === condVal;
      case 'startsWith': return fieldVal.startsWith(condVal);
      case 'endsWith': return fieldVal.endsWith(condVal);
      case 'greaterThan': return parseFloat(value) > parseFloat(condition.value);
      case 'lessThan': return parseFloat(value) < parseFloat(condition.value);
      case 'matches': {
        try {
          return new RegExp(condition.value, 'i').test(value);
        } catch { return false; }
      }
      default: return false;
    }
  }

  private getFieldValue(fileInfo: FileInfo, field: RuleConditionField): string {
    switch (field) {
      case 'name': return fileInfo.nameWithoutExt;
      case 'extension': return fileInfo.extension;
      case 'size': return fileInfo.size.toString();
      case 'created': return fileInfo.created.toString();
      case 'modified': return fileInfo.modified.toString();
      default: return '';
    }
  }

  private resolveDestination(fileInfo: FileInfo, template: string): string {
    const date = new Date(fileInfo.modified);
    return template
      .replace(/{year}/g, date.getFullYear().toString())
      .replace(/{month}/g, String(date.getMonth() + 1).padStart(2, '0'))
      .replace(/{day}/g, String(date.getDate()).padStart(2, '0'))
      .replace(/{ext}/g, fileInfo.extension.replace('.', ''))
      .replace(/{type}/g, this.getTypeCategory(fileInfo.extension))
      .replace(/{name}/g, fileInfo.nameWithoutExt);
  }

  applyPattern(fileInfo: FileInfo, pattern: string): string {
    const date = new Date(fileInfo.modified);
    let counter = 1; // Will be resolved by organizer service for conflicts
    return pattern
      .replace(/{name}/g, fileInfo.nameWithoutExt)
      .replace(/{ext}/g, fileInfo.extension)
      .replace(/{year}/g, date.getFullYear().toString())
      .replace(/{month}/g, String(date.getMonth() + 1).padStart(2, '0'))
      .replace(/{day}/g, String(date.getDate()).padStart(2, '0'))
      .replace(/{counter}/g, String(counter).padStart(3, '0'));
  }

  private getTypeCategory(ext: string): string {
    const categories: Record<string, string[]> = {
      'Images': ['.jpg','.jpeg','.png','.gif','.bmp','.svg','.webp','.heic'],
      'Videos': ['.mp4','.avi','.mov','.mkv','.wmv','.flv','.webm'],
      'Audio': ['.mp3','.wav','.flac','.aac','.ogg','.m4a'],
      'Documents': ['.pdf','.doc','.docx','.txt','.rtf','.odt'],
      'Spreadsheets': ['.xls','.xlsx','.csv','.ods'],
      'Presentations': ['.ppt','.pptx','.odp'],
      'Archives': ['.zip','.rar','.7z','.tar','.gz'],
      'Code': ['.js','.ts','.py','.java','.cpp','.html','.css'],
    };
    for (const [cat, exts] of Object.entries(categories)) {
      if (exts.includes(ext.toLowerCase())) return cat;
    }
    return 'Other';
  }
}

// FileInfo interface (internal to organizer)
interface FileInfo {
  path: string;
  name: string;
  nameWithoutExt: string;
  extension: string;
  size: number;
  created: number;
  modified: number;
}

CREATE src/main/services/organizer/FileOrganizerService.ts:

export class FileOrganizerService {
  
  constructor(private rulesEngine: RulesEngine) {}

  async previewOrganize(
    sourcePath: string,
    rules: OrganizerRule[],
    conflictStrategy: 'skip' | 'rename' | 'overwrite'
  ): Promise<OrganizePreviewItem[]> {
    
    const files = await globFiles('*', {
      cwd: sourcePath,
      absolute: true,
      onlyFiles: true,
      dot: false,
    }).catch(() => []);

    const preview: OrganizePreviewItem[] = [];

    for (const filePath of files) {
      const fileInfo = await this.buildFileInfo(filePath);
      if (!fileInfo) continue;

      const match = this.rulesEngine.evaluate(fileInfo, rules);
      
      if (match) {
        const destDir = path.isAbsolute(match.destination) 
          ? match.destination 
          : path.join(sourcePath, match.destination);
        
        const finalName = match.newName 
          ? match.newName + fileInfo.extension
          : fileInfo.name;
        
        const destPath = path.join(destDir, finalName);
        
        preview.push({
          id: uuid(),
          sourcePath: filePath,
          destinationPath: destPath,
          action: match.rule.action,
          ruleName: match.rule.name,
          willOverwrite: await this.fileExists(destPath),
        });
      } else {
        preview.push({
          id: uuid(),
          sourcePath: filePath,
          destinationPath: null,
          action: 'skip',
          ruleName: null,
          willOverwrite: false,
        });
      }
    }

    return preview;
  }

  async executeOrganize(
    previewItems: OrganizePreviewItem[],
    conflictStrategy: 'skip' | 'rename' | 'overwrite'
  ): Promise<{ succeeded: number; failed: number; skipped: number }> {
    
    let succeeded = 0, failed = 0, skipped = 0;

    for (const item of previewItems) {
      if (!item.destinationPath || item.action === 'skip') {
        skipped++;
        continue;
      }

      try {
        // Handle conflicts
        let destPath = item.destinationPath;
        if (await this.fileExists(destPath)) {
          if (conflictStrategy === 'skip') { skipped++; continue; }
          if (conflictStrategy === 'rename') {
            destPath = await this.findNonConflictingPath(destPath);
          }
          // 'overwrite' falls through
        }

        await ensureDir(path.dirname(destPath));

        if (item.action === 'move') {
          await moveFile(item.sourcePath, destPath);
        } else if (item.action === 'copy') {
          await copyFile(item.sourcePath, destPath);
        }
        
        succeeded++;
      } catch (error) {
        logger.error('FileOrganizer', `Failed: ${item.sourcePath}`, error);
        failed++;
      }
    }

    return { succeeded, failed, skipped };
  }

  private async buildFileInfo(filePath: string): Promise<FileInfo | null> {
    const stat = await getFileStat(filePath);
    if (!stat) return null;
    const name = path.basename(filePath);
    const ext = path.extname(name);
    return {
      path: filePath,
      name,
      nameWithoutExt: path.basename(name, ext),
      extension: ext,
      size: stat.size,
      created: stat.lastModified, // use modified as proxy
      modified: stat.lastModified,
    };
  }

  private async findNonConflictingPath(filePath: string): Promise<string> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    let counter = 1;
    let candidate = filePath;
    
    while (await this.fileExists(candidate)) {
      candidate = path.join(dir, `${base} (${counter})${ext}`);
      counter++;
    }
    return candidate;
  }

  private async fileExists(p: string): Promise<boolean> {
    return isPathAccessible(p);
  }
}

interface OrganizePreviewItem {
  id: string;
  sourcePath: string;
  destinationPath: string | null;
  action: RuleAction | 'skip';
  ruleName: string | null;
  willOverwrite: boolean;
}

Add OrganizePreviewItem to src/shared/types.ts.

CREATE src/main/services/organizer/BulkRenamerService.ts:

export class BulkRenamerService {
  
  previewRename(
    filePaths: string[],
    pattern: RenamePattern
  ): RenamePreviewItem[] {
    return filePaths.map((filePath, index) => {
      const newName = this.applyPattern(filePath, pattern, index + 1);
      return {
        id: uuid(),
        originalPath: filePath,
        originalName: path.basename(filePath),
        newName,
        newPath: path.join(path.dirname(filePath), newName),
        hasConflict: false, // Will check in executeRename
      };
    });
  }

  applyPattern(
    filePath: string, 
    pattern: RenamePattern, 
    counter: number
  ): string {
    const name = path.basename(filePath);
    const ext = path.extname(name);
    const nameWithoutExt = path.basename(name, ext);
    const stat = fs.statSync(filePath);
    const date = new Date(stat.mtime);

    let newName = nameWithoutExt;

    // Apply operations in order
    if (pattern.replaceText) {
      newName = newName.replaceAll(
        pattern.replaceText, 
        pattern.replaceWith || ''
      );
    }
    if (pattern.addPrefix) newName = pattern.addPrefix + newName;
    if (pattern.addSuffix) newName = newName + pattern.addSuffix;
    if (pattern.caseChange === 'upper') newName = newName.toUpperCase();
    if (pattern.caseChange === 'lower') newName = newName.toLowerCase();
    if (pattern.caseChange === 'title') {
      newName = newName.replace(/\b\w/g, c => c.toUpperCase());
    }
    if (pattern.numberSequentially) {
      const pad = String(counter).padStart(pattern.numberPadding || 3, '0');
      newName = pattern.numberPosition === 'prefix' 
        ? `${pad}_${newName}` 
        : `${newName}_${pad}`;
    }
    if (pattern.template) {
      newName = pattern.template
        .replace('{name}', nameWithoutExt)
        .replace('{year}', date.getFullYear().toString())
        .replace('{month}', String(date.getMonth()+1).padStart(2,'0'))
        .replace('{day}', String(date.getDate()).padStart(2,'0'))
        .replace('{counter}', String(counter).padStart(3,'0'));
    }

    return newName + (pattern.changeExtension || ext);
  }

  async executeRename(
    items: RenamePreviewItem[]
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0, failed = 0;
    
    for (const item of items) {
      try {
        await fs.promises.rename(item.originalPath, item.newPath);
        succeeded++;
      } catch {
        failed++;
      }
    }
    
    return { succeeded, failed };
  }
}

interface RenamePattern {
  replaceText?: string;
  replaceWith?: string;
  addPrefix?: string;
  addSuffix?: string;
  caseChange?: 'upper' | 'lower' | 'title' | 'none';
  numberSequentially?: boolean;
  numberPadding?: number;
  numberPosition?: 'prefix' | 'suffix';
  template?: string;
  changeExtension?: string;
}

interface RenamePreviewItem {
  id: string;
  originalPath: string;
  originalName: string;
  newName: string;
  newPath: string;
  hasConflict: boolean;
}

Add RenamePattern, RenamePreviewItem to shared/types.ts.

REGISTER in ipcHandlers.ts:
- PREVIEW_ORGANIZE → fileOrganizerService.previewOrganize(...)
- EXECUTE_ORGANIZE → fileOrganizerService.executeOrganize(...)
- GET_RULES → configService.getRules()
- SAVE_RULES → configService.saveRules(rules)
- RENAME_PREVIEW → bulkRenamerService.previewRename(...)
- RENAME_EXECUTE → bulkRenamerService.executeRename(...)
"""

---

## PROMPT 5.2 — Organizer UI (Rules Builder + Preview + Renamer)

"""
In the CleanSweep Electron project, build the File Organizer UI.

CREATE src/renderer/stores/organizerStore.ts (Zustand):

interface OrganizerStore {
  rules: OrganizerRule[];
  sourcePath: string | null;
  previewItems: OrganizePreviewItem[];
  status: 'idle' | 'previewing' | 'executing' | 'complete';
  result: { succeeded: number; failed: number; skipped: number } | null;
  
  loadRules: () => Promise<void>;
  saveRules: (rules: OrganizerRule[]) => Promise<void>;
  addRule: (rule: OrganizerRule) => void;
  updateRule: (id: string, updates: Partial<OrganizerRule>) => void;
  deleteRule: (id: string) => void;
  reorderRules: (fromIndex: number, toIndex: number) => void;
  setSourcePath: (path: string) => void;
  runPreview: () => Promise<void>;
  executeOrganize: () => Promise<void>;
}

CREATE src/renderer/pages/Organizer/OrganizerHome.tsx:

THREE TABS:
1. "Auto Organizer" tab
2. "Bulk Renamer" tab  
3. "Watch Folders" tab (placeholder for Phase 6)

TAB 1: AUTO ORGANIZER
Split layout:
LEFT PANEL (Rules List, 45%):
- Header: "Organization Rules" + "Add Rule" button
- List of OrganizerRule cards, each showing:
  * Drag handle (visual only in v1)
  * Toggle enable/disable switch
  * Rule name
  * Conditions summary (e.g., "extension equals .jpg")
  * Action + destination (e.g., "→ Move to ~/Pictures/{year}")
  * Edit button, Delete button (with confirm)
- Empty state: "No rules yet. Add your first rule."
- PRESET RULES section below: 
  Clickable preset cards to add common rules:
  * "Sort by File Type" (moves images, videos, docs to folders)
  * "Sort Downloads by Date" (YYYY/MM structure)
  * "Archive Old Files" (files older than 1 year → Archive/)
  * "Organize Screenshots" (files with 'Screenshot' in name → Screenshots/)
  Each preset: click to add to rules list

RIGHT PANEL (Run Organizer, 55%):
- "Source Folder" picker (folder input with browse button)
- "Conflict Strategy" dropdown: Skip / Rename / Overwrite
- "Preview" button (shows what will happen)
- PREVIEW RESULTS (shown after Preview clicked):
  * Table with columns: Original Path | Action | New Path | Rule Applied
  * Color coded: green=move, blue=copy, gray=skip
  * "Will overwrite" warning badge on conflicting items
  * Count summary: "X files will be moved, Y skipped"
  * "Execute" button (only enabled if preview has results)

RULE EDITOR MODAL (opens when "Add Rule" or "Edit" clicked):
Full modal with:
- "Rule Name" text input
- CONDITIONS section:
  * List of conditions, each with:
    - Field dropdown: Name / Extension / Size / Date Modified
    - Operator dropdown: contains / equals / starts with / ends with / 
      greater than / less than / matches regex
    - Value input (text or number)
    - Remove button
  * "Add Condition" button
  * "Match ALL conditions (AND)" / "Match ANY condition (OR)" toggle
- ACTION section:
  * Action dropdown: Move / Copy / Rename / Delete
  * Destination path input (with browse button + variable helper)
  * Variable chips below input: click to insert {year}, {month}, 
    {type}, {ext}, {name}
  * Naming pattern input (optional, shown when Rename selected)
- "Save Rule" / "Cancel" buttons

TAB 2: BULK RENAMER
Layout:
TOP: File picker section
- Drop zone: "Drop files here or click to select"
  (support multiple file selection)
- Show selected files list (up to 20 visible, scrollable)
- "Clear" button

MIDDLE: Rename Operations (applied in order):
Card for each operation type (user can enable/disable):
1. Find & Replace: [find input] → [replace input]
2. Add Prefix: [prefix input]
3. Add Suffix: [suffix input]  
4. Change Case: radio buttons (UPPER / lower / Title / None)
5. Number Files: [start from: 001] [position: prefix/suffix]
6. Use Template: [template input] with variable helper chips
7. Change Extension: [new extension input]

RIGHT SIDE or BELOW: PREVIEW TABLE
Two columns: "Original Name" | "New Name"
Updated live as user changes options.
Green background on new name if valid, red if conflict detected.
Show file icons based on extension.

BOTTOM: 
- "X files will be renamed"
- "Rename All" button
- After rename: show result summary

CREATE src/renderer/components/organizer/RuleEditorModal.tsx
CREATE src/renderer/components/organizer/ConditionRow.tsx
CREATE src/renderer/components/organizer/PreviewTable.tsx
CREATE src/renderer/components/organizer/RenameOperations.tsx
"""

---

## ✅ PHASE 5 MANUAL TEST CHECKLIST
□ Default preset rules appear in the list
□ "Add Rule" opens the rule editor modal
□ Can add multiple conditions with AND/OR logic
□ Rule variables like {year} {month} work in destinations
□ Preview shows correct file movements
□ Execute actually moves files to correct locations
□ Conflict handling (skip/rename/overwrite) works correctly
□ Bulk renamer: drag and drop files works
□ Live preview updates as you type
□ Sequential numbering works (001, 002...)
□ Case change works correctly
□ Renamed files have correct names on disk
□ Empty file list handled gracefully
□ Rules saved to disk and reload on restart

text


---

---
# ═══════════════════════════════════════════════
# PHASE 6: DISK ANALYZER + APPS + WATCH FOLDERS
# Goal: Visual disk map, app manager, real-time watcher
# Estimated time: 3-4 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 6.1 — Disk Analyzer Service & UI

"""
In the CleanSweep Electron project, build the disk space 
analyzer with a visual treemap.

INSTALL packages:
- recharts: ^2.10.3 (for bar/pie charts)
- D3 for treemap: d3: ^7.8.5, @types/d3: ^7.4.3

CREATE src/main/services/disk/DiskAnalyzerService.ts:

export class DiskAnalyzerService {

  async analyzePath(
    dirPath: string,
    maxDepth: number = 3,
    onProgress: (scanned: number) => void
  ): Promise<DiskNode> {
    return this.buildTree(dirPath, 0, maxDepth, onProgress);
  }

  private async buildTree(
    dirPath: string,
    depth: number,
    maxDepth: number,
    onProgress: (n: number) => void
  ): Promise<DiskNode> {
    
    const stat = await getFileStat(dirPath);
    const name = path.basename(dirPath) || dirPath;

    if (!stat?.isDirectory || depth >= maxDepth) {
      return {
        name,
        path: dirPath,
        size: stat?.size || 0,
        type: 'file',
        extension: path.extname(dirPath),
      };
    }

    let entries: string[] = [];
    try {
      entries = await fs.promises.readdir(dirPath)
        .then(names => names.map(n => path.join(dirPath, n)));
    } catch { 
      return { name, path: dirPath, size: 0, type: 'directory' };
    }

    const children: DiskNode[] = [];
    let totalSize = 0;

    for (const entry of entries) {
      if (this.shouldSkip(entry)) continue;
      const child = await this.buildTree(
        entry, depth + 1, maxDepth, onProgress
      );
      totalSize += child.size;
      children.push(child);
      onProgress(children.length);
    }

    // Sort children by size descending
    children.sort((a, b) => b.size - a.size);

    return {
      name,
      path: dirPath,
      size: totalSize,
      type: 'directory',
      children: children.slice(0, 100), // Max 100 children per node
    };
  }

  private shouldSkip(filePath: string): boolean {
    const skipPatterns = [
      '/proc/', '/sys/', '/dev/', 
      'C:\\Windows\\WinSxS',
      'node_modules',
      '.git',
    ];
    return skipPatterns.some(p => filePath.includes(p));
  }

  async findLargeFiles(
    dirPath: string, 
    minSizeBytes: number
  ): Promise<ScannedItem[]> {
    const files = await globFiles('**/*', {
      cwd: dirPath,
      absolute: true,
      onlyFiles: true,
      dot: true,
    }).catch(() => []);

    const results: ScannedItem[] = [];
    
    for (const f of files) {
      const stat = await getFileStat(f);
      if (stat && stat.size >= minSizeBytes) {
        results.push({
          id: uuid(),
          path: f,
          size: stat.size,
          type: 'file',
          lastModified: stat.lastModified,
          lastAccessed: stat.lastAccessed,
          category: 'large-files',
          description: `Large file (${formatBytes(stat.size)})`,
          safeToDelete: false,
        });
      }
    }

    return results.sort((a, b) => b.size - a.size).slice(0, 1000);
  }

  async findEmptyFolders(dirPath: string): Promise<string[]> {
    const emptyFolders: string[] = [];
    const dirs = await globFiles('**/', {
      cwd: dirPath,
      absolute: true,
      onlyDirectories: true,
    }).catch(() => []);

    for (const dir of dirs) {
      const entries = await listDirectory(dir);
      if (entries.length === 0) {
        emptyFolders.push(dir);
      }
    }
    return emptyFolders;
  }

  async findOldFiles(
    dirPath: string,
    olderThanDays: number
  ): Promise<ScannedItem[]> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const files = await globFiles('**/*', {
      cwd: dirPath,
      absolute: true,
      onlyFiles: true,
    }).catch(() => []);

    const results: ScannedItem[] = [];
    for (const f of files) {
      const stat = await getFileStat(f);
      if (stat && stat.lastAccessed < cutoffTime) {
        results.push({
          id: uuid(),
          path: f,
          size: stat.size,
          type: 'file',
          lastModified: stat.lastModified,
          lastAccessed: stat.lastAccessed,
          category: 'old-files',
          description: `Not accessed in ${olderThanDays}+ days`,
          safeToDelete: false,
        });
      }
    }
    return results.sort((a, b) => a.lastAccessed - b.lastAccessed);
  }
}

REGISTER in ipcHandlers.ts:
- ANALYZE_DISK → diskAnalyzerService.analyzePath(...) 
  (send progress via IPC events)
- FIND_LARGE_FILES → diskAnalyzerService.findLargeFiles(...)
- FIND_EMPTY_FOLDERS → diskAnalyzerService.findEmptyFolders(...)
- FIND_OLD_FILES → diskAnalyzerService.findOldFiles(...)

CREATE src/renderer/pages/Disk/DiskAnalyzer.tsx:

FOUR TABS: "Disk Map" | "Large Files" | "Old Files" | "Empty Folders"

TAB 1: DISK MAP
TOP: Drive selector (show all drives as clickable chips with 
  used/total and usage bar)
  Select drive → analyze it

CENTER: TreeMap visualization
Use D3 treemap layout:
- Import d3-hierarchy for treemap
- Color code by file type (images=green, videos=blue, docs=yellow, etc.)
- Each rectangle labeled with folder/file name + size
- Click rectangle to drill down into that folder
- Show breadcrumb navigation: Drive > Folder > Subfolder
- Hover tooltip: name, size, percentage of parent
- Back button to navigate up

BELOW TREEMAP: Stats row
- Total size, Used space, Free space as colored segments

TAB 2: LARGE FILES
- Size threshold filter: > 100MB / > 500MB / > 1GB / Custom
- Folder picker (which folder to scan)
- "Scan" button
- Results: table with columns: Type icon | Name | Size | Location | Date
- Sort by size (default), name, date
- Action buttons: "Open Location" | "Delete" (→ quarantine)

TAB 3: OLD FILES
- "Not accessed in" dropdown: 6 months / 1 year / 2 years / Custom
- Folder picker
- "Scan" button
- Results: same table format as Large Files
- Show "Last accessed" date prominently

TAB 4: EMPTY FOLDERS
- Folder picker
- "Find Empty Folders" button
- Results: list of folder paths
- Checkboxes to select
- "Delete Selected" button

CREATE src/renderer/components/disk/TreeMap.tsx:
D3 treemap React component:
- Props: data: DiskNode, width: number, height: number, 
  onNodeClick: (node: DiskNode) => void
- Use d3.treemap() with squarify tiling
- Color scheme: by file type using a color scale
- Text labels: show name + size, hide if too small
- Animated transitions when drilling down
- Responsive (observe parent width changes)
"""

---

## PROMPT 6.2 — App Manager & Watch Folders

"""
In the CleanSweep Electron project, build the App Manager 
(list + uninstall) and Watch Folders feature.

INSTALL: chokidar: ^3.5.3

CREATE src/main/services/apps/AppManagerService.ts:

export class AppManagerService {

  async listApps(): Promise<AppInfo[]> {
    if (process.platform === 'darwin') {
      return this.getMacApps();
    }
    return this.getWindowsApps();
  }

  private async getMacApps(): Promise<AppInfo[]> {
    const appDirs = ['/Applications', 
      path.join(os.homedir(), 'Applications')];
    const apps: AppInfo[] = [];

    for (const dir of appDirs) {
      const entries = await listDirectory(dir);
      for (const entry of entries.filter(e => e.endsWith('.app'))) {
        try {
          const plistPath = path.join(entry, 'Contents', 'Info.plist');
          // Read plist file manually (parse XML)
          const plistContent = await fs.promises
            .readFile(plistPath, 'utf-8')
            .catch(() => null);
          
          const name = plistContent 
            ? this.extractPlistValue(plistContent, 'CFBundleName') 
            : path.basename(entry, '.app');
          const version = plistContent
            ? this.extractPlistValue(plistContent, 'CFBundleShortVersionString')
            : 'Unknown';
          const bundleId = plistContent
            ? this.extractPlistValue(plistContent, 'CFBundleIdentifier')
            : undefined;
          
          const size = await getDirectorySize(entry);
          
          apps.push({
            id: uuid(),
            name: name || path.basename(entry, '.app'),
            path: entry,
            size,
            version: version || 'Unknown',
            bundleId,
          });
        } catch {
          // Skip apps we can't read
        }
      }
    }

    return apps.sort((a, b) => b.size - a.size);
  }

  private extractPlistValue(plist: string, key: string): string | undefined {
    // Simple plist XML parser for key-string pairs
    const regex = new RegExp(
      `<key>${key}<\\/key>\\s*<string>([^<]+)<\\/string>`
    );
    return plist.match(regex)?.[1];
  }

  private async getWindowsApps(): Promise<AppInfo[]> {
    // Use PowerShell to query registry
    const { execSync } = require('child_process');
    try {
      const output = execSync(`powershell -command "
        Get-ItemProperty 
        'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
        'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' |
        Where-Object { $_.DisplayName } |
        Select-Object DisplayName, DisplayVersion, InstallLocation, Publisher |
        ConvertTo-Json -Compress
      "`, { encoding: 'utf-8', timeout: 10000 });
      
      const parsed = JSON.parse(output);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      
      return list
        .filter(a => a.DisplayName)
        .map(a => ({
          id: uuid(),
          name: a.DisplayName,
          path: a.InstallLocation || '',
          size: 0, // Size calculation is expensive on Windows
          version: a.DisplayVersion || 'Unknown',
          publisher: a.Publisher,
        }));
    } catch {
      return [];
    }
  }

  async uninstallApp(appInfo: AppInfo): Promise<void> {
    if (process.platform === 'darwin') {
      // Move .app to trash
      await shell.trashItem(appInfo.path);
      // Also find and offer to delete app support files
    } else {
      // On Windows, run the uninstaller
      // This is complex - for v1 just open Add/Remove Programs
      shell.openPath('ms-settings:appsfeatures');
    }
  }
}

CREATE src/main/services/apps/StartupManagerService.ts:

export class StartupManagerService {

  async getStartupItems(): Promise<StartupItem[]> {
    if (process.platform === 'darwin') {
      return this.getMacStartupItems();
    }
    return this.getWindowsStartupItems();
  }

  private async getMacStartupItems(): Promise<StartupItem[]> {
    const launchAgentsPath = path.join(
      os.homedir(), 'Library', 'LaunchAgents'
    );
    const items: StartupItem[] = [];
    const files = await listDirectory(launchAgentsPath);
    
    for (const file of files.filter(f => f.endsWith('.plist'))) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const label = this.extractPlistValue(content, 'Label') 
          || path.basename(file, '.plist');
        const program = this.extractPlistValue(content, 'Program');
        
        items.push({
          id: uuid(),
          name: label,
          path: program || file,
          enabled: !content.includes('<key>Disabled</key>'),
          type: 'LaunchAgent',
          impact: 'low',
        });
      } catch {}
    }
    return items;
  }

  private async getWindowsStartupItems(): Promise<StartupItem[]> {
    const { execSync } = require('child_process');
    try {
      const output = execSync(`powershell -command "
        Get-CimInstance Win32_StartupCommand |
        Select-Object Name, Command, Location |
        ConvertTo-Json -Compress
      "`, { encoding: 'utf-8', timeout: 5000 });
      
      const list = JSON.parse(output);
      const arr = Array.isArray(list) ? list : [list];
      
      return arr.map(item => ({
        id: uuid(),
        name: item.Name,
        path: item.Command,
        enabled: true,
        type: item.Location,
        impact: 'medium' as const,
      }));
    } catch {
      return [];
    }
  }

  async toggleStartupItem(
    item: StartupItem, 
    enabled: boolean
  ): Promise<void> {
    // macOS: Complex plist editing - for v1 open System Preferences
    // Windows: Use registry or Task Scheduler APIs
    // For v1, open system settings and show instructions
    if (process.platform === 'darwin') {
      shell.openExternal(
        'x-apple.systempreferences:com.apple.LoginItems-Settings.extension'
      );
    } else {
      shell.openPath('ms-settings:startupapps');
    }
  }
}

CREATE src/main/services/organizer/FolderWatcherService.ts:
import chokidar from 'chokidar'

export class FolderWatcherService {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private watchFolders: WatchFolder[] = [];
  private rulesEngine: RulesEngine;
  private fileOrganizerService: FileOrganizerService;
  private mainWindow: BrowserWindow | null = null;

  constructor(rulesEngine: RulesEngine, organizer: FileOrganizerService) {
    this.rulesEngine = rulesEngine;
    this.fileOrganizerService = organizer;
  }

  setMainWindow(win: BrowserWindow) { this.mainWindow = win; }

  async addWatchFolder(folder: WatchFolder): Promise<void> {
    this.watchFolders.push(folder);
    await this.startWatcher(folder);
  }

  async removeWatchFolder(id: string): Promise<void> {
    const folder = this.watchFolders.find(f => f.id === id);
    if (folder) {
      const watcher = this.watchers.get(folder.sourcePath);
      if (watcher) {
        await watcher.close();
        this.watchers.delete(folder.sourcePath);
      }
    }
    this.watchFolders = this.watchFolders.filter(f => f.id !== id);
  }

  private async startWatcher(folder: WatchFolder): Promise<void> {
    if (!folder.enabled) return;

    const watcher = chokidar.watch(folder.sourcePath, {
      ignoreInitial: true,
      depth: 0,  // Only watch top level
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
    });

    watcher.on('add', async (filePath) => {
      await this.handleNewFile(filePath, folder);
    });

    this.watchers.set(folder.sourcePath, watcher);
  }

  private async handleNewFile(
    filePath: string, 
    watchFolder: WatchFolder
  ): Promise<void> {
    // Get rules for this watch folder
    // Evaluate against new file
    // If match: execute organize
    // Emit activity event to renderer

    this.mainWindow?.webContents.send('cs:watcher:activity', {
      file: filePath,
      watchFolder: watchFolder.sourcePath,
      action: 'detected',
      timestamp: Date.now(),
    });

    // ... evaluate and organize
  }

  listWatchFolders(): WatchFolder[] {
    return this.watchFolders;
  }
}

CREATE src/renderer/pages/Apps/AppsHome.tsx:

TWO TABS: "Installed Apps" | "Startup Items"

TAB 1: INSTALLED APPS
- Loading state while fetching apps
- Search bar (filter by name)
- Sort: by Size (default) / Name / Install Date
- Grid or list of app cards, each showing:
  * App icon (show generic icon if not available)
  * App name
  * Size (human readable, shown prominently)
  * Version
  * Size bar (visual proportion of all apps)
- Pagination or virtual scroll (apps list can be 100+)
- Click app → shows detail panel on right:
  * Full path
  * Version
  * "Open App" button
  * "Uninstall" button (red, with confirm dialog)

TAB 2: STARTUP ITEMS
- List of startup items with:
  * Name
  * Type (LoginItem / LaunchAgent / Registry)
  * Path
  * Impact badge (Low/Medium/High) colored
  * Enable/Disable toggle
- Info banner: "Changes may require restart to take effect"

ALSO UPDATE src/renderer/pages/Organizer/OrganizerHome.tsx TAB 3:
Watch Folders:
- List of watch folders currently active
- "Add Watch Folder" button → picks folder + assigns rule
- Each watch folder card: 
  * Source path
  * Status: Active/Inactive indicator (green/gray dot)
  * Rules assigned count
  * Toggle enable/disable
  * Delete button
- Recent activity log: 
  * Shows last 20 files processed by watchers
  * "filename.jpg was moved to Photos/2025/03"
"""

---

## ✅ PHASE 6 MANUAL TEST CHECKLIST
□ Disk analyzer shows drives correctly
□ TreeMap renders with colored rectangles
□ Click to drill down into folders works
□ Breadcrumb navigation works
□ Large files scan returns actual large files
□ Empty folders found correctly
□ Old files filter by access date works
□ Apps list loads and shows sizes
□ App search filter works
□ Startup items load without crashing
□ Watch folder: add folder with rules
□ Watch folder: drop a file → file gets moved
□ Watch folder activity shows in UI
□ Disable watch folder stops watching

text


---

---
# ═══════════════════════════════════════════════
# PHASE 7: DASHBOARD + SCHEDULER + SETTINGS + QUARANTINE UI
# Goal: Complete all remaining UI pages
# Estimated time: 3-4 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 7.1 — Dashboard

"""
In the CleanSweep Electron project, build the Dashboard page 
— the home screen users see on launch.

CREATE src/renderer/pages/Dashboard/Dashboard.tsx:

LAYOUT: Grid layout (2 columns on wider screens, 1 on narrow)

TOP ROW: Full width — "Health Score" card
- Large circular progress indicator (0-100)
- Score is calculated:
  * 100 base score
  * -10 if last scan was > 7 days ago
  * -15 if > 1 GB of junk detected in last scan
  * -10 if > 10 duplicate groups found
  * -5 if quarantine > 1GB
  * -5 if > 5 startup items enabled
- Color: green (80-100), yellow (50-79), red (0-49)
- Below score: "Your Mac/PC is in good shape" or "Needs attention"
- "Run Quick Scan" button if score < 70

SECOND ROW: 3 cards side by side

CARD 1: "Total Space Freed"
- All-time total from history entries
- Large number: "47.3 GB"
- Subtitle: "Since you started using CleanSweep"
- Small chart: bar chart of last 7 days (daily cleaned amount)

CARD 2: "Disk Usage" 
- For each drive: Drive name + donut chart (used vs free)
- Show used GB and total
- Warning color if > 85% full

CARD 3: "Last Scan"
- Date and time of last scan
- "Never" if no scan yet
- Items found and size
- "Scan Now" button

THIRD ROW: 2 cards

CARD 4: "Quick Actions"
- Grid of 6 action buttons:
  * "Quick Clean" (→ navigates to Cleaner, starts scan)
  * "Find Duplicates" (→ navigates to Duplicates)
  * "Organize Files" (→ navigates to Organizer)
  * "Analyze Disk" (→ navigates to Disk)
  * "Clean Browser" (→ Cleaner browser tab)
  * "Empty Quarantine" (→ calls purge)
- Each as a card with icon + label

CARD 5: "Recent Activity"
- List of last 10 history entries
- Each: icon + action type + size freed + date
- "View all" link → goes to... (show in a modal or settings)

BOTTOM: System stats bar (always visible at bottom of dashboard)
- RAM: used / total as mini bar
- CPU: percentage
- Storage: for each drive, mini bar
- These update every 5 seconds via polling

LOAD DATA on mount:
- Fetch scan history from IPC
- Fetch disk usage from IPC
- Calculate health score
- Poll system stats every 5s (cleanup on unmount)
"""

---

## PROMPT 7.2 — Scheduler, Settings & Quarantine UI

"""
In the CleanSweep Electron project, build the remaining 
UI pages: Scheduler, Settings, and Quarantine Manager.

CREATE src/main/services/scheduler/SchedulerService.ts:

import nodeCron from 'node-cron'
INSTALL: node-cron: ^3.0.3, @types/node-cron: ^3.0.11

export class SchedulerService {
  private jobs: Map<string, nodeCron.ScheduledTask> = new Map();
  private tasks: ScheduleTask[] = [];

  constructor(
    private scannerService: ScannerService,
    private configService: ConfigService,
    private mainWindow: () => BrowserWindow | null
  ) {}

  async loadAndStartAll(): Promise<void> {
    this.tasks = await this.configService.getSchedules();
    for (const task of this.tasks.filter(t => t.enabled)) {
      this.startJob(task);
    }
  }

  private startJob(task: ScheduleTask): void {
    const cronExpression = this.taskToCron(task);
    if (!nodeCron.validate(cronExpression)) return;

    const job = nodeCron.schedule(cronExpression, async () => {
      await this.runTask(task);
    });

    this.jobs.set(task.id, job);
  }

  private taskToCron(task: ScheduleTask): string {
    const [hours, minutes] = task.time.split(':').map(Number);
    
    switch (task.frequency) {
      case 'daily': 
        return `${minutes} ${hours} * * *`;
      case 'weekly': 
        return `${minutes} ${hours} * * ${task.dayOfWeek || 0}`;
      case 'monthly': 
        return `${minutes} ${hours} ${task.dayOfMonth || 1} * *`;
      default: 
        return `${minutes} ${hours} * * *`;
    }
  }

  private async runTask(task: ScheduleTask): Promise<void> {
    logger.info('Scheduler', `Running scheduled task: ${task.name}`);
    
    try {
      if (task.taskType === 'quick-clean') {
        const whitelist = await this.configService.getWhitelist();
        await this.scannerService.quickScan(
          {},
          () => {}, // silent progress
          whitelist
        );
      }
      
      // Update lastRun
      task.lastRun = Date.now();
      await this.configService.saveSchedules(this.tasks);
      
      // Notify renderer
      this.mainWindow()?.webContents.send(
        'cs:scheduler:task-complete', 
        { taskId: task.id, taskName: task.name }
      );
    } catch (error) {
      logger.error('Scheduler', `Task failed: ${task.name}`, error);
    }
  }

  async createTask(task: ScheduleTask): Promise<void> {
    this.tasks.push(task);
    await this.configService.saveSchedules(this.tasks);
    if (task.enabled) this.startJob(task);
  }

  async deleteTask(id: string): Promise<void> {
    this.jobs.get(id)?.stop();
    this.jobs.delete(id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    await this.configService.saveSchedules(this.tasks);
  }

  async toggleTask(id: string, enabled: boolean): Promise<void> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.enabled = enabled;
    
    if (enabled) { this.startJob(task); }
    else { this.jobs.get(id)?.stop(); this.jobs.delete(id); }
    
    await this.configService.saveSchedules(this.tasks);
  }

  getTasks(): ScheduleTask[] { return this.tasks; }
}

Register Scheduler IPC handlers.
Call schedulerService.loadAndStartAll() in main process after app ready.

CREATE src/renderer/pages/Scheduler/SchedulerHome.tsx:

HEADER: Pro badge + "Automated Cleaning Schedules"
Subtitle: "Set up automatic cleaning to run in the background"

TASKS LIST:
Each ScheduleTask as a card:
- Toggle (enable/disable)
- Task name (editable inline? or via modal)
- Frequency badge: "Daily" / "Weekly" / "Monthly"
- Time: "3:00 AM"
- Task type: "Quick Clean" / "Deep Clean"
- Last run: date or "Never"
- Next run: calculated date
- Delete button (X)

"+ Add Schedule" button → opens CREATE SCHEDULE MODAL:
- Task name input
- Task type: Quick Clean / Organize Downloads
- Frequency: Daily / Weekly / Monthly
- Time picker (hour:minute dropdowns)
- Day of week (if weekly): Mon-Sun buttons
- Day of month (if monthly): number input
- Preview: "Will run every Monday at 3:00 AM"
- Save button

Empty state: "No schedules yet. Set up automatic cleaning."

PRO GATE: Show blur overlay with "Upgrade to Pro" if not pro user.
For now, just show it ungated (assume pro for development).

CREATE src/renderer/pages/Settings/SettingsHome.tsx:

SETTINGS with sections in a left nav + right content layout:

SECTION: General
- Theme: Light / Dark / System (radio buttons or segmented control)
- Launch at startup: toggle
- Minimize to tray on close: toggle
- Show desktop notifications: toggle
- Language: dropdown (just "English" for now)
- Low disk space alert: input + "GB" label

SECTION: Scanning
- Include hidden files: toggle
- Include system files: toggle (with warning)
- Minimum file size to report: slider (0 to 100MB)
- Custom scan paths: list with add/remove
- Excluded file extensions: tag input (.tmp, .log, etc.)

SECTION: Cleaning & Safety  
- Use quarantine (safe delete): toggle (STRONGLY recommended on)
- Quarantine retention: slider 1-30 days with label
- Maximum quarantine size: input + "GB"
- Show confirmation before cleaning: toggle (always on, can't disable?)

SECTION: Whitelist / Exclusions
- List of whitelisted paths
- "Add Path" button → folder picker
- Each entry: path + "Remove" button
- Explanation text: "These files and folders will never be touched"

SECTION: Browser Cleaning
- Per-browser settings table:
  Columns: Browser name | Enabled | Cache | Cookies | History | Passwords
  Rows: Chrome, Firefox, Safari (macOS), Edge, Brave
  All as toggles

SECTION: About
- App logo + CleanSweep name
- Version: 1.0.0
- "Check for Updates" button
- Credits
- Open source licenses (placeholder)
- "Export Logs" button (opens userData/logs in file explorer)

CREATE src/renderer/pages/Quarantine/QuarantineHome.tsx:

HEADER: "Quarantine — Safe Recovery"
Stats row: "X files • Y GB • Oldest: [date]"

TOOLBAR:
- "Restore All" button
- "Empty Quarantine" button (red, with confirm)
- Days filter: "All" / "Last 7 days" / "Last 30 days"

LIST of QuarantineEntry items (virtualized):
Each entry row:
- Checkbox
- File type icon
- Original filename (bold)
- Original location (muted, truncated, with tooltip for full path)
- Size
- Date deleted
- Expires in X days (or "Expired" in red)
- "Restore" button (icon button)

Footer: "Files are permanently deleted after [7] days"

Bulk actions bar (appears when items checked):
- "Restore Selected" | "Delete Selected" buttons

EMPTY STATE: 
- Shield icon
- "Quarantine is empty"
- "Files you clean will appear here for 7 days before permanent deletion"
"""

---

## ✅ PHASE 7 MANUAL TEST CHECKLIST
□ Dashboard health score calculates correctly
□ Health score changes after running a scan
□ Disk usage cards show all drives
□ Quick action buttons navigate correctly
□ Recent activity shows history entries
□ System stats update every 5 seconds
□ Scheduler: create daily, weekly, monthly schedules
□ Scheduler: enable/disable toggle works
□ Scheduled task actually runs at correct time (test with 1 min)
□ Settings: theme change applies immediately
□ Settings: whitelist persists after restart
□ Settings: browser toggles persist
□ Quarantine: all items listed correctly
□ Quarantine: restore returns file to original location
□ Quarantine: "Empty Quarantine" with confirm works
□ Quarantine: expired items visually marked

text


---

---
# ═══════════════════════════════════════════════
# PHASE 8: POLISH, PERFORMANCE & PACKAGING
# Goal: Production-ready app with zero rough edges
# Estimated time: 2-3 hours of agent work
# ═══════════════════════════════════════════════

## PROMPT 8.1 — UI Polish & UX Improvements

"""
In the CleanSweep Electron project, add UI polish and UX 
improvements across the entire app.

1. LOADING STATES
Add skeleton loading screens for every page that fetches data.
Create src/renderer/components/ui/Skeleton.tsx:
- Animated pulse skeleton component
- Variants: line, card, circle
- Usage: show while IPC calls are pending

Add skeletons to:
- Dashboard while stats load
- Apps list while loading
- Duplicate results while scanning
- Any list that takes > 200ms to populate

2. EMPTY STATES
Create src/renderer/components/ui/EmptyState.tsx:
Props: icon, title, description, actionLabel?, onAction?
Apply to ALL lists/results that could be empty:
- Scan results: "No junk found! Your system is clean."
- Duplicates: "No duplicates found in selected folders."
- Apps: "No apps found."
- Quarantine: "Quarantine is empty."
- History: "No cleaning history yet."
- Watch folders: "No watch folders configured."

3. ERROR STATES
Create src/renderer/components/ui/ErrorState.tsx:
Props: title, description, onRetry?
Apply to all IPC failures with retry button.

4. TRANSITIONS & ANIMATIONS
Add smooth page transitions using CSS animations:
- Pages slide in from right on navigate forward
- Fade transition when switching tabs
- Smooth number counting animation on Dashboard stats
  (numbers count up from 0 to final value)
- Progress bars animate smoothly

Create src/renderer/styles/animations.css:
@keyframes fadeIn, slideIn, pulse, countUp definitions

5. PLATFORM-AWARE TEXT
Create src/renderer/hooks/usePlatform.ts:
Returns { isMac, isWindows, platformName }
Use throughout app:
- "Your Mac" vs "Your PC"
- "Finder" vs "Explorer"  
- "Trash" vs "Recycle Bin"
- "Command" vs "Ctrl"
- Keyboard shortcut display

6. KEYBOARD SHORTCUTS
Add app-level keyboard shortcuts:
In main process, register globalShortcuts:
- Cmd/Ctrl+1 → Dashboard
- Cmd/Ctrl+2 → Cleaner
- Cmd/Ctrl+3 → Duplicates
- Cmd/Ctrl+4 → Organizer
- Cmd/Ctrl+R → Refresh/Re-scan
- Cmd/Ctrl+, → Settings
- Escape → Cancel current scan

Show shortcuts in sidebar tooltips (on hover).

7. SYSTEM TRAY
CREATE src/main/trayManager.ts:
- Show app icon in system tray (macOS menu bar / Windows taskbar)
- Tray menu:
  * "Open CleanSweep" (show window)
  * Separator
  * "Quick Scan" (run scan silently)
  * "Last cleaned: [date]"
  * Separator
  * "Quit"
- On macOS: show in menu bar
- On Windows: show in system notification area
- Use Electron Tray API
- Show badge/indicator when scheduled scan runs

8. NATIVE NOTIFICATIONS
In main process, use Electron Notification API:
Notify when:
- Scheduled scan completes: "Quick Clean complete. Freed X GB."
- Low disk space (check every hour, alert once per day)
- Watch folder moves a file: "[file] organized to [folder]"
Only send if notifications enabled in settings.

9. WINDOW TITLE
Update window title dynamically:
"CleanSweep — Dashboard"
"CleanSweep — Scanning..."
"CleanSweep — 2.4 GB found"
etc.
Send from renderer via IPC: 'cs:window:set-title'

10. CONTEXT MENUS
Add right-click context menus on file lists:
- "Open File Location" (shell.showItemInFolder)
- "Copy Path"
- "Add to Whitelist"
- "Delete File" (quarantine)
Use Electron's Menu.buildFromTemplate and menu.popup()
Expose via IPC: 'cs:menu:show-file-context'

11. DRAG AND DROP
On Duplicate Finder and Bulk Renamer: 
Accept files dropped onto the window.
Listen to ondragover / ondrop in renderer.
Extract file paths from event.dataTransfer.files.
"""

---

## PROMPT 8.2 — Performance Optimizations

"""
In the CleanSweep Electron project, add performance optimizations
to ensure the app runs smoothly even on large file systems.

1. VIRTUAL SCROLLING
Install: @tanstack/react-virtual: ^3.0.4

Apply useVirtualizer to ALL lists that could exceed 100 items:
- Scan results file list in CleanerHome
- Duplicate groups list in DuplicatesHome
- Files within each duplicate group
- Large files list in DiskAnalyzer
- Apps list in AppsHome
- Quarantine list

2. SCAN RESULT PAGINATION
For scan results with > 10,000 items per category:
Only render first 500 initially.
"Load more" button or automatic infinite scroll using 
IntersectionObserver.

3. DEBOUNCED SEARCH
All search/filter inputs: debounce by 300ms before filtering.
Use custom useDebounce hook:
src/renderer/hooks/useDebounce.ts

4. MEMOIZATION
Wrap heavy computed values in useMemo:
- Total size calculations in scan store
- File grouping by category
- Formatted sizes (don't recalculate on every render)

Use React.memo on:
- FileListItem component
- ScanCategoryCard component  
- DuplicateGroupCard component
- AppCard component

5. IPC CACHING
In renderer, cache IPC responses with a simple TTL:
CREATE src/renderer/utils/ipcCache.ts:
- Cache getConfig() result for 5 seconds
- Cache getSystemStats() result for 5 seconds (polling handles this)
- Cache listApps() result for 60 seconds
- Cache getHistory() result for 30 seconds
- Invalidate cache on relevant mutations

6. WORKER THREAD CANCELLATION
Ensure worker threads can be properly cancelled:
When cancel is called:
1. Set cancelled flag in service
2. Terminate active workers with worker.terminate()
3. Clean up any partial results
Make sure there are no memory leaks after cancellation.

7. MEMORY MANAGEMENT
- Clear scan results from store when navigating away from Cleaner
  (after 10 minutes of inactivity)
- Limit history entries loaded in memory to 100 
  (load full history on demand)
- DiskNode trees: only keep current drill-down path in memory,
  discard other branches

8. STARTUP PERFORMANCE  
Lazy load heavy pages:
In router.tsx, use React.lazy() for:
- DiskAnalyzer (D3 is heavy)
- AppsHome (slow to initialize)
- DuplicatesHome

Add React.Suspense with loading fallback.

Defer non-critical init in main process:
- FolderWatcherService: start after 3 second delay
- SchedulerService: start after 5 second delay
- Let UI appear immediately

9. PROGRESS THROTTLING
Scan progress events can fire very rapidly (100+ per second).
In main process, throttle progress events:
Only send progress IPC event every 100ms maximum.
Track last sent time and skip events within 100ms window.

10. LARGE DIRECTORY HANDLING
In DiskAnalyzerService: 
If a directory has > 1000 children, only process top 200 by size.
Show "And X more items" in the UI.

In DuplicateFinderService:
If candidate files > 50,000, warn user and ask to narrow scope.
"""

---

## PROMPT 8.3 — Packaging & Distribution

"""
In the CleanSweep Electron project, set up production packaging
for both macOS and Windows.

1. ELECTRON-BUILDER CONFIGURATION
CREATE electron-builder.json in project root:

{
  "appId": "com.cleansweep.app",
  "productName": "CleanSweep",
  "copyright": "Copyright © 2025 CleanSweep",
  "directories": {
    "output": "release",
    "buildResources": "assets"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  "extraResources": [],
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ],
    "category": "public.app-category.utilities",
    "darkModeSupport": true,
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "assets/entitlements.mac.plist",
    "entitlementsInherit": "assets/entitlements.mac.plist",
    "icon": "assets/icons/icon.icns",
    "minimumSystemVersion": "12.0"
  },
  "dmg": {
    "title": "CleanSweep",
    "icon": "assets/icons/icon.icns",
    "background": "assets/dmg-background.png",
    "window": { "width": 540, "height": 380 },
    "contents": [
      { "x": 140, "y": 200, "type": "file" },
      { "x": 400, "y": 200, "type": "link", "path": "/Applications" }
    ]
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "assets/icons/icon.ico",
    "requestedExecutionLevel": "asInvoker"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "CleanSweep",
    "uninstallDisplayName": "CleanSweep",
    "installerIcon": "assets/icons/icon.ico",
    "uninstallerIcon": "assets/icons/icon.ico"
  },
  "publish": null,
  "asar": true,
  "compression": "maximum"
}

2. CREATE MACOS ENTITLEMENTS
CREATE assets/entitlements.mac.plist:
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.files.user-selected.read-write</key><true/>
  <key>com.apple.security.files.downloads.read-write</key><true/>
  <key>com.apple.security.temporary-exception.files.absolute-path.read-write</key>
  <array>
    <string>/private/tmp/</string>
    <string>/var/folders/</string>
  </array>
</dict>
</plist>

3. AUTO-UPDATER SETUP
The app uses GitHub Releases for updates (no update server needed).

UPDATE src/main/autoUpdater.ts:
import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'

export function initAutoUpdater(mainWindow: BrowserWindow) {
  // Don't check in development
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('cs:update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('cs:update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('cs:update:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('cs:update:progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('cs:update:downloaded');
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('cs:update:error', err.message);
  });

  ipcMain.on('cs:update:start-download', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on('cs:update:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Check for updates on start, then every 4 hours
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 4 * 60 * 60 * 1000);
}

4. UPDATE NOTIFICATION UI
CREATE src/renderer/components/ui/UpdateBanner.tsx:
Shows at top of app when update is available:
- "CleanSweep v1.1.0 is available"
- "Download" button → starts download
- Shows download progress bar
- "Restart to Install" button when downloaded
- Dismiss (X) button
Subscribe to update IPC events in App.tsx and show this banner.

5. PRODUCTION ENVIRONMENT HANDLING
In src/main/index.ts:

Add proper NODE_ENV handling:
- In dev: load Vite dev server URL
- In prod: load dist/index.html
- Set app.setAppUserModelId in Windows ('com.cleansweep.app')
- Set proper protocol handler for deep links (future use)
- Handle second instance (single instance lock):
  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) { app.quit(); return; }
  app.on('second-instance', () => { mainWindow.show(); })

6. BUILD SCRIPTS
Update package.json scripts:
"build:mac": "npm run build && electron-builder --mac --universal",
"build:win": "npm run build && electron-builder --win",
"build:all": "npm run build && electron-builder -mw",
"dist:mac": "CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac",
"dist:win": "npm run build:win"

7. ICON ASSETS
Create instructions file assets/ICONS_NEEDED.md describing:
- Required: icon.png (1024x1024, PNG with transparency)
- macOS: icon.icns (generated from icon.png using iconutil)
- Windows: icon.ico (multi-size: 16,32,48,64,128,256)
- DMG background: dmg-background.png (540x380)
- Tray icon: tray-icon.png (22x22 macOS, 16x16 Windows)

For development, create placeholder 1024x1024 blue square icon.

8. GITHUB ACTIONS WORKFLOW (optional but useful)
CREATE .github/workflows/build.yml:
Workflow that:
- Triggers on git tag push (v*)
- Builds on macOS runner for .dmg
- Builds on Windows runner for .exe
- Creates GitHub Release with artifacts
- Uses secrets: MAC_SIGNING_CERT, WIN_SIGNING_CERT

9. FIRST RUN EXPERIENCE
CREATE src/renderer/pages/Welcome/WelcomePage.tsx:
Show on first launch (check config.version === undefined or 'new'):
- Step 1: Welcome screen with CleanSweep logo + tagline
- Step 2: macOS: "Grant Full Disk Access" instructions with 
  screenshot and "Open System Preferences" button
  Windows: "CleanSweep is ready to use" (no extra permissions needed)
- Step 3: Choose quick setup:
  * "Set up Watch Folder on Downloads" checkbox
  * "Schedule weekly auto-clean" checkbox
  * "Start with system" checkbox
- Step 4: Run first quick scan or "Skip for now"
- Complete → update config to mark welcome as seen

Check in App.tsx on load whether to show WelcomePage or MainLayout.
"""

---

## ✅ PHASE 8 FINAL TEST CHECKLIST
□ App launches in < 3 seconds
□ All skeleton loaders show while loading
□ All empty states have icons and helpful text
□ All error states have retry buttons
□ Page navigation transitions are smooth
□ System tray icon appears
□ Tray menu "Quick Scan" works without opening window
□ Keyboard shortcuts work (Cmd/Ctrl+1 through 4)
□ Right-click context menu on file items works
□ "Open File Location" opens Finder/Explorer correctly
□ Drag and drop files onto Duplicate Finder works
□ Virtual scrolling: 10,000 item list scrolls smoothly
□ No memory leaks: scan 3 times, memory should not grow unboundedly
□ Progress events don't flood the IPC (throttled)
□ npm run build:mac produces .dmg file
□ npm run build:win produces .exe installer
□ .dmg installs cleanly on macOS
□ .exe installs cleanly on Windows
□ Auto-updater update banner shows in Settings > About
□ Welcome screen shows on first launch
□ macOS permission instructions are clear
□ Single instance: second launch focuses existing window
□ No console errors in production build
□ Dark mode looks correct on both platforms

text


---

---
# 🛠️ DEBUGGING PROMPTS
# Use these when the agent breaks something
# ═══════════════════════════════════════════════

## DEBUG PROMPT A — IPC Not Working

"""
In the CleanSweep project, debug the IPC communication issue.

Check these things in order and fix any issues found:

1. In src/main/preload.ts:
   - Is contextBridge.exposeInMainWorld called with 'cleanSweepAPI'?
   - Is ipcRenderer imported from 'electron'?
   - Are all channels using the exact strings from IPC_CHANNELS?

2. In src/main/index.ts:
   - Is the preload path correctly pointing to the compiled preload.js?
   - Is contextIsolation: true set?
   - Is nodeIntegration: false set?

3. In src/main/ipcHandlers.ts:
   - Is registerAllHandlers(mainWindow) called after app.whenReady()?
   - Is each handler using ipcMain.handle (not ipcMain.on) for 
     request-response patterns?

4. In src/renderer/types/electron.d.ts:
   - Is window.cleanSweepAPI properly typed?

5. Test by adding this to Dashboard temporarily:
   useEffect(() => {
     window.cleanSweepAPI.config.getConfig()
       .then(r => console.log('IPC works:', r))
       .catch(e => console.error('IPC failed:', e))
   }, [])

Fix any issues found and verify the test log appears.
"""

---

## DEBUG PROMPT B — Build Failures

"""
In the CleanSweep project, fix the build configuration issues.

Common issues to check and fix:

1. VITE CONFIG:
   - Does vite.config.ts have electron plugin configured for both 
     main and renderer?
   - Is the renderer output going to 'dist/'?
   - Is the main process output going to 'dist-electron/'?

2. TSCONFIG:
   - tsconfig.main.json should have: 
     "module": "commonjs", "outDir": "dist-electron", 
     "include": ["src/main/**/*", "src/shared/**/*"]
   - tsconfig.renderer.json should have:
     "module": "esnext", "jsx": "react-jsx"
   - tsconfig.json (root) extends tsconfig.renderer.json

3. SHARED IMPORTS:
   - Can main process import from 'src/shared/'? 
     (Path alias must be set in tsconfig.main.json)
   - Can renderer process import from 'src/shared/'?
     (Path alias must be set in vite.config.ts)
   - Add path alias: '@shared' → 'src/shared'

4. ELECTRON-BUILDER:
   - Are 'files' patterns correct in electron-builder.json?
   - Does it include both dist/ and dist-electron/?

Run: npm run build
Fix any TypeScript errors shown.
Run: npm run package:mac (or package:win)
Fix any packaging errors.
"""

---

## DEBUG PROMPT C — Scanner Returns Empty Results

"""
In the CleanSweep project, the scanner is returning 0 results.
Debug and fix the issue.

1. Add debug logging to ScannerService.quickScan():
   - Log each location path AFTER expansion (expanded path)
   - Log whether each path is accessible
   - Log file count found in each location

2. Check PlatformService.expandPath():
   - Test: expandPath('~/Library/Caches') should return 
     '/Users/[username]/Library/Caches' on macOS
   - Test: expandPath('%TEMP%') should return actual temp path on Windows

3. Check file permissions:
   - On macOS, the app needs Full Disk Access for some locations
   - The scanner should gracefully skip inaccessible paths (not crash)
   - Ensure try/catch wraps ALL fs operations

4. Check fast-glob usage:
   - Add a direct test: 
     const files = await glob('**/*', { cwd: '/tmp', absolute: true })
   - If glob returns [], check if cwd path exists

5. Check whitelist:
   - Log the whitelist contents
   - Ensure whitelist filtering isn't accidentally filtering everything

6. Add a test scan location that ALWAYS has files:
   - On macOS: /private/tmp always exists
   - On Windows: %TEMP% always exists
   - If even these return 0, the issue is in globFiles()

Fix the root cause and ensure scanner finds at least some files.
"""

---

## DEBUG PROMPT D — Performance Issues (Slow/Freezing)

"""
In the CleanSweep project, the UI is freezing during scans.
Fix the performance issues.

PROBLEM: Heavy operations running on main thread blocking IPC.

1. Check if file system operations are truly async:
   - All fs operations must use fs.promises (not sync versions)
   - fs.readdirSync → fs.promises.readdir
   - fs.statSync → fs.promises.stat
   - fs.readFileSync → fs.promises.readFile
   Search the codebase and fix ALL sync fs calls in services.

2. Check Worker Thread usage:
   - SHA-256 hashing MUST be in a worker thread (not main thread)
   - If worker thread isn't being used, fall back to processing 
     in batches of 100 files with setImmediate() between batches

3. Add IPC progress throttling if not already there:
   In ScannerService, add:
     let lastProgressTime = 0;
     const THROTTLE_MS = 100;
     const sendProgress = (progress) => {
       const now = Date.now();
       if (now - lastProgressTime >= THROTTLE_MS) {
         lastProgressTime = now;
         onProgress(progress);
       }
     };
   Use sendProgress instead of onProgress directly.

4. Check React rendering:
   - Scan results store update should use 'set' with a new array
   - Ensure FileListItem is wrapped in React.memo
   - Ensure useVirtualizer is used for lists > 100 items
   - Check DevTools Profiler for expensive re-renders

5. Check for event listener leaks:
   - Every ipcRenderer.on() in preload must have cleanup
   - Every chokidar watcher must be closed when watch folder removed

Fix all found issues and verify UI stays responsive during scanning.
"""

---

## 📌 QUICK REFERENCE

### Order of Prompts (Don't Skip Any):
Phase 1: 1.1 → 1.2 → 1.3 → 1.4
Phase 2: 2.1 → 2.2
Phase 3: 3.1 → 3.2 → 3.3
Phase 4: 4.1 → 4.2
Phase 5: 5.1 → 5.2
Phase 6: 6.1 → 6.2
Phase 7: 7.1 → 7.2
Phase 8: 8.1 → 8.2 → 8.3

### Total: 19 Feature Prompts + 4 Debug Prompts

### Estimated Total Development Time:
- With a fast coding agent: ~20-30 hours
- With human review + testing between prompts: ~2-3 weeks

### After Each Prompt:
1. Run the app: npm run dev
2. Check console for errors
3. Complete the manual test checklist for that phase
4. Fix any issues with debug prompts if needed
5. Then move to next prompt

### Files Never to Modify Manually After Creation:
- src/shared/ipcChannels.ts (source of truth for all IPC)
- src/shared/types.ts (source of truth for all types)
- The above two files are imported by BOTH main and renderer

### Platform Testing Priority:
- Develop primarily on your target OS
- Test the other OS before each phase completion
- Pay special attention to path separators (/ vs \)
  and path expansion (~ vs %USERPROFILE%)



so i am planning to vibecode it by codingagents so i want you to give me whatever number of prompt which i will give to coding agent . like divide the app in several phases and under those phases give prompts of that phase . like divide the project into phases according to the capabilities of todays model can handle and really ship with very less bugs and issues and in most less amount of time . make a Prompts.md file on this


claude-sonnet-4-6
Research: Features of Cleaner + File Sorting Apps
Let me analyze apps like CCleaner, CleanMyMac, DaisyDisk, dupeGuru, FileJuggler, Hazel, and similar tools to compile a comprehensive feature list.

📋 PRD.md — Product Requirements Document
Markdown

# PRD.md — CleanSweep: Cross-Platform Cleaner & File Organizer
## Product Requirements Document
### Version: 1.0.0 | Status: Draft | Date: 2025

---

## 1. EXECUTIVE SUMMARY

**Product Name:** CleanSweep  
**Tagline:** "Clean Smart. Stay Organized."  
**Type:** Desktop Application (macOS + Windows)  
**Distribution:** Direct download (.dmg for macOS, .exe installer for Windows)  
**Codebase:** Single cross-platform codebase (Electron + React + Node.js)  
**Data Storage:** 100% Local — no cloud, no database, no telemetry  
**License Model:** Freemium (Free tier + one-time Pro purchase)

---

## 2. PROBLEM STATEMENT

Modern users accumulate gigabytes of junk files, duplicate documents, 
disorganized downloads, and system clutter without realizing it. Existing 
solutions are either:
- Too expensive (CleanMyMac at $39.95/year)
- Too complex for average users
- macOS-only or Windows-only
- Require accounts, subscriptions, or cloud connectivity
- Invasive with telemetry and data collection

**CleanSweep** solves this by providing a powerful, privacy-first, 
cross-platform cleaning and organization tool that users install once 
and own forever.

---

## 3. TARGET USERS

### Primary Personas

#### Persona 1: "The Overwhelmed Professional"
- Age: 28–45
- Downloads folder with 3,000+ files
- Laptop running slow, storage almost full
- Doesn't know where their storage went
- Wants one-click solutions

#### Persona 2: "The Privacy-Conscious Power User"
- Age: 22–35
- Refuses cloud-based or subscription tools
- Wants granular control over what gets deleted
- Uses both Mac and Windows machines

#### Persona 3: "The Non-Technical Home User"
- Age: 45–65
- Inherited a cluttered PC
- Needs simple UI with clear explanations
- Afraid of accidentally deleting important files

---

## 4. GOALS & SUCCESS METRICS

| Goal | Metric | Target |
|------|--------|--------|
| Storage Recovery | Avg GB freed per scan | > 5 GB |
| User Satisfaction | App Store / review rating | ≥ 4.5/5 |
| Scan Speed | Time for full system scan | < 60 seconds |
| Safety | Files incorrectly deleted | 0 |
| Adoption | DAU retention at 30 days | > 40% |
| Performance | App RAM usage (idle) | < 150 MB |

---

## 5. FEATURE REQUIREMENTS

### 5.1 MODULE 1 — SYSTEM CLEANER

#### F-001: Quick Scan
- **Priority:** P0 (Must Have)
- **Description:** One-click scan of common junk locations
- **Locations scanned:**
  - Temp files (%TEMP%, /tmp, ~/Library/Caches)
  - Browser caches (Chrome, Firefox, Safari, Edge, Brave, Opera)
  - System logs
  - Crash reports
  - Recent files lists
  - Recycle Bin / Trash
- **Output:** Visual breakdown of space found by category
- **Action:** User selects categories → clicks Clean

#### F-002: Deep Scan
- **Priority:** P1 (Should Have)
- **Description:** Thorough scan of entire user-selected drives
- **Includes:** Everything in Quick Scan + orphaned files, 
  old downloads, large files analysis
- **Time estimate:** Shown before scan begins

#### F-003: Browser Cleaner
- **Priority:** P0 (Must Have)
- **Supported Browsers:** Chrome, Firefox, Safari (macOS), 
  Edge, Brave, Opera, Vivaldi
- **Cleans:**
  - Cache
  - Cookies (with whitelist option)
  - Browsing history
  - Download history
  - Saved form data
  - Session data
  - Saved passwords (optional, OFF by default)
- **Per-browser toggle:** User can enable/disable per browser

#### F-004: System Junk Cleaner
- **Priority:** P0
- **macOS specific:**
  - ~/Library/Caches
  - ~/Library/Logs
  - ~/Library/Application Support (orphaned app data)
  - Language files (remove unused localizations)
  - iOS device backups (old ones)
  - XCode derived data
  - Broken login items
- **Windows specific:**
  - %TEMP% and C:\Windows\Temp
  - Windows Update cache (WinSxS cleanup)
  - Prefetch files
  - DNS cache
  - Event logs
  - Thumbnail cache
  - Windows Error Reporting files
  - Delivery optimization files

#### F-005: Application Cleaner / Uninstaller
- **Priority:** P1
- **Description:** List all installed applications with size
- **Features:**
  - Sort by size, name, last used, install date
  - Uninstall app + all leftover files (registry entries on Windows, 
    plist/app support files on macOS)
  - Batch uninstall
  - Flag apps not used in X days

#### F-006: Startup Manager
- **Priority:** P1
- **Description:** View and manage startup programs
- **Windows:** Registry + Task Scheduler + Startup folder entries
- **macOS:** Login Items + LaunchAgents + LaunchDaemons
- **Actions:** Enable, Disable, Remove, View file path
- **Impact indicator:** Shows CPU/RAM impact level (Low/Medium/High)

#### F-007: Memory (RAM) Optimizer
- **Priority:** P2 (Nice to Have)
- **Description:** Display current RAM usage, free up inactive memory
- **macOS:** Uses memory pressure APIs
- **Windows:** Empty working sets
- **Note:** Show warning that this is a temporary fix

#### F-008: Disk Usage Analyzer (Disk Map)
- **Priority:** P1
- **Description:** Visual treemap/sunburst chart of disk usage
- **Features:**
  - Drill down into folders
  - Right-click to open in Finder/Explorer or delete
  - Color-coded by file type
  - Show largest files and folders

#### F-009: Privacy Cleaner
- **Priority:** P1
- **Cleans:**
  - Recent documents list (per app and system-wide)
  - Clipboard history
  - WiFi networks list
  - Windows thumbnail cache
  - macOS Quick Look cache
  - Shell/terminal history (bash, zsh, PowerShell)
  - macOS Spotlight search history
  - Windows Search index cache
  - Trash / Recycle Bin

---

### 5.2 MODULE 2 — DUPLICATE FINDER

#### F-010: Duplicate File Finder
- **Priority:** P0
- **Detection methods:**
  - Exact match (byte-by-byte / MD5+SHA hash)
  - Name-based similarity
  - Content similarity (for documents)
- **File types:** All file types
- **Filters:** By file type, size range, date range, folder scope
- **Smart selection:**
  - Auto-select keeping newest
  - Auto-select keeping oldest
  - Auto-select keeping copy in preferred folder
- **Preview:** Preview images, documents before deleting
- **Actions:** Delete, Move to folder, Skip

#### F-011: Duplicate Photo Finder
- **Priority:** P1
- **Uses:** Perceptual hashing (pHash) for visually similar photos
- **Detects:**
  - Exact duplicates
  - Resized versions
  - Screenshot duplicates
  - JPEG compression variants
- **Preview:** Side-by-side comparison
- **Metadata view:** Show resolution, file size, date taken

#### F-012: Similar Video Finder
- **Priority:** P2
- **Method:** Frame sampling + perceptual hash comparison
- **Preview:** Thumbnail comparison

---

### 5.3 MODULE 3 — FILE ORGANIZER

#### F-013: Smart File Organizer (Auto-Sort)
- **Priority:** P0
- **Description:** Automatically move/copy files into organized 
  folder structures based on rules
- **Default rule sets:**
  - By file type (Images → Images/, Videos → Videos/, etc.)
  - By date (YYYY/MM/DD structure)
  - By file extension
  - By keywords in filename
  - By file size
- **Custom rules:**
  - User-defined conditions (IF filename contains X AND size > Y)
  - User-defined destination folders
  - User-defined folder naming patterns
- **Modes:**
  - Preview mode (show what WILL happen before doing it)
  - Auto-sort on schedule
  - Watch folder mode (continuously monitor a folder)
- **Actions:** Move, Copy, Rename, Delete

#### F-014: Bulk File Renamer
- **Priority:** P1
- **Features:**
  - Rename by pattern/template
  - Add prefix / suffix
  - Replace text in filenames
  - Number sequentially (001, 002...)
  - Case conversion (UPPER, lower, Title Case)
  - Use metadata (date, EXIF data for photos)
  - Live preview of new names before applying
  - Undo last rename operation

#### F-015: Folder Template Creator
- **Priority:** P2
- **Description:** Create folder structure templates 
  (e.g., "Client Project Template") and apply them anywhere
- **Format:** Save/load templates as JSON

#### F-016: Empty Folder Finder & Remover
- **Priority:** P1
- **Description:** Scan for and remove empty folders
- **Options:** Preview list before deletion

#### F-017: Large File Finder
- **Priority:** P1
- **Description:** Find files above a user-defined size threshold
- **Sort by:** Size, date, type
- **Actions:** Open location, Delete, Move

#### F-018: Old File Finder
- **Priority:** P2
- **Description:** Find files not accessed in X days/months/years
- **Configurable threshold**
- **Actions:** Review list, archive, delete

#### F-019: File Type Analyzer
- **Priority:** P2
- **Description:** Show breakdown of what types of files are 
  consuming the most space
- **Visualization:** Pie chart / bar chart

---

### 5.4 MODULE 4 — SCHEDULER & AUTOMATION

#### F-020: Scheduled Cleaning
- **Priority:** P1
- **Description:** Schedule automatic cleaning runs
- **Frequency options:** Daily, Weekly, Monthly, Custom
- **Options:** 
  - Run silently in background
  - Show notification when done
  - Run only when idle
  - Run only when plugged in (laptops)

#### F-021: Watch Folders (Real-Time Organizer)
- **Priority:** P1
- **Description:** Monitor folders and auto-sort new files 
  as they are added
- **Use case:** Downloads folder auto-sorted on drop
- **Rules engine:** Same as F-013

#### F-022: Cleaning Profiles
- **Priority:** P2
- **Description:** Save different cleaning configurations as profiles
- **Examples:** "Work Clean" (light), "Deep Clean" (everything), 
  "Privacy Clean" (browsing data only)

---

### 5.5 MODULE 5 — SAFETY & RECOVERY

#### F-023: Safe Delete (Quarantine/Recycle)
- **Priority:** P0 (CRITICAL)
- **Description:** Instead of permanent delete, move files to 
  an app-managed quarantine folder first
- **Retention period:** User-configurable (default: 7 days)
- **Restore:** One-click restore from quarantine
- **Auto-purge:** After retention period

#### F-024: Scan Preview (Dry Run)
- **Priority:** P0 (CRITICAL)
- **Description:** ALWAYS show what will be deleted before 
  any destructive action
- **UI:** Expandable list with file paths, sizes, checkboxes
- **Require confirmation:** Two-step confirmation for large deletions

#### F-025: Whitelist / Exclusions
- **Priority:** P0
- **Description:** User can add folders/files/apps to a 
  permanent exclusion list
- **Never touched:** Whitelisted items never appear in scan results
- **Persistent:** Saved in local config file

#### F-026: Backup Before Clean (Optional)
- **Priority:** P2
- **Description:** Create a manifest file (not a full backup) 
  of what was deleted and where it was
- **Format:** Human-readable text log

---

### 5.6 MODULE 6 — SETTINGS & CONFIGURATION

#### F-027: General Settings
- Launch at startup toggle
- Minimize to system tray/menu bar
- Language selection
- Theme: Light / Dark / System
- Keyboard shortcuts

#### F-028: Scan Settings
- Include/exclude hidden files
- Include/exclude system files
- Minimum file size threshold
- Custom scan paths
- File extension exclusions

#### F-029: Notification Settings
- Desktop notifications on/off
- Summary notification after scheduled clean
- Low disk space alert (threshold configurable)

#### F-030: Appearance
- Light mode / Dark mode / Auto
- Compact / Comfortable view density
- Accent color options

---

### 5.7 MODULE 7 — DASHBOARD & REPORTING

#### F-031: Home Dashboard
- **Total space freed** (all-time counter)
- **Last scan date/time**
- **Current disk usage** (all drives)
- **Quick action buttons**
- **Health score** (0–100 based on junk, duplicates, organization)

#### F-032: Scan History & Reports
- **Description:** Local log of all scan/clean operations
- **Shows:** Date, items cleaned, space freed, categories
- **Export:** Export report as PDF or plain text
- **Storage:** Stored as local JSON/text files

#### F-033: Real-Time Stats Widget
- Current RAM usage
- CPU usage
- Disk read/write speed
- Shown in sidebar or mini-widget

---

## 6. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Specification |
|-------------|---------------|
| Performance | Scan 100k files in < 30 seconds |
| Memory | Idle < 150MB RAM, Active scan < 400MB RAM |
| Storage | App install size < 200MB |
| Startup | App launch to usable UI < 3 seconds |
| Privacy | Zero network calls, zero telemetry |
| Safety | No file deleted without user confirmation |
| Compatibility | macOS 12+ (Monterey and above), Windows 10/11 |
| Accessibility | Keyboard navigable, screen reader support |
| Localization | English (v1), extendable i18n architecture |

---

## 7. OUT OF SCOPE (v1.0)

- Cloud backup / sync
- Remote management
- iOS/Android companion app
- Registry defragmentation (Windows)
- Disk defragmentation
- Antivirus / malware scanning
- VPN functionality
- Password manager

---

## 8. MONETIZATION (Freemium)

### Free Tier
- Quick Scan + Basic Cleaning
- Duplicate Finder (up to 1000 files)
- File Organizer (manual, no scheduling)
- Disk Usage Analyzer
- Basic rename

### Pro Tier (One-time purchase, ~$29.99)
- Deep Scan
- Unlimited Duplicate Finder
- Watch Folders + Scheduling
- Similar Photo/Video Finder
- App Uninstaller (full)
- Startup Manager
- Cleaning Profiles
- Priority support

---

## 9. USER JOURNEY FLOWS

### Flow 1: First Launch
Install → Welcome Screen → Grant Permissions → 
Quick Scan → Review Results → Clean → 
"You freed X GB!" → Dashboard

### Flow 2: Duplicate Finder
Open Duplicates → Select Scope → Scan → 
Review Pairs → Auto-Select → Preview Deletions → 
Confirm → Move to Quarantine → Done

### Flow 3: Auto File Organizer
Open Organizer → Select Source Folder → 
Choose/Create Rules → Preview Changes → 
Apply → View Results

### Flow 4: Setup Watch Folder
Settings → Watch Folders → Add Folder → 
Assign Rules → Enable → 
(Background: files sorted as added)

---

## 10. PLATFORM-SPECIFIC CONSIDERATIONS

### macOS
- Request Full Disk Access permission (System Preferences)
- Sandbox considerations for Mac App Store (if published)
- Notarization required for distribution
- Respect macOS privacy APIs
- Integration with Finder (right-click context menu extension)

### Windows
- UAC elevation for system-level cleaning
- Windows Defender / SmartScreen handling
- Code signing certificate required
- Integration with Explorer context menu
- Handle OneDrive / cloud sync folders carefully

---

## 11. LOCALIZATION STRATEGY

- All strings externalized from day 1
- i18n folder with JSON locale files
- v1.0: English only
- v1.1: Spanish, French, German, Japanese
- RTL support architecture planned but not v1

---

## 12. RELEASE ROADMAP

| Version | Features | Timeline |
|---------|----------|----------|
| v0.1 Alpha | System cleaner, basic duplicate finder | Month 1-2 |
| v0.5 Beta | File organizer, disk analyzer, rename | Month 3-4 |
| v0.8 RC | Scheduling, watch folders, all settings | Month 5 |
| v1.0 Launch | Full feature set, both platforms | Month 6 |
| v1.1 | Localization, performance improvements | Month 7-8 |
| v1.2 | Similar photos, video finder | Month 9-10 |
🔧 TRD.md — Technical Requirements Document
Markdown

# TRD.md — CleanSweep: Technical Requirements Document
### Version: 1.0.0 | Status: Draft | Date: 2025

---

## 1. TECHNOLOGY STACK DECISIONS

### 1.1 Core Framework: Electron + React

**Decision: Electron v28+ with React 18**

Rationale:
- Single codebase → macOS + Windows
- Full Node.js access for filesystem operations
- Native OS API access via Node addons
- Large ecosystem for UI components
- Alternative considered: Tauri (Rust) — rejected due to 
  steeper learning curve and less mature ecosystem for 
  file system heavy operations

### 1.2 Full Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Electron 28+ | Cross-platform shell |
| UI Library | React 18 | Component model, ecosystem |
| UI State | Zustand | Lightweight, no boilerplate |
| Styling | Tailwind CSS + CSS Modules | Utility-first + scoped |
| Charts | Recharts + D3.js | Disk map treemap needs D3 |
| Build Tool | Vite | Fast HMR, optimized builds |
| IPC | Electron IPC (contextBridge) | Secure main↔renderer comms |
| File Ops | Node.js fs + chokidar | Native FS + file watching |
| Hashing | crypto (built-in) + imghash | MD5/SHA for duplicates |
| Scheduling | node-cron | Local task scheduling |
| Packaging | electron-builder | .dmg + .exe + auto-update |
| Testing | Vitest + Playwright | Unit + E2E |
| Language | TypeScript 5 | Type safety throughout |

### 1.3 Native Addons (node-addon-api / N-API)

For performance-critical operations, native C++ addons:
- Fast directory tree walking (faster than pure JS)
- Memory optimization calls (platform-specific)
- Low-level file hash computation (multi-threaded)

Alternative: Use worker_threads for CPU-intensive tasks
in pure JS/TS before reaching for native addons.

---

## 2. ARCHITECTURE

### 2.1 High-Level Architecture
┌─────────────────────────────────────────────────────────────┐
│ ELECTRON MAIN PROCESS │
│ │
│ ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ IPC Router │ │ File System │ │ Platform Layer │ │
│ │ (Bridge) │ │ Service │ │ (OS-specific) │ │
│ └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘ │
│ │ │ │ │
│ ┌──────▼──────────────────────────────────────▼─────────┐ │
│ │ CORE SERVICES LAYER │ │
│ │ │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │ │
│ │ │ Scanner │ │Duplicate │ │Organizer │ │Scheduler│ │ │
│ │ │ Service │ │ Service │ │ Service │ │ Service │ │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │ │
│ │ │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │ │
│ │ │ Privacy │ │ AppMgmt │ │Quarantine│ │ Config │ │ │
│ │ │ Service │ │ Service │ │ Service │ │ Service │ │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │ │
│ └────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ WORKER THREADS POOL │ │
│ │ Thread 1: File Hashing │ Thread 2: Deep Scan │ │
│ │ Thread 3: Image pHash │ Thread 4: Directory Walk │ │
│ └────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ LOCAL STORAGE LAYER │ │
│ │ Config (JSON) │ History (JSON) │ Quarantine (FS) │ │
│ │ Rules (JSON) │ Whitelist(JSON)│ Logs (.log files) │ │
│ └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────┘
│ IPC (contextBridge)
┌──────────────────────────────────────▼──────────────────────┐
│ ELECTRON RENDERER PROCESS │
│ (React Application) │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ROUTER (React Router v6) │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│ │Dashboard │ │ Cleaner │ │Duplicate │ │ Organizer │ │
│ │ Page │ │ Pages │ │ Pages │ │ Pages │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ZUSTAND STORE (Global State) │ │
│ │ scanState │ settingsState │ resultsState │ uiState │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ UI COMPONENT LIBRARY │ │
│ │ Shared components, Charts, Modals, Forms │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

text


### 2.2 Process Architecture Detail
Main Process (Node.js environment)
├── index.ts (entry point)
├── ipcHandlers.ts (all IPC channel registrations)
├── windowManager.ts (BrowserWindow management)
├── trayManager.ts (system tray)
├── autoUpdater.ts (electron-updater)
└── services/
├── scanner/
│ ├── QuickScanner.ts
│ ├── DeepScanner.ts
│ ├── BrowserScanner.ts
│ └── SystemJunkScanner.ts
├── duplicates/
│ ├── DuplicateFinder.ts
│ ├── HashComputer.ts (worker thread)
│ └── ImageDuplicateFinder.ts
├── organizer/
│ ├── FileOrganizer.ts
│ ├── RulesEngine.ts
│ ├── BulkRenamer.ts
│ └── FolderWatcher.ts (chokidar)
├── privacy/
│ └── PrivacyCleaner.ts
├── apps/
│ ├── AppManager.ts
│ └── StartupManager.ts
├── system/
│ ├── DiskAnalyzer.ts
│ ├── MemoryOptimizer.ts
│ └── PlatformDetector.ts
├── quarantine/
│ └── QuarantineService.ts
├── scheduler/
│ └── TaskScheduler.ts
└── config/
└── ConfigService.ts

text


---

## 3. IPC COMMUNICATION DESIGN

### 3.1 IPC Channel Naming Convention
cleansweep:{module}:{action}

text


### 3.2 IPC Channel Registry

```typescript
// All IPC channels defined as constants

// SCANNER
'cleansweep:scanner:quick-scan'
'cleansweep:scanner:deep-scan'
'cleansweep:scanner:browser-scan'
'cleansweep:scanner:cancel'
'cleansweep:scanner:progress' // main → renderer (event)

// CLEANER
'cleansweep:cleaner:preview'
'cleansweep:cleaner:execute'
'cleansweep:cleaner:get-history'

// DUPLICATES
'cleansweep:duplicates:scan'
'cleansweep:duplicates:scan-photos'
'cleansweep:duplicates:delete'
'cleansweep:duplicates:progress' // event

// ORGANIZER
'cleansweep:organizer:preview'
'cleansweep:organizer:execute'
'cleansweep:organizer:get-rules'
'cleansweep:organizer:save-rules'
'cleansweep:organizer:rename-preview'
'cleansweep:organizer:rename-execute'

// WATCH FOLDERS
'cleansweep:watcher:add'
'cleansweep:watcher:remove'
'cleansweep:watcher:list'
'cleansweep:watcher:activity' // event

// DISK
'cleansweep:disk:analyze'
'cleansweep:disk:get-drives'
'cleansweep:disk:find-large-files'
'cleansweep:disk:find-empty-folders'

// APPS
'cleansweep:apps:list'
'cleansweep:apps:uninstall'
'cleansweep:apps:get-startup'
'cleansweep:apps:toggle-startup'

// QUARANTINE
'cleansweep:quarantine:list'
'cleansweep:quarantine:restore'
'cleansweep:quarantine:purge'

// CONFIG
'cleansweep:config:get'
'cleansweep:config:set'
'cleansweep:config:get-whitelist'
'cleansweep:config:add-whitelist'
'cleansweep:config:remove-whitelist'

// SYSTEM
'cleansweep:system:get-stats'
'cleansweep:system:optimize-memory'
'cleansweep:system:get-disk-usage'

// SCHEDULER
'cleansweep:scheduler:get-tasks'
'cleansweep:scheduler:create-task'
'cleansweep:scheduler:delete-task'
'cleansweep:scheduler:toggle-task'
3.3 IPC Type Definitions
TypeScript

// Shared types between main and renderer
interface ScanResult {
  id: string;
  category: ScanCategory;
  items: ScannedItem[];
  totalSize: number;
  scanDuration: number;
}

interface ScannedItem {
  path: string;
  size: number;
  type: 'file' | 'directory';
  lastModified: Date;
  lastAccessed: Date;
  category: string;
  safeToDelete: boolean;
}

interface ScanProgress {
  phase: 'indexing' | 'analyzing' | 'complete';
  filesScanned: number;
  totalFound: number;
  currentPath: string;
  percentage: number;
}

interface DuplicateGroup {
  hash: string;
  files: ScannedItem[];
  wastedSpace: number;
}

interface OrganizerRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: RuleCondition[];
  action: 'move' | 'copy' | 'rename' | 'delete';
  destination: string;
  namingPattern?: string;
}

interface RuleCondition {
  field: 'name' | 'extension' | 'size' | 'date' | 'content';
  operator: 'contains' | 'equals' | 'startsWith' | 
            'endsWith' | 'greaterThan' | 'lessThan' | 'matches';
  value: string;
}

type ScanCategory = 
  | 'system-junk'
  | 'browser-cache'
  | 'logs'
  | 'temp-files'
  | 'app-leftovers'
  | 'large-files'
  | 'old-files'
  | 'duplicates'
  | 'trash';
4. DATA STORAGE DESIGN (Local Only)
4.1 Storage Locations
text

macOS: ~/Library/Application Support/CleanSweep/
Windows: %APPDATA%\CleanSweep\

CleanSweep/
├── config.json           # App settings & preferences
├── whitelist.json        # Excluded files/folders
├── rules.json            # File organizer rules
├── history.json          # Scan/clean history (last 90 days)
├── schedules.json        # Scheduled task definitions
├── profiles.json         # Cleaning profiles
├── quarantine/           # Quarantined files (moved here)
│   ├── manifest.json     # Index of quarantined items
│   └── [files...]        # Actual quarantined files
└── logs/
    ├── app-2025-01.log
    └── operations-2025-01.log
4.2 Config Schema
TypeScript

interface AppConfig {
  version: string;
  general: {
    launchAtStartup: boolean;
    minimizeToTray: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
    showNotifications: boolean;
    lowDiskAlertThreshold: number; // GB
  };
  scan: {
    includeHidden: boolean;
    includeSystem: boolean;
    minFileSize: number; // bytes
    customPaths: string[];
    excludedExtensions: string[];
  };
  quarantine: {
    enabled: boolean;
    retentionDays: number;
    maxSizeGB: number;
  };
  cleaner: {
    browsers: {
      [browserName: string]: {
        enabled: boolean;
        clearCache: boolean;
        clearCookies: boolean;
        clearHistory: boolean;
        clearPasswords: boolean;
        cookieWhitelist: string[];
      };
    };
    systemJunk: {
      [category: string]: boolean;
    };
  };
  organizer: {
    watchFolders: WatchFolder[];
    defaultDestination: string;
    conflictStrategy: 'skip' | 'rename' | 'overwrite';
  };
  ui: {
    density: 'compact' | 'comfortable';
    accentColor: string;
    showSidebar: boolean;
  };
}
4.3 History Schema
TypeScript

interface HistoryEntry {
  id: string;
  timestamp: string; // ISO 8601
  type: 'quick-clean' | 'deep-clean' | 'duplicate-remove' 
      | 'organize' | 'rename' | 'uninstall';
  summary: {
    filesProcessed: number;
    spaceFreed: number; // bytes
    categories: Record<string, { count: number; size: number }>;
  };
  items: HistoryItem[]; // detailed per-file log
}

interface HistoryItem {
  originalPath: string;
  action: 'deleted' | 'moved' | 'quarantined' | 'renamed';
  newPath?: string;
  size: number;
  restorable: boolean;
}
4.4 Quarantine Manifest
TypeScript

interface QuarantineManifest {
  entries: QuarantineEntry[];
  totalSize: number;
}

interface QuarantineEntry {
  id: string;          // UUID
  originalPath: string; // Where file came from
  quarantinePath: string; // Where it is now in quarantine folder
  filename: string;
  size: number;
  deletedAt: string;   // ISO timestamp
  expiresAt: string;   // deletedAt + retentionDays
  reason: string;      // Why it was deleted (category)
  restorable: boolean;
}
5. CORE SERVICE IMPLEMENTATIONS
5.1 Scanner Service
TypeScript

// QuickScanner.ts - Core scan logic
class QuickScanner extends EventEmitter {
  private locations: ScanLocation[];
  private whitelist: string[];
  
  constructor(config: ScanConfig, whitelist: string[]) {
    super();
    this.locations = this.buildLocationList();
    this.whitelist = whitelist;
  }

  async scan(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    
    for (const location of this.locations) {
      // Emit progress
      this.emit('progress', { 
        phase: 'indexing', 
        currentPath: location.path 
      });
      
      const items = await this.scanLocation(location);
      results.push({
        id: uuid(),
        category: location.category,
        items: items.filter(i => !this.isWhitelisted(i.path)),
        totalSize: sum(items.map(i => i.size)),
        scanDuration: 0
      });
    }
    
    return results;
  }

  private async scanLocation(
    location: ScanLocation
  ): Promise<ScannedItem[]> {
    // Use fast-glob for directory scanning
    // Filter by whitelist
    // Return file metadata
  }

  private buildLocationList(): ScanLocation[] {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      return MACOS_SCAN_LOCATIONS;
    } else if (platform === 'win32') {
      return WINDOWS_SCAN_LOCATIONS;
    }
    
    throw new Error('Unsupported platform');
  }
}
5.2 Duplicate Finder with Worker Threads
TypeScript

// HashComputer.ts (runs in worker thread)
import { workerData, parentPort } from 'worker_threads';
import * as crypto from 'crypto';
import * as fs from 'fs';

interface WorkerInput {
  files: string[];
  algorithm: 'md5' | 'sha256';
}

async function computeHashes(files: string[], algo: string) {
  const results: Record<string, string> = {};
  
  for (const file of files) {
    const hash = crypto.createHash(algo);
    const stream = fs.createReadStream(file, { 
      highWaterMark: 64 * 1024 // 64KB chunks
    });
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    results[file] = hash.digest('hex');
    parentPort?.postMessage({ type: 'progress', file });
  }
  
  parentPort?.postMessage({ type: 'complete', results });
}

// DuplicateFinder.ts
class DuplicateFinder extends EventEmitter {
  
  async findDuplicates(
    paths: string[], 
    options: DuplicateOptions
  ): Promise<DuplicateGroup[]> {
    
    // Phase 1: Group by file size (fast, no hashing needed)
    const bySize = await this.groupBySize(paths);
    const candidates = Object.values(bySize)
      .filter(group => group.length > 1)
      .flat();
    
    // Phase 2: Hash only size-matched files
    const hashes = await this.computeHashesParallel(candidates);
    
    // Phase 3: Group by hash
    const byHash = this.groupByHash(hashes);
    
    return Object.entries(byHash)
      .filter(([_, files]) => files.length > 1)
      .map(([hash, files]) => ({
        hash,
        files: files.map(f => this.buildScannedItem(f)),
        wastedSpace: sum(files.slice(1).map(f => f.size))
      }));
  }

  private async computeHashesParallel(
    files: string[]
  ): Promise<Record<string, string>> {
    const CHUNK_SIZE = 500;
    const chunks = chunkArray(files, CHUNK_SIZE);
    const workers: Worker[] = [];
    const results: Record<string, string> = {};
    
    for (const chunk of chunks) {
      const worker = new Worker('./hashComputer.js', {
        workerData: { files: chunk, algorithm: 'sha256' }
      });
      workers.push(worker);
      
      const chunkResult = await new Promise(resolve => {
        worker.on('message', (msg) => {
          if (msg.type === 'complete') resolve(msg.results);
          if (msg.type === 'progress') {
            this.emit('progress', { file: msg.file });
          }
        });
      });
      
      Object.assign(results, chunkResult);
    }
    
    return results;
  }
}
5.3 Rules Engine (File Organizer)
TypeScript

// RulesEngine.ts
class RulesEngine {
  
  evaluate(file: FileInfo, rules: OrganizerRule[]): RuleAction | null {
    for (const rule of rules.filter(r => r.enabled)) {
      if (this.matchesAllConditions(file, rule.conditions)) {
        return {
          rule,
          destination: this.resolveDestination(file, rule),
          newName: rule.namingPattern 
            ? this.applyNamingPattern(file, rule.namingPattern) 
            : null
        };
      }
    }
    return null;
  }

  private matchesAllConditions(
    file: FileInfo, 
    conditions: RuleCondition[]
  ): boolean {
    return conditions.every(condition => 
      this.evaluateCondition(file, condition)
    );
  }

  private evaluateCondition(
    file: FileInfo, 
    condition: RuleCondition
  ): boolean {
    const value = this.getFieldValue(file, condition.field);
    
    switch (condition.operator) {
      case 'contains': 
        return value.toLowerCase()
          .includes(condition.value.toLowerCase());
      case 'equals': 
        return value.toLowerCase() === condition.value.toLowerCase();
      case 'startsWith': 
        return value.toLowerCase()
          .startsWith(condition.value.toLowerCase());
      case 'endsWith': 
        return value.toLowerCase()
          .endsWith(condition.value.toLowerCase());
      case 'greaterThan': 
        return parseFloat(value) > parseFloat(condition.value);
      case 'lessThan': 
        return parseFloat(value) < parseFloat(condition.value);
      case 'matches': 
        return new RegExp(condition.value).test(value);
      default: 
        return false;
    }
  }

  private applyNamingPattern(
    file: FileInfo, 
    pattern: string
  ): string {
    // Pattern variables: {name}, {ext}, {date}, {year}, 
    // {month}, {day}, {counter}, {size}
    return pattern
      .replace('{name}', file.nameWithoutExt)
      .replace('{ext}', file.extension)
      .replace('{year}', file.date.getFullYear().toString())
      .replace('{month}', padZero(file.date.getMonth() + 1))
      .replace('{day}', padZero(file.date.getDate()));
  }

  resolveDestination(file: FileInfo, rule: OrganizerRule): string {
    // Support dynamic path variables in destination
    return rule.destination
      .replace('{year}', file.date.getFullYear().toString())
      .replace('{month}', padZero(file.date.getMonth() + 1))
      .replace('{ext}', file.extension)
      .replace('{type}', this.getFileTypeCategory(file.extension));
  }
}
5.4 Platform-Specific Implementations
TypeScript

// platform/macos.ts
export const MACOS_SCAN_LOCATIONS: ScanLocation[] = [
  {
    category: 'system-junk',
    path: '~/Library/Caches',
    recursive: true,
    description: 'System & Application Caches'
  },
  {
    category: 'logs',
    path: '~/Library/Logs',
    recursive: true,
    description: 'Application Logs'
  },
  {
    category: 'logs',
    path: '/var/log',
    recursive: false,
    requiresElevation: false,
    description: 'System Logs'
  },
  {
    category: 'temp-files',
    path: '/private/tmp',
    recursive: true,
    description: 'Temporary Files'
  },
  {
    category: 'system-junk',
    path: '~/Library/Application Support',
    recursive: false, // only scan top-level orphaned dirs
    description: 'Application Support Files'
  },
  // ... more locations
];

export async function getMacOSInstalledApps(): Promise<AppInfo[]> {
  const apps: AppInfo[] = [];
  const appDirs = ['/Applications', '~/Applications'];
  
  for (const dir of appDirs) {
    const entries = await fs.readdir(expandPath(dir));
    for (const entry of entries.filter(e => e.endsWith('.app'))) {
      const plistPath = path.join(dir, entry, 
        'Contents/Info.plist');
      const info = await parsePlist(plistPath);
      apps.push({
        name: info.CFBundleName || entry.replace('.app', ''),
        bundleId: info.CFBundleIdentifier,
        path: path.join(dir, entry),
        version: info.CFBundleVersion,
        size: await getFolderSize(path.join(dir, entry)),
      });
    }
  }
  return apps;
}

// platform/windows.ts
export const WINDOWS_SCAN_LOCATIONS: ScanLocation[] = [
  {
    category: 'temp-files',
    path: '%TEMP%',
    recursive: true,
    description: 'User Temporary Files'
  },
  {
    category: 'temp-files',
    path: 'C:\\Windows\\Temp',
    recursive: true,
    requiresElevation: true,
    description: 'System Temporary Files'
  },
  {
    category: 'system-junk',
    path: '%LOCALAPPDATA%\\Microsoft\\Windows\\INetCache',
    recursive: true,
    description: 'Internet Cache'
  },
  {
    category: 'system-junk',
    path: '%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer',
    filePattern: 'thumbcache_*.db',
    description: 'Thumbnail Cache'
  },
  // ... more locations
];

export async function getWindowsInstalledApps(): Promise<AppInfo[]> {
  // Read from Windows Registry via PowerShell
  const script = `
    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\
    CurrentVersion\\Uninstall\\* | 
    Select-Object DisplayName, DisplayVersion, 
    InstallLocation, EstimatedSize |
    ConvertTo-Json
  `;
  const result = await runPowerShell(script);
  return JSON.parse(result);
}
6. SECURITY & SAFETY ARCHITECTURE
6.1 Electron Security Configuration
TypeScript

// main/index.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // NEVER enable
    contextIsolation: true,         // ALWAYS enable
    sandbox: true,                  // Enable renderer sandbox
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,
    allowRunningInsecureContent: false,
  }
});

// Content Security Policy
mainWindow.webContents.session.webRequest.onHeadersReceived(
  (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        ]
      }
    });
  }
);
6.2 Preload Script (Secure Bridge)
TypeScript

// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Only expose specific, typed functions - never expose ipcRenderer directly
contextBridge.exposeInMainWorld('cleanSweepAPI', {
  
  scanner: {
    quickScan: (options: QuickScanOptions) => 
      ipcRenderer.invoke('cleansweep:scanner:quick-scan', options),
    cancel: () => 
      ipcRenderer.send('cleansweep:scanner:cancel'),
    onProgress: (callback: (progress: ScanProgress) => void) => {
      ipcRenderer.on('cleansweep:scanner:progress', 
        (_, data) => callback(data));
      // Return cleanup function
      return () => ipcRenderer.removeAllListeners(
        'cleansweep:scanner:progress'
      );
    }
  },

  cleaner: {
    preview: (items: ScannedItem[]) => 
      ipcRenderer.invoke('cleansweep:cleaner:preview', items),
    execute: (items: ScannedItem[], useQuarantine: boolean) => 
      ipcRenderer.invoke('cleansweep:cleaner:execute', 
        items, useQuarantine),
  },
  
  // ... all other modules
});
6.3 Safe Delete Implementation
TypeScript

// QuarantineService.ts
class QuarantineService {
  private quarantinePath: string;
  private manifest: QuarantineManifest;

  async quarantine(item: ScannedItem): Promise<QuarantineEntry> {
    const entry: QuarantineEntry = {
      id: uuid(),
      originalPath: item.path,
      quarantinePath: path.join(this.quarantinePath, uuid()),
      filename: path.basename(item.path),
      size: item.size,
      deletedAt: new Date().toISOString(),
      expiresAt: addDays(new Date(), this.retentionDays).toISOString(),
      reason: item.category,
      restorable: true
    };

    // Move file to quarantine (not delete!)
    await fs.rename(item.path, entry.quarantinePath);
    
    // Update manifest
    this.manifest.entries.push(entry);
    await this.saveManifest();
    
    return entry;
  }

  async restore(entryId: string): Promise<void> {
    const entry = this.manifest.entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found in quarantine');
    
    // Ensure original directory exists
    await fs.mkdir(path.dirname(entry.originalPath), 
      { recursive: true });
    
    // Move back
    await fs.rename(entry.quarantinePath, entry.originalPath);
    
    // Remove from manifest
    this.manifest.entries = this.manifest.entries
      .filter(e => e.id !== entryId);
    await this.saveManifest();
  }

  async purgeExpired(): Promise<void> {
    const now = new Date();
    const expired = this.manifest.entries
      .filter(e => new Date(e.expiresAt) < now);
    
    for (const entry of expired) {
      await fs.unlink(entry.quarantinePath).catch(() => {});
    }
    
    this.manifest.entries = this.manifest.entries
      .filter(e => new Date(e.expiresAt) >= now);
    await this.saveManifest();
  }
}
7. PERFORMANCE ARCHITECTURE
7.1 Worker Thread Pool
TypeScript

// workers/WorkerPool.ts
class WorkerPool {
  private workers: Worker[] = [];
  private queue: WorkItem[] = [];
  private maxWorkers: number;

  constructor() {
    // Use 50% of available CPU cores, min 2, max 8
    this.maxWorkers = Math.min(8, 
      Math.max(2, Math.floor(os.cpus().length / 2))
    );
  }

  async execute<T>(workerScript: string, data: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.workers.length < this.maxWorkers) {
        this.runWorker(workerScript, data, resolve, reject);
      } else {
        this.queue.push({ workerScript, data, resolve, reject });
      }
    });
  }
}
7.2 Virtual Scrolling for Large Lists
TypeScript

// All lists with potentially thousands of items use 
// @tanstack/react-virtual for virtualized rendering

import { useVirtualizer } from '@tanstack/react-virtual';

function DuplicateList({ groups }: { groups: DuplicateGroup[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: groups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <DuplicateGroupRow 
            key={virtualItem.key}
            group={groups[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
7.3 Scan Performance Targets
Operation	Target	Strategy
Quick Scan (typical)	< 10s	Predefined paths, parallel
Deep Scan (100k files)	< 60s	Worker threads, streaming
Duplicate Hash 10k files	< 30s	Worker pool, size-filter first
Image pHash 1k photos	< 20s	Worker thread + batch
Directory tree walk	< 5s/GB	fast-glob, avoid stat() when possible
App list generation	< 3s	Cache + lazy load sizes
8. UI ARCHITECTURE
8.1 Page/Module Structure
text

src/renderer/
├── App.tsx
├── router.tsx
├── pages/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── HealthScore.tsx
│   │   ├── DiskUsageWidget.tsx
│   │   └── RecentActivity.tsx
│   ├── Cleaner/
│   │   ├── CleanerHome.tsx
│   │   ├── QuickScan.tsx
│   │   ├── ScanResults.tsx
│   │   ├── BrowserCleaner.tsx
│   │   ├── SystemJunk.tsx
│   │   └── PrivacyCleaner.tsx
│   ├── Duplicates/
│   │   ├── DuplicateHome.tsx
│   │   ├── DuplicateScan.tsx
│   │   ├── DuplicateResults.tsx
│   │   └── PhotoDuplicates.tsx
│   ├── Organizer/
│   │   ├── OrganizerHome.tsx
│   │   ├── RulesBuilder.tsx
│   │   ├── BulkRenamer.tsx
│   │   ├── WatchFolders.tsx
│   │   └── FolderTemplates.tsx
│   ├── DiskAnalyzer/
│   │   ├── DiskAnalyzer.tsx
│   │   ├── TreeMap.tsx        ← D3.js component
│   │   ├── LargeFiles.tsx
│   │   └── FileTypes.tsx
│   ├── Apps/
│   │   ├── AppManager.tsx
│   │   ├── StartupManager.tsx
│   │   └── AppUninstaller.tsx
│   ├── Quarantine/
│   │   └── QuarantineManager.tsx
│   ├── Scheduler/
│   │   └── SchedulerManager.tsx
│   └── Settings/
│       ├── Settings.tsx
│       ├── GeneralSettings.tsx
│       ├── ScanSettings.tsx
│       ├── Whitelist.tsx
│       └── AboutPage.tsx
├── components/
│   ├── ui/              # Base UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Progress/
│   │   ├── Toggle/
│   │   ├── Tooltip/
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── MainLayout.tsx
│   └── shared/
│       ├── FileList.tsx    # Virtualized file list
│       ├── SizeBar.tsx     # Visual size indicator
│       ├── ConfirmDialog.tsx
│       └── ScanProgress.tsx
├── stores/              # Zustand stores
│   ├── scanStore.ts
│   ├── settingsStore.ts
│   ├── resultsStore.ts
│   └── uiStore.ts
├── hooks/               # Custom React hooks
│   ├── useScan.ts
│   ├── useIPC.ts
│   ├── usePlatform.ts
│   └── useProgress.ts
└── utils/
    ├── formatBytes.ts
    ├── formatDate.ts
    └── platform.ts
8.2 State Management (Zustand)
TypeScript

// stores/scanStore.ts
interface ScanStore {
  // State
  status: 'idle' | 'scanning' | 'complete' | 'error';
  progress: ScanProgress | null;
  results: ScanResult[];
  selectedItems: Set<string>;
  
  // Actions
  startQuickScan: (options: QuickScanOptions) => Promise<void>;
  cancelScan: () => void;
  toggleItemSelection: (itemId: string) => void;
  selectAll: () => void;
  selectCategory: (category: ScanCategory) => void;
  clearResults: () => void;
  executeClean: (useQuarantine: boolean) => Promise<void>;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  status: 'idle',
  progress: null,
  results: [],
  selectedItems: new Set(),

  startQuickScan: async (options) => {
    set({ status: 'scanning', results: [], progress: null });
    
    const cleanup = window.cleanSweepAPI.scanner.onProgress(
      (progress) => set({ progress })
    );
    
    try {
      const results = await window.cleanSweepAPI.scanner
        .quickScan(options);
      set({ status: 'complete', results });
    } catch (error) {
      set({ status: 'error' });
    } finally {
      cleanup();
    }
  },

  executeClean: async (useQuarantine) => {
    const { selectedItems, results } = get();
    const items = results.flatMap(r => r.items)
      .filter(i => selectedItems.has(i.path));
    
    await window.cleanSweepAPI.cleaner.execute(items, useQuarantine);
    set({ status: 'idle', results: [], selectedItems: new Set() });
  }
}));
9. BUILD & PACKAGING
9.1 electron-builder Configuration
JSON

{
  "appId": "com.cleansweep.app",
  "productName": "CleanSweep",
  "directories": {
    "output": "dist",
    "buildResources": "assets"
  },
  "files": [
    "dist-electron/**/*",
    "dist-renderer/**/*"
  ],
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ],
    "category": "public.app-category.utilities",
    "entitlements": "assets/entitlements.mac.plist",
    "entitlementsInherit": "assets/entitlements.mac.plist",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "icon": "assets/icon.icns"
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64", "ia32"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "assets/icon.ico",
    "requestedExecutionLevel": "asInvoker",
    "signAndEditExecutable": true
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },
  "publish": null
}
9.2 Build Scripts
JSON

{
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "dev:renderer": "vite",
    "dev:main": "tsc -p tsconfig.main.json --watch",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build",
    "build:main": "tsc -p tsconfig.main.json",
    "package:mac": "npm run build && electron-builder --mac",
    "package:win": "npm run build && electron-builder --win",
    "package:all": "npm run build && electron-builder -mw",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
10. TESTING STRATEGY
10.1 Test Pyramid
text

          /\
         /E2E\          ← Playwright (10%)
        /------\        Full app flows
       / Integr. \      ← Vitest + electron mock (30%)
      /------------\    IPC handlers, services
     /   Unit Tests  \  ← Vitest (60%)
    /------------------\ Core logic, rules engine,
                         scanner logic, utilities
10.2 Unit Test Examples
TypeScript

// tests/unit/rulesEngine.test.ts
describe('RulesEngine', () => {
  const engine = new RulesEngine();

  test('matches file by extension', () => {
    const file = buildFileInfo({ 
      name: 'photo.jpg', 
      extension: '.jpg' 
    });
    const rule = buildRule({ 
      conditions: [{ 
        field: 'extension', 
        operator: 'equals', 
        value: '.jpg' 
      }]
    });
    
    const result = engine.evaluate(file, [rule]);
    expect(result).not.toBeNull();
    expect(result?.rule.id).toBe(rule.id);
  });

  test('requires ALL conditions to match (AND logic)', () => {
    const smallFile = buildFileInfo({ 
      name: 'small.pdf', 
      size: 100 * 1024  // 100KB
    });
    const rule = buildRule({ conditions: [
      { field: 'extension', operator: 'equals', value: '.pdf' },
      { field: 'size', operator: 'greaterThan', value: '1000000' }
    ]});
    
    expect(engine.evaluate(smallFile, [rule])).toBeNull();
  });

  test('resolves destination with date variables', () => {
    const file = buildFileInfo({ 
      date: new Date('2025-03-15') 
    });
    const rule = buildRule({ 
      destination: '/Organized/{year}/{month}' 
    });
    
    const dest = engine.resolveDestination(file, rule);
    expect(dest).toBe('/Organized/2025/03');
  });
});

// tests/unit/duplicateFinder.test.ts
describe('DuplicateFinder', () => {
  test('groups files by size before hashing', async () => {
    const spy = vi.spyOn(HashComputer, 'compute');
    const finder = new DuplicateFinder();
    
    // Files with unique sizes should not be hashed
    await finder.findDuplicates([
      'unique-1mb.txt',    // size: 1MB
      'unique-2mb.txt',    // size: 2MB  
      'dup-a-500kb.txt',   // size: 500KB
      'dup-b-500kb.txt',   // size: 500KB
    ]);
    
    // Only the two same-sized files should be hashed
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
10.3 E2E Test Examples
TypeScript

// tests/e2e/quickScan.test.ts
import { test, expect, _electron as electron } from '@playwright/test';

test('Quick scan completes and shows results', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  await window.click('[data-testid="quick-scan-button"]');
  await window.waitForSelector('[data-testid="scan-progress"]');
  
  // Wait for scan to complete (max 60s)
  await window.waitForSelector('[data-testid="scan-results"]', {
    timeout: 60000
  });
  
  const resultCount = await window.locator(
    '[data-testid="result-item"]'
  ).count();
  expect(resultCount).toBeGreaterThan(0);
  
  await app.close();
});
11. ERROR HANDLING STRATEGY
TypeScript

// Centralized error types
class CleanSweepError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recoverable: boolean = true,
    public userMessage: string = message
  ) {
    super(message);
  }
}

enum ErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  DISK_FULL = 'DISK_FULL',
  FILE_IN_USE = 'FILE_IN_USE',
  SCAN_CANCELLED = 'SCAN_CANCELLED',
  INVALID_RULE = 'INVALID_RULE',
  QUARANTINE_FULL = 'QUARANTINE_FULL',
}

// IPC handler error wrapper
function safeHandle(
  channel: string, 
  handler: (...args: unknown[]) => Promise<unknown>
) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return { success: true, data: await handler(...args) };
    } catch (error) {
      logger.error(`IPC Error [${channel}]:`, error);
      
      if (error instanceof CleanSweepError) {
        return { 
          success: false, 
          error: {
            code: error.code,
            message: error.userMessage,
            recoverable: error.recoverable
          }
        };
      }
      
      return { 
        success: false, 
        error: { 
          code: 'UNKNOWN_ERROR', 
          message: 'An unexpected error occurred',
          recoverable: false
        }
      };
    }
  });
}
12. LOGGING SYSTEM
TypeScript

// services/Logger.ts
class Logger {
  private logPath: string;
  private maxLogSize = 10 * 1024 * 1024; // 10MB
  
  log(level: 'INFO' | 'WARN' | 'ERROR', 
      module: string, 
      message: string, 
      data?: unknown) {
    
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      ...(data && { data })
    };
    
    // Write to file (rotating log)
    this.writeToFile(JSON.stringify(entry) + '\n');
    
    // Also log to console in dev
    if (!app.isPackaged) {
      console[level.toLowerCase()](
        `[${module}] ${message}`, data || ''
      );
    }
  }

  // Log file operations for audit trail (not for telemetry)
  logOperation(operation: FileOperation): void {
    this.log('INFO', 'OPERATIONS', 
      `${operation.action}: ${operation.path}`, {
        size: operation.size,
        destination: operation.destination
      }
    );
  }
}
13. AUTO-UPDATE MECHANISM
TypeScript

// autoUpdater.ts (uses electron-updater)
// Updates delivered via GitHub Releases (no update server needed)

import { autoUpdater } from 'electron-updater';

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.autoDownload = false; // Ask user first
  
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update:downloaded');
  });

  ipcMain.on('update:start-download', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on('update:install', () => {
    autoUpdater.quitAndInstall();
  });

  // Check once per day
  autoUpdater.checkForUpdates();
  setInterval(() => autoUpdater.checkForUpdates(), 
    24 * 60 * 60 * 1000);
}
14. PROJECT STRUCTURE (COMPLETE)
text

cleansweep/
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.renderer.json
├── vite.config.ts
├── electron-builder.json
├── .eslintrc.js
├── .prettierrc
│
├── assets/                        # Build assets
│   ├── icon.icns                  # macOS icon
│   ├── icon.ico                   # Windows icon
│   ├── icon.png                   # Source icon (1024x1024)
│   ├── entitlements.mac.plist     # macOS entitlements
│   └── installer/                 # NSIS installer assets
│
├── src/
│   ├── main/                      # ELECTRON MAIN PROCESS
│   │   ├── index.ts               # Entry point
│   │   ├── preload.ts             # Secure bridge
│   │   ├── ipcHandlers.ts         # All IPC registrations
│   │   ├── windowManager.ts       # Window lifecycle
│   │   ├── trayManager.ts         # System tray
│   │   ├── autoUpdater.ts         # Update mechanism
│   │   ├── menuBuilder.ts         # App menu
│   │   │
│   │   ├── services/
│   │   │   ├── scanner/
│   │   │   │   ├── QuickScanner.ts
│   │   │   │   ├── DeepScanner.ts
│   │   │   │   ├── BrowserScanner.ts
│   │   │   │   ├── SystemJunkScanner.ts
│   │   │   │   └── locations/
│   │   │   │       ├── macos.ts
│   │   │   │       └── windows.ts
│   │   │   │
│   │   │   ├── cleaner/
│   │   │   │   └── CleanerService.ts
│   │   │   │
│   │   │   ├── duplicates/
│   │   │   │   ├── DuplicateFinder.ts
│   │   │   │   └── ImageDuplicateFinder.ts
│   │   │   │
│   │   │   ├── organizer/
│   │   │   │   ├── FileOrganizer.ts
│   │   │   │   ├── RulesEngine.ts
│   │   │   │   ├── BulkRenamer.ts
│   │   │   │   └── FolderWatcher.ts
│   │   │   │
│   │   │   ├── privacy/
│   │   │   │   └── PrivacyCleaner.ts
│   │   │   │
│   │   │   ├── apps/
│   │   │   │   ├── AppManager.ts
│   │   │   │   └── StartupManager.ts
│   │   │   │
│   │   │   ├── disk/
│   │   │   │   └── DiskAnalyzer.ts
│   │   │   │
│   │   │   ├── system/
│   │   │   │   ├── MemoryOptimizer.ts
│   │   │   │   └── PlatformDetector.ts
│   │   │   │
│   │   │   ├── quarantine/
│   │   │   │   └── QuarantineService.ts
│   │   │   │
│   │   │   ├── scheduler/
│   │   │   │   └── TaskScheduler.ts
│   │   │   │
│   │   │   └── config/
│   │   │       └── ConfigService.ts
│   │   │
│   │   ├── workers/               # Worker thread scripts
│   │   │   ├── hashWorker.ts
│   │   │   ├── dirWalker.ts
│   │   │   └── imageHashWorker.ts
│   │   │
│   │   └── utils/
│   │       ├── fsUtils.ts
│   │       ├── pathUtils.ts
│   │       ├── platform.ts
│   │       └── logger.ts
│   │
│   ├── renderer/                  # REACT APPLICATION
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   │
│   │   ├── pages/                 # (see section 8.1)
│   │   ├── components/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   │       ├── globals.css
│   │       └── tailwind.css
│   │
│   └── shared/                    # SHARED TYPES
│       ├── ipcChannels.ts         # Channel name constants
│       ├── types.ts               # All shared interfaces
│       └── constants.ts           # Shared constants
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
15. DEPENDENCIES
JSON

{
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "chokidar": "^3.5.3",
    "fast-glob": "^3.3.0",
    "node-cron": "^3.0.3",
    "imghash": "^0.2.1",
    "uuid": "^9.0.0",
    "electron-updater": "^6.1.0",
    "recharts": "^2.10.0",
    "d3": "^7.8.5",
    "@tanstack/react-virtual": "^3.0.0",
    "date-fns": "^3.0.0",
    "plist": "^3.1.0"
  },
  "devDependencies": {
    "electron-builder": "^24.9.0",
    "vite": "^5.0.0",
    "vite-plugin-electron": "^0.15.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0",
    "@types/d3": "^7.4.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.0.0",
    "playwright": "^1.40.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.1.0",
    "concurrently": "^8.2.0"
  }
}
text


---

# 🗺️ ARCHITECTURE.md — Architecture Diagrams

```markdown
# ARCHITECTURE.md — CleanSweep Architecture

## 1. SYSTEM ARCHITECTURE OVERVIEW
╔══════════════════════════════════════════════════════════════════╗
║ CLEANSWEEP APPLICATION ║
║ ║
║ ┌─────────────────────────────────────────────────────────────┐ ║
║ │ ELECTRON SHELL LAYER │ ║
║ │ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ │ ║
║ │ │ Main Window │ │ System Tray │ │ Auto Updater │ │ ║
║ │ └──────────────┘ └──────────────┘ └───────────────┘ │ ║
║ └─────────────────────────────────────────────────────────────┘ ║
║ │ ║
║ ┌───────────────────────────┼───────────────────────────────┐ ║
║ │ SECURE IPC BRIDGE (contextBridge) │ ║
║ │ preload.ts │ ║
║ └───────────────────────────┼───────────────────────────────┘ ║
║ ┌─────────────────┘└──────────────────┐ ║
║ ▼ ▼ ║
║ ┌────────────────────┐ ┌─────────────────────────┐ ║
║ │ MAIN PROCESS │ │ RENDERER PROCESS │ ║
║ │ (Node.js) │ IPC calls │ (React + Chromium) │ ║
║ │ │◄────────────►│ │ ║
║ │ All file system │ │ All UI rendering │ ║
║ │ operations here │ │ No direct FS access │ ║
║ └────────────────────┘ └─────────────────────────┘ ║
║ │ ║
║ ┌────────┼──────────────────────────────────────────────────┐ ║
║ │ ▼ WORKER THREADS (CPU-intensive work) │ ║
║ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ ║
║ │ │ Hash │ │ Dir │ │ Image │ │ Deep │ │ ║
║ │ │ Worker │ │ Walker │ │ pHash │ │ Scan │ │ ║
║ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ ║
║ └────────────────────────────────────────────────────────────┘ ║
║ ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ LOCAL FILE SYSTEM │ ║
║ │ Config │ Rules │ History │ Whitelist │ Quarantine │ Logs │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════╝

text


## 2. MODULE DEPENDENCY GRAPH
text

                ┌─────────────────┐
                │   ipcHandlers   │
                └────────┬────────┘
                         │ uses
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│QuickScanner │  │DuplicateFndr│  │  FileOrganizer  │
└──────┬──────┘  └──────┬──────┘  └────────┬────────┘
       │                │                   │
       ▼                ▼                   ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│Platform Loc.│  │ HashComputer│  │  RulesEngine    │
│(OS-specific)│  │(Worker Thrd)│  │  BulkRenamer    │
└──────┬──────┘  └─────────────┘  └─────────────────┘
       │
       ▼
┌─────────────┐
│  fsUtils    │ ← All services use this
│  pathUtils  │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌──────────────┐
│QuarantineSvc│◄────────│ CleanerService│
└──────┬──────┘         └──────────────┘
       │
       ▼
┌─────────────┐
│ ConfigService│ ← All services read config from here
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Logger    │ ← All services log through here
└─────────────┘
text


## 3. DATA FLOW: QUICK SCAN → CLEAN
User Clicks React UI IPC Bridge Main Process
"Quick Scan"
│
├──────────────► scanStore
│ .startQuickScan()
│ │
│ ├──────────────────────────────► invoke(
│ │ 'scanner:quick-scan'
│ │ )
│ │ │
│ │◄── progress events ────────────────┤ QuickScanner
│ │ (IPC push) │ .scan()
│ │ │
│ Progress Bar │ results returned │
│ updates in real-time │◄──────────────────────────────────┘
│
│ Results Page
│ shown with
│ checkboxes
│
├──────────────► User reviews & selects items
│
├──────────────► "Clean Selected"
│ scanStore.executeClean()
│ │
│ ├──────────────────────────────► invoke(
│ │ 'cleaner:execute'
│ │ )
│ │ │
│ │ QuarantineService
│ │ .quarantine(items)
│ │ │
│ │ moves files to
│ │ quarantine folder
│ │ │
│ │◄──────────────────────────────────┘
│
│ "✓ 2.4 GB freed!"
│ Dashboard updated
▼

text


## 4. FILE ORGANIZER FLOW
Watch Folder Event Rules Engine File System
(chokidar detects
new file added)
│
▼
FolderWatcher
.handleNewFile(filePath)
│
├──── Get file info ──────────────────────────────► fs.stat()
│◄────────────────────────────────────────────────── FileInfo
│
├──── Evaluate rules ────────────────────────────► RulesEngine
│ .evaluate()
│◄────────────────────────────────────────────────── RuleAction
│ (or null)
│
├── if (action) ──────────── build destination path
│
├──── Preview or Execute?
│
│ [Preview Mode] [Execute Mode]
│ emit to UI FileOrganizer
│ "would move X to Y" .execute(action)
│ │
│ ┌─────▼──────┐
│ │ Conflict │
│ │ Check? │
│ └─────┬──────┘
│ skip│rename│overwrite
│ │
│ fs.rename() / fs.copyFile()
│ │
│ Log operation
│
▼

text


## 5. SECURITY BOUNDARY DIAGRAM
╔════════════════════════════════════════════════════════════════╗
║ RENDERER PROCESS (Untrusted Zone - like a webpage) ║
║ ┌─────────────────────────────────────────────────────────┐ ║
║ │ React App │ ║
║ │ │ ║
║ │ Can ONLY call: window.cleanSweepAPI.* │ ║
║ │ Cannot: access fs, exec, require, ipcRenderer directly │ ║
║ └────────────────────┬────────────────────────────────────┘ ║
╚═══════════════════════│════════════════════════════════════════╝
│ contextBridge (typed, validated)
╔═══════════════════════│════════════════════════════════════════╗
║ PRELOAD SCRIPT │ ║
║ ┌────────────────────▼────────────────────────────────────┐ ║
║ │ exposeInMainWorld('cleanSweepAPI', { │ ║
║ │ // Only specific, safe functions exposed │ ║
║ │ // Input validated before IPC call │ ║
║ │ // No raw IPC access │ ║
║ │ }) │ ║
║ └────────────────────┬────────────────────────────────────┘ ║
╚═══════════════════════│════════════════════════════════════════╝
│ ipcMain.handle (validated)
╔═══════════════════════│════════════════════════════════════════╗
║ MAIN PROCESS (Trusted Zone - full Node.js) ║
║ ┌────────────────────▼────────────────────────────────────┐ ║
║ │ IPC Handlers │ ║
║ │ → Input validation │ ║
║ │ → Permission checks │ ║
║ │ → Whitelist verification │ ║
║ │ → Service calls │ ║
║ │ → Quarantine before delete │ ║
║ └──────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝

text


## 6. PLATFORM ABSTRACTION LAYER
┌─────────────────────────────────────────────────────┐
│ Service Layer (shared) │
│ │
│ QuickScanner DuplicateFinder FileOrganizer ... │
└─────────────────────┬───────────────────────────────┘
│ calls
┌─────────────────────▼───────────────────────────────┐
│ PlatformDetector │
│ (process.platform === 'darwin' │
│ process.platform === 'win32') │
└──────────┬──────────────────────┬───────────────────┘
│ │
▼ ▼
┌──────────────────┐ ┌──────────────────────┐
│ macos.ts │ │ windows.ts │
│ │ │ │
│ Scan locations │ │ Scan locations │
│ App parsing │ │ Registry reading │
│ Startup items │ │ Startup items │
│ (launchd) │ │ (registry/scheduler) │
│ Memory APIs │ │ Memory APIs │
│ Path expansion │ │ Path expansion │
│ (~/Library...) │ │ (%APPDATA%...) │
└──────────────────┘ └──────────────────────┘

📁 DEVELOPMENT_PLAN.md
Markdown

# DEVELOPMENT_PLAN.md — CleanSweep

## Sprint Breakdown (2-week sprints)

### Sprint 1-2: Foundation (Weeks 1-4)
- [ ] Electron + React + TypeScript project setup
- [ ] Build pipeline (Vite + electron-builder)
- [ ] IPC architecture and preload setup
- [ ] Config service (read/write local JSON)
- [ ] Platform detection layer
- [ ] Logger service
- [ ] Basic app shell (sidebar nav, routing)
- [ ] Dark/light theme

### Sprint 3-4: Core Scanner (Weeks 5-8)
- [ ] QuickScanner (platform-specific locations)
- [ ] Browser cache scanner (Chrome, Firefox, Edge)
- [ ] Scan progress reporting via IPC events
- [ ] Scan results UI with category breakdown
- [ ] Whitelist/exclusion system
- [ ] QuarantineService (safe delete)
- [ ] Clean execution + confirmation dialogs
- [ ] Scan history storage

### Sprint 5-6: Duplicate Finder (Weeks 9-12)
- [ ] Worker thread pool
- [ ] Size-grouping optimization
- [ ] SHA-256 hashing in workers
- [ ] Duplicate results UI (virtualized list)
- [ ] Auto-selection strategies
- [ ] Preview before delete
- [ ] Image duplicate finder (pHash)

### Sprint 7-8: File Organizer (Weeks 13-16)
- [ ] RulesEngine implementation
- [ ] Rules builder UI (visual condition builder)
- [ ] File organizer preview mode
- [ ] File organizer execute
- [ ] BulkRenamer with preview
- [ ] FolderWatcher (chokidar integration)
- [ ] Watch folders UI

### Sprint 9-10: Advanced Features (Weeks 17-20)
- [ ] Disk Analyzer (treemap with D3)
- [ ] App Manager + Uninstaller
- [ ] Startup Manager
- [ ] Privacy Cleaner
- [ ] Scheduler (node-cron)
- [ ] Memory Optimizer
- [ ] Large/old file finder

### Sprint 11: Dashboard & Polish (Weeks 21-22)
- [ ] Dashboard with health score
- [ ] Stats widgets
- [ ] Scan history reports
- [ ] Settings pages (all)
- [ ] System tray + menu bar
- [ ] Keyboard shortcuts
- [ ] Accessibility review

### Sprint 12: Testing & Release (Weeks 23-24)
- [ ] Unit test coverage > 80%
- [ ] E2E tests for critical flows
- [ ] macOS notarization
- [ ] Windows code signing
- [ ] Performance profiling
- [ ] Beta testing
- [ ] Release v1.0

## Team Roles (solo-friendly, can be done by 1-2 devs)
- 1x Full-stack Electron/React developer
- 1x Designer (UI/UX — can be same person with Figma)

## Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| macOS permissions changes | Medium | High | Monitor Apple WWDC, build permission flow early |
| Windows defender false positives | High | High | Code sign early, submit for review |
| Performance on large drives | Medium | High | Worker threads, test with 1M+ file sets |
| Safe delete edge cases | Low | Critical | Extensive quarantine testing |
| File watcher performance | Medium | Medium | Use chokidar with debounce |
This gives you a complete, production-ready blueprint for CleanSweep. Here's a summary of what was created:

📦 What You Got
Document	Contents
PRD.md	33 features across 7 modules, user personas, success metrics, monetization, user flows, roadmap
TRD.md	Full tech stack, IPC design, data schemas, service implementations, security model, testing strategy, build config
ARCHITECTURE.md	6 architecture diagrams (system overview, module deps, data flows, security boundary, platform abstraction)
DEVELOPMENT_PLAN.md	12 sprints, 24-week plan, risk register
🏗️ Key Architecture Decisions
Electron + React — single codebase, macOS + Windows
Worker Threads — non-blocking heavy operations (hashing, scanning)
No database — pure JSON files in AppData/Application Support
Quarantine-first — never hard-delete without user review period
Platform abstraction layer — all OS-specific code isolated



hey i want to make a cleaner + files sorting app for mac windows both from a single codebase. i want all the features a cleaner + file sorting app has . so first i want you to go and find all feature a app like this has and Then create a PRD.md and TRD.md file of this project. this app will not have a database or any type of cloud based services the user just installs and uses it . i want you to plan the project and write the PRD and TRD and also architecture diagram and all other things which i may have not mentioned .


