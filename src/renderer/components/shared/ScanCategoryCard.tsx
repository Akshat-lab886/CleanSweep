import React, { memo } from 'react'
import { Trash2, Globe, FileText, Clock, Package, HardDrive, Shield } from 'lucide-react'
import type { ScanCategory, ScanResult } from '../../../shared/types'
import { formatBytes } from '../../utils/format'
import clsx from 'clsx'

const categoryIcons: Record<ScanCategory, React.ElementType> = {
  'system-junk': Trash2,
  'browser-cache': Globe,
  logs: FileText,
  'temp-files': Clock,
  'app-leftovers': Package,
  'large-files': HardDrive,
  'old-files': Clock,
  duplicates: Package,
  trash: Trash2,
  privacy: Shield,
}

interface ScanCategoryCardProps {
  result: ScanResult
  selected: boolean
  selectedCount: number
  selectedSize: number
  onSelect: (category: string, selected: boolean) => void
}

const ScanCategoryCard = memo(function ScanCategoryCard({
  result,
  selected,
  selectedCount,
  selectedSize,
  onSelect,
}: ScanCategoryCardProps) {
  const Icon = categoryIcons[result.category] || Trash2
  const percentage = result.totalSize > 0 ? (selectedSize / result.totalSize) * 100 : 0

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border cursor-pointer transition-all',
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      )}
      onClick={() => onSelect(result.category, !selected)}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(result.category, !selected)}
          className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">{result.categoryLabel}</h3>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{result.items.length} items</span>
            <span>{formatBytes(result.totalSize)}</span>
          </div>
          {selectedCount > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {selectedCount} selected ({formatBytes(selectedSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default ScanCategoryCard
