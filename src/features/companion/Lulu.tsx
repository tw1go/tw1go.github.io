import { useEffect, useState } from 'react'
import { Sprite } from '../../components/Sprite'
import { playDuration, type SpriteName } from '../../sprites/manifest'
import './lulu.css'

type Surface = 'floor' | 'desk'
type Action =
  | 'stand'
  | 'walk'
  | 'groom'
  | 'jump'
  | 'sit'
  | 'sitting'
  | 'situp'
  | 'sleep'
  | 'sleeping'
  | 'wake'

/**
 * Standing line for each surface, as a row of the 256px character frame.
 *
 * Row 124 is where the monitor's base and the bottle both sit, so Lulu
 * stands there too — matching the room's own objects matters more than
 * the dark edge line that shows under her. Dropping her to 126, onto the
 * lit wood, removes that line but puts her out of step with everything
 * else on the desk, which looks worse.
 *
 * The character's feet are row 174, so 176 puts her just in front of him
 * on the floor.
 */
const LINE: Record<Surface, number> = { floor: 176, desk: 124 }

/**
 * How far along each surface she may wander, in percent of the frame.
 *
 * The floor spans the room: she passes in front of the character, which
 * is fine — she is on a layer above him, so it reads as a cat crossing
 * the room rather than clipping through him.
 *
 * The desk is the constrained one. It only exists between 13% and 86%,
 * and she has to keep off the character's arms (from 31%), the bottle
 * (31%) and Elli (66%), which leaves the stretch to their left.
 */
const RANGE: Record<Surface, [number, number]> = {
  floor: [4, 92],
  desk: [15, 29],
}

/** Percent of the frame crossed per second on foot. */
const SPEED = 13
const JUMP_MS = 700
/** How long she pauses between walks, before deciding what to do next. */
const STAND_MIN_MS = 1400
const STAND_MAX_MS = 4200
/** How long she stays sat down, flicking her tail. Cats commit to this. */
const SIT_MIN_MS = 30_000
const SIT_MAX_MS = 60_000

const SPRITE: Record<Action, SpriteName> = {
  stand: 'lulu/stand',
  walk: 'lulu/walk',
  groom: 'lulu/groom',
  sit: 'lulu/sit',
  sitting: 'lulu/sitting',
  situp: 'lulu/situp',
  jump: 'lulu/jump',
  sleep: 'lulu/sleep',
  sleeping: 'lulu/sleeping',
  wake: 'lulu/wake',
}

const LOOPS: Record<Action, number | 'infinite'> = {
  stand: 'infinite',
  walk: 'infinite',
  groom: 1,
  sit: 1,
  sitting: 'infinite',
  situp: 1,
  jump: 1,
  sleep: 1,
  sleeping: 'infinite',
  wake: 1,
}

/**
 * States where she is down and staying down. Clicking her in one of
 * these gets a different remark out of Elli — the rising animations are
 * excluded, since by then she is already getting up.
 */
const RESTING = new Set<Action>(['sit', 'sitting', 'sleep', 'sleeping'])

