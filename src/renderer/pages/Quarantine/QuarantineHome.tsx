import React, { useEffect, useState } from 'react'
import { Shield, Trash2, RotateCcw, FolderOpen, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatBytes } from '../../utils/format'
import { usePlatform } from '../../hooks/usePlatform'
import { useUIStore } from '../../stores/uiStore'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import type { QuarantineEntry } from '../../../shared/types'

export default function QuarantineHome() {
  const { trashName, finderName } = usePlatform()
  const { addToast } = useUIStore()

  const [activeTab, setActiveTab] = useState<'trash' | 'quarantine'>('trash')
  const [quarantineItems, setQuarantineItems] = useState<QuarantineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false)

  const fetchQuarantine = async () => {
    setLoading(true)
    const res = await window.cleanSweepAPI.quarantine.listQuarantine()
    if (res.success) setQuarantineItems(res.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchQuarantine()
  }, [])

  const handleRestore = async (id: string) => {
    const res = await window.cleanSweepAPI.quarantine.restoreItem(id)
    if (res.success) {
      addToast('File restored to original path!', 'success')
      fetchQuarantine()
    }
  }

  const handlePurgeAll = async () => {
    const res = await window.cleanSweepAPI.quarantine.purgeAll()
    if (res.success) {
      addToast(`Purged ${res.data.count} items from Quarantine!`, 'success')
      fetchQuarantine()
    }
    setShowEmptyConfirm(false)
  }

  const totalQuarantineSize = quarantineItems.reduce((acc, i) => acc + i.size, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Navigation */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: 'trash', label: `System ${trashName}`, icon: Trash2 },
            { id: 'quarantine', label: `CleanSweep Quarantine (${quarantineItems.length})`, icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SYSTEM TRASH GUIDE */}
      {activeTab === 'trash' && (
        <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Native System {trashName} Integration Active
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              All cleaned junk files and deleted duplicates are moved directly to your operating system's native <strong>{trashName}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 max-w-lg mx-auto space-y-2 text-left">
            <p className="font-semibold text-gray-900 dark:text-white">How to view or restore your files:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Open your OS <strong>{trashName}</strong> on Desktop or Dock.</li>
              <li>Right-click any cleaned file and select <strong>Put Back</strong> (macOS) or <strong>Restore</strong> (Windows).</li>
              <li>Items remain in your Trash until you choose to empty it.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: QUARANTINE MANIFEST */}
      {activeTab === 'quarantine' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Internal Quarantine Vault</h3>
              <p className="text-xs text-gray-400">Total Size: {formatBytes(totalQuarantineSize)}</p>
            </div>

            {quarantineItems.length > 0 && (
              <button
                onClick={() => setShowEmptyConfirm(true)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Empty Quarantine Vault</span>
              </button>
            )}
          </div>

          {quarantineItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
              <Shield className="w-10 h-10 text-emerald-500/40 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quarantine Vault is Empty</p>
              <p className="text-xs text-gray-400">Cleaned items are sent directly to your native System {trashName}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quarantineItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-xs text-gray-900 dark:text-white">{item.filename}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{item.originalPath}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-500">{formatBytes(item.size)}</span>
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showEmptyConfirm}
        onClose={() => setShowEmptyConfirm(false)}
        onConfirm={handlePurgeAll}
        title="Permanently Purge Quarantine Vault?"
        description={`This will permanently delete all ${quarantineItems.length} quarantined items (${formatBytes(totalQuarantineSize)}). This action cannot be undone.`}
        confirmText="Permanently Delete"
      />
    </div>
  )
}
