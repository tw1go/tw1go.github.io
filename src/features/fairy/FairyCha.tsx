import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { FairySprite } from './FairySprite'
import { createDust, type DustEngine } from './dust'
import {
  FAIRY_SUMMON_EVENT,
  type FairyDirection,
  type SummonOptions,
} from './summon'
import './fairy-cha.css'

/** How often the dice are rolled, and the odds on each roll. */
const ROLL_MS = 10_000
const CHANCE = 0.0716

/** One crossing of the room, edge to edge. */
const FLIGHT_MS = 11000

/* How hard she slows over twigo: her speed there is 1 - LINGER of the
   average, and 1 + LINGER at the edges. */
const LINGER = 0.45

/* How long the puff of dust has the screen to itself before the reveal
   covers it. Any sooner and the overlay hides the burst entirely. */
const CAUGHT_MS = 420

interface Flight {
  id: number
  direction: FairyDirection
}

interface FairyChaProps {
  /**
   * The character's sprite frame. She flies relative to it — over his
   * head, slowing as she passes — rather than to the viewport.
   */
  anchor: RefObject<HTMLElement | null>
  /** Stop rolling while something else has the screen. */
  resting?: boolean
  /** She has just flown over twigo. */
  onPass: () => void
  /** Someone caught her. */
  onCaught: () => void
}

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Fairy Cha, the rarest thing in the room.
 *
 * Every ten seconds there is a 7.16% chance she crosses the screen,
 * shedding dust behind her and lighting fireflies as she goes. Click her
 * mid-flight to catch her.
 *
 * Her position is written straight to the element's transform from a rAF
 * loop instead of going through React state: sixty re-renders a second
 * for one transform would be pure overhead, and a CSS path could not
 * report where she is to the dust or to the heart trigger.
 */
