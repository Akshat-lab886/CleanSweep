import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import { execSync } from 'child_process'
import { shell } from 'electron'
import { v4 as uuid } from 'uuid'
import { getDirectorySize, listDirectory } from '../../utils/fsUtils'
import type { AppInfo } from '../../../shared/types'
import { logger } from '../../utils/logger'

export class AppManagerService {
  async listApps(): Promise<AppInfo[]> {
    if (process.platform === 'darwin') {
      return this.getMacApps()
    }
    return this.getWindowsApps()
  }

  private async getMacApps(): Promise<AppInfo[]> {
    const appDirs = ['/Applications', path.join(os.homedir(), 'Applications')]
    const apps: AppInfo[] = []

    for (const dir of appDirs) {
      const entries = await listDirectory(dir)

      for (const entry of entries.filter(e => e.endsWith('.app'))) {
        try {
          const plistPath = path.join(entry, 'Contents', 'Info.plist')
          const plistContent = await fs.readFile(plistPath, 'utf-8').catch(() => null)

          const name = plistContent
            ? this.extractPlistValue(plistContent, 'CFBundleName')
            : path.basename(entry, '.app')

          const version = plistContent
            ? this.extractPlistValue(plistContent, 'CFBundleShortVersionString')
            : 'Unknown'

          const bundleId = plistContent
            ? this.extractPlistValue(plistContent, 'CFBundleIdentifier')
            : undefined

          const size = await getDirectorySize(entry)

          apps.push({
            id: uuid(),
            name: name || path.basename(entry, '.app'),
            path: entry,
            size,
            version: version || 'Unknown',
            bundleId,
          })
        } catch {
          // Skip apps we can't read
        }
      }
    }

    return apps.sort((a, b) => b.size - a.size)
  }

  private extractPlistValue(plist: string, key: string): string | undefined {
    const regex = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`)
    return plist.match(regex)?.[1]
  }

  private async getWindowsApps(): Promise<AppInfo[]> {
    try {
      const output = execSync(
        `powershell -command "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*','HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*' | Where-Object { $_.DisplayName } | Select-Object DisplayName, DisplayVersion, InstallLocation, Publisher | ConvertTo-Json -Compress"`,
        { encoding: 'utf-8', timeout: 10000 }
      )

      const parsed = JSON.parse(output)
      const list = Array.isArray(parsed) ? parsed : [parsed]

      return list
        .filter(a => a.DisplayName)
        .map(a => ({
          id: uuid(),
          name: a.DisplayName,
          path: a.InstallLocation || '',
          size: 0, // Size calculation is expensive on Windows
          version: a.DisplayVersion || 'Unknown',
          publisher: a.Publisher,
        }))
    } catch {
      return []
    }
  }

  async uninstallApp(appInfo: AppInfo): Promise<void> {
    if (process.platform === 'darwin') {
      // Move .app to trash
      await shell.trashItem(appInfo.path)
    } else {
      // On Windows, open Add/Remove Programs
      shell.openPath('ms-settings:appsfeatures')
    }
  }
}
