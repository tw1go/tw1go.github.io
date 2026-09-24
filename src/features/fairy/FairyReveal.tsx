import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useTypeIn } from '../dialog/useTypewriter'
import { FAIRY_SPEAKER, pickFairyBlessing } from '../dialog/lines'
import { FairySprite } from './FairySprite'
import '../dialog/interaction-box.css'
import './fairy-reveal.css'

/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 520

/* Twinkles around her, as fractions of the stage. Scattered by hand:
   random placement kept clumping on one side. */
const TWINKLES = [
  { x: '14%', y: '22%', d: 0 },
  { x: '82%', y: '16%', d: 420 },
  { x: '6%', y: '64%', d: 860 },
  { x: '90%', y: '58%', d: 240 },
  { x: '28%', y: '88%', d: 1100 },
  { x: '70%', y: '90%', d: 640 },
  { x: '48%', y: '4%', d: 1380 },
  { x: '96%', y: '86%', d: 980 },
  { x: '2%', y: '10%', d: 1620 },
]

/**
 * The payoff for catching her: the pumpkin's reveal, blessed instead of
 * cursed.
 *
 * She swoops in to the front of the room and hovers there, still
 * flapping, while she tells you how lucky you are.
 */
export function FairyReveal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  // Drawn once, in a lazy initialiser, so a re-render cannot swap the
  // blessing out from under a line that is still typing.
  const [text] = useState(pickFairyBlessing)
  // Starts after she has arrived, so the line lands on her rather than
  // racing her across the screen.
  const line = useTypeIn(text, { speed: 28, startDelay: 900 })

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
      className="fairy-reveal"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
    >
      {/* Three nested elements, one transform each: the swoop in or out,
          the slow hover, and the frame-steadying offset inside
          FairySprite. One element could only animate one of them. */}
      <div className="fairy-reveal__swoop" aria-hidden="true">
        <span className="fairy-reveal__glow" />
        {TWINKLES.map((twinkle) => (
          <span
            key={twinkle.d}
            className="fairy-reveal__twinkle"
            style={
              {
                left: twinkle.x,
                top: twinkle.y,
                animationDelay: `${twinkle.d}ms`,
              } as CSSProperties
            }
          />
        ))}
        <div className="fairy-reveal__hover">
          <FairySprite mode="hover" className="fairy-reveal__art" />
        </div>
      </div>

      <div
        className="interaction interaction--static fairy-reveal__box"
        onClick={(event) => {
          event.stopPropagation()
          if (!line.done) line.skip()
        }}
      >
        <span className="interaction__name">{FAIRY_SPEAKER}</span>
        <span className="interaction__text" role="status">
          {line.typed}
          {!line.done && <i className="interaction__caret" />}
        </span>
      </div>
    </div>
  )
}