interface Pose {
  /** Bumped on every change so the sprite remounts and restarts. */
  id: number
  action: Action
  surface: Surface
  /** Percent of the frame. */
  x: number
  /** 1 faces right, -1 flips the sheet. All three sheets are drawn right. */
  facing: 1 | -1
  /** How long the move to `x` should take. */
  moveMs: number
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Pick somewhere new on `surface` and work out how long walking there takes. */
function walkTo(surface: Surface, from: Pose, id: number): Pose {
  const [min, max] = RANGE[surface]
  let x = min + Math.random() * (max - min)
  // A walk to almost where she already is reads as a twitch, so send her
  // to the far end instead.
  if (Math.abs(x - from.x) < 5) x = from.x < (min + max) / 2 ? max : min
  return {
    id,
    action: 'walk',
    surface,
    x,
    facing: x >= from.x ? 1 : -1,
    moveMs: (Math.abs(x - from.x) / SPEED) * 1000,
  }
}

function nextPose(prev: Pose): Pose {
  const id = prev.id + 1

  // Sleeping and sitting are both three-part sequences — settle, hold,
  // get back up — so those states just advance to the next part.
  if (prev.action === 'sleep') return { ...prev, id, action: 'sleeping', moveMs: 0 }
  if (prev.action === 'sleeping') return { ...prev, id, action: 'wake', moveMs: 0 }
  if (prev.action === 'sit') return { ...prev, id, action: 'sitting', moveMs: 0 }
  if (prev.action === 'sitting') return { ...prev, id, action: 'situp', moveMs: 0 }

  // Everything that finishes comes to a stop first. Without this she
  // paces without pause, which reads as a machine rather than an animal.
  if (
    prev.action === 'walk' ||
    prev.action === 'jump' ||
    prev.action === 'wake' ||
    prev.action === 'situp' ||
    prev.action === 'groom'
  ) {
    return { ...prev, id, action: 'stand', moveMs: 0 }
  }

  // Standing is where she decides what to do next.
  const roll = Math.random()
  if (roll < 0.12) return { ...prev, id, action: 'sleep', moveMs: 0 }
  if (roll < 0.34) return { ...prev, id, action: 'sit', moveMs: 0 }
  if (roll < 0.50) return { ...prev, id, action: 'groom', moveMs: 0 }

  if (roll < 0.66) {
    const surface: Surface = prev.surface === 'floor' ? 'desk' : 'floor'
    const [min, max] = RANGE[surface]
    // Land roughly above or below where she took off from, clamped onto
    // the new surface's usable stretch.
    const x = Math.min(max, Math.max(min, prev.x))
    return { id, action: 'jump', surface, x, facing: x >= prev.x ? 1 : -1, moveMs: JUMP_MS }
  }

  return walkTo(prev.surface, prev, id)
}

function holdFor(pose: Pose): number {
  switch (pose.action) {
    case 'stand':
      return STAND_MIN_MS + Math.random() * (STAND_MAX_MS - STAND_MIN_MS)
    case 'walk':
      return pose.moveMs
    case 'groom':
      return playDuration('lulu/groom')
    case 'sit':
      return playDuration('lulu/sit')
    case 'sitting':
      return SIT_MIN_MS + Math.random() * (SIT_MAX_MS - SIT_MIN_MS)
    case 'situp':
      return playDuration('lulu/situp')
    case 'jump':
      return JUMP_MS
    case 'sleep':
      return playDuration('lulu/sleep')
    case 'sleeping':
      // The point of splitting the sheet: hold the settled loop for a
      // few cycles rather than popping straight back up.
      return playDuration('lulu/sleeping') * (3 + Math.floor(Math.random() * 4))
    case 'wake':
      return playDuration('lulu/wake')
  }
}

/**
 * Lulu the cat, wandering the room on her own.
 *
 * She walks a stretch of floor or desk, hops between the two, and now and
 * then lies down for a while. Everything is expressed in frame
 * percentages so she keeps her place in the room at every breakpoint.
 */
export function Lulu({ onPet }: { onPet?: (resting: boolean) => void }) {
  const [pose, setPose] = useState<Pose>({
    id: 0,
    action: 'walk',
    surface: 'floor',
    x: 20,
    facing: 1,
    moveMs: 0,
  })

  useEffect(() => {
    if (prefersReducedMotion()) return
    const timer = window.setTimeout(() => setPose(nextPose), holdFor(pose))
    return () => window.clearTimeout(timer)
  }, [pose])

  return (
    <button
      type="button"
      className="lulu"
      onClick={() => onPet?.(RESTING.has(pose.action))}
      aria-label="Lulu, twigo's cat"
      data-action={pose.action}
      data-jump={pose.action === 'jump' ? pose.surface : undefined}
      style={
        {
          '--lulu-x': `${pose.x}%`,
          '--lulu-bottom': `${((256 - LINE[pose.surface]) / 256) * 100}%`,
          '--lulu-face': pose.facing,
          '--lulu-move': `${pose.moveMs}ms`,
        } as React.CSSProperties
      }
    >
      {/* `key` remounts on every change so the CSS animation restarts from
          its first frame rather than retiming mid-cycle. */}
      <Sprite
        key={pose.id}
        name={SPRITE[pose.action]}
        className="lulu__sprite"
        iterations={LOOPS[pose.action]}
      />
    </button>
  )
}
