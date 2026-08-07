import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface UIStore {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  activeModal: string | null
  toasts: Toast[]
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  openModal: (id: string) => void
  closeModal: () => void
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      activeModal: null,
      toasts: [],

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      openModal: (id) => set({ activeModal: id }),

      closeModal: () => set({ activeModal: null }),

      addToast: (message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }))

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          get().removeToast(id)
        }, 4000)
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'cleansweep-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
