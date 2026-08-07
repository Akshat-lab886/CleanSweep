import * as os from 'os'
import * as path from 'path'
import { execSync } from 'child_process'
import type { DiskDrive } from '../../../shared/types'

export class SystemStatsService {
  getSystemStats() {
    return {
      platform: process.platform,
      arch: process.arch,
      totalRAM: os.totalmem(),
      freeRAM: os.freemem(),
      usedRAM: os.totalmem() - os.freemem(),
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      cpuUsage: this.getCPUUsage(),
      uptime: os.uptime(),
    }
  }

  private getCPUUsage(): number {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type]
      }
      totalIdle += cpu.times.idle
    }

    const totalUsed = totalTick - totalIdle
    return Math.round((totalUsed / totalTick) * 100)
  }

  async getDiskUsage(): Promise<DiskDrive[]> {
    try {
      if (process.platform === 'darwin') {
        return this.getMacDiskUsage()
      } else if (process.platform === 'win32') {
        return this.getWindowsDiskUsage()
      }
      return []
    } catch {
      return []
    }
  }

  private async getMacDiskUsage(): Promise<DiskDrive[]> {
    try {
      const output = execSync('df -k', { encoding: 'utf-8', timeout: 5000 })
      const lines = output.trim().split('\n').slice(1) // Skip header

      return lines
        .map(line => {
          const parts = line.split(/\s+/)
          if (parts.length < 6) return null

          const total = parseInt(parts[1]) * 1024
          const used = parseInt(parts[2]) * 1024
          const free = parseInt(parts[3]) * 1024
          const mountPoint = parts[5]

          // Skip system volumes
          if (mountPoint.startsWith('/System/') || mountPoint === '/dev') return null

          return {
            name: mountPoint === '/' ? 'Macintosh HD' : path.basename(mountPoint),
            mountPoint,
            total,
            used,
            free,
            type: 'internal' as DiskDrive['type'],
          }
        })
        .filter((d): d is DiskDrive => d !== null && d.total > 0)
    } catch {
      return []
    }
  }

  private async getWindowsDiskUsage(): Promise<DiskDrive[]> {
    try {
      const output = execSync(
        'wmic logicaldisk get size,freespace,caption,volumename /format:csv',
        { encoding: 'utf-8', timeout: 10000 }
      )

      const lines = output.trim().split('\n').slice(1) // Skip header

      return lines
        .map(line => {
          const parts = line.split(',')
          if (parts.length < 5 || !parts[1]) return null

          const caption = parts[1]
          const freeSpace = parseInt(parts[2]) || 0
          const size = parseInt(parts[3]) || 0
          const volumeName = parts[4] || 'Local Disk'

          if (size === 0) return null

          return {
            name: `${volumeName} (${caption})`,
            mountPoint: caption + '\\',
            total: size,
            used: size - freeSpace,
            free: freeSpace,
            type: 'internal' as DiskDrive['type'],
          }
        })
        .filter((d): d is DiskDrive => d !== null)
    } catch {
      return []
    }
  }

  optimizeMemory(): void {
    if (global.gc) {
      global.gc()
    }
  }
}
