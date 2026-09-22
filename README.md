# twigo

A single pixel-art hero screen: one character at a desk in a dark room,
animating on its own. No scrolling, no nav.

Vite + React + TypeScript. Node **≥ 22.12** is required (Vite 8's bundler
ships a platform binary that npm silently skips below that); `.nvmrc` pins it.

```bash
nvm use          # 22.23.2
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Spotify "now playing"

The strip at the bottom of the room shows what's actually playing on the
account, live.

### Why there is a server at all

The site is static (GitHub Pages), but a static site **cannot** do this on
its own. Spotify's refresh token never expires, so shipping it in the
bundle would hand permanent read access to the account to anyone who opens
devtools. Spotify's PKCE flow avoids the client secret but authenticates
*the visitor*, so every guest would see their own music instead.

So one small function holds the credentials and returns a sanitised blob —
title, artist, art URL, progress. No tokens ever cross to the browser.

```
tw1go.github.io            static site, GitHub Pages
        │  fetch(VITE_NOW_PLAYING_URL)
        ▼
<project>.vercel.app/api/now-playing    holds the secrets
        ▼
accounts.spotify.com  →  api.spotify.com
```

`api/now-playing.ts` is a Web-standard `Request -> Response` handler, so
the same function body backs both Vercel's edge runtime and the local dev
middleware in `vite.config.ts`. There is no second implementation to drift.

### Setup

1. **Register the app** at <https://developer.spotify.com/dashboard> and add
   `http://127.0.0.1:8888/callback` as a redirect URI.
2. **Copy `.env.example` to `.env.local`** and fill in the client ID and secret.
3. **Mint a refresh token** — a one-time browser round trip:
   ```bash
   npm run spotify:auth
   ```
   Paste the printed `SPOTIFY_REFRESH_TOKEN` into `.env.local`. `npm run dev`
   now serves real data at `/api/now-playing`.
4. **Deploy the function to Vercel.** Set `SPOTIFY_CLIENT_ID`,
   `SPOTIFY_CLIENT_SECRET` and `SPOTIFY_REFRESH_TOKEN` under Project
   Settings → Environment Variables.
5. **Tell the Pages build where the function is.** In the GitHub repo,
   Settings → Secrets and variables → Actions → *Variables*, add
   `VITE_NOW_PLAYING_URL` = `https://<project>.vercel.app/api/now-playing`.
   It is a repo *variable*, not a secret — it is baked into the public
   bundle, which is fine.
6. **Turn on Pages**: Settings → Pages → Source = *GitHub Actions*.

Only `user-read-currently-playing` is requested. Adding a scope means
re-running step 3.

### Behaviour

- Polls every 15s, and not at all while the tab is hidden; a hidden tab that
  becomes visible refetches immediately.
- Progress advances locally between polls so the bar moves smoothly.
- Paused counts as *not playing* — the strip only ever claims live playback.
  Ads and empty responses read as offline too.
- Any failure (endpoint down, bad credentials, rate limit) degrades to
  "Nothing playing". The function never reports *why*, so a misconfigured
  secret can't announce itself.
- Responses are edge-cached for 10s, so a burst of visitors is one Spotify
  call rather than hundreds.
- CORS is restricted to `tw1go.github.io` and the local dev ports; other
  origins get no `Access-Control-Allow-Origin` header back.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to Pages on every push
to `master`. `tw1go.github.io` is a GitHub *user* site, so it serves from the
domain root and Vite's `base` stays `/`.
