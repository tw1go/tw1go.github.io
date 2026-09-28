import { useEffect, useState } from 'react'
import type { Game } from './presence'
import './game-tag.css'

/** 1h 12m, or 8m, or "just started". */
function elapsed(since: number, now: number): string {
  const minutes = Math.floor((now - since) / 60_000)
  if (minutes < 1) return 'just started'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

/**
 * "Currently playing — [game]", hung over the PC tower on the desk while
 * twigo is in a game on Discord.
 *
 * Kept mounted for a moment after the game ends so it can pop back out
 * rather than vanishing; the `game` it last showed is latched for that.
 */
export function GameTag({ game }: { game: Game | null }) {
  const [shown, setShown] = useState<Game | null>(game)
  const [leaving, setLeaving] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Latched during render, so a new game swaps in on the same commit.
  if (game && game !== shown) {
    setShown(game)
    setLeaving(false)
  } else if (!game && shown && !leaving) {
    setLeaving(true)
  }

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => setShown(null), 220)
    return () => window.clearTimeout(timer)
  }, [leaving])

  // The play time ticks over once a minute; checked every 20s so it is
  // never far behind.
  useEffect(() => {
    if (!shown?.since) return
    const timer = window.setInterval(() => setNow(Date.now()), 20_000)
    return () => window.clearInterval(timer)
  }, [shown?.since])

  if (!shown) return null

  return (
    <div className="game-tag" data-leaving={leaving || undefined} role="status">
      <span className="game-tag__label">
        <i className="game-tag__dot" aria-hidden="true" />
        Currently playing
      </span>
      <span className="game-tag__name">{shown.name}</span>
      {(shown.details || shown.since) && (
        <span className="game-tag__meta">
          {[shown.details, shown.since ? elapsed(shown.since, now) : null].filter(Boolean).join(' · ')}
        </span>
      )}
    </div>
  )
}
