import { useEffect, useState } from 'react'
import { pickLine } from '../features/dialog/lines'
import { playDuration, sprites, type SpriteName } from '../sprites/manifest'
import { preloadSprites } from '../sprites/preload'

const IDLE: SpriteName = 'main-body/idle'

/** One-shot animations the character drops into now and then. */
const ACTIONS: SpriteName[] = [
  'main-body/random-movement',
  'main-body/drinking',
]

/** How many idle loops to sit through before doing something else. */
const IDLE_LOOPS_MIN = 4
const IDLE_LOOPS_MAX = 11

export interface CharacterPlay {
  name: SpriteName
  /** Bumped on every switch so the sprite can remount and restart. */
  id: number
  /** Idle loops forever; actions play exactly once. */
  loop: boolean
  /**
   * What the character says for this play, if anything. Chosen here
   * rather than by the view so it is fixed for the whole play instead of
   * being re-rolled on an unrelated re-render.
   */
  line?: string
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Keeps the character idling, then breaks into a random one-shot action
 * and returns to idle. Holds are whole multiples of the idle loop so a
 * cycle is never cut halfway through.
 */
export function useCharacterAnimation(): CharacterPlay {
  const [play, setPlay] = useState<CharacterPlay>({
    name: IDLE,
    id: 0,
    loop: true,
  })

  // Warm every sheet during the first idle stretch. Without this the first
  // switch to an action decodes a 1024x1024 PNG on the frame it appears.
  useEffect(preloadSprites, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const isIdle = play.name === IDLE
    const hold = isIdle
      ? sprites[IDLE].duration * randomInt(IDLE_LOOPS_MIN, IDLE_LOOPS_MAX)
      : playDuration(play.name)

    const timer = window.setTimeout(() => {
      setPlay((prev) => {
        const name = isIdle ? pick(ACTIONS) : IDLE
        return {
          name,
          id: prev.id + 1,
          loop: !isIdle,
          line: isIdle ? pickLine(name) : undefined,
        }
      })
    }, hold)

    return () => window.clearTimeout(timer)
  }, [play])

  return play
}
