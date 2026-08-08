import React from 'react'
import type { OrganizePreviewItem } from '../../../shared/types'

interface PreviewTableProps {
  items: OrganizePreviewItem[]
}

export default function PreviewTable({ items }: PreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-800/60 max-h-72">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50/80 dark:bg-gray-900/80 text-gray-500 font-bold border-b border-gray-200/60 dark:border-gray-800/60 sticky top-0 backdrop-blur-md">
          <tr>
            <th className="p-3">Original File</th>
            <th className="p-3">Matched Rule</th>
            <th className="p-3">Target Destination</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/40 dark:divide-gray-800/40 font-mono">
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td className="p-3 truncate max-w-xs text-gray-900 dark:text-white font-medium">{item.sourcePath}</td>
              <td className="p-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-sans font-semibold">
                  {item.ruleName}
                </span>
              </td>
              <td className="p-3 truncate max-w-xs text-emerald-600 dark:text-emerald-400">{item.destinationPath}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
