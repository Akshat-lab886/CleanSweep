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
  { path: '/disk', icon: PieChart, label: 'Disk Treemap' },
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
        'flex flex-col h-screen glass-card border-r border-gray-200/80 dark:border-gray-800/80 z-20 transition-all duration-300 relative select-none',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* App Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="font-extrabold text-lg gradient-text-blue tracking-tight font-heading block">
                CleanSweep
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-blue-500 dark:text-blue-400 -mt-0.5">
                Pro Desktop Cleaner
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={clsx(
                    'w-4 h-4 transition-transform duration-200 group-hover:scale-110 shrink-0',
                    isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500'
                  )}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Collapse Button */}
      <div className="p-3 border-t border-gray-200/60 dark:border-gray-800/60">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all text-xs font-semibold"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
