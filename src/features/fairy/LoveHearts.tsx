import { useEffect, type CSSProperties } from 'react'
import './love-hearts.css'

/* The heart, one character per art pixel: o outline, f fill, h shine.
   Built into an SVG of unit squares, so it scales up without a single
   smoothed edge. */
const HEART = [
  '.oo...oo.',
  'ohfo.offo',
  'ohffffffo',
  'offfffffo',
  '.offfffo.',
  '..offfo..',
  '...ofo...',
  '....o....',
]

const INK: Record<string, string> = {
  o: '#6b1047',
  f: '#d946ef',
  h: '#fbcfe8',
}

const HEART_SRC = (() => {
  const cells = HEART.flatMap((row, y) =>
    [...row].flatMap((c, x) =>
      INK[c] ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${INK[c]}"/>`] : [],
    ),
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 8" shape-rendering="crispEdges">${cells}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

/* Start points as fractions of the frame, about his head (50%). They
   fan out to either side as they rise: the sign hangs only a few art
   pixels above his hair, so a straight climb ran every heart through it.
   Delays are staggered so they come up as a stream, not a volley. */
const HEARTS = [
  { x: '49%', drift: -0.1, scale: 1, delay: 0 },
  { x: '51%', drift: 0.11, scale: 0.8, delay: 350 },
  { x: '48%', drift: -0.14, scale: 0.65, delay: 700 },
  { x: '52%', drift: 0.15, scale: 1, delay: 1050 },
  { x: '50%', drift: -0.07, scale: 0.75, delay: 1450 },
  { x: '50%', drift: 0.08, scale: 0.9, delay: 1850 },
  { x: '49%', drift: -0.12, scale: 0.7, delay: 2300 },
  { x: '51%', drift: 0.13, scale: 0.85, delay: 2700 },
]

/** Kept in sync with heart-rise in the CSS. */
const RISE_MS = 2800
const TOTAL_MS = HEARTS[HEARTS.length - 1].delay + RISE_MS

/**
 * twigo, smitten, for the few seconds after she flies over him.
 *
 * Plays once and reports back, so the layer can unmount rather than sit
 * there with finished animations in it.
 */
export function LoveHearts({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, TOTAL_MS)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div className="love-hearts" aria-hidden="true">
      {HEARTS.map((heart) => (
        <span
          key={heart.delay}
          className="love-hearts__heart"
          style={
            {
              '--heart-src': HEART_SRC,
              '--h-x': heart.x,
              '--h-drift': `${heart.drift}`,
              '--h-scale': heart.scale,
              animationDelay: `${heart.delay}ms`,
              animationDuration: `${RISE_MS}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
