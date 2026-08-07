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
  { path: '/quarantine', icon: Shield, label: 'Quarantine' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-500" />
          {!sidebarCollapsed && (
            <span className="font-semibold text-gray-900 dark:text-white">CleanSweep</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  )
}
