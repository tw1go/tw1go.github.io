#!/usr/bin/env node
/**
 * One-time helper: turns your Spotify login into a refresh token.
 *
 * Run it once on your own machine, paste the result into Vercel, and never
 * think about it again — refresh tokens don't expire. Nothing it prints
 * should ever be committed or sent to the browser.
 *
 *   node scripts/spotify-auth.mjs
 *
 * Needs SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, read from .env.local
 * or the environment, and this exact redirect URI registered in your app
 * at https://developer.spotify.com/dashboard:
 *
 *   http://127.0.0.1:8888/callback
 */
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const PORT = 8888
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`
const SCOPE = 'user-read-currently-playing'

/** Minimal .env parser — avoids a dependency for a script run once. */
function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const at = line.indexOf('=')
          return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')]
        }),
    )
  } catch {
    return {}
  }
}

const fileEnv = readEnvFile('.env.local')
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || fileEnv.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || fileEnv.SPOTIFY_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    '\n  Missing credentials.\n\n' +
      '  Create an app at https://developer.spotify.com/dashboard, add\n' +
      `  ${REDIRECT_URI} as a redirect URI, then put its ID and secret in\n` +
      '  .env.local as SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.\n',
  )
  process.exit(1)
}

// Guards against a stray request to the callback port being treated as
// the real authorisation response.
const state = randomBytes(16).toString('hex')

const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    state,
  })

async function exchange(code) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const params = [...url.searchParams.keys()]

  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')

  // Only a request actually carrying Spotify's answer counts. A bare visit
  // to /callback, a favicon fetch or any other probe must be ignored rather
  // than treated as a failed authorisation — otherwise a stray request
  // tears the server down before the real redirect arrives.
  if (url.pathname !== '/callback' || (!code && !error)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Waiting for the Spotify redirect.')
    console.log(
      `  ignored: ${req.method} ${url.pathname}` +
        `${params.length ? ` (params: ${params.join(', ')})` : ' (no query parameters)'}` +
        '\n  -> still listening. This was not the Spotify redirect.',
    )
    return
  }

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end(`Spotify said: ${error}`)
    console.error(
      `\n  Spotify refused: ${error}\n\n` +
        '  If this is redirect_uri_mismatch, the dashboard entry must be\n' +
        `  exactly ${REDIRECT_URI} — added with the Add button and saved.\n`,
    )
    server.close()
    process.exitCode = 1
    return
  }

  if (url.searchParams.get('state') !== state) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end('State mismatch — start again with a fresh run.')
    console.error('\n  State mismatch: this response belongs to a different run.\n')
    server.close()
    process.exitCode = 1
    return
  }

  try {
    const tokens = await exchange(code)
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Done. Refresh token printed in your terminal — you can close this tab.')

    console.log(
      '\n  Refresh token (treat it like a password):\n\n' +
        `    SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}\n\n` +
        '  Add it, plus the client ID and secret, to:\n' +
        '    - Vercel  -> Project Settings -> Environment Variables\n' +
        '    - .env.local here, for local dev\n',
    )
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Token exchange failed. Check the terminal.')
    console.error(`\n  Token exchange failed: ${err.message}\n`)
    process.exitCode = 1
  } finally {
    server.close()
  }
})

// Don't sit open forever if the tab is never approved.
const giveUp = setTimeout(
  () => {
    console.error('\n  Timed out after 5 minutes with no redirect from Spotify.\n')
    server.close()
    process.exitCode = 1
  },
  5 * 60 * 1000,
)
giveUp.unref()

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n  Port ${PORT} is already in use — an earlier run may still be holding it.\n` +
        `  Free it with:  lsof -ti tcp:${PORT} | xargs kill\n`,
    )
  } else {
    console.error(`\n  Server error: ${err.message}\n`)
  }
  process.exitCode = 1
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Open this in your browser and approve:\n\n    ${authUrl}\n`)
})
