import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  Copy,
  FolderOpen,
  PieChart,
  AppWindow,
  Clock,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import clsx from 'clsx'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/cleaner', icon: Sparkles, label: 'Cleaner' },
  { path: '/duplicates', icon: Copy, label: 'Duplicates' },
  { path: '/organizer', icon: FolderOpen, label: 'Organizer' },
  { path: '/disk', icon: PieChart, label: 'Disk Analyzer' },
  { path: '/apps', icon: AppWindow, label: 'Apps' },
  { path: '/scheduler', icon: Clock, label: 'Scheduler' },
  { path: '/quarantine', icon: Trash2, label: 'Trash & Safety' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen glass-card border-r border-gray-200/80 dark:border-gray-800/80 z-20 transition-all duration-300 relative',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="font-bold text-lg gradient-text-blue tracking-tight">CleanSweep</span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400 dark:text-gray-500 -mt-1">
                Desktop Utility
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={clsx(
                    'w-5 h-5 transition-transform duration-200 group-hover:scale-110 shrink-0',
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  )}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {isActive && (
                  <span className="absolute right-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-400 rounded-l-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Footer Toggle */}
      <div className="p-3 border-t border-gray-200/60 dark:border-gray-800/60">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-colors"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
