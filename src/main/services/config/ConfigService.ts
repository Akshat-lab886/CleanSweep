import * as fs from 'fs/promises'
import * as path from 'path'
import { app } from 'electron'
import { v4 as uuid } from 'uuid'
import type { AppConfig, OrganizerRule, HistoryEntry, ScheduleTask } from '../../../shared/types'
import { DEFAULT_CONFIG } from '../../../shared/constants'
import { logger } from '../../utils/logger'

export class ConfigService {
  private configPath: string
  private whitelistPath: string
  private historyPath: string
  private rulesPath: string
  private schedulesPath: string
  private configCache: AppConfig | null = null

  constructor() {
    const userData = app.getPath('userData')
    this.configPath = path.join(userData, 'config.json')
    this.whitelistPath = path.join(userData, 'whitelist.json')
    this.historyPath = path.join(userData, 'history.json')
    this.rulesPath = path.join(userData, 'rules.json')
    this.schedulesPath = path.join(userData, 'schedules.json')
    this.ensureDir(userData)
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch {}
  }

  private async readJSON<T>(filePath: string): Promise<T | null> {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  private async writeJSON<T>(filePath: string, data: T): Promise<void> {
    const tmpPath = filePath + '.tmp'
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(tmpPath, filePath)
  }

  async getConfig(): Promise<AppConfig> {
    if (this.configCache) return this.configCache

    const saved = await this.readJSON<Partial<AppConfig>>(this.configPath)

    if (!saved) {
      const defaultConfig = { ...DEFAULT_CONFIG }
      await this.writeJSON(this.configPath, defaultConfig)
      this.configCache = defaultConfig
      return defaultConfig
    }

    // Deep merge with defaults
    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      ...saved,
      general: { ...DEFAULT_CONFIG.general, ...saved.general },
      scan: { ...DEFAULT_CONFIG.scan, ...saved.scan },
      quarantine: { ...DEFAULT_CONFIG.quarantine, ...saved.quarantine },
      cleaner: {
        browsers: { ...DEFAULT_CONFIG.cleaner.browsers, ...saved.cleaner?.browsers },
        systemJunk: { ...DEFAULT_CONFIG.cleaner.systemJunk, ...saved.cleaner?.systemJunk },
      },
      organizer: { ...DEFAULT_CONFIG.organizer, ...saved.organizer },
      ui: { ...DEFAULT_CONFIG.ui, ...saved.ui },
    }

    this.configCache = config
    return config
  }

  async setConfig(partial: Partial<AppConfig>): Promise<void> {
    const current = await this.getConfig()
    const updated = this.deepMerge(current, partial)
    await this.writeJSON(this.configPath, updated)
    this.configCache = updated
  }

  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target }
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key], source[key] as any)
        } else {
          result[key] = source[key] as any
        }
      }
    }
    return result
  }

  async getWhitelist(): Promise<string[]> {
    const list = await this.readJSON<string[]>(this.whitelistPath)
    return list || []
  }

  async addToWhitelist(itemPath: string): Promise<void> {
    const list = await this.getWhitelist()
    if (!list.includes(itemPath)) {
      list.push(itemPath)
      await this.writeJSON(this.whitelistPath, list)
    }
  }

  async removeFromWhitelist(itemPath: string): Promise<void> {
    const list = await this.getWhitelist()
    const filtered = list.filter(p => p !== itemPath)
    await this.writeJSON(this.whitelistPath, filtered)
  }

  async getRules(): Promise<OrganizerRule[]> {
    const rules = await this.readJSON<OrganizerRule[]>(this.rulesPath)
    return rules || []
  }

  async saveRules(rules: OrganizerRule[]): Promise<void> {
    await this.writeJSON(this.rulesPath, rules)
  }

  async getHistory(): Promise<HistoryEntry[]> {
    const history = await this.readJSON<HistoryEntry[]>(this.historyPath)
    return history || []
  }

  async addHistoryEntry(entry: HistoryEntry): Promise<void> {
    const history = await this.getHistory()
    history.unshift(entry)
    // Keep only last 500 entries
    if (history.length > 500) {
      history.pop()
    }
    await this.writeJSON(this.historyPath, history)
  }

  async getSchedules(): Promise<ScheduleTask[]> {
    const schedules = await this.readJSON<ScheduleTask[]>(this.schedulesPath)
    return schedules || []
  }

  async saveSchedules(schedules: ScheduleTask[]): Promise<void> {
    await this.writeJSON(this.schedulesPath, schedules)
  }
}
