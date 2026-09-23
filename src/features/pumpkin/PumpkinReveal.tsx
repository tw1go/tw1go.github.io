import { useCallback, useEffect, useState } from 'react'
import { Sprite } from '../../components/Sprite'
import { useTypeIn } from '../dialog/useTypewriter'
import { PUMPKIN_SPEAKER, pickPumpkinCurse } from '../dialog/lines'
import '../dialog/interaction-box.css'
import './pumpkin-reveal.css'

/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 320

/**
 * The payoff for finding the pumpkin.
 *
 * It comes up out of the window to the front of the room, held like
 * something just dug up, and twitches there while it curses you.
 */
export function PumpkinReveal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  // Drawn once, in a lazy initialiser, so a re-render cannot swap the
  // curse out from under a line that is still typing.
  const [text] = useState(pickPumpkinCurse)
  // Starts after the pumpkin has arrived, so the line lands on it rather
  // than racing it up the screen.
  const curse = useTypeIn(text, { speed: 30, startDelay: 620 })

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
      className="pumpkin-reveal"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
    >
      {/* Two nested elements on purpose: the outer one is thrown up the
          screen once, the inner one twitches forever. One element cannot
          do both, since each would be animating `transform`. */}
      <div className="pumpkin-reveal__rise" aria-hidden="true">
        <span className="pumpkin-reveal__glow" />
        <div className="pumpkin-reveal__twitch">
          <Sprite name="props/pumpkin" className="pumpkin-reveal__art" />
        </div>
      </div>

      <div
        className="interaction interaction--static"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="interaction__name">{PUMPKIN_SPEAKER}</span>
        <span className="interaction__text" role="status">
          {curse.typed}
          {!curse.done && <i className="interaction__caret" />}
        </span>
      </div>
    </div>
  )
}
