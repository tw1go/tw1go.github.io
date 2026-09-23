import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTypeIn } from '../dialog/useTypewriter'
import { ARTISTS, type Artist } from './artists'
import '../dialog/interaction-box.css'
import './artist-showcase.css'

const INTRO = 'twigo has been listening to these artists frequently.'
/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 540

/**
 * Sleeve colours, assigned by position so a given record always keeps its
 * own. Muted rather than saturated: nine full-strength squares would
 * shout over the covers they are meant to sit behind.
 */
const SLEEVES = [
  '#a8423f',
  '#b9762f',
  '#b39327',
  '#4f8a4c',
  '#2f7b8a',
  '#3f5da2',
  '#744ba0',
  '#a0447a',
  '#6b6f79',
]

/**
 * The jukebox's record rack.
 *
 * Records fly in from off screen and settle into a rack; hovering one
 * puts that artist in the panel below, with a link out to Spotify.
 *
 * The hovered artist is deliberately *sticky* — leaving a record does not
 * clear it. Otherwise the link would vanish the moment you moved the
 * pointer towards it, which makes it impossible to click.
 */
export function ArtistShowcase({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = useState<Artist | null>(null)
  const [closing, setClosing] = useState(false)
  const rackRef = useRef<HTMLUListElement>(null)
  const intro = useTypeIn(INTRO, { speed: 26, startDelay: 420 })

  /**
   * Point every record at the jukebox it came out of.
   *
   * The distance is per record and only knowable once the grid has been
   * laid out, so it is measured here rather than guessed in CSS. A layout
   * effect runs before paint, so the values are in place for the
   * animation's first frame — and because the same offsets drive the
   * closing animation in reverse, the records go back where they came
   * from too.
   */
  useLayoutEffect(() => {
    const rack = rackRef.current
    if (!rack) return

    // The flight animation has `both` fill and a delay, so before it runs
    // each slot is already held at its `from` keyframe — off screen and
    // scaled down. Measuring through that returns the start of the
    // flight, not the slot's resting place, so it is switched off for
    // the measurement. A layout effect runs before paint, so nothing of
    // this is ever visible.
    rack.dataset.measuring = 'true'

    const source = document.querySelector('.scene__jukebox')?.getBoundingClientRect()
    // Falling back to the bottom-centre keeps this working if the
    // jukebox is ever off screen or removed.
    const sx = source ? source.left + source.width / 2 : window.innerWidth / 2
    const sy = source ? source.top + source.height / 2 : window.innerHeight

    for (const slot of Array.from(rack.children) as HTMLElement[]) {
      const r = slot.getBoundingClientRect()
      slot.style.setProperty('--from-x', `${Math.round(sx - (r.left + r.width / 2))}px`)
      slot.style.setProperty('--from-y', `${Math.round(sy - (r.top + r.height / 2))}px`)
    }

    delete rack.dataset.measuring
  }, [])

  // Start the exit rather than unmounting on the spot, so the records
  // have time to fly back.
  const dismiss = useCallback(() => setClosing(true), [])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => onClose(), OUT_MS)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  return (
    // Clicking the dim backdrop closes; the rack and the panel stop the
    // click from reaching it.
    <div
      className="showcase"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
      aria-label="Artists twigo listens to"
    >
      <ul
        className="showcase__rack"
        ref={rackRef}
        onClick={(event) => event.stopPropagation()}
      >
        {ARTISTS.map((artist, i) => {
          // Derived from the index rather than random, so a re-render
          // never sends a record back off screen to fly in again.
          const dir = i % 2 === 0 ? -1 : 1
          return (
            <li
              key={artist.name}
              className="showcase__slot"
              style={
                {
                  // --from-x/y are filled in by the layout effect above.
                  '--i': i,
                  '--spin': `${dir * (300 + (i % 3) * 120)}deg`,
                  '--sleeve': SLEEVES[i % SLEEVES.length],
                } as React.CSSProperties
              }
            >
              <a
                className="vinyl"
                href={artist.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${artist.name} on Spotify`}
                onMouseEnter={() => setPicked(artist)}
                onFocus={() => setPicked(artist)}
              >
                <span className="vinyl__sleeve" />
                <span className="vinyl__disc">
                  <img className="vinyl__label" src={artist.cover} alt="" />
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <div
        className="interaction interaction--static"
        onClick={(event) => event.stopPropagation()}
      >
        {picked ? (
          <>
            <span className="interaction__name">{picked.name}</span>
            <span className="interaction__text">
              <a
                className="showcase__link"
                href={picked.url}
                target="_blank"
                rel="noreferrer"
              >
                Open on Spotify
              </a>
            </span>
          </>
        ) : (
          <>
            <span className="interaction__name">Jukebox</span>
            <span className="interaction__text" role="status">
              {intro.typed}
              {!intro.done && <i className="interaction__caret" />}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
