import React from 'react'
import { Shield } from 'lucide-react'

export default function QuarantineHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <Shield className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quarantine</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        View and restore files that have been quarantined before permanent deletion.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500">Feature coming soon</p>
    </div>
  )
}
