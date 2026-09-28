import type { CSSProperties } from 'react'
import { NOTE_SRC } from './note'
import './croakyangs.css'

/* Offsets across the window's top, drift, and stagger. */
const NOTES = [
  { x: 0.42, drift: -1, delay: 0 },
  { x: 0.58, drift: 1, delay: 700 },
  { x: 0.5, drift: -0.5, delay: 1400 },
  { x: 0.64, drift: 0.8, delay: 2100 },
]

/**
 * Notes floating up out of the right-hand window while Croakyangs sings.
 * Laid over the drapes, so they show even with the curtain shut — the
 * frog you can hear but not see, as on the group calls.
 */
export function CroakNotes({ singing }: { singing: boolean }) {
  return (
    <span className="croak-notes" data-singing={singing || undefined} aria-hidden="true">
      {NOTES.map((note) => (
        <span
          key={note.delay}
          className="croak-notes__note"
          style={
            {
              backgroundImage: NOTE_SRC,
              '--n-x': note.x,
              '--n-drift': note.drift,
              animationDelay: `${note.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}
