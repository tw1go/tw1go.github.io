import type { CSSProperties } from 'react'
import { Sprite } from '../../components/Sprite'
import { sprites } from '../../sprites/manifest'
import './fairy-cha.css'

interface FairySpriteProps {
  /**
   * `flight` loops only the level-flight frames, for crossing the room.
   * `hover` plays the whole sheet, which rises into an upright hover
   * every cycle — right for when she is holding still in the reveal,
   * and what made her look like she kept stopping mid-flight.
   */
  mode: 'flight' | 'hover'
  className?: string
}

/**
 * Her animation, held steady.
 *
 * The sheet was drawn with her head drifting forward over the cycle and
 * snapping back on the wrap, which reads as a hitch once a loop. The
 * wrapper replays a measured counter-offset in lockstep with the frames
 * (same duration, same step count, mounted in the same commit so both
 * clocks start together), which pins her head in place and leaves the
 * flight path as the only thing moving her.
 */
export function FairySprite({ mode, className }: FairySpriteProps) {
  const name = mode === 'flight' ? 'fairy/cha-flight' : 'fairy/cha'
  return (
    <div
      className={`fairy-steady fairy-steady--${mode}`}
      style={{ '--fairy-cycle': `${sprites[name].duration}ms` } as CSSProperties}
    >
      <Sprite name={name} className={className} />
    </div>
  )
}
