import { useCallback, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react'
import { Sprite } from '../../components/Sprite'
import { sprites, type SpriteName } from '../../sprites/manifest'
import { Exclaim } from './Exclaim'
import { WONWUU_SUMMON_EVENT, type WonwuuSummonOptions } from './summon'
import { ALERT_MS, liveX, nextTrack, offstage, type Track } from './track'
import './wonwuu.css'

/** How often the dice are rolled, and the odds on each roll. */
const ROLL_MS = 10_000
const CHANCE = 0.8

/** He leaves on his own somewhere in this window after arriving. */
const STAY_MIN_MS = 20_000
const STAY_MAX_MS = 30_000

/* Speeds are derived, never set: each loop of the sheet is one stride,
   so how far he travels per second has to be how far a stride carries
   him divided by how long a loop takes. Set independently, the two drift
   apart and his feet skate across the floor — a slow-motion walk sliding
   along at running pace.

   His body is 22 art pixels long on a 28px cell drawn at Lulu's scale,
   which comes to 5.2% of the frame at every breakpoint. */
const BODY = 5.2
/** Short, careful steps: most of a body length per stride. */
const SNEAK_STRIDE = BODY * 0.8
/** Bounding flat out: nearly two body lengths per stride. */
const RUN_STRIDE = BODY * 1.8
/** Percent of the frame per second. */
const CREEP_SPEED = SNEAK_STRIDE / (sprites['wonwuu/sneak'].duration / 1000)
const FLEE_SPEED = RUN_STRIDE / (sprites['wonwuu/run'].duration / 1000)

/** Floor range he wanders, in percent of the frame. Lulu's is 4-92. */
const RANGE: [number, number] = [6, 94]

/**
 * His floor line, as a row of the 256px frame. Two rows in front of
 * Lulu's 176, so when their paths cross he is the one drawn nearer.
 */
const LINE = 178

/** How far ahead of her she can see him, in percent of the frame. */
const SIGHT = 46

/**
 * The things Lulu can be doing and still notice him. Asleep, waking,
 * mid-jump or busy grooming, she misses him entirely — which is the
 * whole game for him.
 */
const WATCHFUL = new Set(['stand', 'walk', 'sit', 'sitting', 'situp', 'return'])

type Phase = 'arrive' | 'enter' | 'creep' | 'sniff' | 'look' | 'leave' | 'alert' | 'flee'

interface Pose {
  id: number
  phase: Phase
  x: number
  /** 1 faces right. The sheet is drawn facing left, so CSS flips it. */
  facing: 1 | -1
  moveMs: number
}

const SPRITE: Record<Phase, SpriteName> = {
  arrive: 'wonwuu/still',
  enter: 'wonwuu/sneak',
  creep: 'wonwuu/sneak',
  sniff: 'wonwuu/twitch',
  look: 'wonwuu/still',
  leave: 'wonwuu/sneak',
  alert: 'wonwuu/still',
  // The only time the full run cycle plays.
  flee: 'wonwuu/run',
}

/** Phases where he is loose in the room and Lulu might spot him. */
const WANDERING = new Set<Phase>(['enter', 'creep', 'sniff', 'look', 'leave'])

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const walk = (from: number, to: number, speed: number) =>
  (Math.abs(to - from) / speed) * 1000

interface Context {
  off: { left: number; right: number }
  overstayed: boolean
}

function nextPose(prev: Pose, { off, overstayed }: Context): Pose | null {
  const id = prev.id + 1
  const [min, max] = RANGE

  switch (prev.phase) {
    case 'arrive': {
      // A short way in from whichever edge he came through.
      const x = prev.facing === 1 ? min + rand(2, 16) : max - rand(2, 16)
      return { id, phase: 'enter', x, facing: prev.facing, moveMs: walk(prev.x, x, CREEP_SPEED) }
    }
    case 'enter':
    case 'creep':
      // Every stretch of creeping ends in a stop — mostly twitching as he
      // sniffs the air, sometimes frozen, listening.
      return { ...prev, id, phase: Math.random() < 0.65 ? 'sniff' : 'look', moveMs: 0 }
    case 'sniff':
    case 'look': {
      if (overstayed) {
        // Out by the nearer edge.
        const x = prev.x < 50 ? off.left : off.right
        return { id, phase: 'leave', x, facing: x > prev.x ? 1 : -1, moveMs: walk(prev.x, x, CREEP_SPEED) }
      }
      // Usually carries on the way he was heading, the way a nose follows
      // a trail; turns back at the walls or on a whim.
      let facing = prev.facing
      if (Math.random() < 0.3) facing = facing === 1 ? -1 : 1
      // A few strides at a time: at a sneak's pace that is one to three
      // seconds between stops.
      const step = rand(4, 12) * facing
      let x = prev.x + step
      if (x < min || x > max) {
        facing = facing === 1 ? -1 : 1
        x = prev.x - step
      }
      x = Math.min(max, Math.max(min, x))
      return { id, phase: 'creep', x, facing, moveMs: walk(prev.x, x, CREEP_SPEED) }
    }
    case 'alert': {
      const x = prev.facing === 1 ? off.right : off.left
      return { id, phase: 'flee', x, facing: prev.facing, moveMs: walk(prev.x, x, FLEE_SPEED) }
    }
    case 'leave':
    case 'flee':
      return null
  }
}

function holdFor(pose: Pose): number {
  switch (pose.phase) {
    case 'arrive':
      // Long enough for the offstage position to paint before the walk
      // in starts, so the transition has somewhere to start from.
      return 60
    case 'sniff':
      return rand(1400, 3200)
    case 'look':
      return rand(700, 1600)
    case 'alert':
      return ALERT_MS
    default:
      return pose.moveMs
  }
}

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** How long he holds a glare at Pittuki. */
export const GLARE_MS = 1800

export interface WonwuuControls {
  /** Pittuki has him in his sights. He glares back. */
  glare: () => void
}

interface WonwuuProps {
  /** Where Lulu is, published by her. He is only ever seen through it. */
  lulu: RefObject<Track | null>
  /** Stop rolling while Lulu is off chasing a previous visit. */
  resting?: boolean
  /** Lulu has seen him. `direction` is the way she is facing. */
  onSpotted: (direction: 1 | -1) => void
  /** Someone clicked him. He bolts, and the room shows his trade. */
  onCaught?: () => void
  /** Every move he makes, or null once he has gone — for Pittuki, who
      keeps an eye on him from the wall. */
  onMove?: (track: Track | null) => void
  /** Lets the room set him glaring. */
  controls?: RefObject<WonwuuControls | null>
}

/**
 * Wonwuu the wandering rat.
 *
 * Every ten seconds there is an 80% chance he creeps in from one side,
 * noses around the floor in careful stretches, and leaves again within
 * half a minute. If Lulu is awake on the floor and looking his way,
 * she spots him: both freeze under a "!", then he bolts off the side
 * she is facing with her right behind him.
 */
export function Wonwuu({
  lulu,
  resting = false,
  onSpotted,
  onCaught,
  onMove,
  controls,
}: WonwuuProps) {
  const [pose, setPose] = useState<Pose | null>(null)
  // Always mounted, even while he is away, so there is something to
  // measure the pets' layer from before he has an element of his own.
  const anchor = useRef<HTMLSpanElement>(null)
  const track = useRef<Track | null>(null)
  const leaveBy = useRef(0)

  const onSpottedRef = useRef(onSpotted)
  const onMoveRef = useRef(onMove)
  useEffect(() => {
    onSpottedRef.current = onSpotted
    onMoveRef.current = onMove
  }, [onSpotted, onMove])

  // Bumped for every glare, so a second one restarts the mark; cleared
  // on a timer rather than on animationend, which may never fire.
  const [glare, setGlare] = useState(0)
  useImperativeHandle(controls, () => ({ glare: () => setGlare((n) => n + 1) }), [])
  useEffect(() => {
    if (!glare) return
    const timer = window.setTimeout(() => setGlare(0), GLARE_MS)
    return () => window.clearTimeout(timer)
  }, [glare])

  const catchHim = useCallback(() => {
    const now = track.current
    if (!pose || !WANDERING.has(pose.phase) || !now) return
    const x = liveX(now)
    const off = offstage(anchor.current?.parentElement ?? null)
    // Same freeze-then-bolt as being seen by Lulu, but off by whichever
    // edge is nearer: there is no cat to run from, just the cursor.
    const facing = x - off.left < off.right - x ? -1 : 1
    setPose({ id: pose.id + 1, phase: 'alert', x, facing, moveMs: 0 })
    onCaught?.()
  }, [pose, onCaught])

  const arrive = useCallback((from?: 'left' | 'right') => {
    const side = from ?? (Math.random() < 0.5 ? 'left' : 'right')
    const off = offstage(anchor.current?.parentElement ?? null)
    setPose(
      (current) =>
        current ?? {
          id: Date.now(),
          phase: 'arrive',
          x: side === 'left' ? off.left : off.right,
          // Walks in facing into the room.
          facing: side === 'left' ? 1 : -1,
          moveMs: 0,
        },
    )
  }, [])

  useEffect(() => {
    const onSummon = (event: Event) =>
      arrive((event as CustomEvent<WonwuuSummonOptions>).detail?.from)
    window.addEventListener(WONWUU_SUMMON_EVENT, onSummon)
    return () => window.removeEventListener(WONWUU_SUMMON_EVENT, onSummon)
  }, [arrive])

  // The dice, rolled only while he is out of the room.
  useEffect(() => {
    if (pose || resting || reducedMotion()) return
    const timer = window.setInterval(() => {
      if (!document.hidden && Math.random() < CHANCE) arrive()
    }, ROLL_MS)
    return () => window.clearInterval(timer)
  }, [pose, resting, arrive])

  // Publish the move and schedule the next one.
  useEffect(() => {
    if (!pose) {
      onMoveRef.current?.(null)
      return
    }
    if (pose.phase === 'arrive') {
      // A new visit: forget the last one's track and start the clock.
      track.current = null
      leaveBy.current = performance.now() + rand(STAY_MIN_MS, STAY_MAX_MS)
    }
    track.current = nextTrack(track.current, {
      toX: pose.x,
      ms: pose.moveMs,
      facing: pose.facing,
      action: pose.phase,
      surface: 'floor',
    })
    onMoveRef.current?.(track.current)
    const timer = window.setTimeout(() => {
      const context = {
        off: offstage(anchor.current?.parentElement ?? null),
        overstayed: performance.now() > leaveBy.current,
      }
      setPose((prev) => (prev ? nextPose(prev, context) : null))
    }, holdFor(pose))
    return () => window.clearTimeout(timer)
  }, [pose])

  // Lulu's line of sight. Polled rather than event-driven: neither
  // animal knows when the other has moved into view, only where it is.
  const loose = pose !== null && WANDERING.has(pose.phase)
  useEffect(() => {
    if (!loose) return
    const timer = window.setInterval(() => {
      const cat = lulu.current
      const rat = track.current
      if (!cat || !rat) return
      if (cat.surface !== 'floor' || !WATCHFUL.has(cat.action)) return
      const now = performance.now()
      const x = liveX(rat, now)
      // Not in the room yet, or already out of it: nothing to see. He
      // walks in from well past the edge, and without this she could
      // spot him before he was on screen and chase off after nothing.
      const edge = offstage(anchor.current?.parentElement ?? null, 0)
      if (x < edge.left + 2 || x > edge.right - 2) return
      const ahead = (x - liveX(cat, now)) * cat.facing
      // Behind her, or too far off to make out: he is safe.
      if (ahead <= 0 || ahead > SIGHT) return

      // He turns tail the instant he is seen, so the two are never
      // face to face: he runs the way she is looking, and she follows.
      setPose((prev) =>
        prev ? { id: prev.id + 1, phase: 'alert', x, facing: cat.facing, moveMs: 0 } : prev,
      )
      onSpottedRef.current(cat.facing)
    }, 120)
    return () => window.clearInterval(timer)
  }, [loose, lulu])

  return (
    <>
      <span ref={anchor} hidden />
      {pose && (
        <button
          type="button"
          className="wonwuu"
          data-phase={pose.phase}
          onClick={catchHim}
          // Only catchable while he is loose. Once seen, he is already gone.
          disabled={!WANDERING.has(pose.phase)}
          aria-label="Wonwuu the wandering rat"
          style={
            {
              '--w-x': `${pose.x}%`,
              '--w-bottom': `${((256 - LINE) / 256) * 100}%`,
              '--w-face': pose.facing,
              '--w-move': `${pose.moveMs}ms`,
            } as React.CSSProperties
          }
        >
          <Sprite
            key={pose.id}
            name={SPRITE[pose.phase]}
            className="wonwuu__sprite"
          />
          {pose.phase === 'alert' && <Exclaim className="wonwuu__alert" />}
          {glare > 0 && WANDERING.has(pose.phase) && (
            <Exclaim key={glare} kind="anger" className="wonwuu__alert" />
          )}
        </button>
      )}
    </>
  )
}
