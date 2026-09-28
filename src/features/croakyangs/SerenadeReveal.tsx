import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Sprite } from '../../components/Sprite'
import { useTypeIn } from '../dialog/useTypewriter'
import { CROAK_SPEAKER, pickCroakSong } from '../dialog/lines'
import { NOTE_SRC } from './note'
import '../dialog/interaction-box.css'
import './serenade-reveal.css'

/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 460

/* Notes rising round him, as offsets across the stage. */
const NOTES = [
  { x: 0.18, drift: -1, delay: 0 },
  { x: 0.34, drift: 0.6, delay: 500 },
  { x: 0.72, drift: 1, delay: 250 },
  { x: 0.86, drift: -0.7, delay: 900 },
  { x: 0.55, drift: 0.4, delay: 1300 },
  { x: 0.26, drift: 0.9, delay: 1700 },
]

/**
 * The payoff for finding Croakyangs: after the curse, the blessing, the
 * trade, the prophecy and the session, a serenade.
 *
 * He rises into the middle of the screen in moonlight, singing, notes
 * coming off him, while his song types out below.
 */
export function SerenadeReveal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  // Drawn once, in a lazy initialiser, so a re-render cannot swap the
  // song out from under a line that is still typing.
  const [text] = useState(pickCroakSong)
  const line = useTypeIn(text, { speed: 28, startDelay: 600 })

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
    <div
      className="serenade-reveal"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
    >
      <div className="serenade-reveal__stage" aria-hidden="true">
        <span className="serenade-reveal__moon" />
        {NOTES.map((note) => (
          <span
            key={note.delay}
            className="serenade-reveal__note"
            style={
              {
                backgroundImage: NOTE_SRC,
                '--n-x': note.x,
                '--n-drift': note.drift,
                animationDelay: `${note.delay}ms`,
              } as CSSProperties
            }
          />
        ))}
        <div className="serenade-reveal__rise">
          <Sprite name="croakyangs/hi-sing" className="serenade-reveal__art" />
        </div>
      </div>

      <div
        className="interaction interaction--static serenade-reveal__box"
        onClick={(event) => {
          event.stopPropagation()
          if (!line.done) line.skip()
        }}
      >
        <span className="interaction__name">{CROAK_SPEAKER}</span>
        <span className="interaction__text" role="status">
          {line.typed}
          {!line.done && <i className="interaction__caret" />}
        </span>
      </div>
    </div>
  )
}
