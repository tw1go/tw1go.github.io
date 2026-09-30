/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the Spotify proxy. Empty in dev (the middleware serves it). */
  readonly VITE_NOW_PLAYING_URL?: string
  /** HTTPS base URL of twigo-bot's room API (leaderboard, Kowen finds).
      Empty turns both features off. */
  readonly VITE_BOT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
