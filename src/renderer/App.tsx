import React, { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import AppRouter from './router'
import { useUIStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import ToastContainer from './components/shared/Toast'

function App() {
  const { theme } = useUIStore()
  const { loadConfig } = useSettingsStore()

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  // Load config on mount
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <HashRouter>
      <AppRouter />
      <ToastContainer />
    </HashRouter>
  )
}

export default App
