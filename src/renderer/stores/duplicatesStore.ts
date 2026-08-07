import { create } from 'zustand'
import type { DuplicateGroup, ScanProgress, ScannedItem } from '../../shared/types'

interface DuplicatesStore {
  status: 'idle' | 'scanning' | 'complete' | 'error'
  progress: ScanProgress | null
  groups: DuplicateGroup[]
  selectedItemIds: Set<string>
  scanPaths: string[]
  minSizeBytes: number
  errorMessage: string | null

  totalWastedSpace: number
  totalSelectedSize: number

  setScanPaths: (paths: string[]) => void
  setMinSize: (bytes: number) => void
  startScan: () => void
  cancelScan: () => void
  setProgress: (progress: ScanProgress) => void
  toggleItem: (id: string) => void
  autoSelectKeepNewest: () => void
  autoSelectKeepOldest: () => void
  selectAll: () => void
  deselectAll: () => void
  deleteSelected: (useQuarantine: boolean) => Promise<{ freed: number; count: number } | null>
  clearResults: () => void
  recalculateTotals: () => void
}

export const useDuplicatesStore = create<DuplicatesStore>((set, get) => ({
  status: 'idle',
  progress: null,
  groups: [],
  selectedItemIds: new Set(),
  scanPaths: [],
  minSizeBytes: 0,
  errorMessage: null,
  totalWastedSpace: 0,
  totalSelectedSize: 0,

  setScanPaths: (paths) => set({ scanPaths: paths }),

  setMinSize: (bytes) => set({ minSizeBytes: bytes }),

  startScan: () => {
    const { scanPaths, minSizeBytes } = get()
    if (scanPaths.length === 0) return

    set({ status: 'scanning', progress: null, groups: [], errorMessage: null })

    const unsubscribe = window.cleanSweepAPI.duplicates.onProgress((progress) => {
      set({ progress })
      if (progress.phase === 'complete') {
        unsubscribe()
      }
    })

    window.cleanSweepAPI.duplicates
      .findDuplicates(scanPaths, { minSizeBytes, includeHidden: false })
      .then((response) => {
        if (response.success) {
          set({ status: 'complete', groups: response.data })
          get().recalculateTotals()
        } else {
          set({ status: 'error', errorMessage: response.error.message })
        }
      })
  },

  cancelScan: () => {
    window.cleanSweepAPI.scanner.cancelScan()
    set({ status: 'idle', progress: null })
  },

  setProgress: (progress) => set({ progress }),

  toggleItem: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedItemIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedItemIds: newSet }
    })
    get().recalculateTotals()
  },

  autoSelectKeepNewest: () => {
    set((state) => {
      const newSet = new Set<string>()
      state.groups.forEach((group) => {
        // Sort by lastModified descending (newest first)
        const sorted = [...group.files].sort((a, b) => b.lastModified - a.lastModified)
        // Select all except the first (newest)
        sorted.slice(1).forEach((item) => {
          newSet.add(item.id)
        })
      })
      return { selectedItemIds: newSet }
    })
    get().recalculateTotals()
  },

  autoSelectKeepOldest: () => {
    set((state) => {
      const newSet = new Set<string>()
      state.groups.forEach((group) => {
        // Sort by lastModified ascending (oldest first)
        const sorted = [...group.files].sort((a, b) => a.lastModified - b.lastModified)
        // Select all except the first (oldest)
        sorted.slice(1).forEach((item) => {
          newSet.add(item.id)
        })
      })
      return { selectedItemIds: newSet }
    })
    get().recalculateTotals()
  },

  selectAll: () => {
    const allIds = new Set<string>()
    get().groups.forEach((group) => {
      group.files.forEach((item) => {
        allIds.add(item.id)
      })
    })
    set({ selectedItemIds: allIds })
    get().recalculateTotals()
  },

  deselectAll: () => {
    set({ selectedItemIds: new Set() })
    get().recalculateTotals()
  },

  deleteSelected: async (useQuarantine) => {
    const state = get()
    const selectedItems: ScannedItem[] = []

    state.groups.forEach((group) => {
      group.files.forEach((item) => {
        if (state.selectedItemIds.has(item.id)) {
          selectedItems.push(item)
        }
      })
    })

    if (selectedItems.length === 0) return null

    try {
      const response = await window.cleanSweepAPI.duplicates.deleteDuplicates(selectedItems, useQuarantine)
      if (response.success) {
        set({
          status: 'idle',
          groups: [],
          selectedItemIds: new Set(),
          progress: null,
        })
        return response.data
      } else {
        set({ status: 'error', errorMessage: response.error.message })
        return null
      }
    } catch (error) {
      set({ status: 'error', errorMessage: 'Failed to delete duplicates' })
      return null
    }
  },

  clearResults: () => {
    set({
      status: 'idle',
      progress: null,
      groups: [],
      selectedItemIds: new Set(),
      errorMessage: null,
      totalWastedSpace: 0,
      totalSelectedSize: 0,
    })
  },

  recalculateTotals: () => {
    const state = get()
    let wastedSpace = 0
    let selectedSize = 0

    state.groups.forEach((group) => {
      wastedSpace += group.wastedSpace
      group.files.forEach((item) => {
        if (state.selectedItemIds.has(item.id)) {
          selectedSize += item.size
        }
      })
    })

    set({ totalWastedSpace: wastedSpace, totalSelectedSize: selectedSize })
  },
}))
