import * as path from 'path'
import { v4 as uuid } from 'uuid'
import { RulesEngine } from './RulesEngine'
import { getFileStat, globFiles, ensureDir, moveFile, copyFile, isPathAccessible } from '../../utils/fsUtils'
import type { OrganizerRule, OrganizePreviewItem } from '../../../shared/types'
import { logger } from '../../utils/logger'

export class FileOrganizerService {
  constructor(private rulesEngine: RulesEngine) {}

  async previewOrganize(
    sourcePath: string,
    rules: OrganizerRule[],
    conflictStrategy: 'skip' | 'rename' | 'overwrite'
  ): Promise<OrganizePreviewItem[]> {
    const files = await globFiles('*', {
      cwd: sourcePath,
      absolute: true,
      onlyFiles: true,
      dot: false,
    }).catch(() => [])

    const preview: OrganizePreviewItem[] = []

    for (const filePath of files) {
      const fileInfo = await this.buildFileInfo(filePath)
      if (!fileInfo) continue

      const match = this.rulesEngine.evaluate(fileInfo, rules)

      if (match) {
        const destDir = path.isAbsolute(match.destination)
          ? match.destination
          : path.join(sourcePath, match.destination)

        const finalName = match.newName
          ? match.newName + fileInfo.extension
          : fileInfo.name

        const destPath = path.join(destDir, finalName)

        preview.push({
          id: uuid(),
          sourcePath: filePath,
          destinationPath: destPath,
          action: match.rule.action,
          ruleName: match.rule.name,
          willOverwrite: await this.fileExists(destPath),
        })
      } else {
        preview.push({
          id: uuid(),
          sourcePath: filePath,
          destinationPath: '',
          action: 'skip',
          ruleName: '',
          willOverwrite: false,
        })
      }
    }

    return preview
  }

  async executeOrganize(
    previewItems: OrganizePreviewItem[],
    conflictStrategy: 'skip' | 'rename' | 'overwrite'
  ): Promise<{ succeeded: number; failed: number; skipped: number }> {
    let succeeded = 0
    let failed = 0
    let skipped = 0

    for (const item of previewItems) {
      if (!item.destinationPath || item.action === 'skip') {
        skipped++
        continue
      }

      try {
        let destPath = item.destinationPath
        if (await this.fileExists(destPath)) {
          if (conflictStrategy === 'skip') {
            skipped++
            continue
          }
          if (conflictStrategy === 'rename') {
            destPath = await this.findNonConflictingPath(destPath)
          }
        }

        await ensureDir(path.dirname(destPath))

        if (item.action === 'move') {
          await moveFile(item.sourcePath, destPath)
        } else if (item.action === 'copy') {
          await copyFile(item.sourcePath, destPath)
        }

        succeeded++
      } catch (error) {
        logger.error('FileOrganizer', `Failed: ${item.sourcePath}`, error)
        failed++
      }
    }

    return { succeeded, failed, skipped }
  }

  private async buildFileInfo(filePath: string) {
    const stat = await getFileStat(filePath)
    if (!stat) return null
    const name = path.basename(filePath)
    const ext = path.extname(name)
    return {
      path: filePath,
      name,
      nameWithoutExt: path.basename(name, ext),
      extension: ext,
      size: stat.size,
      created: stat.lastModified,
      modified: stat.lastModified,
    }
  }

  private async findNonConflictingPath(filePath: string): Promise<string> {
    const dir = path.dirname(filePath)
    const ext = path.extname(filePath)
    const base = path.basename(filePath, ext)
    let counter = 1
    let candidate = filePath

    while (await this.fileExists(candidate)) {
      candidate = path.join(dir, `${base} (${counter})${ext}`)
      counter++
    }
    return candidate
  }

  private async fileExists(p: string): Promise<boolean> {
    return isPathAccessible(p)
  }
}
