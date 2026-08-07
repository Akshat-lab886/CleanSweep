import React, { useState } from 'react'
import { Sparkles, Globe, Loader2, CheckCircle } from 'lucide-react'
import { useScanStore } from '../../stores/scanStore'
import { useUIStore } from '../../stores/uiStore'
import { BROWSER_LIST } from '../../../shared/constants'
import { formatBytes } from '../../utils/format'
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
  const [cleaning, setCleaning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [freedSpace, setFreedSpace] = useState(0)
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
    const result = await executeClean(true)
    if (result) {
      setFreedSpace(result.freed)
      addToast(`Cleaned ${formatBytes(result.freed)}!`, 'success')
    }
    setCleaning(false)
    setShowConfirm(false)
  }

  // Idle view
  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Quick Scan Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Quick Clean</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scan common junk locations</p>
              </div>
            </div>
            <button
              onClick={startQuickScan}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Start Scan
            </button>
          </div>

          {/* Browser Scan Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Browser Clean</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clear browser caches</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {BROWSER_LIST.map((browser) => (
                <button
                  key={browser}
                  onClick={() => setBrowserToggles((t) => ({ ...t, [browser]: !t[browser] }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    browserToggles[browser]
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {browser}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const enabledBrowsers = Object.entries(browserToggles)
                  .filter(([, enabled]) => enabled)
                  .map(([browser]) => browser)
                startBrowserScan(enabledBrowsers, { clearCache: true })
              }}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              Start Browser Scan
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Files are moved to Quarantine for safety before deletion
        </p>
      </div>
    )
  }

  // Scanning view
  if (status === 'scanning') {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {scanType === 'browser' ? 'Scanning Browsers...' : 'Scanning System...'}
          </h2>
          {progress && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate max-w-md mx-auto">
                {progress.currentPath}
              </p>
              <div className="mb-4">
                <Progress.Root className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <Progress.Indicator
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </Progress.Root>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {progress.filesScanned} files scanned • {progress.percentage}%
              </p>
            </>
          )}
          <button
            onClick={cancelScan}
            className="mt-6 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Results view
  if (status === 'complete' && results.length > 0) {
    return (
      <div className="animate-fadeIn">
        <div className="flex gap-6">
          {/* Categories */}
          <div className="w-2/5 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Categories</h2>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-primary-500 hover:text-primary-600">
                  Select All
                </button>
                <button onClick={deselectAll} className="text-xs text-gray-500 hover:text-gray-600">
                  Deselect All
                </button>
              </div>
            </div>
            {results.map((result) => {
              const selectedCount = result.items.filter((i) => selectedItemIds.has(i.id)).length
              const selectedSize = result.items
                .filter((i) => selectedItemIds.has(i.id))
                .reduce((sum, i) => sum + i.size, 0)
              return (
                <ScanCategoryCard
                  key={result.id}
                  result={result}
                  selected={selectedCount > 0}
                  selectedCount={selectedCount}
                  selectedSize={selectedSize}
                  onSelect={toggleCategorySelection}
                />
              )
            })}
          </div>

          {/* Files list */}
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Files</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {results.flatMap((r) => r.items).slice(0, 100).map((item) => (
                  <FileListItem
                    key={item.id}
                    item={item}
                    selected={selectedItemIds.has(item.id)}
                    onSelect={toggleItemSelection}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-60 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedItemIds.size} items • {formatBytes(totalSelectedSize)}
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearResults}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={selectedItemIds.size === 0}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clean
              </button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Clean Selected Files?"
          description={`${selectedItemIds.size} files (${formatBytes(totalSelectedSize)}) will be moved to Quarantine.`}
          confirmLabel="Clean"
          variant="danger"
          onConfirm={handleClean}
        />
      </div>
    )
  }

  return null
}
