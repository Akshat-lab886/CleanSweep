import * as os from 'os'
import * as path from 'path'
import { execSync } from 'child_process'
import type { Platform, ScanCategory } from '../../../shared/types'

export class PlatformService {
  getPlatform(): Platform {
    return process.platform as Platform
  }

  isMac(): boolean {
    return process.platform === 'darwin'
  }

  isWindows(): boolean {
    return process.platform === 'win32'
  }

  expandPath(inputPath: string): string {
    let result = inputPath

    // Expand tilde
    if (result.startsWith('~')) {
      result = path.join(os.homedir(), result.slice(1))
    }

    // Expand Windows environment variables
    if (this.isWindows()) {
      result = result.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '')
    }

    // Expand Unix environment variables
    if (this.isMac()) {
      result = result.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, key) => process.env[key] || '')
    }

    return path.resolve(result)
  }

  getCommonScanPaths(): Array<{ path: string; category: ScanCategory; label: string }> {
    if (this.isMac()) {
      return [
        { path: '~/Library/Caches', category: 'system-junk', label: 'System Caches' },
        { path: '~/Library/Logs', category: 'logs', label: 'Application Logs' },
        { path: '/private/tmp', category: 'temp-files', label: 'Temporary Files' },
        { path: '~/Library/Application Support/CrashReporter', category: 'logs', label: 'Crash Reports' },
        { path: '~/.Trash', category: 'trash', label: 'Trash' },
        { path: '~/Library/Application Support', category: 'app-leftovers', label: 'App Support Files' },
      ]
    }

    if (this.isWindows()) {
      return [
        { path: '%TEMP%', category: 'temp-files', label: 'User Temp Files' },
        { path: '%SystemRoot%\\Temp', category: 'temp-files', label: 'System Temp Files' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\INetCache', category: 'browser-cache', label: 'IE/Edge Cache' },
        { path: '%LOCALAPPDATA%\\CrashDumps', category: 'logs', label: 'Crash Dumps' },
        { path: '%APPDATA%\\Microsoft\\Windows\\Recent', category: 'privacy', label: 'Recent Files List' },
      ]
    }

    return []
  }

  getBrowserPaths(): Record<string, Array<{ name: string; cachePath: string; dataPath: string }>> {
    if (this.isMac()) {
      return {
        chrome: [{
          name: 'Google Chrome',
          cachePath: '~/Library/Application Support/Google/Chrome/Default/Cache',
          dataPath: '~/Library/Application Support/Google/Chrome/Default',
        }],
        firefox: [{
          name: 'Mozilla Firefox',
          cachePath: '~/Library/Application Support/Firefox/Profiles/*/cache2',
          dataPath: '~/Library/Application Support/Firefox/Profiles',
        }],
        safari: [{
          name: 'Safari',
          cachePath: '~/Library/Caches/com.apple.Safari',
          dataPath: '~/Library/Safari',
        }],
        edge: [{
          name: 'Microsoft Edge',
          cachePath: '~/Library/Application Support/Microsoft Edge/Default/Cache',
          dataPath: '~/Library/Application Support/Microsoft Edge/Default',
        }],
        brave: [{
          name: 'Brave Browser',
          cachePath: '~/Library/Application Support/BraveSoftware/Brave-Browser/Default/Cache',
          dataPath: '~/Library/Application Support/BraveSoftware/Brave-Browser/Default',
        }],
        opera: [{
          name: 'Opera',
          cachePath: '~/Library/Application Support/com.operasoftware.Opera/Cache',
          dataPath: '~/Library/Application Support/com.operasoftware.Opera',
        }],
      }
    }

    if (this.isWindows()) {
      return {
        chrome: [{
          name: 'Google Chrome',
          cachePath: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache',
          dataPath: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default',
        }],
        firefox: [{
          name: 'Mozilla Firefox',
          cachePath: '%APPDATA%\\Mozilla\\Firefox\\Profiles\\*\\cache2',
          dataPath: '%APPDATA%\\Mozilla\\Firefox\\Profiles',
        }],
        edge: [{
          name: 'Microsoft Edge',
          cachePath: '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache',
          dataPath: '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default',
        }],
        brave: [{
          name: 'Brave Browser',
          cachePath: '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Cache',
          dataPath: '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\User Data\\Default',
        }],
        opera: [{
          name: 'Opera',
          cachePath: '%APPDATA%\\Opera Software\\Opera Stable\\Cache',
          dataPath: '%APPDATA%\\Opera Software\\Opera Stable',
        }],
      }
    }

    return {}
  }
}
