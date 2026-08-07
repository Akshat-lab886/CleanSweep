import React, { memo } from 'react'
import { File, Folder, Image, FileText, Music, Video, Archive, Code } from 'lucide-react'
import type { ScannedItem } from '../../../shared/types'
import { formatBytes } from '../../utils/format'

interface FileListItemProps {
  item: ScannedItem
  selected: boolean
  onSelect: (id: string) => void
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

const FileListItem = memo(function FileListItem({ item, selected, onSelect }: FileListItemProps) {
  const ext = item.path.includes('.') ? '.' + item.path.split('.').pop() : ''
  const Icon = item.type === 'directory' ? Folder : getFileIcon(ext)
  const fileName = item.path.split('/').pop() || item.path.split('\\').pop() || item.path

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={() => onSelect(item.id)}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(item.id)}
        className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
        onClick={(e) => e.stopPropagation()}
      />
      <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{fileName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.path}</p>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
        {formatBytes(item.size)}
      </span>
    </div>
  )
})

export default FileListItem
