import { useState, type AnimationEvent, type CSSProperties } from 'react'

/* One drop: a one-pixel staircase leaning into the wind, at a finer pixel
   than the rest of the sky so it reads as thin. The mask gives the shape,
   the stylesheet the colour. */
const DROP_ROWS = ['..x', '.x.', '.x.', 'x..']
const DROP = (() => {
  const cells = DROP_ROWS.flatMap((row, y) =>
    [...row].flatMap((c, x) => (c === 'x' ? [`M${x} ${y}h1v1h-1z`] : [])),
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4" shape-rendering="crispEdges"><path d="${cells}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

interface Drop {
  id: number
  x: number
  duration: number
  delay: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Seconds per fall: storm rain comes down harder. */
const SPEED = { rain: [0.55, 0.9], storm: [0.36, 0.6] } as const

/* How far a drop blows sideways over one fall, as a share of the window's
   width: the CSS --wind (28 and 40 room pixels) over the glass's 34. A
   drop has to start that far upwind of where it lands, so drops are
   spawned across the window *plus* that much to its right — otherwise
   everything has drifted left by the bottom, and the bottom-right corner
   gets no rain at all. */
const DRIFT = { rain: 82, storm: 118 } as const
const spawnX = (kind: 'rain' | 'storm') => rand(-5, 105 + DRIFT[kind])

/* Drops per window: the spread above is wider than the glass, so the
   count is scaled up to keep the rain on the glass as dense as it looks. */
const COUNT = { rain: 46, storm: 96 } as const

function makeDrops(count: number, kind: 'rain' | 'storm'): Drop[] {
  const [min, max] = SPEED[kind]
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: spawnX(kind),
    duration: rand(min, max),
    // Spread over a whole fall, so the first second is not a curtain of
    // drops all arriving together.
    delay: -rand(0, max),
  }))
}

/**
 * Rain on one window: separate drops, each falling at its own speed and
 * each landing somewhere new every time round.
 *
 * A single repeated streak texture moved in lockstep and read as a
 * pattern rather than weather. Here every drop is its own element with
 * its own speed, and each time one finishes a fall it is moved to a fresh
 * random spot — straight on the element, without a re-render — so the
 * same drop never lands in the same place twice.
 */
export function Rain({ kind }: { kind: 'rain' | 'storm' }) {
  // A storm gets far more: its drops fall faster, so each spends less
  // time on the glass, and the same count reads thinner than rain.
  const [drops] = useState(() => makeDrops(COUNT[kind], kind))

  // Only the position changes between falls. Changing the duration of a
  // running animation retimes it on the spot, which would throw the drop
  // to a random point mid-fall; each drop's own fixed speed already keeps
  // them all out of step.
  const respawn = (event: AnimationEvent<HTMLSpanElement>) => {
    event.currentTarget.style.left = `${spawnX(kind)}%`
  }

  return (
    <span className="window-rain" data-kind={kind}>
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="window-rain__drop"
          onAnimationIteration={respawn}
          style={
            {
              left: `${drop.x}%`,
              animationDuration: `${drop.duration}s`,
              animationDelay: `${drop.delay}s`,
              maskImage: DROP,
              WebkitMaskImage: DROP,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}
