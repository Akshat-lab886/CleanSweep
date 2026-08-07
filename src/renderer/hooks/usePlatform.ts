import { useMemo } from 'react'

interface PlatformInfo {
  isMac: boolean
  isWindows: boolean
  platformName: string
  finderName: string
  trashName: string
}

export function usePlatform(): PlatformInfo {
  return useMemo(() => {
    // Detect platform from navigator or IPC
    const platform = navigator.platform.toLowerCase()
    const isMac = platform.includes('mac')
    const isWindows = platform.includes('win')

    return {
      isMac,
      isWindows,
      platformName: isMac ? 'macOS' : isWindows ? 'Windows' : 'Unknown',
      finderName: isMac ? 'Finder' : 'Explorer',
      trashName: isMac ? 'Trash' : 'Recycle Bin',
    }
  }, [])
}
