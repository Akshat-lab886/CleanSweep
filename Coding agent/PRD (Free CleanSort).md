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