import { useCallback, useEffect, useState } from 'react'
import { Sprite } from '../../components/Sprite'
import type { SpriteName } from '../../sprites/manifest'
import { useTypeIn } from './useTypewriter'
import './interaction-box.css'

/** Kept in sync with the interaction-out duration in the CSS. */
const OUT_MS = 220

interface InteractionBoxProps {
  /** Whose line this is — shown on the tag. */
  speaker: string
  text: string
  /**
   * Sprite to perch on the panel's top-right corner. Optional and taken
   * by name rather than hard-coded, so the box stays usable for whoever
   * is talking.
   */
  portrait?: SpriteName
  onClose: () => void
}

/**
 * The full-width box along the bottom of the room, for when someone in
 * the scene is actually talking to you.
 *
 * Distinct from DialogBubble, which is an ambient thought above the
 * character's head that types itself back out and leaves. This one is
 * addressed to the viewer and waits: it stays until dismissed, and the
 * whole panel is the button, so a click anywhere either finishes the
 * crawl or closes it — the convention every game dialog box uses.
 */
export function InteractionBox({
  speaker,
  text,
  portrait,
  onClose,
}: InteractionBoxProps) {
  const { typed, done, skip } = useTypeIn(text, { speed: 26, startDelay: 140 })
  const [closing, setClosing] = useState(false)

  // Starts the exit rather than unmounting on the spot, so the panel has
  // time to slide out. Setting it twice is harmless: React bails out of
  // a re-render when the value is unchanged.
  const dismiss = useCallback(() => setClosing(true), [])

  // Unmount is on a timer rather than an animationend listener: a missed
  // event would strand the panel on screen with nothing to close it.
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
    <button
      type="button"
      className={`interaction${portrait ? ' interaction--portrait' : ''}`}
      data-closing={closing || undefined}
      onClick={done ? dismiss : skip}
      aria-label={done ? `Close what ${speaker} said` : `Finish what ${speaker} is saying`}
    >
      {portrait && (
        /* Decorative: the speaker is already named on the tag, so this
           would only repeat it to a screen reader. */
        <span className="interaction__portrait" aria-hidden="true">
          <Sprite name={portrait} />
        </span>
      )}

      <span className="interaction__name">{speaker}</span>

      {/* Announced once it settles rather than on every character. */}
      <span className="interaction__text" role="status">
        {typed}
        {!done && <i className="interaction__caret" />}
      </span>

      {done && <span className="interaction__more" aria-hidden="true" />}
    </button>
  )
}
