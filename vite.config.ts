import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import handler from './api/now-playing.ts'

/**
 * Serves the Vercel function locally during `npm run dev`.
 *
 * GitHub Pages can't run it and Vite's dev server doesn't know about
 * `api/`, so without this the strip would only ever work in production.
 * It calls the exact same handler the edge runtime does — the function is
 * a Web-standard Request -> Response, so this only has to translate
 * between Node's streams and that.
 */
function spotifyDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'twigo:spotify-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/now-playing', (req, res) => {
        // The handler reads secrets from process.env; in dev they live in
        // .env.local, which Vite loads but does not export to the process.
        for (const key of ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN']) {
          if (env[key]) process.env[key] = env[key]
        }

        const request = new Request('http://localhost/api/now-playing', {
          method: req.method ?? 'GET',
          headers: { origin: req.headers.origin ?? 'http://localhost:5173' },
        })

        handler(request)
          .then(async (response) => {
            response.headers.forEach((value, key) => res.setHeader(key, value))
            res.statusCode = response.status
            res.end(response.body ? Buffer.from(await response.arrayBuffer()) : null)
          })
          .catch(() => {
            res.statusCode = 500
            res.end()
          })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // tw1go.github.io is a GitHub *user* site, so it serves from the domain
  // root. A project page would need base: '/<repo>/' here instead.
  base: '/',
  plugins: [react(), spotifyDevApi(loadEnv(mode, process.cwd(), ''))],
}))
