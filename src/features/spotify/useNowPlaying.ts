import { useEffect, useState } from 'react'
import type { NowPlayingState } from './types'

/**
 * In dev the Vite middleware serves this path locally. In the GitHub Pages
 * build it must be the absolute Vercel URL, injected at build time — Pages
 * is static and has nothing to proxy with.
 */
const ENDPOINT = import.meta.env.VITE_NOW_PLAYING_URL || '/api/now-playing'

/** How often to ask the server what's playing. */
const POLL_MS = 15_000
/** How often to advance the progress bar between polls. */
const TICK_MS = 1_000

export function useNowPlaying(): NowPlayingState {
  const [state, setState] = useState<NowPlayingState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const poll = async () => {
      controller?.abort()
      controller = new AbortController()

      try {
        const res = await fetch(ENDPOINT, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        const next: NowPlayingState = res.ok
          ? ((await res.json()) as NowPlayingState)
          : { status: 'offline' }
        if (!cancelled) setState(next)
      } catch {
        // Endpoint down, offline, or an aborted in-flight request. The
        // strip going quiet is the right failure mode either way.
        if (!cancelled) setState({ status: 'offline' })
      }

      if (!cancelled) schedule()
    }

    const schedule = () => {
      clearTimeout(timer)
      // No point polling a tab nobody is looking at. The visibility
      // listener below fires an immediate poll when it comes back.
      if (document.hidden) return
      timer = setTimeout(poll, POLL_MS)
    }

    const onVisibility = () => {
      if (document.hidden) clearTimeout(timer)
      else void poll()
    }

    void poll()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controller?.abort()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Advance progress locally between polls so the bar moves smoothly
  // instead of jumping once every 15 seconds.
  useEffect(() => {
    // The updater form reads the newest state without this effect having
    // to depend on it — otherwise the interval would be torn down and
    // rebuilt on every tick, drifting a little further each time.
    const tick = setInterval(() => {
      setState((current) => {
        if (current.status !== 'playing') return current
        const { progressMs, durationMs } = current.track
        if (progressMs >= durationMs) return current
        return {
          status: 'playing',
          track: { ...current.track, progressMs: Math.min(progressMs + TICK_MS, durationMs) },
        }
      })
    }, TICK_MS)
    return () => clearInterval(tick)
  }, [])

  return state
}
