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
        // System & User Caches
        { path: '~/Library/Caches', category: 'system-junk', label: 'User Application Caches' },
        { path: '/Library/Caches', category: 'system-junk', label: 'System Library Caches' },

        // Developer & Build Junk (Xcode, Node, CocoaPods, Homebrew, Gradle, Pip)
        { path: '~/Library/Developer/Xcode/DerivedData', category: 'app-leftovers', label: 'Xcode DerivedData' },
        { path: '~/Library/Developer/Xcode/Archives', category: 'app-leftovers', label: 'Xcode Archives' },
        { path: '~/Library/Developer/Xcode/iOS Device Logs', category: 'logs', label: 'iOS Device Logs' },
        { path: '~/Library/Caches/CocoaPods', category: 'system-junk', label: 'CocoaPods Cache' },
        { path: '~/.npm/_cacache', category: 'system-junk', label: 'NPM Package Cache' },
        { path: '~/.npm/_logs', category: 'logs', label: 'NPM Execution Logs' },
        { path: '~/Library/Caches/Yarn', category: 'system-junk', label: 'Yarn Cache' },
        { path: '~/.cache/pnpm', category: 'system-junk', label: 'PNPM Package Store' },
        { path: '~/Library/Caches/Homebrew', category: 'system-junk', label: 'Homebrew Downloads' },
        { path: '~/.gradle/caches', category: 'system-junk', label: 'Gradle Build Caches' },
        { path: '~/Library/Caches/pip', category: 'system-junk', label: 'Python Pip Cache' },

        // Application & Diagnostic Logs
        { path: '~/Library/Logs', category: 'logs', label: 'User Application Logs' },
        { path: '~/Library/Logs/DiagnosticReports', category: 'logs', label: 'Diagnostic Crash Reports' },
        { path: '/Library/Logs', category: 'logs', label: 'System Logs' },
        { path: '~/Library/Application Support/CrashReporter', category: 'logs', label: 'Crash Reporter Data' },

        // App Saved States & Communication Caches
        { path: '~/Library/Saved Application State', category: 'app-leftovers', label: 'Saved App States' },
        { path: '~/Library/Application Support/Slack/Service Worker/CacheStorage', category: 'browser-cache', label: 'Slack Cache' },
        { path: '~/Library/Application Support/discord/Cache', category: 'browser-cache', label: 'Discord Cache' },
        { path: '~/Library/Application Support/Microsoft/Teams/Cache', category: 'browser-cache', label: 'Teams Cache' },

        // Temporary Files & System Trash
        { path: '/private/tmp', category: 'temp-files', label: 'System Temp Items' },
        { path: '/var/tmp', category: 'temp-files', label: 'Var Temp Items' },
        { path: '~/.Trash', category: 'trash', label: 'System Trash Bin' },
      ]
    }

    if (this.isWindows()) {
      return [
        { path: '%TEMP%', category: 'temp-files', label: 'User Temporary Files' },
        { path: '%SystemRoot%\\Temp', category: 'temp-files', label: 'Windows System Temp' },
        { path: '%LOCALAPPDATA%\\Temp', category: 'temp-files', label: 'Local AppData Temp' },
        { path: '%LOCALAPPDATA%\\CrashDumps', category: 'logs', label: 'Windows Crash Dumps' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\WER', category: 'logs', label: 'Error Reporting Logs' },
        { path: '%LOCALAPPDATA%\\Microsoft\\Windows\\INetCache', category: 'browser-cache', label: 'INet Web Cache' },
        { path: '%USERPROFILE%\\.npm\\_cacache', category: 'system-junk', label: 'NPM Cache' },
        { path: '%USERPROFILE%\\.gradle\\caches', category: 'system-junk', label: 'Gradle Cache' },
        { path: '%LOCALAPPDATA%\\pip\\Cache', category: 'system-junk', label: 'Pip Package Cache' },
        { path: '%APPDATA%\\Microsoft\\Windows\\Recent', category: 'privacy', label: 'Recent Documents History' },
      ]
    }

    return []
  }

  getBrowserPaths(): Record<string, Array<{ name: string; cachePath: string; dataPath: string }>> {
    if (this.isMac()) {
      return {
        chrome: [
          { name: 'Google Chrome Cache', cachePath: '~/Library/Caches/Google/Chrome/Default/Cache', dataPath: '~/Library/Application Support/Google/Chrome/Default' },
          { name: 'Google Chrome Code Cache', cachePath: '~/Library/Caches/Google/Chrome/Default/Code Cache', dataPath: '~/Library/Application Support/Google/Chrome/Default' },
          { name: 'Google Chrome GPUCache', cachePath: '~/Library/Caches/Google/Chrome/Default/GPUCache', dataPath: '~/Library/Application Support/Google/Chrome/Default' },
        ],
        firefox: [{
          name: 'Mozilla Firefox Cache',
          cachePath: '~/Library/Caches/Firefox/Profiles/*/cache2',
          dataPath: '~/Library/Application Support/Firefox/Profiles',
        }],
        safari: [
          { name: 'Safari Cache', cachePath: '~/Library/Caches/com.apple.Safari', dataPath: '~/Library/Safari' },
          { name: 'Safari WebKit Cache', cachePath: '~/Library/Caches/com.apple.WebKit.WebContent', dataPath: '~/Library/Safari' },
        ],
        edge: [
          { name: 'Microsoft Edge Cache', cachePath: '~/Library/Caches/Microsoft Edge/Default/Cache', dataPath: '~/Library/Application Support/Microsoft Edge/Default' },
        ],
        brave: [
          { name: 'Brave Browser Cache', cachePath: '~/Library/Caches/BraveSoftware/Brave-Browser/Default/Cache', dataPath: '~/Library/Application Support/BraveSoftware/Brave-Browser/Default' },
        ],
        opera: [
          { name: 'Opera Cache', cachePath: '~/Library/Caches/com.operasoftware.Opera', dataPath: '~/Library/Application Support/com.operasoftware.Opera' },
        ],
      }
    }

    return {
      chrome: [{
        name: 'Google Chrome',
        cachePath: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache',
        dataPath: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default',
      }],
      edge: [{
        name: 'Microsoft Edge',
        cachePath: '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache',
        dataPath: '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default',
      }],
      firefox: [{
        name: 'Mozilla Firefox',
        cachePath: '%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles\\*\\cache2',
        dataPath: '%APPDATA%\\Mozilla\\Firefox\\Profiles',
      }],
      brave: [{
        name: 'Brave Browser',
        cachePath: '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Cache',
        dataPath: '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\User Data\\Default',
      }],
      opera: [{
        name: 'Opera',
        cachePath: '%LOCALAPPDATA%\\Opera Software\\Opera Stable\\Cache',
        dataPath: '%APPDATA%\\Opera Software\\Opera Stable',
      }],
    }
  }
}
