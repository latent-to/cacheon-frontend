import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './api.client'

export interface PollState<T> {
  data: T | null
  error: string | null
  /** True when the last failure was an HTTP 429 (rate-limited), not a real outage. */
  rateLimited: boolean
  loading: boolean
  refetch: () => void
}

export function usePoll<T>(fetcher: () => Promise<T>, intervalMs: number): PollState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const run = useCallback(async () => {
    try {
      const result = await fetcher()
      if (mounted.current) {
        setData(result)
        setError(null)
        setRateLimited(false)
      }
    } catch (e) {
      if (mounted.current) {
        const isRL = e instanceof ApiError && e.isRateLimit
        setRateLimited(isRL)
        // On a rate-limit, keep the previous data visible; only clear on a real error.
        if (!isRL) setError(e instanceof Error ? e.message : String(e))
      }
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

  return { data, error, rateLimited, loading, refetch: run }
}
