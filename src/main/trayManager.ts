import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import * as path from 'path'

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow

  constructor(window: BrowserWindow) {
    this.mainWindow = window
    this.createTray()
  }

  private createTray() {
    // Create tray icon
    const iconPath = this.getIconPath()
    const icon = nativeImage.createFromPath(iconPath)

    // Resize for tray (16x16 on macOS, 32x32 on Windows)
    const trayIcon = process.platform === 'darwin' ? icon.resize({ width: 16, height: 16 }) : icon.resize({ width: 32, height: 32 })

    this.tray = new Tray(trayIcon)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open CleanSweep',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
        },
      },
      {
        label: 'Quick Scan',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
          // Emit event to start quick scan
          this.mainWindow.webContents.send('tray:quick-scan')
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        },
      },
    ])

    this.tray.setToolTip('CleanSweep')
    this.tray.setContextMenu(contextMenu)

    // On macOS, clicking the tray icon shows the menu by default
    // On Windows, clicking shows the window
    if (process.platform === 'win32') {
      this.tray.on('click', () => {
        this.mainWindow.show()
        this.mainWindow.focus()
      })
    }
  }

  private getIconPath(): string {
    // In development, use a placeholder
    // In production, use the app icon
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

    if (isDev) {
      // Return a simple 1x1 transparent PNG for dev
      return path.join(__dirname, '../../assets/icon.png')
    }

    return path.join(process.resourcesPath, 'assets/icon.png')
  }

  updateTooltip(text: string) {
    this.tray?.setToolTip(text)
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
