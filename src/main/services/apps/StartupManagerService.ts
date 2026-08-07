import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import { execSync } from 'child_process'
import { shell } from 'electron'
import { v4 as uuid } from 'uuid'
import { listDirectory } from '../../utils/fsUtils'
import type { StartupItem } from '../../../shared/types'

export class StartupManagerService {
  async getStartupItems(): Promise<StartupItem[]> {
    if (process.platform === 'darwin') {
      return this.getMacStartupItems()
    }
    return this.getWindowsStartupItems()
  }

  private async getMacStartupItems(): Promise<StartupItem[]> {
    const launchAgentsPath = path.join(os.homedir(), 'Library', 'LaunchAgents')
    const items: StartupItem[] = []

    try {
      const files = await listDirectory(launchAgentsPath)

      for (const file of files.filter(f => f.endsWith('.plist'))) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const label = this.extractPlistValue(content, 'Label') || path.basename(file, '.plist')
          const program = this.extractPlistValue(content, 'Program')

          items.push({
            id: uuid(),
            name: label,
            path: program || file,
            enabled: !content.includes('<key>Disabled</key>'),
            type: 'LaunchAgent',
            impact: 'low',
          })
        } catch {}
      }
    } catch {}

    return items
  }

  private extractPlistValue(plist: string, key: string): string | undefined {
    const regex = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`)
    return plist.match(regex)?.[1]
  }

  private async getWindowsStartupItems(): Promise<StartupItem[]> {
    try {
      const output = execSync(
        `powershell -command "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json -Compress"`,
        { encoding: 'utf-8', timeout: 5000 }
      )

      const list = JSON.parse(output)
      const arr = Array.isArray(list) ? list : [list]

      return arr.map(item => ({
        id: uuid(),
        name: item.Name,
        path: item.Command,
        enabled: true,
        type: item.Location,
        impact: 'medium' as const,
      }))
    } catch {
      return []
    }
  }

  async toggleStartupItem(item: StartupItem, enabled: boolean): Promise<void> {
    // For v1, open system settings for safety
    if (process.platform === 'darwin') {
      shell.openExternal('x-apple.systempreferences:com.apple.LoginItems-Settings.extension')
    } else {
      shell.openPath('ms-settings:startupapps')
    }
  }
}
