import { useState } from 'react'
import { Sprite } from '../../components/Sprite'
import './elli.css'

/**
 * Elli, the desk companion.
 *
 * The badge above her head is the affordance. A red "!" says there is
 * something here worth a click; once she has been clicked it settles into
 * a grey "?" — still interactive, no longer asking for attention.
 *
 * `met` is deliberately component state rather than localStorage, so the
 * "!" returns on a fresh visit. Persisting it would mean a returning
 * visitor never sees the cue at all.
 */
export function Elli({ onTalk }: { onTalk?: () => void }) {
  const [met, setMet] = useState(false)

  return (
    <button
      type="button"
      className="elli"
      onClick={() => {
        setMet(true)
        onTalk?.()
      }}
      aria-label={met ? 'Elli, the desk companion' : 'Elli has something to say'}
    >
      <Sprite name="elli/idle" className="elli__sprite" />
      <span
        className={`elli__badge${met ? ' elli__badge--seen' : ''}`}
        aria-hidden="true"
      >
        {met ? '?' : '!'}
      </span>
    </button>
  )
}
