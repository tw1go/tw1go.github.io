import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import kowenCoin from '../../assets/kowen.png'
import { PREVIEW_BOARD_EVENT, PREVIEW_ROWS, fetchLeaderboard, type LeaderboardRow } from './api'
import './kowen-board.css'

/** How often the board refreshes while the tab is open. */
const REFRESH_MS = 60_000

/** The Kowen leaderboard, polled from twigo-bot. */
function useLeaderboard(): LeaderboardRow[] | null {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      if (document.hidden) return
      void fetchLeaderboard().then((next) => {
        if (!cancelled && next) setRows(next)
      })
    }
    load()
    // Console preview: made-up rows, only while the real board is absent.
    const preview = () => setRows((current) => current ?? PREVIEW_ROWS)
    window.addEventListener(PREVIEW_BOARD_EVENT, preview)
    const timer = window.setInterval(load, REFRESH_MS)
    document.addEventListener('visibilitychange', load)
    return () => {
      cancelled = true
      window.removeEventListener(PREVIEW_BOARD_EVENT, preview)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', load)
    }
  }, [])

  return rows
}

const MEDAL = ['🥇', '🥈', '🥉']

/**
 * A little leaderboard pinned to the wall above the jukebox: the top three
 * in tiny pixel type, and the whole top ten when clicked. Stays off the
 * wall entirely until the bot has answered once, so a room whose bot is
 * unreachable just looks like a room.
 */
export function KowenBoard() {
  const rows = useLeaderboard()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const close = useCallback(() => setClosing(true), [])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [closing])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!rows) return null

  return (
    <>
      <button
        type="button"
        className="kowen-board"
        onClick={() => setOpen(true)}
        aria-label="Kowen leaderboard"
      >
        <span className="kowen-board__title">
          <img className="kowen-board__coin" src={kowenCoin} alt="" />
          KOWENS
        </span>
        {rows.slice(0, 3).map((row) => (
          <span key={row.rank} className="kowen-board__row">
            <span className="kowen-board__name">
              {row.rank}. {row.name}
            </span>
            <span className="kowen-board__score">{row.kowens}</span>
          </span>
        ))}
      </button>

      {/* Portalled to <body>: the board hangs on the wall layer, whose
          transform makes it the containing block for anything fixed inside
          it, and its stacking context would keep the panel under the desk. */}
      {open &&
        createPortal(
        <div
          className="kowen-panel"
          data-closing={closing || undefined}
          onClick={close}
          role="presentation"
        >
          <div
            className="kowen-panel__card"
            role="dialog"
            aria-label="Kowen leaderboard"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="kowen-panel__title">🏆 Richest in Mikazuki</p>
            <ol className="kowen-panel__list">
              {rows.map((row) => (
                <li key={row.rank} className="kowen-panel__row">
                  <span className="kowen-panel__rank">{MEDAL[row.rank - 1] ?? `${row.rank}.`}</span>
                  {row.avatar && <img className="kowen-panel__avatar" src={row.avatar} alt="" />}
                  <span className="kowen-panel__name">{row.name}</span>
                  <span className="kowen-panel__kowens">
                    <img className="kowen-panel__coin" src={kowenCoin} alt="" />
                    {row.kowens} <small>{row.kowens === 1 ? 'Kowen' : 'Kowens'}</small>
                  </span>
                </li>
              ))}
            </ol>
            <p className="kowen-panel__hint">
              Earn them in the Mikazuki server — or find one by poking around this room.
            </p>
          </div>
        </div>,
          document.body,
        )}
    </>
  )
}
