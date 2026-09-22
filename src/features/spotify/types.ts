/**
 * Shape the UI expects from the Spotify integration.
 *
 * Kept deliberately narrow and provider-agnostic so the panel can be
 * wired to the Web API's `/v1/me/player/currently-playing` response
 * (or a serverless proxy in front of it) without touching components.
 */
export interface NowPlayingTrack {
  title: string
  artist: string
  album: string
  albumArtUrl: string
  trackUrl: string
  /** Playback position and length, in milliseconds. */
  progressMs: number
  durationMs: number
}

export type NowPlayingState =
  | { status: 'loading' }
  | { status: 'offline' }
  | { status: 'playing'; track: NowPlayingTrack }
