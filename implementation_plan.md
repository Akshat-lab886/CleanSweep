# Implementation Plan

## Overview

This plan addresses all identified issues and significantly enhances the cleaning features of CleanSweep, with primary focus on making the cleaning functionality more robust, safe, and feature-rich.

## Issues Identified

### Critical Bugs
1. **`deepScan` is identical to `quickScan`** - `ScannerService.deepScan()` simply calls `quickScan()`, providing no real deep-scan capability.
2. **`BrowserScanner` ignores all options** - `clearCache`, `clearCookies`, `clearHistory`, `clearDownloadHistory` flags are parsed but never used; it always scans only cache.
3. **`QuarantineService.init()` never awaited** - constructor calls `this.init()` without await, so quarantine directory may not exist on first use.
4. **Dangerous fallback in `trashItem`** - if `shell.trashItem` fails, it falls back to `fs.rm` (permanent deletion) which is dangerous and violates the safety-first design.
5. **`selectAll` in cleaner selects unsafe items** - `selectAll()` selects ALL items including `safeToDelete: false`, risking deletion of user documents/system files.

### Feature Gaps
1. **No real deep scan** - should scan more locations, deeper depth, include hidden files, and larger scope.
2. **Browser cleaner options not respected** - cookies, history, downloads are never actually cleared.
3. **No "Deep Clean" button in UI** - only Quick System Clean and Browser Cache Clean are shown.
4. **No "Select Safe Items Only" button** - users can easily select unsafe items.
5. **No quarantine retention cleanup** - expired entries are never auto-purged.
6. **No custom path scanning in cleaner UI** - `customPaths` option exists but never surfaced.
7. **Limited scan locations** - missing many common junk locations.
8. **Scan config not applied** - `includeHidden`, `minFileSizeBytes`, `excludedExtensions` from config are not used in scanner.

## Detailed Plan

### [Types] Type System Changes

No breaking type system changes. We will extend existing interfaces:

- **`ScanOptions`** (new interface in `src/shared/types.ts`):
```
typescript
export interface ScanOptions {
  customPaths?: string[]
  includeHidden?: boolean
  minFileSizeBytes?: number
  excludedExtensions?: string[]
  maxDepth?: number
}
```

### [Files] File Modifications

#### New Files
- **`src/main/services/scanner/DeepScanService.ts`** - Dedicated deep scan service that scans deeper, includes hidden files, scans additional locations, and respects config.
- **`src/main/services/cleaner/CleanerService.ts`** - Enhanced cleaner service that respects per-browser options (cookies, history, downloads), handles safety checks, and provides purge-by-category.

#### Modified Files
- **`src/shared/types.ts`** - Add `ScanOptions` interface.
- **`src/shared/constants.ts`** - Add more scan categories/locations, bump version to `1.5.0`.
- **`src/main/services/scanner/ScannerService.ts`** - Fix deep scan to use DeepScanService, respect scan config options, add `selectSafeItems` logic, respect `minFileSizeBytes` and `excludedExtensions`.
- **`src/main/services/scanner/BrowserScanner.ts`** - Respect all browser cleaning options (cache, cookies, history, downloads).
- **`src/main/services/config/QuarantineService.ts`** - Fix `init()` await, fix dangerous fallback, add auto-purge of expired entries.
- **`src/main/ipcHandlers.ts`** - Add handlers for deep scan with options, safe-select, purge-expired quarantine.
- **`src/main/preload.ts`** - Expose new APIs.
- **`src/renderer/types/electron.d.ts`** - Update type definitions for new APIs.
- **`src/renderer/pages/Cleaner/CleanerHome.tsx`** - Add Deep Clean button, Select Safe Items Only button, custom path scanning, show unsafe items warning.
- **`src/renderer/stores/scanStore.ts`** - Add `selectSafeItems`, `startDeepScan` with options, respect config.
- **`src/renderer/stores/settingsStore.ts`** - Load scan config and pass to scanner.
- **`src/shared/ipcChannels.ts`** - Add new IPC channels for deep scan options and safe-select.

### [Functions] Function Modifications

#### New Functions
- **`DeepScanService.deepScan(options, onProgress, whitelist)`** - `src/main/services/scanner/DeepScanService.ts` - Performs real deep scan with expanded locations, hidden file inclusion, deeper recursive scanning.
- **`CleanerService.cleanBrowserData(browserId, options)`** - `src/main/services/cleaner/CleanerService.ts` - Clears browser cache, cookies, history, downloads per user selection.
- **`QuarantineService.purgeExpired()`** - `src/main/services/config/QuarantineService.ts` - Removes expired quarantine entries based on retentionDays config.

#### Modified Functions
- **`ScannerService.quickScan()`** - Respect `includeHidden`, `minFileSizeBytes`, `excludedExtensions` from config.
- **`ScannerService.deepScan()`** - Use `DeepScanService` instead of calling quickScan.
- **`BrowserScanner.scanBrowsers()`** - Respect `clearCookies`, `clearHistory`, `clearDownloadHistory` options.
- **`QuarantineService.trashItem()`** - Remove dangerous `fs.rm` fallback; return error so caller handles gracefully.
- **`QuarantineService.init()`** - Make constructor properly await init.
- **`scanStore.startDeepScan()`** - Pass config options to deep scan API.
- **`scanStore.selectAll()`** - Only select safe-to-delete items by default.
- **`scanStore.selectSafeItems()`** - New function to select only safe items.

### [Classes] Class Modifications

#### New Classes
- **`DeepScanService`** - `src/main/services/scanner/DeepScanService.ts` - Dedicated deep scanning engine.
- **`CleanerService`** - `src/main/services/cleaner/CleanerService.ts` - Enhanced cleaning orchestration.

#### Modified Classes
- **`ScannerService`** - Add config-aware scanning, real deep scan delegation.
- **`BrowserScanner`** - Full browser data clearing support.
- **`QuarantineService`** - Fix init, remove dangerous fallback, add expiry purge.

### [Dependencies] Dependency Changes

No new external dependencies required. All changes use existing packages (`fast-glob`, `fs/promises`, `shell.trashItem`).

### [Testing] Testing Approach

- Run `npm run build` to verify TypeScript compilation passes with 0 errors.
- Run `npm run dev` to manually test:
  1. Quick scan works and respects config.
  2. Deep scan finds more items than quick scan.
  3. Browser scan respects cookie/history/download options.
  4. "Select Safe Items Only" only selects safe items.
  5. Quarantine expiry auto-purge works.
  6. Custom path scanning works.

### [Implementation Order]

1. Update `src/shared/types.ts` - Add `ScanOptions` interface.
2. Update `src/shared/constants.ts` - Add new scan locations, bump version.
3. Create `src/main/services/scanner/DeepScanService.ts`.
4. Update `src/main/services/scanner/ScannerService.ts` - Config-aware scanning, deep scan delegation.
5. Update `src/main/services/scanner/BrowserScanner.ts` - Respect all browser options.
6. Create `src/main/services/cleaner/CleanerService.ts`.
7. Update `src/main/services/config/QuarantineService.ts` - Fix bugs, add expiry purge.
8. Update `src/main/ipcHandlers.ts` - Wire new services.
9. Update `src/main/preload.ts` and `src/renderer/types/electron.d.ts`.
10. Update `src/shared/ipcChannels.ts` - Add new channels.
11. Update `src/renderer/stores/scanStore.ts` - Config-aware scanning, safe-select.
12. Update `src/renderer/pages/Cleaner/CleanerHome.tsx` - UI improvements.
13. Run `npm run build` and verify 0 errors.
