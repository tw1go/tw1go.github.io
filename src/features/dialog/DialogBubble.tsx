import { useEffect, useState } from 'react'
import { useTypeInOut } from './useTypewriter'
import './dialog-bubble.css'

/** Kept in sync with the bubble-in / bubble-out durations in the CSS. */
const IN_MS = 200
const OUT_MS = 180

interface DialogBubbleProps {
  text: string
  /**
   * How long the line should ideally stay up, in milliseconds — normally
   * the length of the animation it belongs to. It is a target, not a
   * deadline: a long line finishes typing and erasing in its own time,
   * which may run past the animation.
   */
  hold: number
  /** Milliseconds per character. */
  speed?: number
  /** Called once the line has erased and the box has popped out. */
  onDone?: () => void
}

export function DialogBubble({
  text,
  hold,
  speed = 38,
  onDone,
}: DialogBubbleProps) {
  const [closing, setClosing] = useState(false)

  const typed = useTypeInOut(text, {
    speed,
    startDelay: IN_MS,
    holdMs: hold,
    onErased: () => setClosing(true),
  })

  // Unmount is on a timer rather than an animationend listener: the exit
  // animates opacity/transform, and a missed event would strand the box.
  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => onDone?.(), OUT_MS)
    return () => window.clearTimeout(timer)
  }, [closing, onDone])

  return (
    // The label carries the whole line so it is announced once, rather
    // than re-announcing on every character as the text node changes.
    <div
      className="dialog-bubble"
      data-closing={closing || undefined}
      role="status"
      aria-label={text}
    >
      <span className="dialog-bubble__text" aria-hidden="true">
        {/* Holds the final size from the first frame, so the box neither
            grows while typing nor collapses while erasing. It has to
            include the caret: the typed layer below renders text *plus*
            caret, so measuring the text alone left the box one caret too
            narrow and the caret wrapped onto its own line. */}
        <span className="dialog-bubble__ghost">
          {text}
          <i className="dialog-bubble__caret" />
        </span>
        <span className="dialog-bubble__typed">
          {typed}
          {!closing && <i className="dialog-bubble__caret" />}
        </span>
      </span>
    </div>
  )
}
