import { useCallback, useEffect, useState } from 'react'
import { Sprite } from '../../components/Sprite'
import { useTypeIn } from '../dialog/useTypewriter'
import { WONWUU_SPEAKER, pickWonwuuTrade } from '../dialog/lines'
import '../dialog/interaction-box.css'
import './wonwuu-reveal.css'

/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 420
/** Kept in sync with wonwuu-dash-in: how long he runs before he stops. */
const DASH_MS = 520

/**
 * The payoff for catching Wonwuu: the pumpkin's and the fairy's reveal,
 * done as a heist gone wrong.
 *
 * He tears in from the side at a full run, skids to a stop in a
 * spotlight — caught — and stands there twitching while he makes you
 * his trade. Closing it, he bolts.
 */
export function WonwuuReveal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  // Running until he has skidded to a stop, then twitching.
  const [stopped, setStopped] = useState(false)
  // Drawn once, in a lazy initialiser, so a re-render cannot swap the
  // trade out from under a line that is still typing.
  const [text] = useState(pickWonwuuTrade)
  // Starts once he has stopped, so he is standing still for the pitch.
  const line = useTypeIn(text, { speed: 26, startDelay: DASH_MS + 200 })

  const dismiss = useCallback(() => setClosing(true), [])

  useEffect(() => {
    const timer = window.setTimeout(() => setStopped(true), DASH_MS)
    return () => window.clearTimeout(timer)
  }, [])

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

  // Running again on the way out: he does not leave at a walk.
  const running = !stopped || closing

  return (
    <div
      className="wonwuu-reveal"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
    >
      {/* Nested for the same reason as the other reveals: the outer box
          travels in and out, the spotlight and the rat sit inside it, and
          each animates its own transform. */}
      <div className="wonwuu-reveal__stage" aria-hidden="true">
        <span className="wonwuu-reveal__spot" />
        <span className="wonwuu-reveal__shadow" />
        <div className="wonwuu-reveal__dash">
          <Sprite
            key={running ? 'run' : 'twitch'}
            name={running ? 'wonwuu/hi-run' : 'wonwuu/hi-twitch'}
            className="wonwuu-reveal__art"
          />
        </div>
      </div>

      <div
        className="interaction interaction--static wonwuu-reveal__box"
        onClick={(event) => {
          event.stopPropagation()
          if (!line.done) line.skip()
        }}
      >
        <span className="interaction__name">{WONWUU_SPEAKER}</span>
        <span className="interaction__text" role="status">
          {line.typed}
          {!line.done && <i className="interaction__caret" />}
        </span>
      </div>
    </div>
  )
}
