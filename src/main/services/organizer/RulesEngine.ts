import * as path from 'path'
import type { OrganizerRule, RuleCondition, RuleConditionField } from '../../../shared/types'

interface FileInfo {
  path: string
  name: string
  nameWithoutExt: string
  extension: string
  size: number
  created: number
  modified: number
}

export class RulesEngine {
  evaluate(
    fileInfo: FileInfo,
    rules: OrganizerRule[]
  ): { rule: OrganizerRule; destination: string; newName: string | null } | null {
    const sorted = [...rules]
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority)

    for (const rule of sorted) {
      if (this.matchesRule(fileInfo, rule)) {
        return {
          rule,
          destination: this.resolveDestination(fileInfo, rule.destination),
          newName: rule.namingPattern
            ? this.applyPattern(fileInfo, rule.namingPattern)
            : null,
        }
      }
    }
    return null
  }

  private matchesRule(fileInfo: FileInfo, rule: OrganizerRule): boolean {
    const results = rule.conditions.map(c => this.evaluateCondition(fileInfo, c))

    if (rule.logicOperator === 'AND') return results.every(Boolean)
    if (rule.logicOperator === 'OR') return results.some(Boolean)
    return false
  }

  private evaluateCondition(fileInfo: FileInfo, condition: RuleCondition): boolean {
    const value = this.getFieldValue(fileInfo, condition.field)
    const condVal = condition.value.toLowerCase()
    const fieldVal = value.toLowerCase()

    switch (condition.operator) {
      case 'contains':
        return fieldVal.includes(condVal)
      case 'equals':
        return fieldVal === condVal
      case 'startsWith':
        return fieldVal.startsWith(condVal)
      case 'endsWith':
        return fieldVal.endsWith(condVal)
      case 'greaterThan':
        return parseFloat(value) > parseFloat(condition.value)
      case 'lessThan':
        return parseFloat(value) < parseFloat(condition.value)
      case 'matches': {
        try {
          return new RegExp(condition.value, 'i').test(value)
        } catch {
          return false
        }
      }
      default:
        return false
    }
  }

  private getFieldValue(fileInfo: FileInfo, field: RuleConditionField): string {
    switch (field) {
      case 'name':
        return fileInfo.nameWithoutExt
      case 'extension':
        return fileInfo.extension
      case 'size':
        return fileInfo.size.toString()
      case 'created':
        return fileInfo.created.toString()
      case 'modified':
        return fileInfo.modified.toString()
      default:
        return ''
    }
  }

  private resolveDestination(fileInfo: FileInfo, template: string): string {
    const date = new Date(fileInfo.modified)
    return template
      .replace(/{year}/g, date.getFullYear().toString())
      .replace(/{month}/g, String(date.getMonth() + 1).padStart(2, '0'))
      .replace(/{day}/g, String(date.getDate()).padStart(2, '0'))
      .replace(/{ext}/g, fileInfo.extension.replace('.', ''))
      .replace(/{type}/g, this.getTypeCategory(fileInfo.extension))
      .replace(/{name}/g, fileInfo.nameWithoutExt)
  }

  applyPattern(fileInfo: FileInfo, pattern: string): string {
    const date = new Date(fileInfo.modified)
    let counter = 1
    return pattern
      .replace(/{name}/g, fileInfo.nameWithoutExt)
      .replace(/{ext}/g, fileInfo.extension)
      .replace(/{year}/g, date.getFullYear().toString())
      .replace(/{month}/g, String(date.getMonth() + 1).padStart(2, '0'))
      .replace(/{day}/g, String(date.getDate()).padStart(2, '0'))
      .replace(/{counter}/g, String(counter).padStart(3, '0'))
  }

  private getTypeCategory(ext: string): string {
    const categories: Record<string, string[]> = {
      Images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.heic'],
      Videos: ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'],
      Audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      Documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
      Spreadsheets: ['.xls', '.xlsx', '.csv', '.ods'],
      Presentations: ['.ppt', '.pptx', '.odp'],
      Archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      Code: ['.js', '.ts', '.py', '.java', '.cpp', '.html', '.css'],
    }
    for (const [cat, exts] of Object.entries(categories)) {
      if (exts.includes(ext.toLowerCase())) return cat
    }
    return 'Other'
  }

  buildFileInfo(filePath: string, stats: { size: number; lastModified: number }): FileInfo {
    const name = path.basename(filePath)
    const ext = path.extname(name)
    return {
      path: filePath,
      name,
      nameWithoutExt: path.basename(name, ext),
      extension: ext,
      size: stats.size,
      created: stats.lastModified,
      modified: stats.lastModified,
    }
  }
}
