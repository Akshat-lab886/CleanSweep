
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

