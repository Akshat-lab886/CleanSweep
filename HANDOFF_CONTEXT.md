# 🧹 CleanSweep — Complete Agent Context & Project State Handoff

> **Purpose:** Single source of truth context file for any AI coding agent resuming work on CleanSweep.
> **Current Version:** `v1.4.0` | **Repository:** `Akshat-lab886/CleanSweep`
> **GitHub Release Tag:** [`v1.4.0`](https://github.com/Akshat-lab886/CleanSweep/releases/tag/v1.4.0)

---

## 1. PROJECT ARCHITECTURE & TECH STACK

- **Framework:** Electron 28 + React 18 + TypeScript 5 + Vite 5 + Zustand 4 + Tailwind CSS 3 + React Router 6
- **Architecture Pattern:**
  - `src/main/` → Main process (Node.js, filesystem operations, multi-threaded scanners, IPC handlers)
  - `src/renderer/` → React UI (Glassmorphism design, D3 storage treemaps, Recharts charts, 0 direct `fs` access)
  - `src/shared/` → Shared interfaces (`types.ts`), constants (`constants.ts`), and channel definitions (`ipcChannels.ts`)
- **IPC Isolation:** Strictly enforced via `contextBridge` in `src/main/preload.ts` (`window.cleanSweepAPI`). `nodeIntegration: false`, `contextIsolation: true`.
- **Primary OS Support:** macOS (Apple Silicon `arm64` & Intel `x64`) + Windows (`win32`).

---

## 2. KEY RECENT IMPLEMENTATIONS (`v1.4.0`)

### ⚡ 2.1 Ultra-Fast Parallel Scanner Engine (`ScannerService.ts`)
- **Single-Pass Stat Stream (`stats: true`)**: Replaced slow recursive directory traversals with single-pass `fast-glob` readdir stat streams, indexing thousands of cache items in milliseconds.
- **Isolated App Cache Enumeration**: `~/Library/Caches/*` top-level folders are enumerated independently using `fs.readdir`. An `EACCES` permission error on a system folder no longer aborts scanning for VS Code, Spotify, Slack, Discord, Chrome, Safari, Xcode, or Adobe caches.
- **5-Way Concurrency Pool**: Processes top scan locations in parallel (`Promise.all`), taking full advantage of modern multi-core CPUs and SSD read throughput.

### 🛡️ 2.2 Ironclad Protection Engine (`isSafeToDelete` & `QuarantineService.ts`)
- **Strictly Protected Items (NEVER Deleted)**:
  - **Credentials & Security**: `.ssh/`, `.aws/`, `.kube/`, `.gnupg/`, `.keychain`, `~/Library/Keychains/`, `~/Library/Preferences/`, `.git/`, `.env`
  - **User Workspaces**: `~/Documents/`, `~/Desktop/`, `~/Pictures/`, `~/Movies/`, `~/Music/`, `~/Projects/`, `~/Developer/`, `iCloud Drive`, `Dropbox`, `OneDrive`, `Google Drive`
  - **Active Locks**: `.lock` and `.lck` files
- **Native OS System Trash (`shell.trashItem()`)**: Files are safely sent to native System Trash in parallel chunks of 15 concurrent operations.

### 🎨 2.3 Hyper-Premium UI & 60fps Micro-Animations
- **Typography**: Google Fonts **`Outfit`** (display headings) and **`Inter`** (clean body telemetry) in `index.html`.
- **3D Page Transitions**: Key-based spring scale-fade and slide entrance (`.animate-page-enter`) in `MainLayout.tsx`.
- **Radar Scanner HUD**: Concentric ripple waves (`.animate-ripple`, `.animate-glow-halo`) and rotating radar beam.
- **Micro-Interactions**: Metallic light sweep shimmer (`.shimmer-button`), float physics bounce (`.animate-float-gentle`), and glassmorphism hover lift (`.card-hover-lift`).

---

## 3. FILE MANIFEST & DIRECTORY LAYOUT

```
CleanSweep/
├── src/
│   ├── main/
│   │   ├── index.ts                      # BrowserWindow creation & Electron lifecycle
│   │   ├── preload.ts                    # ContextBridge IPC API definition
│   │   ├── ipcHandlers.ts                # IPC channel routing to services
│   │   ├── trayManager.ts                # System tray icon & menu
│   │   ├── services/
│   │   │   ├── scanner/
│   │   │   │   ├── ScannerService.ts     # Fast-glob multi-threaded scanner & safety rules
│   │   │   │   └── BrowserScanner.ts     # Instant browser cache indexer
│   │   │   ├── config/
│   │   │   │   ├── ConfigService.ts      # Persistent JSON configuration & history
│   │   │   │   └── QuarantineService.ts  # Native System Trash & quarantine safety
│   │   │   ├── duplicates/
│   │   │   │   └── DuplicateFinderService.ts # 4-phase duplicate finder engine
│   │   │   ├── organizer/
│   │   │   │   ├── FileOrganizerService.ts   # Rule-based auto organizer
│   │   │   │   ├── RulesEngine.ts            # Condition matcher
│   │   │   │   ├── BulkRenamerService.ts     # Pattern-based bulk rename engine
│   │   │   │   └── FolderWatcherService.ts   # Chokidar real-time folder watcher
│   │   │   ├── disk/
│   │   │   │   └── DiskAnalyzerService.ts    # Tree builder & top 1000 large file finder
│   │   │   ├── apps/
│   │   │   │   ├── AppManagerService.ts      # Native app list & uninstaller
│   │   │   │   └── StartupManagerService.ts  # Startup item manager
│   │   │   ├── scheduler/
│   │   │   │   └── SchedulerService.ts      # Cron scheduled background cleaning
│   │   │   └── system/
│   │   │       ├── PlatformService.ts        # Path expander & 20+ scan locations
│   │   │       └── SystemStatsService.ts     # Real-time RAM, CPU, & Disk telemetry
│   │   └── utils/
│   │       ├── fsUtils.ts                # Fast filesystem stat & glob utilities
│   │       ├── ipcHelper.ts              # safeHandle wrapper for IPCResponse
│   │       └── logger.ts                 # JSON lines log rotator
│   ├── renderer/
│   │   ├── index.html                    # Fonts (Outfit & Inter) & CSP
│   │   ├── main.tsx                      # React root
│   │   ├── App.tsx                       # Layout & toast wrapper
│   │   ├── router.tsx                    # HashRouter routes
│   │   ├── styles/
│   │   │   ├── globals.css               # Tailwind imports, typography & glassmorphism
│   │   │   └── animations.css            # 3D page transitions, ripples & glow keyframes
│   │   ├── pages/
│   │   │   ├── Dashboard/Dashboard.tsx   # SVG Health Ring, RAM/CPU meters & Recharts
│   │   │   ├── Cleaner/CleanerHome.tsx   # Scanning HUD radar & category filter chips
│   │   │   ├── Duplicates/DuplicatesHome.tsx # Duplicate group cards & hash badges
│   │   │   ├── Organizer/OrganizerHome.tsx   # Rule editor modal & renamer table
│   │   │   ├── Disk/DiskAnalyzer.tsx     # D3 squarified storage treemap
│   │   │   ├── Apps/AppsHome.tsx         # App uninstaller & startup items
│   │   │   ├── Scheduler/SchedulerHome.tsx   # Cron task scheduler UI
│   │   │   ├── Quarantine/QuarantineHome.tsx # Trash management & restoration
│   │   │   └── Settings/SettingsHome.tsx # App version & preferences
│   │   └── components/layout/
│   │       ├── Sidebar.tsx               # Glowing active pills & outfit font headers
│   │       ├── TopBar.tsx                # System status bar & search
│   │       └── MainLayout.tsx            # Animated page enter wrapper
│   └── shared/
│       ├── types.ts                      # Shared interfaces across main & renderer
│       ├── constants.ts                  # APP_VERSION = '1.4.0' & scan categories
│       └── ipcChannels.ts                # Channel constants (`cs:*`)
├── electron-builder.json                 # DMG (arm64 & x64) & NSIS build config
├── package.json                          # Scripts & dependencies
└── tsconfig.json                         # Project TS config
```

---

## 4. COMMANDS & BUILD SCRIPTS

```bash
# Type check renderer & main process (Passes 0 errors)
npx tsc --noEmit && npx tsc -p tsconfig.main.json --noEmit

# Run local development server
npm run dev

# Build production bundle
npm run build

# Package macOS DMG binaries (CleanSweep-1.4.0-arm64.dmg & CleanSweep-1.4.0.dmg)
npm run build:mac

# Create and publish GitHub release
git add . && git commit -m "bump: release v1.4.0" && git push origin main
gh release create v1.4.0 release/CleanSweep-1.4.0-arm64.dmg release/CleanSweep-1.4.0.dmg --title "CleanSweep v1.4.0 - Precision Safety & App Cache Engine" --draft=false --latest
```

---

## 5. RECENT VERIFICATION & STATUS
- **TypeScript Error Count:** **0 ERRORS** across renderer and main process.
- **Production Build Status:** Successfully compiled and built DMG assets for macOS (`CleanSweep-1.4.0-arm64.dmg` & `CleanSweep-1.4.0.dmg`).
- **GitHub Release Status:** Published as `Latest` release `v1.4.0` at `https://github.com/Akshat-lab886/CleanSweep/releases/tag/v1.4.0`.
