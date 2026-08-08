import React, { useState, useEffect } from 'react'
import { FolderOpen, Plus, Trash2, Edit2, Play, ArrowRight, FileText, Check, ShieldCheck, Eye, Layers, Settings } from 'lucide-react'
import { useOrganizerStore } from '../../stores/organizerStore'
import { useUIStore } from '../../stores/uiStore'
import RuleEditorModal from '../../components/organizer/RuleEditorModal'
import PreviewTable from '../../components/organizer/PreviewTable'
import RenameOperations from '../../components/organizer/RenameOperations'
import { usePlatform } from '../../hooks/usePlatform'

export default function OrganizerHome() {
  const {
    rules,
    sourcePath,
    previewItems,
    status,
    result,
    loadRules,
    saveRules,
    addRule,
    updateRule,
    deleteRule,
    setSourcePath,
    runPreview,
    executeOrganize,
  } = useOrganizerStore()

  const { addToast } = useUIStore()
  const { finderName } = usePlatform()

  const [activeTab, setActiveTab] = useState<'organize' | 'renamer' | 'watcher'>('organize')
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [strategy, setStrategy] = useState<'rename' | 'skip' | 'overwrite'>('rename')

  // Bulk renamer state
  const [renameFiles, setRenameFiles] = useState<string[]>([])
  const [renamePattern, setRenamePattern] = useState<any>({ caseChange: 'none' })
  const [renamePreviews, setRenamePreviews] = useState<any[]>([])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handlePickSourceFolder = async () => {
    const res = await window.cleanSweepAPI.dialog.openFolder()
    if (res.success && res.data && res.data[0]) {
      setSourcePath(res.data[0])
    }
  }

  const handleAddPresetRule = async (presetType: string) => {
    let newRule: any
    if (presetType === 'type') {
      newRule = {
        id: Date.now().toString(),
        name: 'Sort by File Type',
        enabled: true,
        conditions: [{ id: '1', field: 'extension', operator: 'contains', value: 'jpg,png,pdf,docx,mp4' }],
        logicOperator: 'OR',
        action: 'move',
        destination: '{type}',
        priority: rules.length + 1,
      }
    } else if (presetType === 'date') {
      newRule = {
        id: Date.now().toString(),
        name: 'Sort by Year and Month',
        enabled: true,
        conditions: [{ id: '1', field: 'name', operator: 'contains', value: '' }],
        logicOperator: 'AND',
        action: 'move',
        destination: '{year}/{month}',
        priority: rules.length + 1,
      }
    }
    if (newRule) {
      await addRule(newRule)
      addToast(`Added preset rule: ${newRule.name}`, 'success')
    }
  }

  const handleSaveModalRule = async (ruleData: any) => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleData)
      addToast('Rule updated successfully', 'success')
    } else {
      await addRule({ ...ruleData, id: Date.now().toString(), priority: rules.length + 1 })
      addToast('New rule created', 'success')
    }
    setShowRuleModal(false)
    setEditingRule(null)
  }

  const handleRunOrganize = async () => {
    if (!sourcePath) {
      addToast('Please select a source folder first', 'error')
      return
    }
    await runPreview()
  }

  const handleExecuteOrganize = async () => {
    await executeOrganize(strategy)
    const res = useOrganizerStore.getState().result
    if (res) {
      addToast(`Organized ${res.succeeded} files!`, 'success')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60 pb-3">
        <div className="flex gap-2">
          {[
            { id: 'organize', label: 'Auto Organizer', icon: FolderOpen },
            { id: 'renamer', label: 'Bulk Renamer', icon: FileText },
            { id: 'watcher', label: 'Watch Folders', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: AUTO ORGANIZER */}
      {activeTab === 'organize' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Rules Management */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Active Sorting Rules</h3>
                <button
                  onClick={() => {
                    setEditingRule(null)
                    setShowRuleModal(true)
                  }}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Rule</span>
                </button>
              </div>

              {/* Preset Cards */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Quick Presets:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddPresetRule('type')}
                    className="p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:border-blue-500/50 text-left bg-white/40 dark:bg-gray-900/40 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    + Sort by File Type
                  </button>
                  <button
                    onClick={() => handleAddPresetRule('date')}
                    className="p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:border-blue-500/50 text-left bg-white/40 dark:bg-gray-900/40 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    + Sort by Date
                  </button>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2 pt-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">{rule.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono">
                          {rule.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                        Dest: {rule.destination}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRule(rule)
                          setShowRuleModal(true)
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-gray-400 hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Execution & Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Run File Organizer</h3>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                    Source Directory:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={sourcePath}
                      placeholder="Select folder to organize..."
                      className="glass-input flex-1 rounded-xl px-3.5 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={handlePickSourceFolder}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300"
                    >
                      Browse
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                    Conflict Strategy:
                  </label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as any)}
                    className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-medium"
                  >
                    <option value="rename">Auto Rename (1)</option>
                    <option value="skip">Skip Conflict</option>
                    <option value="overwrite">Overwrite</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRunOrganize}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Sort Results</span>
                </button>
              </div>
            </div>

            {/* Preview Table Component */}
            {previewItems.length > 0 && (
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Preview: {previewItems.length} Files Matched
                  </span>
                  <button
                    onClick={handleExecuteOrganize}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Execute Organization</span>
                  </button>
                </div>

                <PreviewTable items={previewItems} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BULK RENAMER */}
      {activeTab === 'renamer' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <RenameOperations
            files={renameFiles}
            onSelectFiles={(files) => setRenameFiles(files)}
            pattern={renamePattern}
            onChangePattern={(p) => setRenamePattern(p)}
          />
        </div>
      )}

      {/* TAB 3: WATCH FOLDERS */}
      {activeTab === 'watcher' && (
        <div className="glass-card rounded-2xl p-6 text-center py-12 space-y-3">
          <Layers className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Folder Watcher Service Active</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Background file watcher monitors selected directories like <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">~/Downloads</code> and automatically applies your sorting rules as new files arrive.
          </p>
        </div>
      )}

      {/* Rule Editor Modal */}
      {showRuleModal && (
        <RuleEditorModal
          rule={editingRule}
          onClose={() => setShowRuleModal(false)}
          onSave={handleSaveModalRule}
        />
      )}
    </div>
  )
}