export function FairyCha({ anchor, resting = false, onPass, onCaught }: FairyChaProps) {
  const [flight, setFlight] = useState<Flight | null>(null)
  const flyerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dustRef = useRef<DustEngine | null>(null)
  // Where she is right now, for the burst when she is caught.
  const here = useRef({ x: 0, y: 0 })

  // Held in refs so the flight loop, which starts once per flight, always
  // calls the latest handler without restarting when App re-renders.
  const onPassRef = useRef(onPass)
  const onCaughtRef = useRef(onCaught)
  useEffect(() => {
    onPassRef.current = onPass
    onCaughtRef.current = onCaught
  }, [onPass, onCaught])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dust = createDust(canvas)
    dustRef.current = dust
    return () => {
      dust.destroy()
      dustRef.current = null
    }
  }, [])

  const launch = useCallback((options: SummonOptions = {}) => {
    const direction: FairyDirection =
      options.direction === 'left-to-right'
        ? 1
        : options.direction === 'right-to-left'
          ? -1
          : Math.random() < 0.5
            ? 1
            : -1
    // A flight already in the air wins; a second summon is dropped.
    setFlight((current) => current ?? { id: Date.now(), direction })
  }, [])

  // The console / programmatic trigger.
  useEffect(() => {
    const onSummon = (event: Event) =>
      launch((event as CustomEvent<SummonOptions>).detail)
    window.addEventListener(FAIRY_SUMMON_EVENT, onSummon)
    return () => window.removeEventListener(FAIRY_SUMMON_EVENT, onSummon)
  }, [launch])

  // The dice. Paused while she is out, while something else is open, and
  // while the tab is hidden — nobody should be lucky in a background tab.
  useEffect(() => {
    if (resting || flight || reducedMotion()) return
    const timer = window.setInterval(() => {
      if (!document.hidden && Math.random() < CHANCE) launch()
    }, ROLL_MS)
    return () => window.clearInterval(timer)
  }, [resting, flight, launch])

  useEffect(() => {
    if (!flight) return
    const flyer = flyerRef.current
    if (!flyer) return

    const { direction } = flight
    const w = flyer.offsetWidth
    const h = flyer.offsetHeight
    const vw = window.innerWidth
    const box = anchor.current?.getBoundingClientRect()
    const frame = box?.height ?? window.innerHeight
    // His head: the art's top row is 34% down the frame.
    const headX = box ? box.left + box.width / 2 : vw / 2
    const headY = box ? box.top + frame * 0.36 : window.innerHeight * 0.4

    const from = direction === 1 ? -w * 0.6 : vw + w * 0.6
    const to = direction === 1 ? vw + w * 0.6 : -w * 0.6

    /* t in 0..1 → screen point. The sine term in `u` is what makes her
       linger: its derivative is 1 + LINGER * cos(2πt), slow at the middle
       of the room and quick at the edges, with no seam in the velocity.
       Height comes in from above, swoops down over him and climbs away,
       with a slow ripple on top so the line is never ruler-straight. */
    const at = (t: number) => {
      const u = t + (LINGER * Math.sin(2 * Math.PI * t)) / (2 * Math.PI)
      const x = from + (to - from) * u
      const y =
        headY -
        frame * 0.24 +
        frame * 0.16 * Math.sin(Math.PI * t) +
        h * 0.09 * Math.sin(2 * Math.PI * 2.5 * t)
      return { x, y }
    }

    const room = {
      left: 0,
      right: vw,
      top: headY - frame * 0.3,
      bottom: box ? box.top + frame * 0.72 : window.innerHeight * 0.85,
    }
    // A scattering across the room as she arrives, lighting up over the
    // length of her crossing rather than all at once.
    dustRef.current?.fireflies(26, room, [0.3, FLIGHT_MS / 1000 - 1])

    let raf = 0
    let passed = false
    let nextFly = 0
    const start = performance.now()
    let last = start

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - start) / FLIGHT_MS
      if (t >= 1) {
        setFlight(null)
        return
      }

      const p = at(t)
      const ahead = at(Math.min(1, t + 0.004))
      // Nose follows the path. Measured against |dx| and flipped with
      // her, so diving reads as nose-down whichever way she faces.
      const pitch = Math.atan2(ahead.y - p.y, Math.abs(ahead.x - p.x))
      const tilt = Math.max(-0.3, Math.min(0.3, pitch)) * direction
      flyer.style.transform = `translate3d(${p.x - w / 2}px, ${p.y - h / 2}px, 0) rotate(${tilt}rad) scaleX(${direction})`
      here.current = p

      // From just behind her middle, where the sheet's own swirl trails.
      dustRef.current?.trail(p.x - direction * w * 0.14, p.y + h * 0.06, direction, dt)

      // The shower. Heaviest while she is over the middle of the room,
      // tapering off toward the edges, so it swells as she passes him.
      dustRef.current?.rain(dt, 15 + 33 * Math.sin(Math.PI * t))

      // More fireflies stirred up along the line she has just flown.
      if (now >= nextFly) {
        nextFly = now + 260
        dustRef.current?.fireflies(1, {
          left: p.x - w,
          right: p.x + w,
          top: p.y - h * 0.4,
          bottom: p.y + h * 1.2,
        })
      }

      if (!passed && Math.abs(p.x - headX) < w * 0.35) {
        passed = true
        onPassRef.current()
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [flight, anchor])

  const catchHer = useCallback(() => {
    dustRef.current?.burst(here.current.x, here.current.y)
    setFlight(null)
    window.setTimeout(() => onCaughtRef.current(), CAUGHT_MS)
  }, [])

  return (
    <div className="fairy-layer" aria-hidden={!flight}>
      <canvas ref={canvasRef} className="fairy-layer__dust" />
      {flight && (
        <div
          key={flight.id}
          ref={flyerRef}
          className="fairy"
          // Parked off screen until the first frame places her, so she
          // never flashes up in the corner for a frame.
          style={{ transform: 'translate3d(-200vw, 0, 0)' }}
        >
          <FairySprite mode="flight" className="fairy__art" />
          <button
            type="button"
            className="fairy__catch"
            onClick={catchHer}
            aria-label="Catch Fairy Cha"
          />
        </div>
      )}
    </div>
  )
}
