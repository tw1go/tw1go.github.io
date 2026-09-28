import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Sprite } from '../../components/Sprite'
import { CIRCLE_STEPS, RitualCircle } from './RitualCircle'
import { JORDS_FORK_SUMMON_EVENT } from './summon'
import './jords-fork.css'

/** How often the dice are rolled, and the odds on each roll. */
const ROLL_MS = 10_000
const CHANCE = 0.5

/** How long the fork stays out once it has risen. */
const HOVER_MIN_MS = 8000
const HOVER_MAX_MS = 15_000

/* Phase lengths. Each is kept in sync with its animation in the CSS. */
const KINDLE_MS = 2000
const RISE_MS = 750
const SINK_MS = 700
const FADE_MS = 1000

type Phase = 'kindle' | 'rise' | 'hover' | 'sink' | 'fade'

const NEXT: Record<Phase, Phase | null> = {
  kindle: 'rise',
  rise: 'hover',
  hover: 'sink',
  sink: 'fade',
  fade: null,
}

const holdFor = (phase: Phase) =>
  phase === 'kindle'
    ? KINDLE_MS
    : phase === 'rise'
      ? RISE_MS
      : phase === 'hover'
        ? HOVER_MIN_MS + Math.random() * (HOVER_MAX_MS - HOVER_MIN_MS)
        : phase === 'sink'
          ? SINK_MS
          : FADE_MS

/** Embers drifting up off the circle, as offsets across it. */
const EMBERS = [-0.36, -0.2, -0.08, 0.05, 0.14, 0.27, 0.38, -0.28, 0.21, 0]

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Jord's Fork.
 *
 * Every ten seconds there is a 50% chance that cryptic symbols start
 * glowing on the floor at the right of the room, one after another,
 * until the circle is complete — and a flaming trident rises out of it,
 * floating in the air above, for eight to fifteen seconds before
 * it sinks back in and the circle goes dark.
 *
 * Purely CSS once a phase is set: the component only steps the phases.
 */
interface JordsForkProps {
  /** Someone clicked the fork. It sinks back, and the room shows its
      reveal. */
  onCaught?: () => void
}

export function JordsFork({ onCaught }: JordsForkProps) {
  const [ritual, setRitual] = useState<{ id: number; phase: Phase } | null>(null)

  const begin = useCallback(() => {
    setRitual((current) => current ?? { id: Date.now(), phase: 'kindle' })
  }, [])

  useEffect(() => {
    window.addEventListener(JORDS_FORK_SUMMON_EVENT, begin)
    return () => window.removeEventListener(JORDS_FORK_SUMMON_EVENT, begin)
  }, [begin])

  useEffect(() => {
    if (ritual || reducedMotion()) return
    const timer = window.setInterval(() => {
      if (!document.hidden && Math.random() < CHANCE) begin()
    }, ROLL_MS)
    return () => window.clearInterval(timer)
  }, [ritual, begin])

  useEffect(() => {
    if (!ritual) return
    const timer = window.setTimeout(() => {
      setRitual((prev) => {
        if (!prev) return prev
        const next = NEXT[prev.phase]
        return next ? { ...prev, phase: next } : null
      })
    }, holdFor(ritual.phase))
    return () => window.clearTimeout(timer)
  }, [ritual])

  // Caught: it goes back down into the circle at once rather than seeing
  // out the hover, and the circle closes behind it.
  const catchIt = useCallback(() => {
    setRitual((prev) =>
      prev && (prev.phase === 'rise' || prev.phase === 'hover')
        ? { ...prev, phase: 'sink' }
        : prev,
    )
    onCaught?.()
  }, [onCaught])

  if (!ritual) return null
  const { phase } = ritual
  const forkOut = phase === 'rise' || phase === 'hover' || phase === 'sink'

  return (
    <div
      key={ritual.id}
      className="jords-fork"
      data-phase={phase}
      style={{ '--kindle-step': `${KINDLE_MS / CIRCLE_STEPS}ms`,
          '--fade-step': `${FADE_MS / CIRCLE_STEPS}ms`,
         } as CSSProperties}
    >
      {/* The light the circle throws on the floor around it. */}
      <span className="jords-fork__pool" />

      <RitualCircle className="jords-fork__circle" />

      {phase === 'rise' && <span className="jords-fork__pillar" />}

      {forkOut && (
        <>
          {EMBERS.map((x, i) => (
            <span
              key={i}
              className="jords-fork__ember"
              style={{ '--e-x': x, '--e-i': i } as CSSProperties}
            />
          ))}
          {/* Mounted with the fork, in the same commit as the bob, so their
              clocks start together. */}
          <span className="jords-fork__shadow" />
          {/* Clipped at the circle's centre line, so the fork comes up
              *through* the circle rather than sliding up in front of it.
              Inside, three wrappers with one transform each: rising out
              of the circle (and back in), the bob, and the drift. */}
          <div className="jords-fork__portal">
            <div className="jords-fork__lift">
              <div className="jords-fork__bob">
                <div className="jords-fork__drift">
                  <button
                    type="button"
                    className="jords-fork__catch"
                    onClick={catchIt}
                    // Only while it is up. Sinking, it is already leaving.
                    disabled={phase === 'sink'}
                    aria-label="Jord's Fork"
                  >
                    <Sprite name="jords-fork/burn" className="jords-fork__art" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
