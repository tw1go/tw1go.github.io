import { useEffect, useState } from 'react'

/*
 * How big the room is drawn: the size of one art pixel on screen, as a
 * whole number so the grid never lands on half a pixel.
 *
 * It has to fit both ways, which a width breakpoint could never do: on a
 * short laptop screen the room was too tall and lost the air conditioner
 * off the top, and on a big monitor it sat tiny in a sea of black.
 *
 *  - Across: the 256-pixel frame, less a few columns — the outermost
 *    ones hold only empty wall, so they can clip.
 *  - Down: the floor line sits at 80% of the height, and everything from
 *    the air conditioner's top (13.5% down the frame) to there has to
 *    fit above it. That span is 132 art pixels (see --stage-top), plus a
 *    little headroom.
 */
const FIT_COLUMNS = 248
const FIT_ROWS = 170
const MIN = 1
const MAX = 10

export function sceneScaleFor(width: number, height: number): number {
  const fit = Math.floor(Math.min(width / FIT_COLUMNS, height / FIT_ROWS))
  return Math.max(MIN, Math.min(MAX, fit))
}

export function useSceneScale(): number {
  // Worked out in the initialiser, so the very first paint is already
  // the right size rather than jumping after an effect.
  const [scale, setScale] = useState(() => sceneScaleFor(window.innerWidth, window.innerHeight))

  useEffect(() => {
    const update = () => setScale(sceneScaleFor(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', update)
    // Phones rotating: some report the new size only after the turn.
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return scale
}
