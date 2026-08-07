import React from 'react'
import { Sparkles, Trash2, Copy, FolderOpen, PieChart, AppWindow, Clock, Shield, HardDrive } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Health Score */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your system is in great shape</p>
          </div>
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">98</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Space Freed</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">2.4 GB</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Disk Usage</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">64%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Scan</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">2 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: Sparkles, label: 'Quick Clean', path: '/cleaner', color: 'text-blue-500' },
            { icon: Copy, label: 'Find Duplicates', path: '/duplicates', color: 'text-purple-500' },
            { icon: FolderOpen, label: 'Organize Files', path: '/organizer', color: 'text-green-500' },
            { icon: PieChart, label: 'Analyze Disk', path: '/disk', color: 'text-orange-500' },
            { icon: AppWindow, label: 'Manage Apps', path: '/apps', color: 'text-pink-500' },
            { icon: Shield, label: 'Empty Quarantine', path: '/quarantine', color: 'text-red-500' },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => window.location.assign(`#${action.path}`)}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>
    </div>
  )
}
