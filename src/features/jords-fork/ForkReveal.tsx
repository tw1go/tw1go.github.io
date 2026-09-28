import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Sprite } from '../../components/Sprite'
import { useTypeIn } from '../dialog/useTypewriter'
import { JORDS_FORK_SPEAKER, pickJordsProphecy } from '../dialog/lines'
import { CIRCLE_STEPS, RitualCircle } from './RitualCircle'
import '../dialog/interaction-box.css'
// Its keyframes are the room's, reused at a bigger pixel size.
import './jords-fork.css'
import './fork-reveal.css'

/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 520
/** The circle lights in this long before the fork comes up. */
const KINDLE_MS = 700

/** Embers off the big circle, as offsets across it. */
const EMBERS = [-0.34, -0.18, -0.06, 0.08, 0.2, 0.32, -0.26, 0.14]

/**
 * The payoff for catching Jord's Fork, after the pumpkin's curse, the
 * fairy's blessing and the rat's trade: a prophecy.
 *
 * The circle from the floor opens up big in the middle of the screen,
 * the fork rises out of it in full detail and hangs there, burning,
 * while it tells you your future.
 */
export function ForkReveal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  // Drawn once, in a lazy initialiser, so a re-render cannot swap the
  // prophecy out from under a line that is still typing.
  const [text] = useState(pickJordsProphecy)
  // Starts once the fork has risen, so it is hanging still for the
  // pronouncement.
  const line = useTypeIn(text, { speed: 28, startDelay: KINDLE_MS + 700 })

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
      className="fork-reveal"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
      style={{ '--kindle-step': `${KINDLE_MS / CIRCLE_STEPS}ms` } as CSSProperties}
    >
      <div className="fork-reveal__stage" aria-hidden="true">
        <RitualCircle className="fork-reveal__circle" />
        <span className="fork-reveal__pillar" />
        {EMBERS.map((x, i) => (
          <span
            key={i}
            className="fork-reveal__ember"
            style={{ '--e-x': x, '--e-i': i } as CSSProperties}
          />
        ))}
        {/* Rising out of the circle (and back in), then the stepped bob
            and the drift — one transform per wrapper, as in the room. */}
        {/* Clipped at the circle's centre line, so it rises through it. */}
        <div className="fork-reveal__portal">
          <div className="fork-reveal__lift">
            <div className="fork-reveal__bob">
              <div className="fork-reveal__drift">
                <Sprite name="jords-fork/hi-burn" className="fork-reveal__art" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="interaction interaction--static fork-reveal__box"
        onClick={(event) => {
          event.stopPropagation()
          if (!line.done) line.skip()
        }}
      >
        <span className="interaction__name">{JORDS_FORK_SPEAKER}</span>
        <span className="interaction__text" role="status">
          {line.typed}
          {!line.done && <i className="interaction__caret" />}
        </span>
      </div>
    </div>
  )
}
