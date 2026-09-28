import { useEffect } from 'react'

/**
 * Lightning, while there is a storm: every few seconds a strike, as a
 * quick double flicker — the way real lightning stutters.
 *
 * Written to `data-flash` on <html> rather than kept in React state, so
 * both windows, the light through them and the room all flash on the
 * same frame without re-rendering anything.
 */
export function useLightning(storm: boolean): void {
  useEffect(() => {
    if (!storm || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    const strike = () => {
      root.dataset.flash = ''
      at(90, () => delete root.dataset.flash)
      at(170, () => (root.dataset.flash = ''))
      at(290, () => delete root.dataset.flash)
      at(3500 + Math.random() * 7500, strike)
    }
    at(1500 + Math.random() * 3000, strike)

    return () => {
      timers.forEach(window.clearTimeout)
      delete root.dataset.flash
    }
  }, [storm])
}
