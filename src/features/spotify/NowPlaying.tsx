import { PixelArt } from './PixelArt'
import type { NowPlayingState } from './types'
import './now-playing.css'

/**
 * Bottom-of-room readout for whatever twigo is listening to.
 * Drop `<NowPlaying />` from App.tsx to take it off the scene.
 */
export function NowPlaying({ state }: { state: NowPlayingState }) {
  const playing = state.status === 'playing'

  return (
    <div
      className={`now-playing${playing ? ' now-playing--live' : ''}`}
      // The strip rewrites itself mid-track, so announce changes politely
      // rather than interrupting whatever a screen reader is saying.
      aria-live="polite"
    >
      {state.status === 'playing' && (
        /* 24 art pixels blown up to 72 on screen: a whole-number 3x, so
           every block lands on the same grid as the room. */
        <PixelArt
          src={state.track.albumArtUrl}
          alt={`${state.track.album} cover art`}
          resolution={24}
        />
      )}

      <div className="now-playing__details">
        {state.status === 'playing' ? (
          <>
            <span className="now-playing__equalizer" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>

            <a
              className="now-playing__title"
              href={state.track.trackUrl}
              target="_blank"
              rel="noreferrer"
            >
              {state.track.title}
            </a>
            <span className="now-playing__artist">{state.track.artist}</span>
          </>
        ) : (
          <span className="now-playing__empty">
            {state.status === 'loading'
              ? 'Connecting…'
              : 'twigo is not listening on any track right now'}
          </span>
        )}
      </div>

      {state.status === 'playing' && (
        <span
          className="now-playing__progress"
          aria-hidden="true"
          style={
            {
              '--np-progress': `${Math.round(
                Math.min(100, (state.track.progressMs / state.track.durationMs) * 100),
              )}%`,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  )
}
