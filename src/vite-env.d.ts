/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the Spotify proxy. Empty in dev (the middleware serves it). */
  readonly VITE_NOW_PLAYING_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
