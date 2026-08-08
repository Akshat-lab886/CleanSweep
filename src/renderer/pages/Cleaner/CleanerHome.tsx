import React, { useState } from 'react'
import { Sparkles, Globe, Loader2, CheckCircle2, ShieldCheck, Trash2, Search, X, RotateCcw } from 'lucide-react'
import { useScanStore } from '../../stores/scanStore'
import { useUIStore } from '../../stores/uiStore'
import { BROWSER_LIST } from '../../../shared/constants'
import { formatBytes } from '../../utils/format'
import { usePlatform } from '../../hooks/usePlatform'
import ScanCategoryCard from '../../components/shared/ScanCategoryCard'
import FileListItem from '../../components/shared/FileListItem'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import * as Progress from '@radix-ui/react-progress'

export default function CleanerHome() {
  const {
    status,
    scanType,
    progress,
    results,
    selectedItemIds,
    totalSelectedSize,
    totalFoundSize,
    startQuickScan,
    startBrowserScan,
    cancelScan,
    toggleCategorySelection,
    toggleItemSelection,
    selectAll,
    deselectAll,
    executeClean,
    clearResults,
  } = useScanStore()

  const { addToast } = useUIStore()
  const { trashName } = usePlatform()

  const [cleaning, setCleaning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [freedSpace, setFreedSpace] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [useSystemTrash, setUseSystemTrash] = useState(true)

  const [browserToggles, setBrowserToggles] = useState<Record<string, boolean>>({
    chrome: true,
    firefox: true,
    safari: true,
    edge: false,
    brave: false,
    opera: false,
  })

  const handleClean = async () => {
    setCleaning(true)
    // Pass false to use system trash, true for quarantine
    const result = await executeClean(!useSystemTrash)
    if (result) {
      setFreedSpace(result.freed)
      addToast(`Successfully cleaned ${formatBytes(result.freed)} to ${useSystemTrash ? trashName : 'Quarantine'}!`, 'success')
    }
    setCleaning(false)
    setShowConfirm(false)
  }

  // IDLE VIEW
  if (status === 'idle') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        <div className="text-center max-w-xl mx-auto space-y-2 py-4">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            System & Browser Cleaner
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recover gigabytes of space by scanning cache files, log files, temporary items, and browser junk.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Scan Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick System Clean</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">System caches, logs, temp files & trash</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Scans safe system junk paths including user cache, system logs, crash reporter dumps, and system temp folders.
              </p>
            </div>
            <button
              onClick={startQuickScan}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start System Scan</span>
            </button>
          </div>

          {/* Browser Scan Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Browser Cache Clean</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clear web browser profile caches</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Select Browsers:
                </span>
                <div className="flex flex-wrap gap-2">
                  {BROWSER_LIST.map((browser) => (
                    <button
                      key={browser}
                      onClick={() => setBrowserToggles((t) => ({ ...t, [browser]: !t[browser] }))}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all border ${
                        browserToggles[browser]
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {browser}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const enabled = Object.keys(browserToggles).filter((b) => browserToggles[b])
                startBrowserScan(enabled, { cache: true })
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Start Browser Scan</span>
            </button>
          </div>
        </div>

        {/* Safety Note Banner */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 border border-emerald-500/30 text-xs text-gray-600 dark:text-gray-300">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>
            <strong>Safety First:</strong> Files are sent directly to your native <strong>{trashName}</strong> so you can inspect or restore them anytime. System protected directories are automatically excluded.
          </span>
        </div>
      </div>
    )
  }

  // SCANNING VIEW (Radar HUD)
  if (status === 'scanning') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        {/* Radar Spinning Visual */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 dark:border-blue-500/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-blue-500/30 dark:border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-radar" />
          <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
            Scanning {scanType} Storage...
          </h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-lg mx-auto px-4">
            {progress?.currentPath || 'Indexing filesystem directories...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <Progress.Root
            value={progress?.percentage || 0}
            className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden"
          >
            <Progress.Indicator
              style={{ width: `${progress?.percentage || 0}%` }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
            />
          </Progress.Root>
          <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
            <span>{progress?.filesScanned || 0} Files Evaluated</span>
            <span>{progress?.percentage || 0}%</span>
          </div>
        </div>

        <button
          onClick={cancelScan}
          className="px-6 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-rose-500 hover:text-white text-gray-700 dark:text-gray-300 rounded-xl font-medium text-xs transition-all"
        >
          Cancel Scan
        </button>
      </div>
    )
  }

  // RESULTS VIEW
  const allItems = results.flatMap((r) => r.items)
  const filteredItems = allItems.filter(
    (item) =>
      item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Header Summary */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Scan Completed</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
              {allItems.length} Items Found
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total scan size: <strong>{formatBytes(totalFoundSize)}</strong> • Selected:{' '}
            <strong className="text-blue-500">{formatBytes(totalSelectedSize)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Deselect All
          </button>
          <button
            onClick={clearResults}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
            title="Start New Scan"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Cards List */}
        <div className="space-y-3">
          {results.map((result) => {
            const catSelectedSize = result.items
              .filter((i) => selectedItemIds.has(i.id))
              .reduce((sum, i) => sum + i.size, 0)
            const isAllSelected = result.items.length > 0 && result.items.every((i) => selectedItemIds.has(i.id))

            return (
              <ScanCategoryCard
                key={result.id}
                categoryLabel={result.categoryLabel}
                category={result.category}
                itemCount={result.items.length}
                totalSize={result.totalSize}
                selectedSize={catSelectedSize}
                isAllSelected={isAllSelected}
                onToggleSelectAll={(bool) => toggleCategorySelection(result.category, bool)}
              />
            )
          })}
        </div>

        {/* File Detail Virtual List */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 flex flex-col h-[520px]">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by path or name..."
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredItems.map((item) => (
              <FileListItem
                key={item.id}
                item={item}
                isSelected={selectedItemIds.has(item.id)}
                onToggle={() => toggleItemSelection(item.id)}
              />
            ))}
          </div>

          {/* Action Bar */}
          <div className="pt-4 mt-2 border-t border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSystemTrash}
                  onChange={(e) => setUseSystemTrash(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Move to System {trashName}</span>
              </label>
            </div>

            <button
              disabled={selectedItemIds.size === 0}
              onClick={() => setShowConfirm(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clean {selectedItemIds.size} Items ({formatBytes(totalSelectedSize)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleClean}
        title={`Move ${selectedItemIds.size} Items to ${useSystemTrash ? trashName : 'Quarantine'}?`}
        description={`This will clean ${formatBytes(totalSelectedSize)} of storage. Files will be moved directly to your ${
          useSystemTrash ? trashName : 'CleanSweep Quarantine'
        } where you can easily view or restore them.`}
        confirmText={cleaning ? 'Cleaning...' : `Move to ${useSystemTrash ? trashName : 'Quarantine'}`}
      />
    </div>
  )
}
