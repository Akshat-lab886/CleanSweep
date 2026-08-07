import { useState, useEffect, useCallback } from 'react'

interface UseIPCResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => Promise<void>
}

export function useIPC<T>(
  fn: () => Promise<{ success: true; data: T } | { success: false; error: { message: string } }>,
  deps: React.DependencyList = []
): UseIPCResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fn()
      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, execute }
}
