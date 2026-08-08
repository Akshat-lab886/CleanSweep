import React, { useState, useEffect } from 'react'
import { PieChart as PieIcon, HardDrive, Trash2, FolderSearch, ExternalLink, RefreshCw, AlertTriangle, Layers, Clock } from 'lucide-react'
import { formatBytes } from '../../utils/format'
import { usePlatform } from '../../hooks/usePlatform'
import { useUIStore } from '../../stores/uiStore'
import TreeMap from '../../components/disk/TreeMap'
import type { DiskDrive, DiskNode, ScannedItem } from '../../../shared/types'

export default function DiskAnalyzer() {
  const { trashName, finderName } = usePlatform()
  const { addToast } = useUIStore()

  const [activeTab, setActiveTab] = useState<'map' | 'large' | 'old' | 'empty'>('map')
  const [drives, setDrives] = useState<DiskDrive[]>([])
  const [selectedDrive, setSelectedDrive] = useState<string>('')

  // TreeMap state
  const [treeData, setTreeData] = useState<DiskNode | null>(null)
  const [analyzingMap, setAnalyzingMap] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<DiskNode[]>([])

  // Large Files state
  const [largeFiles, setLargeFiles] = useState<ScannedItem[]>([])
  const [scanningLarge, setScanningLarge] = useState(false)
  const [minSizeMB, setMinSizeMB] = useState(100)

  // Old Files state
  const [oldFiles, setOldFiles] = useState<ScannedItem[]>([])
  const [scanningOld, setScanningOld] = useState(false)

  // Empty Folders state
  const [emptyFolders, setEmptyFolders] = useState<string[]>([])
  const [scanningEmpty, setScanningEmpty] = useState(false)

  useEffect(() => {
    window.cleanSweepAPI.system.getDiskUsage().then((res) => {
      if (res.success && res.data.length > 0) {
        setDrives(res.data)
        setSelectedDrive(res.data[0].mountPoint)
      }
    })
  }, [])

  // Analyze Treemap
  const handleAnalyzeMap = async () => {
    if (!selectedDrive) return
    setAnalyzingMap(true)
    const res = await window.cleanSweepAPI.disk.analyzeDisk(selectedDrive, 3)
    if (res.success && res.data) {
      setTreeData(res.data)
      setBreadcrumbs([res.data])
    }
    setAnalyzingMap(false)
  }

  // Scan Large Files
  const handleScanLarge = async () => {
    if (!selectedDrive) return
    setScanningLarge(true)
    const res = await window.cleanSweepAPI.disk.findLargeFiles(selectedDrive, minSizeMB * 1024 * 1024)
    if (res.success) {
      setLargeFiles(res.data)
      addToast(`Found ${res.data.length} large files`, 'info')
    }
    setScanningLarge(false)
  }

  // Scan Old Files
  const handleScanOld = async () => {
    if (!selectedDrive) return
    setScanningOld(true)
    const res = await window.cleanSweepAPI.disk.findOldFiles(selectedDrive, 180)
    if (res.success) {
      setOldFiles(res.data)
      addToast(`Found ${res.data.length} files not accessed in 6 months`, 'info')
    }
    setScanningOld(false)
  }

  // Scan Empty Folders
  const handleScanEmpty = async () => {
    if (!selectedDrive) return
    setScanningEmpty(true)
    const res = await window.cleanSweepAPI.disk.findEmptyFolders(selectedDrive)
    if (res.success) {
      setEmptyFolders(res.data)
      addToast(`Found ${res.data.length} empty folders`, 'info')
    }
    setScanningEmpty(false)
  }

  // Action: Trash item
  const handleTrashFile = async (item: ScannedItem) => {
    const res = await window.cleanSweepAPI.cleaner.executeClean([item], false)
    if (res.success) {
      setLargeFiles((prev) => prev.filter((f) => f.id !== item.id))
      setOldFiles((prev) => prev.filter((f) => f.id !== item.id))
      addToast(`Moved ${item.path} to ${trashName}`, 'success')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Tabs & Drive Selector */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2">
          {[
            { id: 'map', label: 'Disk Treemap', icon: PieIcon },
            { id: 'large', label: 'Large Files', icon: FolderSearch },
            { id: 'old', label: 'Old Files', icon: Clock },
            { id: 'empty', label: 'Empty Folders', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Drive Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Target Drive:</label>
          <select
            value={selectedDrive}
            onChange={(e) => setSelectedDrive(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs font-medium"
          >
            {drives.map((d) => (
              <option key={d.mountPoint} value={d.mountPoint}>
                {d.name} ({formatBytes(d.free)} free)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: DISK TREEMAP */}
      {activeTab === 'map' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Interactive Folder Storage Map</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Squarified D3 visualizer showing relative directory sizes.
              </p>
            </div>
            <button
              onClick={handleAnalyzeMap}
              disabled={analyzingMap}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${analyzingMap ? 'animate-spin' : ''}`} />
              <span>{analyzingMap ? 'Analyzing...' : 'Analyze Storage'}</span>
            </button>
          </div>

          {treeData ? (
            <TreeMap data={breadcrumbs[breadcrumbs.length - 1] || treeData} />
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
              <PieIcon className="w-12 h-12 text-orange-500/40 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Treemap Generated Yet</p>
              <p className="text-xs text-gray-400">Click "Analyze Storage" to generate interactive storage map</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LARGE FILES */}
      {activeTab === 'large' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Filter Size:</span>
              <select
                value={minSizeMB}
                onChange={(e) => setMinSizeMB(Number(e.target.value))}
                className="glass-input rounded-xl px-3 py-1.5 text-xs font-medium"
              >
                <option value={100}>&gt; 100 MB</option>
                <option value={500}>&gt; 500 MB</option>
                <option value={1024}>&gt; 1 GB</option>
              </select>
            </div>

            <button
              onClick={handleScanLarge}
              disabled={scanningLarge}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <FolderSearch className={`w-4 h-4 ${scanningLarge ? 'animate-spin' : ''}`} />
              <span>{scanningLarge ? 'Scanning...' : 'Find Large Files'}</span>
            </button>
          </div>

          {largeFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              {largeFiles.slice(0, 50).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{file.path}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Size: {formatBytes(file.size)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTrashFile(file)}
                      className="px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{trashName}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OLD FILES */}
      {activeTab === 'old' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Scan for files untouched in 6+ months.</p>
            <button
              onClick={handleScanOld}
              disabled={scanningOld}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition-all"
            >
              Scan Old Files
            </button>
          </div>

          {oldFiles.length > 0 && (
            <div className="space-y-2">
              {oldFiles.slice(0, 30).map((file) => (
                <div key={file.id} className="p-3 rounded-xl bg-white/50 dark:bg-gray-900/50 flex justify-between items-center text-xs">
                  <span className="truncate max-w-lg">{file.path}</span>
                  <span className="font-bold text-orange-500">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EMPTY FOLDERS */}
      {activeTab === 'empty' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Locate empty folder structures.</p>
            <button
              onClick={handleScanEmpty}
              disabled={scanningEmpty}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition-all"
            >
              Scan Empty Folders
            </button>
          </div>

          {emptyFolders.length > 0 && (
            <div className="space-y-1">
              {emptyFolders.map((pathStr) => (
                <div key={pathStr} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-xs font-mono">
                  {pathStr}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
