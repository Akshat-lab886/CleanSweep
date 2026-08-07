import { useEffect } from 'react'

export function useIPCEvent<T>(
  subscribe: (callback: (data: T) => void) => () => void,
  callback: (data: T) => void
): void {
  useEffect(() => {
    const unsubscribe = subscribe(callback)
    return unsubscribe
  }, [subscribe, callback])
}
