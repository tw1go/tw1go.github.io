import { useState } from 'react'
import './rotate-prompt.css'

/* A phone, one character per art pixel: o outline, b body, s screen,
   l the little lime light of the room on it, k the speaker slot. */
const PHONE = [
  '.ooooooooo.',
  'obbbbkbbbbo',
  'obsssssssbo',
  'obsssssssbo',
  'obsssssssbo',
  'obsssssssbo',
  'obssslsssbo',
  'obsslllssbo',
  'obsssssssbo',
  'obsssssssbo',
  'obsssssssbo',
  'obsssssssbo',
  'obbbbbbbbbo',
  'obbbbobbbbo',
  'obbbbbbbbbo',
  '.ooooooooo.',
]

const INK: Record<string, string> = {
  o: '#e5e7eb',
  b: '#111827',
  s: '#7c2ae8',
  l: '#a3e635',
  k: '#374151',
}

const DISMISS_KEY = 'rotate-prompt:dismissed'

/* Remembered for the tab only, and never required: storage can be
   missing or throw, and then the prompt simply comes back next load. */
function wasDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * "Turn your phone sideways", for phones held upright.
 *
 * The room is a wide scene, and upright on a phone it shrinks to a strip
 * across the middle of the screen. This covers it with a pixel phone
 * that tips over onto its side and back — the gesture, shown rather
 * than described. Shown and hidden by CSS alone (portrait, phone-width),
 * so turning the phone makes it vanish on the spot; the button is for
 * anyone who would rather look anyway.
 */
export function RotatePrompt() {
  const [dismissed, setDismissed] = useState(wasDismissed)
  if (dismissed) return null

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* fine: it will only ask again next time */
    }
    setDismissed(true)
  }

  return (
    <div className="rotate-prompt" role="dialog" aria-label="Turn your phone sideways">
      <svg
        className="rotate-prompt__phone"
        viewBox={`0 0 ${PHONE[0].length} ${PHONE.length}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {PHONE.flatMap((row, y) =>
          [...row].flatMap((c, x) =>
            INK[c] ? [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={INK[c]} />] : [],
          ),
        )}
      </svg>

      <p className="rotate-prompt__title">Turn your phone sideways</p>
      <p className="rotate-prompt__body">twigo&rsquo;s room is built for landscape.</p>

      <button type="button" className="rotate-prompt__skip" onClick={dismiss}>
        Show me anyway
      </button>
    </div>
  )
}
