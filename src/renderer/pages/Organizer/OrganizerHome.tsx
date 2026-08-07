import React from 'react'
import { FolderOpen } from 'lucide-react'

export default function OrganizerHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-green-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">File Organizer</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        Create rules to automatically organize your files.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500">Feature coming soon</p>
    </div>
  )
}
