import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Copy,
  FolderOpen,
  PieChart as PieIcon,
  AppWindow,
  Shield,
  HardDrive,
  Cpu,
  Activity,
  ArrowUpRight,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { formatBytes } from '../../utils/format'
import { usePlatform } from '../../hooks/usePlatform'
import type { DiskDrive, HistoryEntry } from '../../../shared/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { trashName } = usePlatform()

  const [systemStats, setSystemStats] = useState<{
    totalRAM: number
    freeRAM: number
    usedRAM: number
    cpuModel: string
    cpuUsage: number
    uptime: number
  } | null>(null)

  const [drives, setDrives] = useState<DiskDrive[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch telemetry
  const fetchTelemetry = async () => {
    try {
      const [statsRes, drivesRes, historyRes] = await Promise.all([
        window.cleanSweepAPI.system.getSystemStats(),
        window.cleanSweepAPI.system.getDiskUsage(),
        window.cleanSweepAPI.cleaner.getHistory(),
      ])

      if (statsRes.success) setSystemStats(statsRes.data)
      if (drivesRes.success) setDrives(drivesRes.data)
      if (historyRes.success) setHistory(historyRes.data)
    } catch {
      // Ignore initial errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    const timer = setInterval(fetchTelemetry, 3000)
    return () => clearInterval(timer)
  }, [])

  // Calculate totals & health score
  const totalFreed = useMemo(() => {
    return history.reduce((acc, h) => acc + (h.spaceFreed || 0), 0)
  }, [history])

  const lastScan = useMemo(() => {
    return history[0] || null
  }, [history])

  const primaryDrive = drives[0] || { total: 100, used: 50, free: 50, name: 'Disk' }
  const diskPercent = primaryDrive.total > 0 ? Math.round((primaryDrive.used / primaryDrive.total) * 100) : 50

  const healthScore = useMemo(() => {
    let score = 100
    if (diskPercent > 85) score -= 25
    else if (diskPercent > 70) score -= 10

    if (!lastScan) score -= 15
    else {
      const days = (Date.now() - lastScan.timestamp) / (1000 * 60 * 60 * 24)
      if (days > 7) score -= 15
      else if (days > 3) score -= 5
    }
    return Math.max(10, Math.min(100, score))
  }, [diskPercent, lastScan])

  const healthColor = healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : 'text-rose-500'
  const strokeColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#f43f5e'

  const pieData = [
    { name: 'Used Space', value: primaryDrive.used, color: '#3b82f6' },
    { name: 'Free Space', value: primaryDrive.free, color: '#10b981' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner - System Health Gauge */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Monitor</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              System Health Overview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {healthScore >= 80
                ? 'Your system is operating in peak condition. All primary drives have healthy free space.'
                : 'Your system requires attention. Clean junk files or remove duplicates to free up storage.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/cleaner')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Quick Scan</span>
              </button>
            </div>
          </div>

          {/* Circular SVG Health Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="10"
                className="text-gray-200 dark:text-gray-800"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke={strokeColor}
                strokeWidth="10"
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * healthScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold tracking-tight ${healthColor}`}>
                {healthScore}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Health Score
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Space Freed */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              All-Time <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Space Freed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatBytes(totalFreed)}
          </p>
          <p className="text-xs text-gray-400 mt-2">From {history.length} cleanup sessions</p>
        </div>

        {/* Metric 2: Primary Disk Usage */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {primaryDrive.name}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Primary Storage Used</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {diskPercent}% <span className="text-sm font-normal text-gray-400">({formatBytes(primaryDrive.used)})</span>
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                diskPercent > 85 ? 'bg-rose-500' : diskPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${diskPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Live RAM Usage */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              {systemStats ? `${Math.round(systemStats.cpuUsage)}% CPU` : 'Active'}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Memory (RAM) Usage</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {systemStats ? formatBytes(systemStats.usedRAM) : 'Loading...'}
            <span className="text-sm font-normal text-gray-400">
              {' '}/ {systemStats ? formatBytes(systemStats.totalRAM) : ''}
            </span>
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="h-2 bg-purple-500 rounded-full transition-all duration-500"
              style={{
                width: systemStats
                  ? `${Math.round((systemStats.usedRAM / systemStats.totalRAM) * 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Navigation Buttons */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Quick Actions</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Quick Clean',
                desc: 'System junk & cache',
                icon: Sparkles,
                color: 'from-blue-500 to-indigo-600',
                path: '/cleaner',
              },
              {
                title: 'Duplicate Finder',
                desc: 'Find duplicate files',
                icon: Copy,
                color: 'from-purple-500 to-pink-600',
                path: '/duplicates',
              },
              {
                title: 'File Organizer',
                desc: 'Smart auto-rules',
                icon: FolderOpen,
                color: 'from-emerald-500 to-teal-600',
                path: '/organizer',
              },
              {
                title: 'Disk Treemap',
                desc: 'Visual space analyzer',
                icon: PieIcon,
                color: 'from-amber-500 to-orange-600',
                path: '/disk',
              },
              {
                title: 'App Manager',
                desc: 'Uninstall & startup',
                icon: AppWindow,
                color: 'from-rose-500 to-red-600',
                path: '/apps',
              },
              {
                title: `${trashName} Safety`,
                desc: 'Manage safety bin',
                icon: Trash2,
                color: 'from-gray-600 to-slate-700',
                path: '/quarantine',
              },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:border-blue-500/40 dark:hover:border-blue-500/40 bg-white/40 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-800/80 transition-all text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-sm`}
                  >
                    <action.icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Disk Usage Pie Chart */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-500" />
            <span>Disk Distribution</span>
          </h3>
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => formatBytes(val)}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{diskPercent}%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Used</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 pt-2 text-xs font-medium border-t border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">Used: {formatBytes(primaryDrive.used)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-600 dark:text-gray-300">Free: {formatBytes(primaryDrive.free)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Recent Cleanup History</span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">{history.length} Sessions Logged</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No cleanup history recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Run a scan to start optimizing your disk space</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {entry.type === 'quick-clean' ? 'FS' : 'DUP'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {entry.details || 'System Cleanup'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatBytes(entry.spaceFreed)}
                  </span>
                  <p className="text-[11px] text-gray-400">{entry.filesProcessed} files processed</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
