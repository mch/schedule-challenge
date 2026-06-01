/**
 * useNetworkStatus — tracks browser online/offline state.
 *
 * Returns `true` when the browser reports it is online, `false` when offline.
 * Note: "online" only means the browser has a network interface; it does NOT
 * guarantee the sync server is reachable.  For that, see useSyncStatus.
 */
import { useEffect, useState } from 'react'

export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}
