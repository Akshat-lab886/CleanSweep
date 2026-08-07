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