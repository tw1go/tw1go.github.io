import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Sprite } from '../../components/Sprite'
import { sprites, type SpriteName } from '../../sprites/manifest'
import { Exclaim } from '../wonwuu/Exclaim'
import { liveX, type Track } from '../wonwuu/track'
import { GLARE_MS } from '../wonwuu/Wonwuu'
import { PITTUKI_SUMMON_EVENT } from './summon'
import { ALL_HEADINGS, SPOTS, ZONE, inZone, route, type Heading, type Leg } from './wall'
import './pittuki.css'

/** How often the dice are rolled, and the odds on each roll. */
const ROLL_MS = 10_000
const CHANCE = 0.6

/** He heads back into hiding somewhere in this window after coming out. */
const STAY_MIN_MS = 25_000
const STAY_MAX_MS = 40_000

/* Speed is derived from the stride, as with Wonwuu, so his feet do not
   skate: 22 art pixels long at the wall's scale is 3.4% of the frame,
   and each loop of the climb sheet carries him most of a body length. */
const BODY = 3.4
const STRIDE = BODY * 0.9
const SPEED = STRIDE / (sprites['pittuki/climb'].duration / 1000)
/** Bolting for cover when clicked: the same sheet, looped twice as fast. */
const DASH_CYCLE_MS = 350
const DASH_SPEED = STRIDE / (DASH_CYCLE_MS / 1000)

/** How close, across the room, Wonwuu has to pass beneath him. */
const GLARE_RANGE = 14

type Phase = 'hidden' | 'crawl' | 'look' | 'still' | 'glare'

interface Pose {
  id: number
  phase: Phase
  x: number
  y: number
  heading: Heading
  moveMs: number
  /** Legs still to crawl after this one. */
  legs: Leg[]
  /** Heading for cover: once the legs run out, he is gone. */
  leaving: boolean
  dash: boolean
}

const SPRITE: Record<Phase, SpriteName> = {
  hidden: 'pittuki/still',
  crawl: 'pittuki/climb',
  look: 'pittuki/look',
  still: 'pittuki/still',
  glare: 'pittuki/still',
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay)

function crawl(prev: Pose, [leg, ...rest]: Leg[], leaving: boolean, dash = false): Pose {
  return {
    id: prev.id + 1,
    phase: 'crawl',
    x: leg.x,
    y: leg.y,
    heading: leg.heading,
    moveMs: (dist(prev.x, prev.y, leg.x, leg.y) / (dash ? DASH_SPEED : SPEED)) * 1000,
    legs: rest,
    leaving,
    dash,
  }
}

/** A short dart in one of his four directions, staying on the wall. */
function wander(prev: Pose): Pose {
  // Mostly carries on the way he is pointing; sometimes sets off anew.
  const order = Math.random() < 0.5 ? [prev.heading, ...ALL_HEADINGS] : [...ALL_HEADINGS].sort(() => Math.random() - 0.5)
  for (const heading of order) {
    const d = rand(5, 14)
    const x = prev.x + heading.dx * d
    const y = prev.y + heading.dy * d
    if (inZone(x, y)) return crawl(prev, [{ x, y, heading }], false)
  }
  // Boxed into a corner: back toward the middle of the wall.
  const cx = (ZONE.left + ZONE.right) / 2
  const cy = (ZONE.top + ZONE.bottom) / 2
  return crawl(prev, route(prev.x, prev.y, cx, cy), false)
}

function nearestSpot(x: number, y: number) {
  return SPOTS.reduce((best, spot) => (dist(x, y, spot.x, spot.y) < dist(x, y, best.x, best.y) ? spot : best))
}

function holdFor(pose: Pose): number {
  switch (pose.phase) {
    case 'hidden':
      // Just long enough to paint in place before the first crawl.
      return 60
    case 'crawl':
      return pose.moveMs
    case 'look':
      return sprites['pittuki/look'].duration
    case 'still':
      // House lizards freeze for ages, then shoot off.
      return rand(1200, 4200)
    case 'glare':
      return GLARE_MS
  }
}

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface PittukiProps {
  /** Where Wonwuu is on the floor, if he is out — his mortal enemy. */
  wonwuu: RefObject<Track | null>
  /** He has caught Wonwuu passing beneath him, and glares. */
  onGlare: () => void
  /** Someone clicked him. */
  onCaught?: () => void
}

/**
 * Pittuki, the house lizard.
 *
 * Every ten seconds there is a 60% chance he comes out from behind the
 * air conditioner or one of the curtains and works his way about the
 * wall: a short dart, a freeze, a look around, another dart. Within
 * forty seconds he slips back behind something.
 *
 * If Wonwuu passes underneath while he is frozen, the two of them glare
 * at each other — once a visit, which is plenty.
 */
