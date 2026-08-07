import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

class Logger {
  private logDir: string
  private currentLogFile: string
  private readonly maxSize = 10 * 1024 * 1024 // 10MB

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs')
    this.currentLogFile = this.getLogFilePath()
    this.ensureLogDir()
  }

  private getLogFilePath(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return path.join(this.logDir, `app-${year}-${month}.log`)
  }

  private async ensureLogDir(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true })
    } catch {
      // Ignore
    }
  }

  private async writeLog(level: string, module: string, message: string, data?: any): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      ...(data && { data }),
    }

    const line = JSON.stringify(entry) + '\n'

    // Console output in dev
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[0m'
      console.log(`${color}[${level.toUpperCase()}] [${module}] ${message}\x1b[0m`, data || '')
    }

    try {
      // Check file size and rotate if needed
      try {
        const stats = await fs.stat(this.currentLogFile)
        if (stats.size >= this.maxSize) {
          await this.rotateLog()
        }
      } catch {
        // File doesn't exist yet
      }

      await fs.appendFile(this.currentLogFile, line, 'utf-8')
    } catch {
      // Ignore write errors
    }
  }

  private async rotateLog(): Promise<void> {
    const backupPath = this.currentLogFile.replace('.log', `-${Date.now()}.log`)
    try {
      await fs.rename(this.currentLogFile, backupPath)
    } catch {
      // Ignore
    }
    this.currentLogFile = this.getLogFilePath()
  }

  async info(module: string, message: string, data?: any): Promise<void> {
    return this.writeLog('info', module, message, data)
  }

  async warn(module: string, message: string, data?: any): Promise<void> {
    return this.writeLog('warn', module, message, data)
  }

  async error(module: string, message: string, data?: any): Promise<void> {
    return this.writeLog('error', module, message, data)
  }
}

export const logger = new Logger()
