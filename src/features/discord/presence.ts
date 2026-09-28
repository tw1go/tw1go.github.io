import { useEffect, useState } from 'react'

/**
 * twigo's Discord user ID — the long number, not the username. Copy it
 * in Discord with Developer Mode on: right-click yourself, "Copy User
 * ID". Presence is only readable once that account has joined the
 * Lanyard server (discord.gg/lanyard). Left empty, nothing connects and
 * the tag stays hidden.
 */
export const DISCORD_USER_ID = '734942189984940063'

/**
 * Live Discord presence, via Lanyard (github.com/Phineas/lanyard): a
 * free, keyless service that republishes a user's presence over a
 * WebSocket, and allows browser connections from any site.
 *
 * Only the game is kept. Discord activity type 0 is "Playing"; the
 * others — Spotify, custom status, streaming, watching — are left alone,
 * since Spotify already has its own strip in the room.
 */

const SOCKET = 'wss://api.lanyard.rest/socket'

export interface Game {
  name: string
  /** When the session started, if the game reports it (ms epoch). */
  since?: number
  /** Extra lines some games send: "Ranked", "In a match". */
  details?: string
}

interface Activity {
  type: number
  name: string
  details?: string
  state?: string
  timestamps?: { start?: number }
}

function gameFrom(activities: Activity[] | undefined): Game | null {
  const playing = activities?.find((activity) => activity.type === 0)
  if (!playing) return null
  return {
    name: playing.name,
    since: playing.timestamps?.start,
    details: [playing.details, playing.state].filter(Boolean).join(' · ') || undefined,
  }
}

export const GAME_EVENT = 'discord:game'

/**
 * Pretends a game is running, for trying the tag without launching one:
 * `setGame('Valorant')`. `setGame(null)` clears it; `setGame()` goes back
 * to the real presence.
 */
export function setGame(name?: string | null): void {
  window.dispatchEvent(new CustomEvent<string | null | undefined>(GAME_EVENT, { detail: name }))
}

declare global {
  interface Window {
    setGame?: typeof setGame
  }
}

if (typeof window !== 'undefined') {
  window.setGame = setGame
}

/**
 * The game twigo is playing right now, or null.
 *
 * Lanyard's socket protocol: the server says hello (op 1) with a
 * heartbeat interval; we subscribe (op 2) and heartbeat (op 3); it then
 * sends the full state (INIT_STATE) and every change after
 * (PRESENCE_UPDATE). If the socket drops it is reopened with a backoff,
 * so a sleeping laptop or a network blip does not leave it dead.
 */
export function useDiscordGame(userId: string = DISCORD_USER_ID): Game | null {
  const [live, setLive] = useState<Game | null>(null)
  // undefined: no override. null: forced off. Game: forced on.
  const [override, setOverride] = useState<Game | null | undefined>(undefined)

  useEffect(() => {
    const onSet = (event: Event) => {
      const name = (event as CustomEvent<string | null | undefined>).detail
      setOverride(name === undefined ? undefined : name === null ? null : { name, since: Date.now() })
    }
    window.addEventListener(GAME_EVENT, onSet)
    return () => window.removeEventListener(GAME_EVENT, onSet)
  }, [])

  useEffect(() => {
    if (!userId) return
    let socket: WebSocket | null = null
    let heartbeat: number | undefined
    let retry: number | undefined
    let attempts = 0
    let closed = false

    const connect = () => {
      socket = new WebSocket(SOCKET)

      socket.onmessage = (message) => {
        const packet = JSON.parse(message.data as string) as {
          op: number
          t?: string
          d?: { heartbeat_interval?: number; activities?: Activity[] }
        }
        if (packet.op === 1) {
          attempts = 0
          socket?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }))
          window.clearInterval(heartbeat)
          heartbeat = window.setInterval(
            () => socket?.send(JSON.stringify({ op: 3 })),
            packet.d?.heartbeat_interval ?? 30_000,
          )
        } else if (packet.op === 0 && (packet.t === 'INIT_STATE' || packet.t === 'PRESENCE_UPDATE')) {
          const next = gameFrom(packet.d?.activities)
          // Kept as the same object while nothing visible has changed, so
          // the tag does not re-render on every presence tick.
          setLive((prev) =>
            prev?.name === next?.name && prev?.details === next?.details && prev?.since === next?.since
              ? prev
              : next,
          )
        }
      }

      socket.onclose = () => {
        window.clearInterval(heartbeat)
        if (closed) return
        attempts += 1
        retry = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts))
      }
    }

    connect()
    return () => {
      closed = true
      window.clearInterval(heartbeat)
      window.clearTimeout(retry)
      socket?.close()
    }
  }, [userId])

  return override === undefined ? live : override
}
