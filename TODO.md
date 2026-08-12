# CleanSweep Implementation Tasks

## Phase 1: Type & Constant Updates
- [x] Step 1: Update `src/shared/types.ts` - Add `ScanOptions` interface
- [x] Step 2: Update `src/shared/constants.ts` - Add new scan locations, bump version to 1.5.0

## Phase 2: Main Process Services
- [x] Step 3: Create `src/main/services/scanner/DeepScanService.ts`
- [x] Step 4: Update `src/main/services/scanner/ScannerService.ts` - Config-aware scanning, deep scan delegation
- [x] Step 5: Update `src/main/services/scanner/BrowserScanner.ts` - Respect all browser options
- [x] Step 6: Create `src/main/services/cleaner/CleanerService.ts`
- [x] Step 7: Update `src/main/services/config/QuarantineService.ts` - Fix init, dangerous fallback, expiry purge

## Phase 3: IPC Layer
- [x] Step 8: Update `src/main/ipcHandlers.ts` - Wire new services
- [x] Step 9: Update `src/main/preload.ts` and `src/renderer/types/electron.d.ts`
- [x] Step 10: Update `src/shared/ipcChannels.ts` - Add new channels

## Phase 4: Renderer Updates
- [x] Step 11: Update `src/renderer/stores/scanStore.ts` - Config-aware scanning, safe-select
- [x] Step 12: Update `src/renderer/pages/Cleaner/CleanerHome.tsx` - UI improvements

## Phase 5: Verification
- [x] Step 13: Run TypeScript check and build verification
