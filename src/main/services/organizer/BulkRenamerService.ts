import * as path from 'path'
import * as fs from 'fs'
import { v4 as uuid } from 'uuid'
import type { RenamePattern, RenamePreviewItem } from '../../../shared/types'

export class BulkRenamerService {
  previewRename(filePaths: string[], pattern: RenamePattern): RenamePreviewItem[] {
    return filePaths.map((filePath, index) => {
      const newName = this.applyPattern(filePath, pattern, index + 1)
      return {
        id: uuid(),
        originalPath: filePath,
        originalName: path.basename(filePath),
        newName,
        newPath: path.join(path.dirname(filePath), newName),
        hasConflict: false,
      }
    })
  }

  applyPattern(filePath: string, pattern: RenamePattern, counter: number): string {
    const name = path.basename(filePath)
    const ext = path.extname(name)
    const nameWithoutExt = path.basename(name, ext)

    try {
      const stat = fs.statSync(filePath)
      const date = new Date(stat.mtime)

      let newName = nameWithoutExt

      if (pattern.replaceText) {
        newName = newName.split(pattern.replaceText).join(pattern.replaceWith || '')
      }
      if (pattern.addPrefix) newName = pattern.addPrefix + newName
      if (pattern.addSuffix) newName = newName + pattern.addSuffix
      if (pattern.caseChange === 'upper') newName = newName.toUpperCase()
      if (pattern.caseChange === 'lower') newName = newName.toLowerCase()
      if (pattern.caseChange === 'title') {
        newName = newName.replace(/\b\w/g, c => c.toUpperCase())
      }
      if (pattern.numberSequentially) {
        const pad = String(counter).padStart(pattern.numberPadding || 3, '0')
        newName = pattern.numberPosition === 'prefix' ? `${pad}_${newName}` : `${newName}_${pad}`
      }
      if (pattern.template) {
        newName = pattern.template
          .replace('{name}', nameWithoutExt)
          .replace('{year}', date.getFullYear().toString())
          .replace('{month}', String(date.getMonth() + 1).padStart(2, '0'))
          .replace('{day}', String(date.getDate()).padStart(2, '0'))
          .replace('{counter}', String(counter).padStart(3, '0'))
      }

      return newName + (pattern.changeExtension || ext)
    } catch {
      return name
    }
  }

  async executeRename(items: RenamePreviewItem[]): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0
    let failed = 0

    for (const item of items) {
      try {
        await fs.promises.rename(item.originalPath, item.newPath)
        succeeded++
      } catch {
        failed++
      }
    }

    return { succeeded, failed }
  }
}
