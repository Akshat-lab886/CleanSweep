import { ipcMain } from 'electron'
import type { IPCResponse } from '../../shared/types'

export function safeHandle<T>(
  handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<T>
): (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<IPCResponse<T>> {
  return async (event, ...args) => {
    try {
      const result = await handler(event, ...args)
      return { success: true, data: result }
    } catch (error) {
      console.error('[IPC Error]', error)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }
}
