import { useEffect, useRef } from 'react'

/**
 * Runs `callback` immediately on mount, then every `interval` ms.
 * Cleans up the interval on unmount.
 *
 * Usage:
 *   usePolling(() => fetchOrders(), 10_000)
 */
export function usePolling(callback, interval = 10_000) {
  // Keep a stable ref so changing `callback` doesn't reset the interval
  const savedCallback = useRef(callback)
  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    // Fire immediately
    savedCallback.current()

    const id = setInterval(() => savedCallback.current(), interval)
    return () => clearInterval(id)
  }, [interval]) // only re-run if interval changes
}
