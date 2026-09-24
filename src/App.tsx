import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite } from './components/Sprite'
import { WallWindow } from './components/WallWindow'
import { Elli } from './features/companion/Elli'
import { Lulu } from './features/companion/Lulu'
import { DialogBubble } from './features/dialog/DialogBubble'
import { InteractionBox } from './features/dialog/InteractionBox'
import {
  ELLI_INTRO,
  LULU_INTRO,
  LULU_PESTER,
  pickLine,
} from './features/dialog/lines'
import { MusicNotes } from './features/spotify/MusicNotes'
import { NowPlaying } from './features/spotify/NowPlaying'
import { ArtistShowcase } from './features/showcase/ArtistShowcase'
import { PumpkinReveal } from './features/pumpkin/PumpkinReveal'
import { FairyCha } from './features/fairy/FairyCha'
import { FairyReveal } from './features/fairy/FairyReveal'
import { LoveHearts } from './features/fairy/LoveHearts'
import { useNowPlaying } from './features/spotify/useNowPlaying'
import { useCharacterAnimation } from './hooks/useCharacterAnimation'
import { playDuration } from './sprites/manifest'
import './App.css'

interface Dialog {
  id: number
  text: string
  hold: number
}

/** Clicks closer together than this count as pestering the cat. */
const PESTER_MS = 1500

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

  // Elli's line lives here rather than inside her, so clicking her again
  // while the box is open swaps the line — the id remounts the box and
  // restarts the crawl.
  const [elliSays, setElliSays] = useState<{ id: number; text: string } | null>(null)
  // Counts clicks for the life of the page, so it doubles as the remount
  // key and as the test for "has she introduced herself yet". Deriving
  // that from `elliSays` would not work: the box is cleared on close, so
  // the next click would look like the first one all over again.
  const [talks, setTalks] = useState(0)

  const talkToElli = useCallback(() => {
    setTalks((count) => count + 1)
    setElliSays({
      id: talks + 1,
      // She introduces herself once, then falls back to small talk.
      text: talks === 0 ? ELLI_INTRO : (pickLine('elli/idle') ?? ''),
    })
  }, [talks])
  const closeElli = useCallback(() => setElliSays(null), [])

  const [pumpkin, setPumpkin] = useState(false)
  const foundPumpkin = useCallback(() => setPumpkin(true), [])
  const closePumpkin = useCallback(() => setPumpkin(false), [])

  // The jukebox's record rack.
  const [showcase, setShowcase] = useState(false)
  const openShowcase = useCallback(() => setShowcase(true), [])
  const closeShowcase = useCallback(() => setShowcase(false), [])

  // Fairy Cha. She flies relative to the character, so she is handed the
  // stage to measure. The hearts are keyed by a count so a second pass
  // over him restarts them rather than being swallowed by the first.
  const stageRef = useRef<HTMLDivElement>(null)
  const [fairy, setFairy] = useState(false)
  const [smitten, setSmitten] = useState(0)
  const caughtFairy = useCallback(() => setFairy(true), [])
  const closeFairy = useCallback(() => setFairy(false), [])
  const fairyPassed = useCallback(() => setSmitten((count) => count + 1), [])
  const heartsDone = useCallback(() => setSmitten(0), [])

  // Lulu's counters are refs rather than state: the streak has to be read
  // and written inside a single handler, and a setState would not have
  // applied in time to choose the line.
  const luluSeen = useRef(0)
  const luluStreak = useRef(0)
  const luluLastAt = useRef(0)

  // One click count per window. Odd means its curtain is open, and the
  // count doubles as the sprite key so each toggle restarts the
  // animation rather than retiming the one already running.
  const [curtains, setCurtains] = useState({ left: 0, right: 0 })
  const toggleCurtain = useCallback((side: 'left' | 'right') => {
    setCurtains((prev) => ({ ...prev, [side]: prev[side] + 1 }))
  }, [])
  const openLeft = useCallback(() => toggleCurtain('left'), [toggleCurtain])
  const openRight = useCallback(() => toggleCurtain('right'), [toggleCurtain])
  // 0 dark, 1 half lit, 2 full daylight.
  const light = (curtains.left % 2) + (curtains.right % 2)

  // Set on <html> rather than on the scene: the room's colour lives on
  // the page background, which no descendant can reach.
  useEffect(() => {
    document.documentElement.dataset.light = String(light)
  }, [light])

  const talkAboutLulu = useCallback((resting: boolean) => {
    const now = Date.now()
    luluStreak.current =
      now - luluLastAt.current < PESTER_MS ? luluStreak.current + 1 : 0
    luluLastAt.current = now

    const streak = luluStreak.current
    const text =
      streak > 0
        ? // Escalates while the clicking keeps up, then holds on the last one.
          LULU_PESTER[Math.min(streak - 1, LULU_PESTER.length - 1)]
        : luluSeen.current === 0
          ? // Introducing her wins even if she is fast asleep.
            LULU_INTRO
          : (pickLine(resting ? 'lulu-resting' : 'lulu') ?? '')
    luluSeen.current += 1

    setElliSays((prev) => ({ id: (prev?.id ?? 0) + 1, text }))
  }, [])

  return (
    <main className="scene">
      {/* Behind the glow, so the monitor spill washes across them the way
          it does the rest of the wall. */}
      <div className="scene__wall" aria-hidden="true">
        <Sprite name="props/aircon" className="scene__aircon" />


        <WallWindow side="left" toggles={curtains.left} onToggle={openLeft}>
          {/* Hidden behind the shut curtain; a sliver shows against the
              glass once the drapes are drawn back, and only then does it
              take a click. */}
          <button
            type="button"
            className="wall-window__secret"
            onClick={foundPumpkin}
            aria-label="A golden pumpkin"
          >
            <Sprite name="props/pumpkin" />
          </button>
        </WallWindow>
        <WallWindow side="right" toggles={curtains.right} onToggle={openRight} />

      </div>

      {/* Light spill from the monitors — the only thing on in the room. */}
      <div className="scene__glow" aria-hidden="true" />
      <div className="scene__floor" aria-hidden="true" />

      <div className="scene__stage" ref={stageRef}>
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

      {/* Furniture. Above the stage, so the desk does not paint over it
          the way it does the wall. The jukebox reacts to playback, so the
          layer carries the state. */}
      <div
        className="scene__props"
        data-playing={nowPlaying.status === 'playing' || undefined}
      >
        <Sprite name="props/ring-light" className="scene__ring-light" />
        <button
          type="button"
          className="scene__jukebox"
          onClick={openShowcase}
          aria-label="Show the artists twigo listens to"
        >
          <Sprite name="props/music-box" className="scene__music-box" />
        </button>
      </div>

      {/* Elli sits on the desk in her own layer, for the same reason as
          the dialog — inside the stage she would be trapped in that
          element's stacking context. */}
      <div className="scene__companion">
        <Elli onTalk={talkToElli} />
      </div>

      {/* Lulu roams between the floor and the desk, so she needs the
          whole frame rather than the companion layer's fixed spot. */}
      <div className="scene__pets">
        <Lulu onPet={talkAboutLulu} />
      </div>

      {/* Over his head, below the dialog, in the same frame-shaped box as
          the notes so they sit on him at every scale. */}
      {smitten > 0 && (
        <div className="scene__hearts">
          <LoveHearts key={smitten} onDone={heartsDone} />
        </div>
      )}

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

      {showcase && <ArtistShowcase onClose={closeShowcase} />}

      {pumpkin && <PumpkinReveal onClose={closePumpkin} />}

      <FairyCha
        anchor={stageRef}
        resting={fairy || pumpkin || showcase}
        onPass={fairyPassed}
        onCaught={caughtFairy}
      />
      {fairy && <FairyReveal onClose={closeFairy} />}

      {elliSays && (
        <InteractionBox
          key={elliSays.id}
          speaker="Elli"
          portrait="elli/portrait"
          text={elliSays.text}
          onClose={closeElli}
        />
      )}
    </main>
  )
}

export default App
