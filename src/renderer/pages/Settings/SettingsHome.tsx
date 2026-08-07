import React, { useState } from 'react'
import { Settings, Sun, Moon, Monitor, Trash2, Shield, Globe, Info } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useSettingsStore } from '../../stores/settingsStore'
import clsx from 'clsx'

const settingsSections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'scanning', label: 'Scanning', icon: Globe },
  { id: 'safety', label: 'Safety', icon: Shield },
  { id: 'whitelist', label: 'Whitelist', icon: Trash2 },
  { id: 'about', label: 'About', icon: Info },
]

export default function SettingsHome() {
  const { theme, setTheme } = useUIStore()
  const { config, updateConfig, whitelist, addToWhitelist, removeFromWhitelist } = useSettingsStore()
  const [activeSection, setActiveSection] = useState('general')
  const [newWhitelistPath, setNewWhitelistPath] = useState('')

  const handleAddWhitelist = async () => {
    if (newWhitelistPath.trim()) {
      await addToWhitelist(newWhitelistPath.trim())
      setNewWhitelistPath('')
    }
  }

  return (
    <div className="flex gap-6 animate-fadeIn">
      {/* Sidebar */}
      <div className="w-48 space-y-1">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              activeSection === section.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <section.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {activeSection === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h2>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <div className="flex gap-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value as 'light' | 'dark' | 'system')}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                      theme === t.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch at startup */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Launch at Startup</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Start CleanSweep when you log in</p>
              </div>
              <button
                onClick={() => updateConfig({ general: { ...config?.general!, launchAtStartup: !config?.general.launchAtStartup } })}
                className={clsx(
                  'relative w-11 h-6 rounded-full transition-colors',
                  config?.general.launchAtStartup ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    config?.general.launchAtStartup ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Show Notifications</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications for scheduled tasks</p>
              </div>
              <button
                onClick={() => updateConfig({ general: { ...config?.general!, showNotifications: !config?.general.showNotifications } })}
                className={clsx(
                  'relative w-11 h-6 rounded-full transition-colors',
                  config?.general.showNotifications ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    config?.general.showNotifications ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {activeSection === 'whitelist' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Whitelist</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Folders in the whitelist will be skipped during scans.
            </p>

            {/* Add path */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newWhitelistPath}
                onChange={(e) => setNewWhitelistPath(e.target.value)}
                placeholder="Enter folder path..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddWhitelist}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Paths list */}
            <div className="space-y-2">
              {whitelist.map((path) => (
                <div
                  key={path}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{path}</span>
                  <button
                    onClick={() => removeFromWhitelist(path)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {whitelist.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No paths in whitelist
                </p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About CleanSweep</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                <p className="text-gray-900 dark:text-white">1.0.0</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="text-gray-600 dark:text-gray-400">
                  Cross-platform desktop cleaner and file organizer for macOS and Windows.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'scanning' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scanning Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure scan behavior.</p>
          </div>
        )}

        {activeSection === 'safety' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Safety Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure quarantine and safety options.</p>
          </div>
        )}
      </div>
    </div>
  )
}
