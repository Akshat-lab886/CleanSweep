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


