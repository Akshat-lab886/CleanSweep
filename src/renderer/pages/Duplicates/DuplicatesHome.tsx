import React, { useState } from 'react'
import { Copy, FolderPlus, Trash2, ShieldCheck, Check, Sparkles, Filter, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useDuplicatesStore } from '../../stores/duplicatesStore'
import { useUIStore } from '../../stores/uiStore'
import { formatBytes } from '../../utils/format'
import { usePlatform } from '../../hooks/usePlatform'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import * as Progress from '@radix-ui/react-progress'

export default function DuplicatesHome() {
  const {
    status,
    progress,
    groups,
    selectedItemIds,
    scanPaths,
    minSizeBytes,
    totalWastedSpace,
    totalSelectedSize,
    setScanPaths,
    setMinSize,
    startScan,
    cancelScan,
    toggleItem,
    autoSelectKeepNewest,
    autoSelectKeepOldest,
    selectAll,
    deselectAll,
    deleteSelected,
  } = useDuplicatesStore()

  const { addToast } = useUIStore()
  const { trashName, finderName } = usePlatform()

  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reviewedCheck, setReviewedCheck] = useState(false)
  const [useSystemTrash, setUseSystemTrash] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 0: true, 1: true })

  const handleAddFolder = async () => {
    const response = await window.cleanSweepAPI.dialog.openFolder()
    if (response.success && response.data && response.data.length > 0) {
      const selected = response.data[0]
      if (!scanPaths.includes(selected)) {
        setScanPaths([...scanPaths, selected])
      }
    }
  }

  const handleRemoveFolder = (pathToRemove: string) => {
    setScanPaths(scanPaths.filter((p) => p !== pathToRemove))
  }

  const handleDelete = async () => {
    if (!reviewedCheck) return
    setDeleting(true)
    const result = await deleteSelected(!useSystemTrash)
    if (result) {
      addToast(`Removed ${result.count} duplicate files (${formatBytes(result.freed)}) to ${useSystemTrash ? trashName : 'Quarantine'}!`, 'success')
    }
    setDeleting(false)
    setShowConfirm(false)
    setReviewedCheck(false)
  }

  // IDLE VIEW
  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="text-center max-w-xl mx-auto space-y-2 py-4">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Duplicate File Finder
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Locate exact duplicate files across your drive using multi-phase SHA-256 worker hashing.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {/* Target Folders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Scan Target Directories:
              </label>
              <button
                onClick={handleAddFolder}
                className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add Folder</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
              {scanPaths.map((pathStr) => (
                <div
                  key={pathStr}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 shadow-sm"
                >
                  <span className="truncate max-w-xs">{pathStr}</span>
                  {scanPaths.length > 1 && (
                    <button
                      onClick={() => handleRemoveFolder(pathStr)}
                      className="text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Min File Size Selector */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                Minimum File Size Filter:
              </label>
              <select
                value={minSizeBytes}
                onChange={(e) => setMinSize(Number(e.target.value))}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-medium"
              >
                <option value={0}>Any Size</option>
                <option value={1048576}>&gt; 1 MB</option>
                <option value={10485760}>&gt; 10 MB (Recommended)</option>
                <option value={104857600}>&gt; 100 MB</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={startScan}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Start Duplicate Scan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // SCANNING VIEW
  if (status === 'scanning') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center animate-bounce">
          <Copy className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
            {progress?.phase === 'indexing' && 'Phase 1: Indexing Files...'}
            {progress?.phase === 'analyzing' && 'Phase 2: Grouping Candidate Sizes...'}
            {progress?.phase === 'hashing' && 'Phase 3: Worker Thread SHA-256 Hashing...'}
          </h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-lg mx-auto">
            {progress?.currentPath || 'Analyzing filesystem structure...'}
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <Progress.Root value={progress?.percentage || 0} className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
            <Progress.Indicator style={{ width: `${progress?.percentage || 0}%` }} className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300" />
          </Progress.Root>
          <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
            <span>{progress?.filesScanned || 0} Candidates Analyzed</span>
            <span>{progress?.percentage || 0}%</span>
          </div>
        </div>

        <button onClick={cancelScan} className="px-6 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-rose-500 hover:text-white text-gray-700 dark:text-gray-300 rounded-xl font-medium text-xs transition-all">
          Cancel Scan
        </button>
      </div>
    )
  }

  // RESULTS VIEW
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Summary */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Duplicate Groups Found</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-semibold border border-purple-500/20">
              {groups.length} Groups
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Wasted space: <strong className="text-purple-600 dark:text-purple-400">{formatBytes(totalWastedSpace)}</strong> • Selected for removal:{' '}
            <strong className="text-blue-500">{formatBytes(totalSelectedSize)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={autoSelectKeepNewest}
            className="px-3.5 py-2 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all"
          >
            Keep Newest
          </button>
          <button
            onClick={autoSelectKeepOldest}
            className="px-3.5 py-2 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all"
          >
            Keep Oldest
          </button>
          <button onClick={selectAll} className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl">
            Select All
          </button>
          <button onClick={deselectAll} className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl">
            Deselect All
          </button>
        </div>
      </div>

      {/* Duplicate Groups List */}
      <div className="space-y-4">
        {groups.map((group, idx) => {
          const isExpanded = expandedGroups[idx] !== false
          const groupWasted = group.wastedSpace

          return (
            <div key={group.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Group Header */}
              <div
                onClick={() => setExpandedGroups((g) => ({ ...g, [idx]: !isExpanded }))}
                className="p-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between cursor-pointer border-b border-gray-200/50 dark:border-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {group.files.length} Duplicate Copies ({formatBytes(group.files[0]?.size || 0)} each)
                    </h4>
                    <p className="text-xs text-gray-400 font-mono">Hash: {group.hash.slice(0, 16)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    Wasted: {formatBytes(groupWasted)}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* File Rows */}
              {isExpanded && (
                <div className="p-3 space-y-2">
                  {group.files.map((file, fileIdx) => {
                    const isSelected = selectedItemIds.has(file.id)
                    const isNewest = fileIdx === 0

                    return (
                      <div
                        key={file.id}
                        onClick={() => toggleItem(file.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500/50 dark:bg-blue-500/15'
                            : 'bg-white/60 dark:bg-gray-900/60 border-gray-200/60 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {file.path}
                              </p>
                              {isNewest && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  KEEP RECOMMENDATION
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Modified: {new Date(file.lastModified).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={useSystemTrash}
            onChange={(e) => setUseSystemTrash(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Move duplicates directly to System {trashName}</span>
        </label>

        <button
          disabled={selectedItemIds.size === 0}
          onClick={() => setShowConfirm(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove {selectedItemIds.size} Selected ({formatBytes(totalSelectedSize)})</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title={`Remove ${selectedItemIds.size} Duplicate Files?`}
        description={`This will move ${formatBytes(totalSelectedSize)} of duplicate files to your ${
          useSystemTrash ? trashName : 'CleanSweep Quarantine'
        }.`}
        confirmText={deleting ? 'Removing...' : `Move to ${useSystemTrash ? trashName : 'Quarantine'}`}
      >
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <input
            type="checkbox"
            id="review-chk"
            checked={reviewedCheck}
            onChange={(e) => setReviewedCheck(e.target.checked)}
            className="rounded border-amber-400"
          />
          <label htmlFor="review-chk" className="cursor-pointer font-medium">
            I have reviewed the selected duplicates and confirm they can be moved.
          </label>
        </div>
      </ConfirmDialog>
    </div>
  )
}
