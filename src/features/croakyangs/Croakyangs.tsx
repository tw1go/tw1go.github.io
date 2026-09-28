import { useEffect, useState } from 'react'
import { Sprite } from '../../components/Sprite'
import { playDuration, type SpriteName } from '../../sprites/manifest'
import './croakyangs.css'

type Phase = 'still' | 'start' | 'sing' | 'stop'

const SPRITE: Record<Phase, SpriteName> = {
  still: 'croakyangs/still',
  start: 'croakyangs/start',
  sing: 'croakyangs/sing',
  stop: 'croakyangs/stop',
}

interface CroakyangsProps {
  singing: boolean
  /** Someone found him and clicked. */
  onFound: () => void
}

/**
 * Croakyangs, on the sill of the right-hand window.
 *
 * Tucked between the glass and the drapes, so he only shows once the
 * curtain is drawn back — until then the only sign of him is the notes
 * coming over the top of it. Each song is drawn breath, the singing
 * loop for as long as it lasts, and settling back; he never cuts
 * straight from one to the other.
 */
export function Croakyangs({ singing, onFound }: CroakyangsProps) {
  const [phase, setPhase] = useState<Phase>('still')
  const [latched, setLatched] = useState(singing)

  // Latched during render, so the first frame of the song lands in the
  // same commit as the note stream starting.
  if (latched !== singing) {
    setLatched(singing)
    setPhase(singing ? 'start' : 'stop')
  }

  useEffect(() => {
    if (phase !== 'start' && phase !== 'stop') return
    const timer = window.setTimeout(
      () => setPhase(phase === 'start' ? 'sing' : 'still'),
      playDuration(SPRITE[phase]),
    )
    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    <button
      type="button"
      className="wall-window__secret croakyangs"
      onClick={onFound}
      aria-label="Croakyangs the singing frog"
    >
      {/* The crop lives on this inner box rather than the button, so the
          button's enlarged tap area (::before) is not clipped with him. */}
      <span className="croakyangs__crop">
        <Sprite key={phase} name={SPRITE[phase]} />
      </span>
    </button>
  )
}
