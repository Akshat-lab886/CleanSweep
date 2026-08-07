import { create } from 'zustand'
import type { AppConfig, HistoryEntry, OrganizerRule, ScheduleTask } from '../../shared/types'

interface SettingsStore {
  config: AppConfig | null
  whitelist: string[]
  rules: OrganizerRule[]
  schedules: ScheduleTask[]
  history: HistoryEntry[]
  loading: boolean

  loadConfig: () => Promise<void>
  updateConfig: (config: Partial<AppConfig>) => Promise<void>
  addToWhitelist: (path: string) => Promise<void>
  removeFromWhitelist: (path: string) => Promise<void>
  loadRules: () => Promise<void>
  saveRules: (rules: OrganizerRule[]) => Promise<void>
  loadSchedules: () => Promise<void>
  loadHistory: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  config: null,
  whitelist: [],
  rules: [],
  schedules: [],
  history: [],
  loading: false,

  loadConfig: async () => {
    set({ loading: true })
    try {
      const response = await window.cleanSweepAPI.config.getConfig()
      if (response.success) {
        set({ config: response.data })
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      set({ loading: false })
    }

    // Also load whitelist
    try {
      const response = await window.cleanSweepAPI.config.getWhitelist()
      if (response.success) {
        set({ whitelist: response.data })
      }
    } catch (error) {
      console.error('Failed to load whitelist:', error)
    }
  },

  updateConfig: async (config) => {
    try {
      const response = await window.cleanSweepAPI.config.setConfig(config)
      if (response.success) {
        set((state) => ({
          config: state.config ? { ...state.config, ...config } : null,
        }))
      }
    } catch (error) {
      console.error('Failed to update config:', error)
    }
  },

  addToWhitelist: async (path) => {
    try {
      const response = await window.cleanSweepAPI.config.addToWhitelist(path)
      if (response.success) {
        set((state) => ({
          whitelist: [...state.whitelist, path],
        }))
      }
    } catch (error) {
      console.error('Failed to add to whitelist:', error)
    }
  },

  removeFromWhitelist: async (path) => {
    try {
      const response = await window.cleanSweepAPI.config.removeFromWhitelist(path)
      if (response.success) {
        set((state) => ({
          whitelist: state.whitelist.filter((p) => p !== path),
        }))
      }
    } catch (error) {
      console.error('Failed to remove from whitelist:', error)
    }
  },

  loadRules: async () => {
    try {
      const response = await window.cleanSweepAPI.organizer.getRules()
      if (response.success) {
        set({ rules: response.data })
      }
    } catch (error) {
      console.error('Failed to load rules:', error)
    }
  },

  saveRules: async (rules) => {
    try {
      const response = await window.cleanSweepAPI.organizer.saveRules(rules)
      if (response.success) {
        set({ rules })
      }
    } catch (error) {
      console.error('Failed to save rules:', error)
    }
  },

  loadSchedules: async () => {
    try {
      const response = await window.cleanSweepAPI.scheduler.getSchedules()
      if (response.success) {
        set({ schedules: response.data })
      }
    } catch (error) {
      console.error('Failed to load schedules:', error)
    }
  },

  loadHistory: async () => {
    try {
      const response = await window.cleanSweepAPI.cleaner.getHistory()
      if (response.success) {
        set({ history: response.data })
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  },
}))
