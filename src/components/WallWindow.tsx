import { useEffect, useState } from 'react'
import { Sprite } from './Sprite'
import { playDuration, type SpriteName } from '../sprites/manifest'
import '../styles/wall-window.css'

/**
 * How long a shut curtain hangs still before a draught catches it. Each
 * window rolls its own interval, which is the whole reason the pair never
 * stir in step.
 */
const GUST_MIN_MS = 2_200
const GUST_MAX_MS = 8_500

type Phase = 'shut' | 'opening' | 'opened' | 'gust' | 'closing'

const SHEET: Record<Phase, SpriteName> = {
  shut: 'curtain/closed',
  opening: 'curtain/open',
  opened: 'curtain/opened',
  gust: 'curtain/blown',
  closing: 'curtain/close',
}

interface WallWindowProps {
  side: 'left' | 'right'
  /** Click count. Odd means the curtain is open. */
  toggles: number
  onToggle: () => void
  /**
   * Anything to tuck between the glass and the drapes — visible only in
   * the gap once the curtain is drawn back, and covered completely when
   * it is shut.
   */
  children?: React.ReactNode
}

/**
 * A window on the back wall, with a curtain that draws back when clicked.
 *
 * The frame and glass are elements rather than a sprite so they sit on the
 * room's pixel grid at every breakpoint: the two panes are grid cells and
 * the frame shows through the gap between them, which draws the sash bar.
 *
 * The curtain is deliberately larger than the window and centred on it, so
 * the shut sheet covers the glass completely — the open animation only
 * draws the drapes aside, and anything wider would still be showing.
 */
export function WallWindow({ side, toggles, onToggle, children }: WallWindowProps) {
  const open = toggles % 2 === 1
  const [phase, setPhase] = useState<Phase>('shut')
  const [latched, setLatched] = useState(toggles)
  // Bumped on every phase change so the sprite remounts and the animation
  // restarts rather than retiming mid-cycle.
  const [take, setTake] = useState(0)

  // Latched during render rather than in an effect, so the curtain starts
  // moving in the same commit as the click that asked for it.
  if (latched !== toggles) {
    setLatched(toggles)
    setPhase(toggles % 2 === 1 ? 'opening' : 'closing')
    setTake((n) => n + 1)
  }

  useEffect(() => {
    const advance = (next: Phase, after: number) =>
      window.setTimeout(() => {
        setPhase(next)
        setTake((n) => n + 1)
      }, after)

    let timer: number
    switch (phase) {
      case 'opening':
        timer = advance('opened', playDuration('curtain/open'))
        break
      case 'closing':
        timer = advance('shut', playDuration('curtain/close'))
        break
      case 'gust':
        timer = advance('shut', playDuration('curtain/blown'))
        break
      case 'shut':
        // Wind arrives when it arrives — not on every cycle, and never at
        // the same moment as the other window.
        timer = advance('gust', GUST_MIN_MS + Math.random() * (GUST_MAX_MS - GUST_MIN_MS))
        break
      default:
        return
    }
    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    /* A container rather than a button: whatever is hidden in the window
       is itself clickable, and a button cannot contain another one. */
    /* `data-phase` is the curtain's actual state, not just whether it has
       been asked to open. Anything hidden in the window keys off that:
       the drapes take well over a second to draw back, and a billowing
       shut curtain briefly uncovers the corners, so `data-open` alone
       would let the secret flash into view. */
    <div
      className={`wall-window wall-window--${side}`}
      data-open={open || undefined}
      data-phase={phase}
    >
      <button
        type="button"
        className="wall-window__toggle"
        onClick={onToggle}
        aria-label={open ? `Close the ${side} curtain` : `Open the ${side} curtain`}
        aria-pressed={open}
      >
        {/* First, so the frame and the drapes both paint over it. The beam
            is a clipped shape with a squared-off head; hiding that head
            behind the window is what makes the light read as coming out
            of the opening rather than as a shape laid on top of it. */}
        <span className="wall-window__ray" aria-hidden="true" />

        <span className="wall-window__frame">
          <span className="wall-window__pane" />
          <span className="wall-window__pane" />
        </span>
      </button>

      {/* Above the toggle so it takes its own clicks, below the curtain
          so the drapes still cover it. */}
      {children}

      <Sprite
        key={take}
        name={SHEET[phase]}
        className="wall-window__curtain"
        iterations={phase === 'shut' || phase === 'opened' ? 'infinite' : 1}
      />
    </div>
  )
}
