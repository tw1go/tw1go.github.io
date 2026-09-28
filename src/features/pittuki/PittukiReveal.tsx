import { useCallback, useEffect, useState } from 'react'
import { Sprite } from '../../components/Sprite'
import { useTypeIn } from '../dialog/useTypewriter'
import { PITTUKI_SPEAKER, pickPittukiSession } from '../dialog/lines'
import '../dialog/interaction-box.css'
import './pittuki-reveal.css'

/** Kept in sync with the closing animation in the CSS. */
const OUT_MS = 460
/** Kept in sync with pittuki-crawl-in: how long he climbs before he stops. */
const CRAWL_MS = 900

/**
 * The payoff for catching Pittuki: after the curse, the blessing, the
 * trade and the prophecy, a therapy session.
 *
 * He climbs up into the middle of the screen — along his own heading,
 * the way he moves on the wall — settles, and looks you over while he
 * works out the diagnosis.
 */
export function PittukiReveal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const [settled, setSettled] = useState(false)
  // Drawn once, in a lazy initialiser, so a re-render cannot swap the
  // session out from under a line that is still typing.
  const [text] = useState(pickPittukiSession)
  const line = useTypeIn(text, { speed: 26, startDelay: CRAWL_MS + 200 })

  const dismiss = useCallback(() => setClosing(true), [])

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), CRAWL_MS)
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

  // Climbing on the way in and on the way out; looking about in between.
  const climbing = !settled || closing

  return (
    <div
      className="pittuki-reveal"
      data-closing={closing || undefined}
      onClick={dismiss}
      role="presentation"
    >
      <div className="pittuki-reveal__stage" aria-hidden="true">
        <span className="pittuki-reveal__glow" />
        <div className="pittuki-reveal__crawl">
          <Sprite
            key={climbing ? 'climb' : 'look'}
            name={climbing ? 'pittuki/hi-climb' : 'pittuki/hi-look'}
            className="pittuki-reveal__art"
          />
        </div>
      </div>

      <div
        className="interaction interaction--static pittuki-reveal__box"
        onClick={(event) => {
          event.stopPropagation()
          if (!line.done) line.skip()
        }}
      >
        <span className="interaction__name">{PITTUKI_SPEAKER}</span>
        <span className="interaction__text" role="status">
          {line.typed}
          {!line.done && <i className="interaction__caret" />}
        </span>
      </div>
    </div>
  )
}
