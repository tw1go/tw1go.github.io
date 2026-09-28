import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite } from './components/Sprite'
import { WallWindow } from './components/WallWindow'
import { Elli } from './features/companion/Elli'
import { Lulu, type LuluControls } from './features/companion/Lulu'
import { Wonwuu, type WonwuuControls } from './features/wonwuu/Wonwuu'
import { Pittuki } from './features/pittuki/Pittuki'
import { PittukiReveal } from './features/pittuki/PittukiReveal'
import { Croakyangs } from './features/croakyangs/Croakyangs'
import { CroakNotes } from './features/croakyangs/CroakNotes'
import { SerenadeReveal } from './features/croakyangs/SerenadeReveal'
import { useSinging } from './features/croakyangs/useSinging'
import { WindowSky } from './features/sky/WindowSky'
import { rayFor, roomLight, useSky } from './features/sky/sky'
import { useLightning } from './features/sky/useLightning'
import { WonwuuReveal } from './features/wonwuu/WonwuuReveal'
import { JordsFork } from './features/jords-fork/JordsFork'
import { ForkReveal } from './features/jords-fork/ForkReveal'
import type { Track } from './features/wonwuu/track'
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
import { useSceneScale } from './hooks/useSceneScale'
import { RotatePrompt } from './features/rotate/RotatePrompt'
import { GameTag } from './features/discord/GameTag'
import { useDiscordGame } from './features/discord/presence'
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
  const sceneScale = useSceneScale()
  // What twigo is playing on Discord right now, if anything.
  const game = useDiscordGame()
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

  // Wonwuu's reveal, shown when he is clicked. It draws its own trade.
  const [ratCaughtOpen, setRatCaughtOpen] = useState(false)
  const ratCaught = useCallback(() => {
    // His reveal covers the room, so Elli's panel is closed rather than
    // left waiting underneath it.
    setElliSays(null)
    setRatCaughtOpen(true)
  }, [])
  const closeRat = useCallback(() => setRatCaughtOpen(false), [])

  // Jord's Fork's prophecy, shown when the fork is clicked.
  const [forkOpen, setForkOpen] = useState(false)
  const forkCaught = useCallback(() => {
    setElliSays(null)
    setForkOpen(true)
  }, [])
  const closeFork = useCallback(() => setForkOpen(false), [])

  // Dr. Pittuki's session, shown when the lizard is clicked.
  const [lizardOpen, setLizardOpen] = useState(false)
  const lizardCaught = useCallback(() => {
    setElliSays(null)
    setLizardOpen(true)
  }, [])
  const closeLizard = useCallback(() => setLizardOpen(false), [])

  // Croakyangs lives in the right-hand window. One song clock for both
  // the frog behind the drapes and the notes rising over them.
  const singing = useSinging()
  const [serenade, setSerenade] = useState(false)
  const frogFound = useCallback(() => {
    setElliSays(null)
    setSerenade(true)
  }, [])
  const closeSerenade = useCallback(() => setSerenade(false), [])

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

  // Wonwuu only ever sees Lulu through her published track, and the
  // room starts the chase through her controls. While she is off seeing
  // him out, he stays away.
  const luluTrack = useRef<Track | null>(null)
  const luluControls = useRef<LuluControls | null>(null)
  const [luluOut, setLuluOut] = useState(false)
  const ratSpotted = useCallback((direction: 1 | -1) => {
    setLuluOut(true)
    luluControls.current?.chase(direction)
  }, [])
  const luluBack = useCallback(() => setLuluOut(false), [])

  const luluMoved = useCallback((track: Track) => {
    luluTrack.current = track
  }, [])

  // Pittuki watches Wonwuu from the wall; when he catches him passing
  // below, the room sets Wonwuu glaring back.
  const ratTrack = useRef<Track | null>(null)
  const ratControls = useRef<WonwuuControls | null>(null)
  const ratMoved = useCallback((track: Track | null) => {
    ratTrack.current = track
  }, [])
  const lizardGlared = useCallback(() => ratControls.current?.glare(), [])

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
  // What is outside: the visitor's time of day and the weather there.
  const sky = useSky()
  const { period, weather } = sky
  useLightning(weather === 'storm')

  // 0 dark, 1 half lit, 2 full daylight — but only as much as the sky
  // outside has to give. At night opening the curtains lets in nothing;
  // a rainy morning lifts the room one step, not two.
  const open = (curtains.left % 2) + (curtains.right % 2)
  const light = roomLight(open, sky)

  // Set on <html> rather than on the scene: the room's colour lives on
  // the page background, which no descendant can reach. The ray's colour
  // rides along, for the shafts of light through the windows.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.light = String(light)
    root.dataset.curtains = String(open)
    const ray = rayFor({ period, weather })
    root.style.setProperty('--sky-ray', ray.rgb)
    root.style.setProperty('--sky-ray-a', String(ray.strength))
  }, [light, open, period, weather])

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
    <main
      className="scene"
      style={{ '--scene-scale': sceneScale } as React.CSSProperties}
    >
      {/* Behind the glow, so the monitor spill washes across them the way
          it does the rest of the wall. */}
      <div className="scene__wall" aria-hidden="true">
        {/* First on the wall, so the aircon and the windows paint over
            him: that is what he hides behind. */}
        <Pittuki wonwuu={ratTrack} onGlare={lizardGlared} onCaught={lizardCaught} />
        <Sprite name="props/aircon" className="scene__aircon" />


        <WallWindow
          side="left"
          toggles={curtains.left}
          onToggle={openLeft}
          sky={<WindowSky sky={sky} side="left" />}
        >
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
        <WallWindow
          side="right"
          toggles={curtains.right}
          onToggle={openRight}
          overlay={<CroakNotes singing={singing} />}
          sky={<WindowSky sky={sky} side="right" />}
        >
          {/* Heard before he is seen: the notes come over the curtain,
              but he only shows once it is drawn back. */}
          <Croakyangs singing={singing} onFound={frogFound} />
        </WallWindow>

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
        <GameTag game={game} />
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
        <Lulu
          onPet={talkAboutLulu}
          onMove={luluMoved}
          controls={luluControls}
          onBack={luluBack}
        />
        <Wonwuu
          lulu={luluTrack}
          resting={luluOut}
          onSpotted={ratSpotted}
          onCaught={ratCaught}
          onMove={ratMoved}
          controls={ratControls}
        />
      </div>

      {/* Jord's Fork: a summoning circle on the floor, in front of the
          animals, with the flaming trident it brings up. Same box as the
          stage, so it keeps its spot in the room. */}
      <div className="scene__ritual">
        <JordsFork onCaught={forkCaught} />
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
        resting={fairy || pumpkin || showcase || ratCaughtOpen || forkOpen || lizardOpen || serenade}
        onPass={fairyPassed}
        onCaught={caughtFairy}
      />
      {fairy && <FairyReveal onClose={closeFairy} />}
      {ratCaughtOpen && <WonwuuReveal onClose={closeRat} />}
      {forkOpen && <ForkReveal onClose={closeFork} />}
      {lizardOpen && <PittukiReveal onClose={closeLizard} />}
      {serenade && <SerenadeReveal onClose={closeSerenade} />}

      <RotatePrompt />

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
