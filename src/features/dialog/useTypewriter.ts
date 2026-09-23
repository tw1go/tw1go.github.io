import { useCallback, useEffect, useRef, useState } from 'react'

/** Shortest time a finished line stays up before it starts erasing. */
const MIN_HOLD_MS = 600

interface TypeInOutOptions {
  /** Milliseconds per character while typing in. */
  speed?: number
  /** Milliseconds per character while erasing — usually quicker. */
  eraseSpeed?: number
  /** Wait before the first character, so typing follows the entrance. */
  startDelay?: number
  /**
   * How long the line should ideally stay up, measured from mount. The
   * erase never starts before the line has finished typing plus a short
   * hold, so a long line simply runs past this.
   */
  holdMs?: number
  onErased?: () => void
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Types `text` in one character at a time, holds, then takes it back out
 * the same way.
 *
 * The erase is scheduled from a single fixed time rather than chained off
 * the typing interval: computing it as max(typing end + hold, holdMs)
 * guarantees typing has finished first, so the two never run at once and
 * there is no race to guard against.
 */
export function useTypeInOut(
  text: string,
  {
    speed = 38,
    eraseSpeed = 20,
    startDelay = 0,
    holdMs = 0,
    onErased,
  }: TypeInOutOptions = {},
): string {
  const reduced = prefersReducedMotion()
  const [typed, setTyped] = useState('')
  const [typingFor, setTypingFor] = useState(text)

  // Rewind when the line changes. Done during render rather than in an
  // effect so there is no frame showing the previous line's characters.
  if (typingFor !== text) {
    setTypingFor(text)
    setTyped('')
  }

  // Kept in a ref so a caller passing an inline arrow doesn't restart the
  // whole sequence on every render.
  const onErasedRef = useRef(onErased)
  useEffect(() => {
    onErasedRef.current = onErased
  }, [onErased])

  useEffect(() => {
    const timers: number[] = []
    const eraseAt = Math.max(
      startDelay + text.length * speed + MIN_HOLD_MS,
      holdMs,
    )

    if (reduced) {
      // The whole line is returned below without any state, so there is
      // nothing to reveal — just hold it, then report it as finished.
      timers.push(window.setTimeout(() => onErasedRef.current?.(), eraseAt))
      return () => timers.forEach(window.clearTimeout)
    }

    let index = 0
    let typing: number | undefined
    let erasing: number | undefined

    timers.push(
      window.setTimeout(() => {
        typing = window.setInterval(() => {
          index += 1
          setTyped(text.slice(0, index))
          if (index >= text.length && typing !== undefined) {
            window.clearInterval(typing)
          }
        }, speed)
      }, startDelay),
    )

    timers.push(
      window.setTimeout(() => {
        erasing = window.setInterval(() => {
          index -= 1
          setTyped(text.slice(0, Math.max(0, index)))
          if (index <= 0) {
            if (erasing !== undefined) window.clearInterval(erasing)
            onErasedRef.current?.()
          }
        }, eraseSpeed)
      }, eraseAt),
    )

    return () => {
      timers.forEach(window.clearTimeout)
      if (typing !== undefined) window.clearInterval(typing)
      if (erasing !== undefined) window.clearInterval(erasing)
    }
  }, [text, speed, eraseSpeed, startDelay, holdMs, reduced])

  // Reduced motion gets the whole line at once, no reveal and no erase.
  return reduced ? text : typed
}

interface TypeInOptions {
  /** Milliseconds per character. */
  speed?: number
  /** Wait before the first character, so typing follows the entrance. */
  startDelay?: number
}

export interface TypeIn {
  typed: string
  /** True once the whole line is on screen. */
  done: boolean
  /** Finish immediately — the usual "click to skip the crawl". */
  skip: () => void
}

/**
 * Types `text` in and leaves it there.
 *
 * Unlike `useTypeInOut` there is no hold and no erase: the caller decides
 * when the line goes away. `skip` exists because making someone wait out
 * a crawl they have already read is the most irritating thing a dialog
 * box can do.
 */
export function useTypeIn(
  text: string,
  { speed = 30, startDelay = 0 }: TypeInOptions = {},
): TypeIn {
  const reduced = prefersReducedMotion()
  const [typed, setTyped] = useState('')
  const [typingFor, setTypingFor] = useState(text)
  // Held so `skip` can stop the run in flight without the effect
  // depending on it and restarting the whole crawl.
  const timers = useRef<{ start?: number; tick?: number }>({})

  // Rewind when the line changes. Done during render rather than in an
  // effect so there is no frame showing the previous line's characters.
  if (typingFor !== text) {
    setTypingFor(text)
    setTyped('')
  }

  useEffect(() => {
    if (reduced) return
    const handles = timers.current
    let index = 0

    handles.start = window.setTimeout(() => {
      handles.tick = window.setInterval(() => {
        index += 1
        setTyped(text.slice(0, index))
        if (index >= text.length && handles.tick !== undefined) {
          window.clearInterval(handles.tick)
        }
      }, speed)
    }, startDelay)

    return () => {
      if (handles.start !== undefined) window.clearTimeout(handles.start)
      if (handles.tick !== undefined) window.clearInterval(handles.tick)
    }
  }, [text, speed, startDelay, reduced])

  const skip = useCallback(() => {
    const handles = timers.current
    if (handles.start !== undefined) window.clearTimeout(handles.start)
    if (handles.tick !== undefined) window.clearInterval(handles.tick)
    setTyped(text)
  }, [text])

  // Reduced motion gets the whole line at once, with no state involved.
  const shown = reduced ? text : typed
  return { typed: shown, done: shown.length >= text.length, skip }
}
