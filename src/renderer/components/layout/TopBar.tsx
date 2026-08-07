import React from 'react'
import { useLocation } from 'react-router-dom'
import { Sun, Moon, Monitor, Bell } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import clsx from 'clsx'

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'System overview and quick actions' },
  '/cleaner': { title: 'Cleaner', description: 'Clean junk files and free up space' },
  '/duplicates': { title: 'Duplicate Finder', description: 'Find and remove duplicate files' },
  '/organizer': { title: 'File Organizer', description: 'Organize files with custom rules' },
  '/disk': { title: 'Disk Analyzer', description: 'Visualize disk usage and find large files' },
  '/apps': { title: 'App Manager', description: 'Manage installed applications' },
  '/scheduler': { title: 'Scheduler', description: 'Schedule automatic cleaning tasks' },
  '/quarantine': { title: 'Quarantine', description: 'Manage quarantined files' },
  '/settings': { title: 'Settings', description: 'Configure CleanSweep preferences' },
}

export default function TopBar() {
  const location = useLocation()
  const { theme, setTheme } = useUIStore()

  const pageInfo = pageTitles[location.pathname] || {
    title: 'CleanSweep',
    description: '',
  }

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <header className="flex items-center justify-between h-12 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{pageInfo.title}</h1>
        {pageInfo.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{pageInfo.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={`Theme: ${theme}`}
        >
          {theme === 'light' && <Sun className="w-5 h-5" />}
          {theme === 'dark' && <Moon className="w-5 h-5" />}
          {theme === 'system' && <Monitor className="w-5 h-5" />}
        </button>
        <button
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
