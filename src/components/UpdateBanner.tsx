'use client'

import { useEffect, useState } from 'react'

const POLL_INTERVAL_MS = 60_000
const INITIAL_DELAY_MS = 30_000

export default function UpdateBanner() {
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    const current = process.env.NEXT_PUBLIC_APP_VERSION
    if (!current || current === 'dev') return

    async function check() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const data: unknown = await res.json()
        if (
          typeof data === 'object' &&
          data !== null &&
          'version' in data &&
          typeof (data as { version: unknown }).version === 'string' &&
          (data as { version: string }).version !== current
        ) {
          setIsStale(true)
        }
      } catch {
        // Network error — ignore
      }
    }

    const initial = setTimeout(() => {
      void check()
      const interval = setInterval(() => void check(), POLL_INTERVAL_MS)
      return () => clearInterval(interval)
    }, INITIAL_DELAY_MS)

    return () => clearTimeout(initial)
  }, [])

  if (!isStale) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-1.5 bg-gray-900/97 border-b border-blue-500 font-mono text-xs tracking-wider text-gray-400">
      <span>NEW VERSION AVAILABLE</span>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600/10 border border-blue-500 text-blue-400 px-3 py-0.5 font-mono text-xs font-bold tracking-wider cursor-pointer rounded"
      >
        RELOAD
      </button>
    </div>
  )
}
