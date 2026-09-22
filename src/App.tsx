import { useCallback, useState } from 'react'
import { Sprite } from './components/Sprite'
import { DialogBubble } from './features/dialog/DialogBubble'
import { MusicNotes } from './features/spotify/MusicNotes'
import { NowPlaying } from './features/spotify/NowPlaying'
import { useNowPlaying } from './features/spotify/useNowPlaying'
import { useCharacterAnimation } from './hooks/useCharacterAnimation'
import { playDuration } from './sprites/manifest'
import './App.css'

interface Dialog {
  id: number
  text: string
  hold: number
}

function App() {
  const play = useCharacterAnimation()
  // Lifted out of NowPlaying so the strip and the floating notes share a
  // single poll — calling the hook in both would double the request rate.
  const nowPlaying = useNowPlaying()

  // The bubble outlives the play that started it — it keeps erasing after
  // the character has gone back to idle — so it can't just be derived from
  // `play`. It is latched here and clears itself once it has finished.
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [latchedPlay, setLatchedPlay] = useState(play.id)

  // Latched during render rather than in an effect, so the bubble mounts
  // in the same commit as the sprite it belongs to.
  if (latchedPlay !== play.id) {
    setLatchedPlay(play.id)
    if (play.line) {
      setDialog({ id: play.id, text: play.line, hold: playDuration(play.name) })
    }
  }

  const clearDialog = useCallback(() => setDialog(null), [])

  return (
    <main className="scene">
      {/* Light spill from the monitors — the only thing on in the room. */}
      <div className="scene__glow" aria-hidden="true" />
      <div className="scene__floor" aria-hidden="true" />

      <div className="scene__stage">
        {/* `key` remounts on every switch so the CSS animation restarts
            from frame 0 instead of retiming mid-cycle. */}
        <Sprite
          key={play.id}
          name={play.name}
          iterations={play.loop ? 'infinite' : 1}
        />

      </div>

      {/* Its own layer, sharing the sprite frame's box. Inside the stage
          the bubble was stuck in that element's stacking context, so the
          sign and the now-playing strip painted over it. */}
      <div className="scene__dialog">
        {dialog && (
          <DialogBubble
            key={dialog.id}
            text={dialog.text}
            hold={dialog.hold}
            onDone={clearDialog}
          />
        )}
      </div>

      {/* Its own layer for the same reason as the dialog: inside the stage
          the notes would be trapped in that stacking context. */}
      {nowPlaying.status === 'playing' && (
        <div className="scene__notes">
          <MusicNotes />
        </div>
      )}

      <p className="scene__wordmark">
        <span className="scene__wordmark-flicker">t</span>wigo
      </p>

      <NowPlaying state={nowPlaying} />
    </main>
  )
}

export default App
