import React from 'react'
import { useLocation } from 'react-router-dom'
import { Sun, Moon, Monitor, Bell, Laptop } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { usePlatform } from '../../hooks/usePlatform'

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'Real-time telemetry and health score' },
  '/cleaner': { title: 'Cleaner', description: 'Scan & clean system junk, browser cache & privacy items' },
  '/duplicates': { title: 'Duplicate Finder', description: 'SHA-256 worker detection & smart selection' },
  '/organizer': { title: 'File Organizer', description: 'Automated rules engine & bulk renamer' },
  '/disk': { title: 'Disk Analyzer', description: 'Interactive D3 treemap & large file finder' },
  '/apps': { title: 'App Manager', description: 'Inspect application bundle sizes & startup items' },
  '/scheduler': { title: 'Scheduler', description: 'Background cron cleanup schedules' },
  '/quarantine': { title: 'Trash & Safety', description: 'Manage native System Trash & Quarantine safety' },
  '/settings': { title: 'Settings', description: 'Configure preferences & exclusion rules' },
}

export default function TopBar() {
  const location = useLocation()
  const { theme, setTheme } = useUIStore()
  const { isMac, platformName } = usePlatform()

  const pageInfo = pageTitles[location.pathname] || {
    title: 'CleanSweep',
    description: 'Cross-Platform Desktop Utility',
  }

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 glass-card border-b border-gray-200/60 dark:border-gray-800/60 select-none z-10">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            {pageInfo.title}
          </h1>
          {pageInfo.description && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {pageInfo.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* OS Platform Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60">
          <Laptop className="w-3.5 h-3.5 text-blue-500" />
          <span>{platformName}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all border border-gray-200/50 dark:border-gray-800/50"
          title={`Theme: ${theme}`}
        >
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
          {theme === 'system' && <Monitor className="w-4 h-4 text-blue-500" />}
        </button>

        {/* Notifications Bell */}
        <button
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all border border-gray-200/50 dark:border-gray-800/50 relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
        </button>
      </div>
    </header>
  )
}
