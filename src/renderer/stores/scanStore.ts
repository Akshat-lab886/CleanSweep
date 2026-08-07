import { create } from 'zustand'
import type { ScanResult, ScanProgress, ScannedItem } from '../../shared/types'

interface ScanStore {
  status: 'idle' | 'scanning' | 'complete' | 'error'
  scanType: 'quick' | 'deep' | 'browser' | null
  progress: ScanProgress | null
  results: ScanResult[]
  selectedItemIds: Set<string>
  errorMessage: string | null

  totalSelectedSize: number
  totalFoundSize: number

  startQuickScan: () => void
  startDeepScan: () => void
  startBrowserScan: (browsers: string[], options: Record<string, boolean>) => void
  cancelScan: () => void
  setProgress: (progress: ScanProgress) => void
  setResults: (results: ScanResult[]) => void
  setError: (error: string) => void
  toggleItemSelection: (id: string) => void
  toggleCategorySelection: (category: string, selected: boolean) => void
  selectAll: () => void
  deselectAll: () => void
  executeClean: (useQuarantine: boolean) => Promise<{ freed: number; count: number; failed: number } | null>
  clearResults: () => void
  recalculateTotals: () => void
}

export const useScanStore = create<ScanStore>((set, get) => ({
  status: 'idle',
  scanType: null,
  progress: null,
  results: [],
  selectedItemIds: new Set(),
  errorMessage: null,
  totalSelectedSize: 0,
  totalFoundSize: 0,

  startQuickScan: () => {
    set({ status: 'scanning', scanType: 'quick', progress: null, results: [], errorMessage: null })

    // Subscribe to progress
    const unsubscribe = window.cleanSweepAPI.scanner.onProgress((progress) => {
      set({ progress })
      if (progress.phase === 'complete') {
        unsubscribe()
      }
    })

    // Start scan
    window.cleanSweepAPI.scanner.quickScan().then((response) => {
      if (response.success) {
        set({ status: 'complete', results: response.data })
        // Auto-select all safe-to-delete items
        const safeIds = new Set<string>()
        response.data.forEach((result) => {
          result.items.forEach((item) => {
            if (item.safeToDelete) {
              safeIds.add(item.id)
            }
          })
        })
        set({ selectedItemIds: safeIds })
        get().recalculateTotals()
      } else {
        set({ status: 'error', errorMessage: response.error.message })
      }
    })
  },

  startDeepScan: () => {
    set({ status: 'scanning', scanType: 'deep', progress: null, results: [], errorMessage: null })

    const unsubscribe = window.cleanSweepAPI.scanner.onProgress((progress) => {
      set({ progress })
      if (progress.phase === 'complete') {
        unsubscribe()
      }
    })

    window.cleanSweepAPI.scanner.deepScan().then((response) => {
      if (response.success) {
        set({ status: 'complete', results: response.data })
        const safeIds = new Set<string>()
        response.data.forEach((result) => {
          result.items.forEach((item) => {
            if (item.safeToDelete) {
              safeIds.add(item.id)
            }
          })
        })
        set({ selectedItemIds: safeIds })
        get().recalculateTotals()
      } else {
        set({ status: 'error', errorMessage: response.error.message })
      }
    })
  },

  startBrowserScan: (browsers, options) => {
    set({ status: 'scanning', scanType: 'browser', progress: null, results: [], errorMessage: null })

    const unsubscribe = window.cleanSweepAPI.scanner.onProgress((progress) => {
      set({ progress })
      if (progress.phase === 'complete') {
        unsubscribe()
      }
    })

    window.cleanSweepAPI.scanner.browserScan(browsers, options).then((response) => {
      if (response.success) {
        set({ status: 'complete', results: response.data })
        const safeIds = new Set<string>()
        response.data.forEach((result) => {
          result.items.forEach((item) => {
            if (item.safeToDelete) {
              safeIds.add(item.id)
            }
          })
        })
        set({ selectedItemIds: safeIds })
        get().recalculateTotals()
      } else {
        set({ status: 'error', errorMessage: response.error.message })
      }
    })
  },

  cancelScan: () => {
    window.cleanSweepAPI.scanner.cancelScan()
    set({ status: 'idle', scanType: null, progress: null })
  },

  setProgress: (progress) => set({ progress }),

  setResults: (results) => set({ results }),

  setError: (error) => set({ status: 'error', errorMessage: error }),

  toggleItemSelection: (id) => {
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

  toggleCategorySelection: (category, selected) => {
    set((state) => {
      const newSet = new Set(state.selectedItemIds)
      const categoryResult = state.results.find((r) => r.category === category)
      if (categoryResult) {
        categoryResult.items.forEach((item) => {
          if (selected) {
            newSet.add(item.id)
          } else {
            newSet.delete(item.id)
          }
        })
      }
      return { selectedItemIds: newSet }
    })
    get().recalculateTotals()
  },

  selectAll: () => {
    const allIds = new Set<string>()
    get().results.forEach((result) => {
      result.items.forEach((item) => {
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

  executeClean: async (useQuarantine) => {
    const state = get()
    const selectedItems: ScannedItem[] = []

    state.results.forEach((result) => {
      result.items.forEach((item) => {
        if (state.selectedItemIds.has(item.id)) {
          selectedItems.push(item)
        }
      })
    })

    if (selectedItems.length === 0) return null

    try {
      const response = await window.cleanSweepAPI.cleaner.executeClean(selectedItems, useQuarantine)
      if (response.success) {
        // Clear results after successful clean
        set({
          status: 'idle',
          results: [],
          selectedItemIds: new Set(),
          progress: null,
        })
        return response.data
      } else {
        set({ status: 'error', errorMessage: response.error.message })
        return null
      }
    } catch (error) {
      set({ status: 'error', errorMessage: 'Failed to execute clean' })
      return null
    }
  },

  clearResults: () => {
    set({
      status: 'idle',
      scanType: null,
      progress: null,
      results: [],
      selectedItemIds: new Set(),
      errorMessage: null,
      totalSelectedSize: 0,
      totalFoundSize: 0,
    })
  },

  recalculateTotals: () => {
    const state = get()
    let selectedSize = 0
    let foundSize = 0

    state.results.forEach((result) => {
      result.items.forEach((item) => {
        foundSize += item.size
        if (state.selectedItemIds.has(item.id)) {
          selectedSize += item.size
        }
      })
    })

    set({ totalSelectedSize: selectedSize, totalFoundSize: foundSize })
  },
}))
