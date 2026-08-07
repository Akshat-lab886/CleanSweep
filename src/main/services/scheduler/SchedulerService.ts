import { app, Notification } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import cron from 'node-cron'
import type { ScheduleTask } from '../../../shared/types'
import { v4 as uuidv4 } from 'uuid'

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map()
  private schedules: ScheduleTask[] = []
  private configPath: string
  private onTaskRun?: (task: ScheduleTask) => Promise<void>

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'schedules.json')
  }

  setOnTaskRun(callback: (task: ScheduleTask) => Promise<void>): void {
    this.onTaskRun = callback
  }

  async loadAndStartAll(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8')
      this.schedules = JSON.parse(data)

      for (const task of this.schedules) {
        if (task.enabled) {
          this.startJob(task)
        }
      }
    } catch {
      this.schedules = []
    }
  }

  async saveToConfig(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.schedules, null, 2))
  }

  getSchedules(): ScheduleTask[] {
    return [...this.schedules]
  }

  async createTask(task: Omit<ScheduleTask, 'id'>): Promise<ScheduleTask> {
    const newTask: ScheduleTask = {
      ...task,
      id: uuidv4(),
    }

    this.schedules.push(newTask)
    await this.saveToConfig()

    if (newTask.enabled) {
      this.startJob(newTask)
    }

    return newTask
  }

  async deleteTask(id: string): Promise<void> {
    this.stopJob(id)
    this.schedules = this.schedules.filter(s => s.id !== id)
    await this.saveToConfig()
  }

  async toggleTask(id: string, enabled: boolean): Promise<void> {
    const task = this.schedules.find(s => s.id === id)
    if (task) {
      task.enabled = enabled
      await this.saveToConfig()

      if (enabled) {
        this.startJob(task)
      } else {
        this.stopJob(id)
      }
    }
  }

  private startJob(task: ScheduleTask): void {
    if (this.jobs.has(task.id)) {
      return
    }

    const cronExpression = this.taskToCron(task)

    if (!cron.validate(cronExpression)) {
      console.error(`Invalid cron expression for task ${task.id}`)
      return
    }

    const job = cron.schedule(cronExpression, async () => {
      await this.runTask(task)
    })

    this.jobs.set(task.id, job)
  }

  private stopJob(id: string): void {
    const job = this.jobs.get(id)
    if (job) {
      job.stop()
      this.jobs.delete(id)
    }
  }

  private taskToCron(task: ScheduleTask): string {
    const [hour, minute] = task.time.split(':').map(Number)

    switch (task.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        // dayOfWeek: 0-6 (Sunday-Saturday)
        return `${minute} ${hour} * * ${task.dayOfWeek ?? 0}`
      case 'monthly':
        // dayOfMonth: 1-31
        return `${minute} ${hour} ${task.dayOfMonth ?? 1} * *`
      default:
        return `${minute} ${hour} * * *`
    }
  }

  private async runTask(task: ScheduleTask): Promise<void> {
    console.log(`Running scheduled task: ${task.name}`)

    // Update lastRun
    task.lastRun = Date.now()
    await this.saveToConfig()

    // Execute callback if set
    if (this.onTaskRun) {
      try {
        await this.onTaskRun(task)
      } catch (error) {
        console.error(`Task ${task.name} failed:`, error)
      }
    }

    // Show notification if enabled
    this.showNotification(task)
  }

  private showNotification(task: ScheduleTask): void {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'CleanSweep',
        body: `Scheduled task "${task.name}" completed`,
      })
      notification.show()
    }
  }

  async destroy(): Promise<void> {
    for (const [id] of this.jobs) {
      this.stopJob(id)
    }
  }
}
