# 🧹 CleanSweep

> **Cross-platform Desktop Cleaner & Intelligent File Organizer**  
> *Built with Electron 28, React 18, TypeScript 5, Vite 5, Zustand 4, and Tailwind CSS 3.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: macOS | Windows](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-brightgreen.svg)](https://github.com/Akshat-lab886/CleanSweep/releases)
[![Electron: 28](https://img.shields.io/badge/Electron-28.0.0-blue)](https://www.electronjs.org/)
[![TypeScript: 5](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

CleanSweep is a modern, high-performance desktop utility for macOS and Windows designed to clean junk files, recover wasted disk space, locate duplicates, automate file organization, and analyze disk usage with rich visual tools.

---

## 📥 Downloads

Get the latest installer for your operating system from the **[GitHub Releases Page](https://github.com/Akshat-lab886/CleanSweep/releases/tag/v1.0.0)**:

| Platform | Target | Download Link |
| :--- | :--- | :--- |
| **macOS (Apple Silicon)** | M1/M2/M3/M4 Macs | [CleanSweep-1.0.0-arm64.dmg](https://github.com/Akshat-lab886/CleanSweep/releases/download/v1.0.0/CleanSweep-1.0.0-arm64.dmg) |
| **macOS (Intel)** | Intel Macs | [CleanSweep-1.0.0.dmg](https://github.com/Akshat-lab886/CleanSweep/releases/download/v1.0.0/CleanSweep-1.0.0.dmg) |
| **Windows** | Windows 10 / 11 (64-bit) | [CleanSweep Setup 1.0.0.exe](https://github.com/Akshat-lab886/CleanSweep/releases/download/v1.0.0/CleanSweep.Setup.1.0.0.exe) |

---

## ✨ Key Features

### 1. 🧹 System & Browser Cleaner
- **Quick Clean:** Scans common temporary files, system caches, log files, crash reports, and system trash.
- **Browser Cleaner:** Detects cache across Chrome, Firefox, Safari, Edge, Brave, and Opera.
- **Privacy Cleaner:** Removes bash/zsh history, QuickLook caches, and recent document shortcuts.
- **Safety Guarantee:** Critical directories (`/System/`, `/usr/bin/`, `C:\Windows\System32`) are protected.

### 2. 👯 Duplicate Finder
- **High Speed Multi-Phase Detection:** Filters candidates by byte size before running SHA-256 hashing in dedicated Node.js worker threads.
- **Smart Auto-Selection:** Select duplicates using "Keep Newest" or "Keep Oldest" rules with one click.
- **Wasted Space Calculator:** Displays total recoverable storage per duplicate group.

### 3. 📂 Smart File Organizer & Bulk Renamer
- **Priority Rules Engine:** Sort files dynamically into custom folder structures using tokens like `{year}`, `{month}`, `{day}`, `{type}`, `{ext}`, and `{name}`.
- **Condition Matching:** Filter by extension, size, modified date, or custom regex.
- **Live Preview Table:** Review exact source and target paths with collision indicators before executing.
- **Bulk Renamer:** Apply prefixes, suffixes, case changes, pattern replacements, and sequential numbering in batch.
- **Folder Watchers:** Background file watching via `chokidar` to automatically organize files as soon as they land in watched directories (e.g. `~/Downloads`).

### 4. 📊 Disk Analyzer
- **Squarified D3 Treemap:** Visualize folder sizes interactively with drill-down navigation and color coding by file category.
- **Large Files Finder:** Scan and sort top 1,000 files larger than configurable thresholds (100MB, 500MB, 1GB).
- **Empty Folder Cleaner:** Detect and prune abandoned empty directory structures.
- **Old Files Finder:** Highlight files untouched for 6+ months or 1+ years.

### 5. 🚀 App Manager & Startup Controller
- **Installed Applications:** Parses macOS `.app` bundle plists and Windows Uninstall Registry keys to show calculated size, version, and publisher.
- **Startup Items:** Inspect and toggle macOS LaunchAgents and Windows startup commands to accelerate boot times.

### 6. 🛡️ Quarantine System (100% Safe Removal)
- **Zero Direct Deletions:** Files selected for cleaning or duplicate removal are never permanently purged immediately.
- **Safe Isolation:** Items are moved to `userData/quarantine/` with UUID mapping and retention tracking (default 7 days).
- **One-Click Restore:** Accidentally removed a file? Restore it back to its original path instantly.

### 7. ⏱️ Automated Scheduler & System Tray
- **Cron Jobs:** Schedule automated background scans (daily, weekly, monthly) using `node-cron`.
- **System Tray:** Quick scan launcher and status tracker in the macOS Menu Bar and Windows System Tray.
- **Health Score Dashboard:** Real-time system health calculation with disk usage donut charts and CPU/RAM usage meters.

---

## 🔒 Security & Privacy Architecture

- **100% Local Storage:** All configuration, logs, whitelist rules, and history are stored locally as JSON files in your operating system's `userData` directory.
- **Zero Telemetry / No Database / No Cloud:** Your file paths, personal data, and system stats never leave your machine.
- **IPC Architecture:** Electron `contextBridge` exposes strictly typed API channels. Renderer UI components have **zero direct access** to Node.js `fs` or `child_process`.

---

## 🛠️ Tech Stack

- **Framework:** Electron 28
- **Frontend:** React 18 + TypeScript 5
- **Bundler:** Vite 5 + `vite-plugin-electron`
- **State Management:** Zustand 4
- **Styling:** Tailwind CSS 3 + Lucide Icons
- **UI Components:** Radix UI (`Dialog`, `Progress`, `ScrollArea`) + `@tanstack/react-virtual`
- **Visualization:** Recharts & D3.js (Treemap)
- **Background Tasks:** Node.js Worker Threads, `chokidar`, `node-cron`
- **Packaging:** `electron-builder`

---

## 🚀 Development & Build Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/Akshat-lab886/CleanSweep.git
cd CleanSweep
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Starts Vite dev server on `http://localhost:5173` and launches Electron with live hot-reloading.

### 3. Type Checking
```bash
# Check renderer TypeScript
npx tsc --noEmit

# Check main process TypeScript
npx tsc -p tsconfig.main.json --noEmit
```

### 4. Build Production Binaries
```bash
# Build Vite frontend + Main process bundle
npm run build

# Package macOS DMG (Intel & Apple Silicon)
npm run build:mac

# Package Windows NSIS Installer (.exe)
npm run build:win

# Package for all platforms
npm run build:all
```
Generated installers will be output to the `release/` directory.

---

## 📁 Repository Structure

```
CleanSweep/
├── src/
│   ├── main/                  # Electron Main Process (Node.js)
│   │   ├── index.ts           # App lifecycle & window management
│   │   ├── preload.ts         # contextBridge API definition
│   │   ├── ipcHandlers.ts     # IPC channel handlers
│   │   ├── trayManager.ts     # System tray controller
│   │   ├── services/          # Core backend logic
│   │   │   ├── scanner/       # Quick scan & browser scanner
│   │   │   ├── duplicates/    # Worker thread duplicate detector
│   │   │   ├── organizer/     # Rules engine, organizer & watcher
│   │   │   ├── disk/          # Treemap builder & large file finder
│   │   │   ├── apps/          # App manager & startup items
│   │   │   ├── config/        # ConfigService & QuarantineService
│   │   │   ├── system/        # PlatformService & SystemStatsService
│   │   │   └── scheduler/     # Background cron scheduler
│   │   ├── workers/           # Worker threads (SHA-256 hash worker)
│   │   └── utils/             # fsUtils, logger, ipcHelper
│   ├── renderer/              # React 18 UI
│   │   ├── index.html         # HTML root
│   │   ├── main.tsx           # React DOM root
│   │   ├── App.tsx            # Main shell & toast container
│   │   ├── router.tsx         # HashRouter navigation
│   │   ├── components/        # Layout, shared modals, virtualized rows
│   │   ├── pages/             # Dashboard, Cleaner, Duplicates, Organizer, etc.
│   │   ├── stores/            # Zustand state stores
│   │   ├── hooks/             # Custom IPC & platform hooks
│   │   └── styles/            # Tailwind CSS & custom animations
│   └── shared/                # Types, constants & IPC channels
├── assets/                    # App icons & macOS entitlements
├── electron-builder.json      # Packaging configuration
├── vite.config.ts             # Vite bundler configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an Issue or submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
