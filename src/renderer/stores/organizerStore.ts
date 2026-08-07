import { create } from 'zustand'
import type { OrganizerRule, OrganizePreviewItem, RenamePreviewItem, RenamePattern } from '../../shared/types'

interface OrganizerStore {
  rules: OrganizerRule[]
  sourcePath: string
  previewItems: OrganizePreviewItem[]
  status: 'idle' | 'previewing' | 'executing' | 'complete' | 'error'
  result: { succeeded: number; failed: number; skipped: number } | null
  errorMessage: string | null

  // Rename state
  renameFiles: string[]
  renamePattern: RenamePattern
  renamePreview: RenamePreviewItem[]
  renameStatus: 'idle' | 'previewing' | 'executing' | 'complete'
  renameResult: { succeeded: number; failed: number } | null

  loadRules: () => Promise<void>
  saveRules: (rules: OrganizerRule[]) => Promise<void>
  addRule: (rule: OrganizerRule) => void
  updateRule: (id: string, updates: Partial<OrganizerRule>) => void
  deleteRule: (id: string) => void
  setSourcePath: (path: string) => void
  runPreview: () => Promise<void>
  executeOrganize: (strategy: 'skip' | 'rename' | 'overwrite') => Promise<void>
  clearPreview: () => void

  // Rename actions
  setRenameFiles: (files: string[]) => void
  setRenamePattern: (pattern: RenamePattern) => void
  runRenamePreview: () => Promise<void>
  executeRename: () => Promise<void>
  clearRename: () => void
}

export const useOrganizerStore = create<OrganizerStore>((set, get) => ({
  rules: [],
  sourcePath: '',
  previewItems: [],
  status: 'idle',
  result: null,
  errorMessage: null,

  renameFiles: [],
  renamePattern: {},
  renamePreview: [],
  renameStatus: 'idle',
  renameResult: null,

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

  addRule: (rule) => {
    set((state) => ({ rules: [...state.rules, rule] }))
  },

  updateRule: (id, updates) => {
    set((state) => ({
      rules: state.rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)),
    }))
  },

  deleteRule: (id) => {
    set((state) => ({
      rules: state.rules.filter((rule) => rule.id !== id),
    }))
  },

  setSourcePath: (path) => set({ sourcePath: path }),

  runPreview: async () => {
    const { sourcePath, rules } = get()
    if (!sourcePath || rules.length === 0) return

    set({ status: 'previewing', errorMessage: null })

    try {
      const response = await window.cleanSweepAPI.organizer.previewOrganize(sourcePath, rules)
      if (response.success) {
        set({ status: 'complete', previewItems: response.data })
      } else {
        set({ status: 'error', errorMessage: response.error.message })
      }
    } catch (error) {
      set({ status: 'error', errorMessage: 'Failed to generate preview' })
    }
  },

  executeOrganize: async (strategy) => {
    const { previewItems } = get()
    if (previewItems.length === 0) return

    set({ status: 'executing' })

    try {
      const response = await window.cleanSweepAPI.organizer.executeOrganize(previewItems, strategy)
      if (response.success) {
        set({ status: 'complete', result: response.data })
      } else {
        set({ status: 'error', errorMessage: response.error.message })
      }
    } catch (error) {
      set({ status: 'error', errorMessage: 'Failed to execute organize' })
    }
  },

  clearPreview: () => {
    set({
      status: 'idle',
      previewItems: [],
      result: null,
      errorMessage: null,
    })
  },

  // Rename actions
  setRenameFiles: (files) => set({ renameFiles: files }),

  setRenamePattern: (pattern) => set({ renamePattern: pattern }),

  runRenamePreview: async () => {
    const { renameFiles, renamePattern } = get()
    if (renameFiles.length === 0) return

    set({ renameStatus: 'previewing' })

    try {
      const response = await window.cleanSweepAPI.organizer.renamePreview(renameFiles, renamePattern)
      if (response.success) {
        set({ renameStatus: 'complete', renamePreview: response.data })
      } else {
        set({ renameStatus: 'idle' })
      }
    } catch (error) {
      set({ renameStatus: 'idle' })
    }
  },

  executeRename: async () => {
    const { renamePreview } = get()
    if (renamePreview.length === 0) return

    set({ renameStatus: 'executing' })

    try {
      const response = await window.cleanSweepAPI.organizer.renameExecute(renamePreview)
      if (response.success) {
        set({ renameStatus: 'complete', renameResult: response.data })
      } else {
        set({ renameStatus: 'idle' })
      }
    } catch (error) {
      set({ renameStatus: 'idle' })
    }
  },

  clearRename: () => {
    set({
      renameFiles: [],
      renamePattern: {},
      renamePreview: [],
      renameStatus: 'idle',
      renameResult: null,
    })
  },
}))
