import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  retry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  title = 'Something went wrong',
  description,
  retry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{description}</p>
      )}
      {retry && (
        <button
          onClick={retry}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
