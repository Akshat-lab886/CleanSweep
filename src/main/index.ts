import { app, BrowserWindow, shell, dialog } from 'electron'
import path from 'path'
import { registerAllHandlers } from './ipcHandlers'
import { TrayManager } from './trayManager'

let mainWindow: BrowserWindow | null = null
let trayManager: TrayManager | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 13 },
    show: false,
  })

  // Load dev server or built files
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Register IPC handlers
  registerAllHandlers(mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    // Set App User Model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.cleansweep.app')
    }

    createWindow()

    // Initialize tray
    trayManager = new TrayManager(mainWindow!)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up on quit
app.on('before-quit', () => {
  trayManager?.destroy()
})
