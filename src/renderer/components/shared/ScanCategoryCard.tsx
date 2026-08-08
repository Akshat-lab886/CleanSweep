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
  result?: ScanResult
  category?: ScanCategory
  categoryLabel?: string
  itemCount?: number
  totalSize?: number
  selectedSize?: number
  selectedCount?: number
  selected?: boolean
  isAllSelected?: boolean
  onSelect?: (category: string, selected: boolean) => void
  onToggleSelectAll?: (selected: boolean) => void
}

const ScanCategoryCard = memo(function ScanCategoryCard(props: ScanCategoryCardProps) {
  const cat = props.category || props.result?.category || 'system-junk'
  const label = props.categoryLabel || props.result?.categoryLabel || 'Category'
  const count = props.itemCount !== undefined ? props.itemCount : props.result?.items.length || 0
  const totSize = props.totalSize !== undefined ? props.totalSize : props.result?.totalSize || 0
  const selSize = props.selectedSize || 0
  const isChecked = props.isAllSelected !== undefined ? props.isAllSelected : props.selected || false

  const handleToggle = (bool: boolean) => {
    if (props.onToggleSelectAll) props.onToggleSelectAll(bool)
    if (props.onSelect) props.onSelect(cat, bool)
  }

  const Icon = categoryIcons[cat] || Trash2

  return (
    <div
      onClick={() => handleToggle(!isChecked)}
      className={clsx(
        'p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
        isChecked
          ? 'border-blue-500/50 bg-blue-500/10 dark:bg-blue-500/15'
          : 'glass-card hover:border-blue-500/30'
      )}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => handleToggle(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-gray-900 dark:text-white">{label}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">{count} items scanned</p>
        </div>
      </div>

      <div className="text-right">
        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">{formatBytes(totSize)}</span>
        <p className="text-[11px] text-emerald-500 font-semibold">{formatBytes(selSize)} selected</p>
      </div>
    </div>
  )
})

export default ScanCategoryCard
