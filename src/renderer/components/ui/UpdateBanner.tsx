import React, { useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'

interface UpdateBannerProps {
  version: string
  progress?: number
  onDownload: () => void
  onRestart: () => void
  onDismiss: () => void
}

export default function UpdateBanner({ version, progress, onDownload, onRestart, onDismiss }: UpdateBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-primary-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm font-medium">v{version} available</span>
        {progress !== undefined && progress > 0 && (
          <span className="text-sm opacity-80">({Math.round(progress)}%)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {progress === undefined && (
          <button
            onClick={onDownload}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-white/20 rounded hover:bg-white/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        {progress === 100 && (
          <button
            onClick={onRestart}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-white/20 rounded hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Restart
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
