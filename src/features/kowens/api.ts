/**
 * twigo-bot's room API: the Kowen leaderboard, and the roll for finding a
 * Kowen when a character is clicked.
 *
 * The roll happens on the bot, never here — a find decided in the browser
 * could be faked from devtools. All the site ever gets back is a one-time
 * code, which only turns into a Kowen when its finder runs /claim in
 * Discord, proving who they are.
 */

const BASE = (import.meta.env.VITE_BOT_API_URL ?? '').replace(/\/$/, '')

/** Off entirely until the bot's API has an address. */
export const BOT_API_ENABLED = BASE !== ''

export interface LeaderboardRow {
  rank: number
  name: string
  avatar: string
  kowens: number
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[] | null> {
  if (!BOT_API_ENABLED) return null
  try {
    const res = await fetch(`${BASE}/leaderboard`)
    if (!res.ok) return null
    const data = (await res.json()) as { rows?: LeaderboardRow[] }
    return Array.isArray(data.rows) ? data.rows : null
  } catch {
    return null
  }
}

export interface Find {
  code: string
  /** When the code stops working (ms epoch). */
  expires: number
  reward: number
  /** Which character it was found on, for the panel's wording. */
  character: string
  /** A console preview, not a real code: it cannot be claimed. */
  preview?: boolean
}

/**
 * Asks the bot whether clicking `character` turned up a Kowen.
 * `fairyAround` — Fairy Cha is in the room, which raises the odds.
 */
export async function rollFind(character: string, fairyAround = false): Promise<Find | null> {
  if (!BOT_API_ENABLED) return null
  try {
    const res = await fetch(`${BASE}/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, fairy: fairyAround }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { found?: boolean; code?: string; expires?: number; reward?: number }
    if (!data.found || !data.code || !data.expires) return null
    return { code: data.code, expires: data.expires, reward: data.reward ?? 1, character }
  } catch {
    return null
  }
}

/* ── Console previews ──────────────────────────────────────────────
   For trying the Kowen UI without the bot, or without waiting on luck.
   Neither touches the bot: the code shown is marked as a preview and
   cannot be claimed. */

export const PREVIEW_FIND_EVENT = 'kowens:preview-find'
export const PREVIEW_BOARD_EVENT = 'kowens:preview-board'

/** Shows the "You found a Kowen!" panel: `previewKowenFind('lulu')`. */
export function previewKowenFind(character = 'fairy-cha'): void {
  window.dispatchEvent(new CustomEvent<string>(PREVIEW_FIND_EVENT, { detail: character }))
}

/** Hangs the leaderboard on the wall with made-up names, if it is not
    already there: `previewKowenBoard()`. */
export function previewKowenBoard(): void {
  window.dispatchEvent(new Event(PREVIEW_BOARD_EVENT))
}

export const PREVIEW_ROWS: LeaderboardRow[] = [
  { rank: 1, name: 'twigo', avatar: '', kowens: 142 },
  { rank: 2, name: 'Wonwuu', avatar: '', kowens: 87 },
  { rank: 3, name: 'Jord', avatar: '', kowens: 64 },
  { rank: 4, name: 'Croakyangs', avatar: '', kowens: 39 },
  { rank: 5, name: 'Pittuki', avatar: '', kowens: 12 },
]

declare global {
  interface Window {
    previewKowenFind?: typeof previewKowenFind
    previewKowenBoard?: typeof previewKowenBoard
  }
}

if (typeof window !== 'undefined') {
  Object.assign(window, { previewKowenFind, previewKowenBoard })
}
