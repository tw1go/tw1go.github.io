import type { CSSProperties } from 'react'
import type { Sky } from './sky'
import { Rain } from './Rain'
import './window-sky.css'

/* The sky's shapes, one character per art pixel, turned into SVG masks:
   the shape comes from here, the colour from the stylesheet, so one sun
   can be pale at noon and orange at dusk. Unit squares, so they scale up
   without a smoothed edge. */
function mask(rows: string[]): string {
  const cells = rows
    .flatMap((row, y) => [...row].flatMap((c, x) => (c === 'x' ? [`M${x} ${y}h1v1h-1z`] : [])))
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges"><path d="${cells}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const SUN = mask(['..xxx..', '.xxxxx.', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..'])
const MOON = mask(['..xxx..', '.xxx...', 'xxx....', 'xxx....', 'xxx....', '.xxx...', '..xxx..'])
const CLOUD = mask(['....xxx......', '..xxxxxxx.xx.', '.xxxxxxxxxxxx', 'xxxxxxxxxxxxx', '.xxxxxxxxxxx.'])
const BOLT = mask(['..xx.', '.xx..', 'xx...', 'xxxx.', '..xx.', '.xx..', 'xx...', 'x....'])

/* Stars in two sets, so they can twinkle out of step. Positions are in
   percent of the whole sky — the frame's width — so the two windows
   show different ones; heights keep below the valance, where an open
   curtain actually shows the glass. */
const STARS = [
  [8, 34], [10, 52], [13, 40], [16, 66], [18, 46], [11, 80], [15, 58],
  [81, 36], [84, 52], [88, 74], [90, 38], [86, 86], [91, 60], [83, 64],
] as const

/* Clouds: height in the window, size, and how far along their crossing
   each starts, so they are spread out rather than setting off together. */
const CLOUDS = [
  { top: 14, scale: 1, offset: 0 },
  { top: 44, scale: 0.8, offset: 0.17 },
  { top: 26, scale: 1.2, offset: 0.34 },
  { top: 60, scale: 0.9, offset: 0.5 },
  { top: 8, scale: 0.7, offset: 0.67 },
  { top: 36, scale: 1.1, offset: 0.84 },
]

const CLOUD_COUNT: Record<Sky['weather'], number> = {
  clear: 2,
  cloudy: 6,
  rain: 6,
  storm: 6,
  fog: 0,
}

/**
 * What is outside one of the wall windows.
 *
 * Both windows look out on the same sky, so rather than drawing it twice
 * each shows its own slice of one wide scene: the sky is the frame's
 * width, and each window is offset into it by where it hangs on the
 * wall. The sun is in one window or the other, never both, and a cloud
 * crosses one and then, a while later, the other.
 */
export function WindowSky({ sky, side }: { sky: Sky; side: 'left' | 'right' }) {
  const clouds = CLOUDS.slice(0, CLOUD_COUNT[sky.weather])
  const body = sky.period === 'night' ? MOON : SUN

  return (
    <span
      className="window-sky"
      data-side={side}
      data-period={sky.period}
      data-weather={sky.weather}
      aria-hidden="true"
    >
      <span className="window-sky__world">
        <span className="window-sky__air" />
        {STARS.map(([x, y], i) => (
          <span
            key={i}
            className="window-sky__star"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 2) * -1.3}s` } as CSSProperties}
          />
        ))}
        <span className="window-sky__body" style={{ maskImage: body, WebkitMaskImage: body }} />
        {clouds.map((cloud) => (
          <span
            key={cloud.offset}
            className="window-sky__cloud"
            style={
              {
                top: `${cloud.top}%`,
                '--c-scale': cloud.scale,
                '--c-offset': cloud.offset,
                maskImage: CLOUD,
                WebkitMaskImage: CLOUD,
              } as CSSProperties
            }
          />
        ))}
        <span className="window-sky__fog" />
        <span className="window-sky__bolt" style={{ maskImage: BOLT, WebkitMaskImage: BOLT }} />
      </span>
      {/* Per window rather than across the shared sky: rain only has to
          fill the glass you can see, and each window gets its own drops. */}
      {(sky.weather === 'rain' || sky.weather === 'storm') && (
        <Rain key={sky.weather} kind={sky.weather} />
      )}
      {/* Over everything in the window: the sheet of white a lightning
          strike throws across the whole sky. */}
      <span className="window-sky__flash" />
    </span>
  )
}
