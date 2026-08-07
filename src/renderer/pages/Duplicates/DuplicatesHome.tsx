import React from 'react'
import { Copy, FolderSearch } from 'lucide-react'

export default function DuplicatesHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
        <Copy className="w-8 h-8 text-purple-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Duplicate Finder</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        Find and remove duplicate files to free up disk space.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500">Feature coming soon</p>
    </div>
  )
}
