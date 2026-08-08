import React, { useEffect, useState } from 'react'
import { Clock, Plus, Trash2, Calendar, CheckCircle2, RefreshCw } from 'lucide-react'
import { formatBytes } from '../../utils/format'
import { useUIStore } from '../../stores/uiStore'
import type { ScheduleTask } from '../../../shared/types'

export default function SchedulerHome() {
  const { addToast } = useUIStore()

  const [schedules, setSchedules] = useState<ScheduleTask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSchedules = async () => {
    setLoading(true)
    const res = await window.cleanSweepAPI.scheduler.getSchedules()
    if (res.success) setSchedules(res.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    const res = await window.cleanSweepAPI.scheduler.toggleSchedule(id, !currentEnabled)
    if (res.success) {
      addToast('Schedule status updated', 'success')
      fetchSchedules()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await window.cleanSweepAPI.scheduler.deleteSchedule(id)
    if (res.success) {
      addToast('Schedule task removed', 'success')
      fetchSchedules()
    }
  }

  const handleCreateDefault = async () => {
    const newTask: ScheduleTask = {
      id: Date.now().toString(),
      name: 'Weekly Auto Quick Clean',
      enabled: true,
      frequency: 'weekly',
      time: '02:00',
      taskType: 'quick-clean',
    }
    const res = await window.cleanSweepAPI.scheduler.createSchedule(newTask)
    if (res.success) {
      addToast('Created weekly cleanup schedule', 'success')
      fetchSchedules()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            <span>Automated Cleanup Schedules</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure silent background cron schedules to keep your system clean automatically.
          </p>
        </div>

        <button
          onClick={handleCreateDefault}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Weekly Schedule</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-cyan-500/40 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Automated Schedules</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Click "Add Weekly Schedule" to automatically run silent background junk cleaning every week.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((task) => (
            <div
              key={task.id}
              className="glass-card rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{task.name}</h4>
                  <p className="text-xs text-gray-400 capitalize">
                    {task.frequency} at {task.time} • Type: {task.taskType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggle(task.id, task.enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  {task.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
