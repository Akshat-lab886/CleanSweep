import React, { useState } from 'react'
import { Settings, Sun, Moon, Monitor, Trash2, Shield, Globe, Info, FolderPlus, X, Check } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePlatform } from '../../hooks/usePlatform'
import clsx from 'clsx'

const settingsSections = [
  { id: 'general', label: 'General & Theme', icon: Settings },
  { id: 'cleanup', label: 'Cleanup & Trash', icon: Trash2 },
  { id: 'scanning', label: 'Scanning Rules', icon: Globe },
  { id: 'whitelist', label: 'Exclusion Whitelist', icon: Shield },
  { id: 'about', label: 'About & Logs', icon: Info },
]

export default function SettingsHome() {
  const { theme, setTheme, addToast } = useUIStore()
  const { config, updateConfig, whitelist, addToWhitelist, removeFromWhitelist } = useSettingsStore()
  const { trashName } = usePlatform()

  const [activeSection, setActiveSection] = useState('general')
  const [newWhitelistPath, setNewWhitelistPath] = useState('')

  const handleBrowseWhitelist = async () => {
    const res = await window.cleanSweepAPI.dialog.openFolder()
    if (res.success && res.data) {
      const selected = Array.isArray(res.data) ? res.data[0] : res.data
      if (selected) {
        await addToWhitelist(selected)
        addToast('Added path to whitelist', 'success')
      }
    }
  }

  const handleAddWhitelist = async () => {
    if (newWhitelistPath.trim()) {
      await addToWhitelist(newWhitelistPath.trim())
      setNewWhitelistPath('')
      addToast('Added path to whitelist', 'success')
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto pb-10">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-56 space-y-1 shrink-0">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-xs transition-all border',
              activeSection === section.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <section.icon className="w-4 h-4" />
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 glass-card rounded-2xl p-6">
        {/* GENERAL SECTION */}
        {activeSection === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Appearance & Theme</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select your preferred user interface mode.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value as any)}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all',
                    theme === t.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <t.icon className="w-5 h-5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-gray-900 dark:text-white">Minimize to System Tray</p>
                <p className="text-[11px] text-gray-400">Keep CleanSweep running in the menu bar / notification area</p>
              </div>
              <input
                type="checkbox"
                checked={config?.general?.minimizeToTray ?? true}
                onChange={(e) => updateConfig({ general: { ...(config?.general as any), minimizeToTray: e.target.checked } } as any)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* CLEANUP & TRASH SECTION */}
        {activeSection === 'cleanup' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Cleanup Target Destination</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose where cleaned files and deleted duplicates are sent.</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">Move Files to System {trashName} (Default)</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                    Cleaned items are sent directly to your operating system's native <strong>{trashName}</strong>. You can inspect or restore them directly from your desktop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCANNING RULES SECTION */}
        {activeSection === 'scanning' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Scanner Configuration</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure path scanning parameters.</p>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 cursor-pointer">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Include Hidden Files</span>
                  <p className="text-[11px] text-gray-400">Scan hidden dotfiles (.tmp, .cache)</p>
                </div>
                <input
                  type="checkbox"
                  checked={config?.scan?.includeHidden ?? true}
                  onChange={(e) => updateConfig({ scan: { ...(config?.scan as any), includeHidden: e.target.checked } } as any)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
              </label>
            </div>
          </div>
        )}

        {/* WHITELIST SECTION */}
        {activeSection === 'whitelist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Exclusion Whitelist</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paths added here will never be scanned or modified.</p>
              </div>
              <button
                onClick={handleBrowseWhitelist}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add Path</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newWhitelistPath}
                onChange={(e) => setNewWhitelistPath(e.target.value)}
                placeholder="Type custom directory path to exclude..."
                className="glass-input flex-1 rounded-xl px-3.5 py-2 text-xs font-mono"
              />
              <button
                onClick={handleAddWhitelist}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {whitelist.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">No exclusion paths in whitelist.</p>
              ) : (
                whitelist.map((itemPath) => (
                  <div key={itemPath} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs font-mono">
                    <span className="truncate max-w-md">{itemPath}</span>
                    <button onClick={() => removeFromWhitelist(itemPath)} className="text-gray-400 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABOUT SECTION */}
        {activeSection === 'about' && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">CleanSweep v1.2.0</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cross-Platform Desktop Cleaner & File Organizer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
