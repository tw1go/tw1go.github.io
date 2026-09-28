import { useEffect, useState } from 'react'

/** How long a song lasts, and how long he rests between them. */
const SING_MIN_MS = 5000
const SING_MAX_MS = 9000
const REST_MIN_MS = 6000
const REST_MAX_MS = 14_000

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/**
 * Whether Croakyangs is singing right now. He is always in his window;
 * this only decides when he is at it.
 *
 * Lifted out of the frog so the window's notes can share it: the frog
 * sits between the glass and the drapes, but the notes have to rise
 * above the drapes to be seen when the curtain is shut — two places in
 * the window, one song.
 */
export function useSinging(): boolean {
  const [singing, setSinging] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(
      () => setSinging((s) => !s),
      singing ? rand(SING_MIN_MS, SING_MAX_MS) : rand(REST_MIN_MS, REST_MAX_MS),
    )
    return () => window.clearTimeout(timer)
  }, [singing])

  return singing
}
