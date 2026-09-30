import { useCallback, useEffect, useState } from 'react'
import kowenCoin from '../../assets/kowen.png'
import type { Find } from './api'
import './kowen-found.css'

/* How each resident is named on the panel. Keys match the bot's /claim
   announcement, so both say the same thing. */
const WHO: Record<string, string> = {
  elli: 'Elli',
  lulu: 'Lulu',
  wonwuu: 'Wonwuu',
  pittuki: 'Dr. Pittuki',
  croakyangs: 'Croakyangs',
  'jords-fork': "Jord's Fork",
  pumpkin: 'Biiko Kalabasa',
  'fairy-cha': 'Fairy Cha',
}

/* What the character was doing with it. */
const HOW: Record<string, string> = {
  elli: 'was keeping one in her charging port',
  lulu: 'knocked one off the desk',
  wonwuu: 'dropped one while running off',
  pittuki: 'left one on the wall as a tip',
  croakyangs: 'was paid one for that song, and passed it on',
  'jords-fork': 'foretold this exact Kowen',
  pumpkin: 'was sitting on one',
  'fairy-cha': 'sprinkled one down with the dust',
}

/* Round the coin, as offsets into its box. Staggered so they glint one
   after another rather than all together. */
const SPARKLES = [
  { x: '-22%', y: '14%', delay: 0, size: 1.2 },
  { x: '104%', y: '-4%', delay: 350, size: 1.5 },
  { x: '112%', y: '74%', delay: 700, size: 1 },
  { x: '-14%', y: '86%', delay: 1050, size: 1.3 },
  { x: '50%', y: '-30%', delay: 1400, size: 0.9 },
]

function remaining(expires: number, now: number): string {
  const s = Math.max(0, Math.round((expires - now) / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * "You found a Kowen!" — the code, how to claim it, and a copy button.
 * Above every reveal: a find can turn up in the middle of one.
 */
export function KowenFound({ find, onClose }: { find: Find; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const dismiss = useCallback(() => setClosing(true), [])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(onClose, 260)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const command = `/claim ${find.code}`
  const copy = () => {
    void navigator.clipboard?.writeText(command).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  const expired = now >= find.expires
  const who = WHO[find.character] ?? 'Someone'
  const how = HOW[find.character] ?? 'had one lying around'

  return (
    <div className="kowen-found" data-closing={closing || undefined} role="dialog" aria-label="You found a Kowen">
      {/* Held still, with sparkles glinting round it. */}
      <span className="kowen-found__treasure" aria-hidden="true">
        <img className="kowen-found__coin" src={kowenCoin} alt="" />
        {SPARKLES.map((s, i) => (
          <i
            key={i}
            className="kowen-found__sparkle"
            style={{ left: s.x, top: s.y, animationDelay: `${s.delay}ms`, '--sp-size': s.size } as React.CSSProperties}
          />
        ))}
      </span>
      <p className="kowen-found__title">You found a Kowen!</p>
      <p className="kowen-found__how">
        {who} {how}.
      </p>

      <p className="kowen-found__step">Claim it in the Mikazuki server:</p>
      <button type="button" className="kowen-found__code" onClick={copy} disabled={expired}>
        <code>{command}</code>
        <span className="kowen-found__copy">{copied ? 'Copied!' : 'Copy'}</span>
      </button>
      <p className="kowen-found__timer">
        {find.preview
          ? 'Preview only — this code cannot be claimed.'
          : expired
            ? 'This code has expired.'
            : `Expires in ${remaining(find.expires, now)} · works once`}
      </p>

      <button type="button" className="kowen-found__close" onClick={dismiss}>
        {expired ? 'Close' : 'Got it'}
      </button>
    </div>
  )
}
