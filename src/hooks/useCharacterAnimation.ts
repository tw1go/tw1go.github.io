import { useEffect, useState } from 'react'
import { gameChatterLine, gameEndLine, gameStartLine, pickLine } from '../features/dialog/lines'
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

/* In a game he is locked in: longer stretches at the screen, and when
   he does break it is mostly to shift in the chair, not to wander off
   for a drink. */
const GAMING_LOOPS_MIN = 9
const GAMING_LOOPS_MAX = 18
const GAMING_ACTIONS: SpriteName[] = [
  'main-body/random-movement',
  'main-body/random-movement',
  'main-body/random-movement',
  'main-body/drinking',
]
/** Share of his breaks, while gaming, that come with something to say. */
const GAMING_CHATTER = 0.6

/** The reaction to a game starting or stopping. */
const REACT: SpriteName = 'main-body/random-movement'

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
 *
 * `game` is what twigo is playing on Discord, if anything. Starting or
 * stopping one gets an immediate reaction with a line about it; while it
 * runs he stays at the screen longer and his asides are about the game.
 */
export function useCharacterAnimation(game: string | null = null): CharacterPlay {
  const [play, setPlay] = useState<CharacterPlay>({
    name: IDLE,
    id: 0,
    loop: true,
  })

  // Latched during render rather than in an effect, so the reaction lands
  // in the same commit as the change that caused it.
  const [latchedGame, setLatchedGame] = useState(game)
  if (latchedGame !== game) {
    setLatchedGame(game)
    const line = game ? gameStartLine(game) : latchedGame ? gameEndLine(latchedGame) : undefined
    if (line && !prefersReducedMotion()) {
      setPlay((prev) => ({ name: REACT, id: prev.id + 1, loop: false, line }))
    }
  }

  // Warm every sheet during the first idle stretch. Without this the first
  // switch to an action decodes a 1024x1024 PNG on the frame it appears.
  useEffect(preloadSprites, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const isIdle = play.name === IDLE
    const hold = isIdle
      ? sprites[IDLE].duration *
        (game
          ? randomInt(GAMING_LOOPS_MIN, GAMING_LOOPS_MAX)
          : randomInt(IDLE_LOOPS_MIN, IDLE_LOOPS_MAX))
      : playDuration(play.name)

    const timer = window.setTimeout(() => {
      setPlay((prev) => {
        if (!isIdle) return { name: IDLE, id: prev.id + 1, loop: true }
        const name = pick(game ? GAMING_ACTIONS : ACTIONS)
        const line = game
          ? Math.random() < GAMING_CHATTER
            ? gameChatterLine(game)
            : undefined
          : pickLine(name)
        return { name, id: prev.id + 1, loop: false, line }
      })
    }, hold)

    return () => window.clearTimeout(timer)
  }, [play, game])

  return play
}