export function Pittuki({ wonwuu, onGlare, onCaught }: PittukiProps) {
  const [pose, setPose] = useState<Pose | null>(null)
  const leaveBy = useRef(0)
  const glared = useRef(false)

  const onGlareRef = useRef(onGlare)
  useEffect(() => {
    onGlareRef.current = onGlare
  }, [onGlare])

  const appear = useCallback(() => {
    setPose((current) => {
      if (current) return current
      const spot = pick(SPOTS)
      const heading = pick(spot.out)
      return {
        id: Date.now(),
        phase: 'hidden',
        x: spot.x,
        y: spot.y,
        heading,
        moveMs: 0,
        // Out from behind it, far enough to be clear of the edge.
        legs: [{ x: spot.x + heading.dx * spot.clear, y: spot.y + heading.dy * spot.clear, heading }],
        leaving: false,
        dash: false,
      }
    })
  }, [])

  useEffect(() => {
    window.addEventListener(PITTUKI_SUMMON_EVENT, appear)
    return () => window.removeEventListener(PITTUKI_SUMMON_EVENT, appear)
  }, [appear])

  useEffect(() => {
    if (pose || reducedMotion()) return
    const timer = window.setInterval(() => {
      if (!document.hidden && Math.random() < CHANCE) appear()
    }, ROLL_MS)
    return () => window.clearInterval(timer)
  }, [pose, appear])

  useEffect(() => {
    if (!pose) return
    if (pose.phase === 'hidden') {
      leaveBy.current = performance.now() + rand(STAY_MIN_MS, STAY_MAX_MS)
      glared.current = false
    }
    const timer = window.setTimeout(() => {
      const overstayed = performance.now() > leaveBy.current
      setPose((prev) => {
        if (!prev) return prev
        if (prev.legs.length) return crawl(prev, prev.legs, prev.leaving, prev.dash)
        if (prev.phase === 'crawl') {
          // Arrived. Back under cover means gone.
          if (prev.leaving) return null
          return { ...prev, id: prev.id + 1, phase: Math.random() < 0.45 ? 'look' : 'still', moveMs: 0 }
        }
        if (prev.phase === 'look' || prev.phase === 'glare') {
          return { ...prev, id: prev.id + 1, phase: 'still', moveMs: 0 }
        }
        if (overstayed) {
          const spot = nearestSpot(prev.x, prev.y)
          return crawl(prev, route(prev.x, prev.y, spot.x, spot.y), true)
        }
        return wander(prev)
      })
    }, holdFor(pose))
    return () => window.clearTimeout(timer)
  }, [pose])

  // Keeping an eye on the floor. Only while he is frozen — a lizard on
  // the move is not watching anything but the wall in front of it.
  const watching = pose !== null && (pose.phase === 'still' || pose.phase === 'look')
  useEffect(() => {
    if (!watching) return
    const timer = window.setInterval(() => {
      const rat = wonwuu.current
      if (!rat || glared.current) return
      setPose((prev) => {
        if (!prev || Math.abs(liveX(rat) - prev.x) > GLARE_RANGE) return prev
        glared.current = true
        return { ...prev, id: prev.id + 1, phase: 'glare', moveMs: 0 }
      })
    }, 200)
    return () => window.clearInterval(timer)
  }, [watching, wonwuu])

  // Tell the room once the glare has actually started, so Wonwuu's mark
  // goes up in the same moment as his.
  const glaring = pose?.phase === 'glare'
  useEffect(() => {
    if (glaring) onGlareRef.current()
  }, [glaring])

  const catchHim = useCallback(() => {
    setPose((prev) => {
      if (!prev || prev.leaving) return prev
      // He does not stop to be looked at: straight back under cover.
      const spot = nearestSpot(prev.x, prev.y)
      return crawl({ ...prev }, route(prev.x, prev.y, spot.x, spot.y), true, true)
    })
    onCaught?.()
  }, [onCaught])

  if (!pose) return null

  return (
    <button
      type="button"
      className="pittuki"
      data-phase={pose.phase}
      onClick={catchHim}
      disabled={pose.leaving || pose.phase === 'hidden'}
      aria-label="Pittuki the house lizard"
      style={
        {
          '--pk-x': `${pose.x}%`,
          '--pk-y': `${pose.y}%`,
          '--pk-sx': pose.heading.sx,
          '--pk-sy': pose.heading.sy,
          '--pk-move': `${pose.moveMs}ms`,
        } as CSSProperties
      }
    >
      <Sprite
        key={pose.id}
        name={SPRITE[pose.phase]}
        className="pittuki__sprite"
        duration={pose.phase === 'crawl' && pose.dash ? DASH_CYCLE_MS : undefined}
      />
      {pose.phase === 'glare' && <Exclaim kind="anger" className="pittuki__mark" />}
    </button>
  )
}
