/**
 * Spotify "now playing" proxy.
 *
 * This exists for exactly one reason: the refresh token and client secret
 * cannot be shipped to the browser. The site is static (GitHub Pages), so
 * this function is the only place in the system that is allowed to know
 * them. It hands the client a sanitised blob and nothing else — no tokens,
 * no scopes, no account identifiers.
 *
 * Runs on Vercel's edge runtime, which means a Web-standard
 * Request -> Response handler, so the same function body backs the Vite
 * dev middleware in vite.config.ts without an adapter.
 */
export const config = { runtime: 'edge' }

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const NOW_PLAYING_ENDPOINT =
  'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode'

/** Only these origins may read the response. */
const ALLOWED_ORIGINS = [
  'https://tw1go.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

interface SpotifyImage {
  url: string
  width: number | null
}

/**
 * An access token lasts an hour, so minting one per request would be three
 * round trips to Spotify for every visitor. Edge isolates are reused, so a
 * module-scope cache survives between invocations on the same instance;
 * a cold start just pays for one extra token call. The 60s safety margin
 * keeps us from using a token that expires mid-flight.
 */
let cachedToken: { value: string; expiresAt: number } | null = null

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    // The response varies by origin, so the CDN must not serve one
    // origin's cached copy (with its Allow-Origin header) to another.
    Vary: 'Origin',
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function json(body: unknown, origin: string | null, cacheSeconds: number): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // The browser polls anyway; the shared cache is what protects us
      // from Spotify's rate limit when several people load the page at once.
      'Cache-Control': `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=30`,
      ...corsHeaders(origin),
    },
  })
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now) return cachedToken.value

  // These must stay as literal `process.env.X` reads. The edge build
  // substitutes them statically at build time, so hoisting `process.env`
  // into a variable — or indexing it with a computed key — hands back an
  // empty object at runtime and every request reports offline.
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing SPOTIFY_CLIENT_ID / _CLIENT_SECRET / _REFRESH_TOKEN')
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    cachedToken = null
    throw new Error(`Token refresh failed: ${res.status}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  }
  return cachedToken.value
}

/** Smallest artwork Spotify offers — the UI paints it at 32px. */
function pickArt(images: SpotifyImage[] | undefined): string {
  if (!images?.length) return ''
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  return sorted.find((image) => (image.width ?? 0) >= 64)?.url ?? sorted[0].url
}

export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        ...corsHeaders(origin),
      },
    })
  }

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders(origin),
    })
  }

  try {
    const token = await getAccessToken()
    const res = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // 204 = nothing on any device. 202 = player is spinning up.
    if (res.status === 204 || res.status === 202) {
      return json({ status: 'offline' }, origin, 10)
    }

    if (res.status === 401) {
      // Token rejected despite our expiry maths — drop it so the next
      // request mints a fresh one rather than looping on a dead token.
      cachedToken = null
      return json({ status: 'offline' }, origin, 0)
    }

    if (!res.ok) return json({ status: 'offline' }, origin, 5)

    const payload = (await res.json()) as {
      is_playing: boolean
      progress_ms: number | null
      currently_playing_type?: string
      item: {
        name: string
        duration_ms: number
        external_urls?: { spotify?: string }
        artists?: { name: string }[]
        album?: { name: string; images: SpotifyImage[] }
        show?: { name: string; images: SpotifyImage[] }
      } | null
    }

    // Paused counts as not playing: the strip only ever claims live
    // playback. Ads and local files arrive with no usable item.
    if (!payload.is_playing || !payload.item || payload.currently_playing_type === 'ad') {
      return json({ status: 'offline' }, origin, 10)
    }

    const { item } = payload
    // A podcast episode carries `show` where a track carries `album`/`artists`.
    const artist = item.artists?.map((a) => a.name).join(', ') ?? item.show?.name ?? ''
    const album = item.album?.name ?? item.show?.name ?? ''
    const art = pickArt(item.album?.images ?? item.show?.images)

    return json(
      {
        status: 'playing',
        track: {
          title: item.name,
          artist,
          album,
          albumArtUrl: art,
          trackUrl: item.external_urls?.spotify ?? '',
          progressMs: payload.progress_ms ?? 0,
          durationMs: item.duration_ms,
        },
      },
      origin,
      10,
    )
  } catch {
    // Never leak the reason — a misconfigured secret must not announce
    // itself to the internet. The strip simply goes quiet.
    return json({ status: 'offline' }, origin, 0)
  }
}
