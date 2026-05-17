import { useCallback, useEffect, useRef, useState } from 'react'

export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
): { data: T | null; error: string | null; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const run = useCallback(async () => {
    try {
      const result = await fetcher()
      if (mounted.current) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    mounted.current = true
    run()
    const id = setInterval(run, intervalMs)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [run, intervalMs])

  return { data, error, loading, refetch: run }
}
