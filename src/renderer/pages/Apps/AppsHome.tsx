import React, { useEffect, useState } from 'react'
import { AppWindow, Rocket, Search, Trash2, ExternalLink, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react'
import { formatBytes } from '../../utils/format'
import { usePlatform } from '../../hooks/usePlatform'
import { useUIStore } from '../../stores/uiStore'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import type { AppInfo, StartupItem } from '../../../shared/types'

export default function AppsHome() {
  const { trashName } = usePlatform()
  const { addToast } = useUIStore()

  const [activeTab, setActiveTab] = useState<'apps' | 'startup'>('apps')
  const [apps, setApps] = useState<AppInfo[]>([])
  const [startupItems, setStartupItems] = useState<StartupItem[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingStartup, setLoadingStartup] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [showUninstallModal, setShowUninstallModal] = useState(false)

  const fetchApps = async () => {
    setLoadingApps(true)
    const res = await window.cleanSweepAPI.apps.listApps()
    if (res.success) setApps(res.data)
    setLoadingApps(false)
  }

  const fetchStartup = async () => {
    setLoadingStartup(true)
    const res = await window.cleanSweepAPI.apps.getStartupItems()
    if (res.success) setStartupItems(res.data)
    setLoadingStartup(false)
  }

  useEffect(() => {
    fetchApps()
    fetchStartup()
  }, [])

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUninstall = async () => {
    if (!selectedApp) return
    const res = await window.cleanSweepAPI.apps.uninstallApp(selectedApp.id)
    if (res.success) {
      addToast(`Moved ${selectedApp.name} to ${trashName}`, 'success')
      setApps((prev) => prev.filter((a) => a.id !== selectedApp.id))
    } else {
      addToast('Failed to uninstall app', 'error')
    }
    setShowUninstallModal(false)
    setSelectedApp(null)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Tabs */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: 'apps', label: 'Installed Applications', icon: AppWindow, count: apps.length },
            { id: 'startup', label: 'Startup Items', icon: Rocket, count: startupItems.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20'
                  : 'bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label} ({tab.count})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            fetchApps()
            fetchStartup()
          }}
          className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: INSTALLED APPLICATIONS */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter apps by name..."
                className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">{filteredApps.length} Apps Listed</span>
          </div>

          {loadingApps ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Inspecting Application Bundles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="glass-card rounded-2xl p-4 flex flex-col justify-between hover:border-pink-500/40 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                      {app.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{app.name}</h4>
                      <p className="text-[11px] text-gray-400 truncate">v{app.version || '1.0'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-pink-600 dark:text-pink-400">{formatBytes(app.size)}</span>
                    <button
                      onClick={() => {
                        setSelectedApp(app)
                        setShowUninstallModal(true)
                      }}
                      className="px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-semibold rounded-lg transition-all flex items-center gap-1"
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

      {/* TAB 2: STARTUP ITEMS */}
      {activeTab === 'startup' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Boot Startup Managers</h3>
            <span className="text-xs text-gray-400">LaunchAgents & Startup Commands</span>
          </div>

          {loadingStartup ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 text-pink-500 animate-spin mx-auto mb-2" />
            </div>
          ) : (
            <div className="space-y-2">
              {startupItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">{item.name}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        Impact: {item.impact}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 mt-1 truncate max-w-md">{item.path}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                    {item.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Uninstall Dialog */}
      {selectedApp && (
        <ConfirmDialog
          isOpen={showUninstallModal}
          onClose={() => setShowUninstallModal(false)}
          onConfirm={handleUninstall}
          title={`Move ${selectedApp.name} to ${trashName}?`}
          description={`This will move the app bundle at ${selectedApp.path} (${formatBytes(selectedApp.size)}) to your ${trashName}.`}
          confirmText={`Move to ${trashName}`}
        />
      )}
    </div>
  )
}
