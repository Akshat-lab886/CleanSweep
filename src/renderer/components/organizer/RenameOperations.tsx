import React from 'react'
import { FolderPlus, FileText, Play } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

interface RenameOperationsProps {
  files: string[]
  onSelectFiles: (files: string[]) => void
  pattern: any
  onChangePattern: (pattern: any) => void
}

export default function RenameOperations({
  files,
  onSelectFiles,
  pattern,
  onChangePattern,
}: RenameOperationsProps) {
  const { addToast } = useUIStore()

  const handlePickFiles = async () => {
    const res = await window.cleanSweepAPI.dialog.openFolder()
    if (res.success && res.data) {
      const selected = Array.isArray(res.data) ? res.data[0] : res.data
      if (selected) {
        onSelectFiles([selected])
        addToast('Selected directory for bulk rename', 'info')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white">Bulk File Renamer</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Batch rename files with case changes, prefixes, suffixes, and numbering.
          </p>
        </div>
        <button
          onClick={handlePickFiles}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Select Target Directory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Prefix Text:</label>
          <input
            type="text"
            placeholder="e.g. Doc_"
            value={pattern.prefix || ''}
            onChange={(e) => onChangePattern({ ...pattern, prefix: e.target.value })}
            className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Suffix Text:</label>
          <input
            type="text"
            placeholder="e.g. _v1"
            value={pattern.suffix || ''}
            onChange={(e) => onChangePattern({ ...pattern, suffix: e.target.value })}
            className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  )
}
