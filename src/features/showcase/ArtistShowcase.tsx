import { useEffect, useState } from 'react'
import { useTypeIn } from '../dialog/useTypewriter'
import { ARTISTS, type Artist } from './artists'
import '../dialog/interaction-box.css'
import './artist-showcase.css'

const INTRO = 'twigo has been listening to these artists frequently.'

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
  const intro = useTypeIn(INTRO, { speed: 26, startDelay: 420 })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // Clicking the dim backdrop closes; the rack and the panel stop the
    // click from reaching it.
    <div
      className="showcase"
      onClick={onClose}
      role="presentation"
      aria-label="Artists twigo listens to"
    >
      <ul className="showcase__rack" onClick={(event) => event.stopPropagation()}>
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
                  '--from-x': `${dir * (72 + (i % 3) * 14)}vw`,
                  '--from-y': `${-18 - (i % 4) * 9}vh`,
                  '--spin': `${dir * (360 + (i % 3) * 120)}deg`,
                  animationDelay: `${i * 70}ms`,
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
