import React, { memo } from 'react'
import { File, Folder, Image, FileText, Music, Video, Archive, Code } from 'lucide-react'
import type { ScannedItem } from '../../../shared/types'
import { formatBytes } from '../../utils/format'

interface FileListItemProps {
  item: ScannedItem
  selected?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
  onToggle?: () => void
}

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase()
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.heic', '.ico']
  const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
  const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages']
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']
  const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php']

  if (imageExts.includes(ext)) return Image
  if (videoExts.includes(ext)) return Video
  if (audioExts.includes(ext)) return Music
  if (docExts.includes(ext)) return FileText
  if (archiveExts.includes(ext)) return Archive
  if (codeExts.includes(ext)) return Code

  return File
}

const FileListItem = memo(function FileListItem({ item, selected, isSelected, onSelect, onToggle }: FileListItemProps) {
  const activeSelected = isSelected !== undefined ? isSelected : (selected || false)
  const ext = item.path.includes('.') ? '.' + item.path.split('.').pop() : ''
  const Icon = item.type === 'directory' ? Folder : getFileIcon(ext)
  const fileName = item.path.split('/').pop() || item.path.split('\\').pop() || item.path

  const handleAction = () => {
    if (onToggle) onToggle()
    if (onSelect) onSelect(item.id)
  }

  return (
    <div
      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/60 cursor-pointer transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
      onClick={handleAction}
    >
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <input
          type="checkbox"
          checked={activeSelected}
          onChange={handleAction}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center shrink-0 font-bold">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{fileName}</p>
          <p className="text-[11px] font-mono text-gray-400 truncate">{item.path}</p>
        </div>
      </div>

      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
        {formatBytes(item.size)}
      </span>
    </div>
  )
})

export default FileListItem
