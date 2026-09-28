import curtainBlownSheet from '../assets/sprites/curtain/animation-window-blown.png'
import curtainOpenSheet from '../assets/sprites/curtain/animation-curtain-open.png'
import curtainClosedSheet from '../assets/sprites/curtain/curtain.png'
import elliIdleSheet from '../assets/sprites/elli/animation-idle-desk.png'
import fairyChaSheet from '../assets/sprites/fairy-cha.png'
import wonwuuSheet from '../assets/sprites/wonwuu/animation-wonwuu-pixel.png'
import wonwuuStillSheet from '../assets/sprites/wonwuu/static-wonwuu-pixel.png'
import wonwuuHiSheet from '../assets/sprites/wonwuu/animation-wonwuu.png'
import jordsForkSheet from '../assets/sprites/jords-fork/animation-jords-fork-pixel.png'
import jordsForkHiSheet from '../assets/sprites/jords-fork/animation-jords-fork.png'
import pittukiClimbSheet from '../assets/sprites/pittuki/animation-pittuki-climb-pixel.png'
import pittukiLookSheet from '../assets/sprites/pittuki/animation-pittuki-movement-pixel.png'
import pittukiClimbHiSheet from '../assets/sprites/pittuki/animation-pittuki-climb.png'
import pittukiLookHiSheet from '../assets/sprites/pittuki/animation-pittuki-movement.png'
import croakSheet from '../assets/sprites/croakyangs/animation-croakyangs-pixel.png'
import croakHiSheet from '../assets/sprites/croakyangs/animation-croakyangs.png'
import airconSheet from '../assets/sprites/aircon.png'
import pumpkinSheet from '../assets/sprites/golden-pumpkin.png'
import musicBoxSheet from '../assets/sprites/music-box.png'
import ringLightSheet from '../assets/sprites/streaming-ring-light.png'
import luluGroomSheet from '../assets/sprites/lulu/animation-grooming.png'
import luluJumpSheet from '../assets/sprites/lulu/animation-jump.png'
import luluSitSheet from '../assets/sprites/lulu/animation-sitting.png'
import luluSleepSheet from '../assets/sprites/lulu/animation-sleep.png'
import luluStandSheet from '../assets/sprites/lulu/animation-stand-still.png'
import luluWalkSheet from '../assets/sprites/lulu/animation-walk.png'
import elliPortraitSheet from '../assets/sprites/elli/animation-idle.png'
import drinkingSheet from '../assets/sprites/main-body/animation-drinking.png'
import idleSheet from '../assets/sprites/main-body/animation-idle.png'
import randomMovementSheet from '../assets/sprites/main-body/animation-random-movement.png'
import idleStaticSheet from '../assets/sprites/main-body/idle-static.png'

export interface SpriteDefinition {
  /** Resolved URL of the sprite sheet. */
  src: string
  /** Size of a single cell, in source pixels. */
  frameWidth: number
  frameHeight: number
  /** Cells per row in the sheet. */
  columns: number
  /**
   * Rows in the sheet. Only needed when the animation does not run to
   * the end of the sheet — the fallback, ceil(frames / columns), is the
   * rows the *animation* spans, which is not the same thing once
   * `firstFrame` is in play or the last rows are unused. Getting it
   * wrong mis-scales the background and the frames land off the image.
   */
  rows?: number
  /**
   * Frames that actually contain art. May be fewer than
   * columns * rows when the last row is partially filled.
   */
  frames: number
  /**
   * Index of the first cell to play, for sheets that hold more than one
   * animation. Defaults to 0.
   */
  firstFrame?: number
  /** Duration of a single pass through the frames, in milliseconds. */
  duration: number
  /** Defaults to looping forever. */
  iterations?: number
  /**
   * Play the frames forward then straight back down. For sheets that end
   * mid-motion this is what makes them loop cleanly — without it the last
   * frame cuts hard back to the first.
   */
  pingPong?: boolean
  /**
   * Play the frames backwards. Used to undo a one-way animation — a cat
   * lying down, played in reverse, is a cat getting up.
   */
  reverse?: boolean
  /** Describes the sprite for assistive tech. */
  label: string
}

/**
 * Every sheet under `assets/sprites` is registered here. Frame counts
 * were read off the sheets — `animation-idle` and `animation-random-movement`
 * are 3x3 grids with 8 used cells, `animation-drinking` is a 4x4 grid
 * with 14 used cells, and Elli's idle is a 4x3 grid with all 12 used.
 */
export const sprites = {
  'main-body/idle-static': {
    src: idleStaticSheet,
    frameWidth: 256,
    frameHeight: 256,
    columns: 1,
    frames: 1,
    duration: 0,
    label: 'twigo sitting at a desk',
  },
  'main-body/idle': {
    src: idleSheet,
    frameWidth: 256,
    frameHeight: 256,
    columns: 3,
    frames: 8,
    duration: 1150,
    label: 'twigo gaming at a desk',
  },
  'main-body/random-movement': {
    src: randomMovementSheet,
    frameWidth: 256,
    frameHeight: 256,
    columns: 3,
    frames: 8,
    duration: 1265,
    label: 'twigo shifting around in the gaming chair',
  },
  'main-body/drinking': {
    src: drinkingSheet,
    frameWidth: 256,
    frameHeight: 256,
    columns: 4,
    frames: 14,
    duration: 1610,
    // The sheet stops with the drink still raised, so it plays back down
    // to the seated pose rather than snapping.
    pingPong: true,
    label: 'twigo reaching for a drink',
  },
  /* Elli is scheduled by nothing — she simply idles for as long as she
     is on screen, so she is not listed in the character's ACTIONS.

     The desk sheet, used exactly as authored: 64px cells, art 50x55,
     drawn 1:1 like the room's own sheets. */
  'elli/idle': {
    src: elliIdleSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    frames: 12,
    duration: 1680,
    label: 'Elli, a companion bot, idling on the desk',
  },
  /* The same idle at its full authored size. Too fine-grained to stand
     in the room — that is what the desk sheet is for — but this is a UI
     portrait sitting on the dialog panel, not an object in the scene, so
     the detail is wanted here. 4x3 grid of 256px cells, art 179x249. */
  'elli/portrait': {
    src: elliPortraitSheet,
    frameWidth: 256,
    frameHeight: 256,
    columns: 4,
    frames: 12,
    duration: 1680,
    label: 'Elli, a companion bot',
  },
  /* Lulu the cat. Walk and jump are 3x3 grids with 8 used cells; the
     sleep sheet is a 4x4 of 16, and splits into two animations: frames
     0-8 lie down, 9-15 are the settled loop. Registering the loop
     separately is what lets her stay asleep for as long as we like
     instead of getting straight back up. */
  'lulu/stand': {
    src: luluStandSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 1,
    frames: 1,
    duration: 0,
    label: 'Lulu the cat, standing',
  },
  'lulu/groom': {
    src: luluGroomSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    frames: 16,
    duration: 1800,
    iterations: 1,
    label: 'Lulu the cat, grooming',
  },
  'lulu/walk': {
    src: luluWalkSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 3,
    frames: 8,
    duration: 640,
    label: 'Lulu the cat, walking',
  },
  'lulu/jump': {
    src: luluJumpSheet,
    frameWidth: 80,
    frameHeight: 80,
    columns: 3,
    frames: 8,
    duration: 700,
    iterations: 1,
    label: 'Lulu the cat, jumping',
  },
  /* Sitting splits the same way sleeping does: frames 0-7 lower her onto
     her haunches, and 8-15 are a seated tail-wag whose width oscillates
     between 38 and 47 pixels. Registering the wag separately lets her
     hold the pose for as long as a real cat would. */
  'lulu/sit': {
    src: luluSitSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    frames: 8,
    duration: 1440,
    iterations: 1,
    label: 'Lulu the cat, sitting down',
  },
  'lulu/sitting': {
    src: luluSitSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    frames: 8,
    firstFrame: 8,
    duration: 2600,
    label: 'Lulu the cat, sitting with her tail flicking',
  },
  'lulu/situp': {
    src: luluSitSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    frames: 8,
    duration: 1120,
    reverse: true,
    iterations: 1,
    label: 'Lulu the cat, getting up',
  },
  'lulu/sleep': {
    src: luluSleepSheet,
    frameWidth: 80,
    frameHeight: 80,
    columns: 4,
    rows: 4,
    frames: 9,
    duration: 1840,
    iterations: 1,
    label: 'Lulu the cat, settling down',
  },
  'lulu/sleeping': {
    src: luluSleepSheet,
    frameWidth: 80,
    frameHeight: 80,
    columns: 4,
    rows: 4,
    frames: 7,
    firstFrame: 9,
    duration: 3500,
    label: 'Lulu the cat, asleep',
  },
  /* The lie-down played backwards, which is a cat getting up. Saves
     needing an animation the sheet does not have. */
  'lulu/wake': {
    src: luluSleepSheet,
    frameWidth: 80,
    frameHeight: 80,
    columns: 4,
    rows: 4,
    frames: 9,
    duration: 1280,
    reverse: true,
    iterations: 1,
    label: 'Lulu the cat, getting up',
  },
  /* Curtains over the wall windows. Closed is a single frame; the open
     sheet draws them back to the sides over 12 cells and is played once,
     holding on the last frame, so the room opens up as it loads. */
  'curtain/closed': {
    src: curtainClosedSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 1,
    rows: 1,
    frames: 1,
    duration: 0,
    label: 'Closed curtain',
  },
  'curtain/open': {
    src: curtainOpenSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 3,
    frames: 12,
    duration: 1600,
    iterations: 1,
    label: 'Curtain drawn back',
  },
  /* The last cell of the open sheet, held. Going back to 'curtain/open'
     after a gust would replay the whole draw-back. */
  'curtain/opened': {
    src: curtainOpenSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 3,
    frames: 1,
    firstFrame: 11,
    duration: 0,
    label: 'Curtain held back',
  },
  /* A gust catching a shut curtain — the art stays full width throughout,
     so this belongs to the closed state, not the open one. */
  'curtain/blown': {
    src: curtainBlownSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 4,
    frames: 16,
    duration: 2200,
    iterations: 1,
    label: 'Curtain stirring in a draught',
  },
  /* The same sheet backwards, which is the curtain falling shut. */
  'curtain/close': {
    src: curtainOpenSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 3,
    frames: 12,
    duration: 1400,
    reverse: true,
    iterations: 1,
    label: 'Curtain drawn shut',
  },
  /* Fairy Cha: a 4x4 grid of 128px cells, all 16 used. The sheet is two
     poses in one loop — frames 4-13 are level flight, one full wing-beat
     from wings-down to wings-down, and 14-15 and 0-3 swing her upright
     into a hover and back. So it is registered twice.

     Her head drifts forward across the cycle and snaps back on the wrap,
     so wherever she is drawn she sits inside a `.fairy-steady` wrapper,
     which cancels that drift frame by frame. Its keyframes are measured
     off this sheet, one set per registration, and must share these
     durations. Both run at 100ms a frame. */
  'fairy/cha': {
    src: fairyChaSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 4,
    frames: 16,
    duration: 1600,
    label: 'Fairy Cha, hovering',
  },
  /* Level flight only, for crossing the room. Frame 13 and frame 4 both
     have her wings down, so the loop closes on the beat instead of
     cutting back to the hover. */
  'fairy/cha-flight': {
    src: fairyChaSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 4,
    frames: 10,
    firstFrame: 4,
    duration: 1000,
    label: 'Fairy Cha, flying',
  },
  /* Wonwuu the rat. The animated sheet is a 12-cell run cycle on a 4x3
     grid, drawn facing LEFT — the opposite of Lulu. Running and
     sneaking both play the whole cycle, at very different speeds; the
     pauses take a short slice of it so he twitches rather than
     sprinting on the spot.

     These are the -pixel sheets: the originals are drawn on 128px cells,
     far finer than the room, and shrinking them in CSS left him looking
     pasted in. They were redrawn on 28px cells by
     scripts/downsample-sheet.mjs, which puts him on Lulu's pixel grid.
     Feet land on row 23 in every cell. */
  'wonwuu/run': {
    src: wonwuuSheet,
    frameWidth: 28,
    frameHeight: 28,
    columns: 4,
    rows: 3,
    frames: 12,
    duration: 300,
    label: 'Wonwuu the rat, running',
  },
  /* The same full cycle as the run, at under a third of the pace: one
     careful stride at a time. Wonwuu.tsx derives his travel speed from
     both durations, so changing either keeps his feet planted. */
  'wonwuu/sneak': {
    src: wonwuuSheet,
    frameWidth: 28,
    frameHeight: 28,
    columns: 4,
    rows: 3,
    frames: 12,
    duration: 1100,
    label: 'Wonwuu the rat, sneaking',
  },
  /* Frames 7-9 are three near-identical crouches with the whiskers out,
     so flicking between them quickly reads as a nervous twitch while he
     stops to sniff the air. */
  'wonwuu/twitch': {
    src: wonwuuSheet,
    frameWidth: 28,
    frameHeight: 28,
    columns: 4,
    rows: 3,
    frames: 3,
    firstFrame: 7,
    duration: 300,
    pingPong: true,
    label: 'Wonwuu the rat, twitching',
  },
  /* The original, full-resolution sheet, for his reveal: there he is
     held up in the middle of the screen like the pumpkin, as a showpiece
     rather than an animal in the room, so the detail is wanted. 128px
     cells, same frame layout as the pixel sheet. */
  'wonwuu/hi-run': {
    src: wonwuuHiSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 3,
    frames: 12,
    duration: 300,
    label: 'Wonwuu the rat, running',
  },
  'wonwuu/hi-twitch': {
    src: wonwuuHiSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 3,
    frames: 3,
    firstFrame: 7,
    duration: 300,
    pingPong: true,
    label: 'Wonwuu the rat, twitching',
  },
  /* Frozen, for looking about and for the moment he is spotted. */
  'wonwuu/still': {
    src: wonwuuStillSheet,
    frameWidth: 28,
    frameHeight: 28,
    columns: 1,
    rows: 1,
    frames: 1,
    duration: 0,
    label: 'Wonwuu the rat, frozen',
  },
  /* Jord's Fork: a flaming trident, 10 cells of its fire flickering on a
     4x3 grid. The -pixel sheet again — the original's 128px cells are as
     fine as Wonwuu's were — but redrawn to 48px rather than his 28: the
     tines are one-pixel lines, and any coarser than that the flames
     outvote them and the fork dissolves into a smudge. */
  'jords-fork/burn': {
    src: jordsForkSheet,
    frameWidth: 48,
    frameHeight: 48,
    columns: 4,
    rows: 3,
    frames: 10,
    duration: 900,
    label: "Jord's Fork, a flaming trident",
  },
  /* The original sheet, for its reveal, where it is held up in the middle
     of the screen as a showpiece and the detail is wanted. */
  'jords-fork/hi-burn': {
    src: jordsForkHiSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 4,
    rows: 3,
    frames: 10,
    duration: 900,
    label: "Jord's Fork, a flaming trident",
  },
  /* Pittuki, the house lizard. Two sheets, both 4x4 grids with 14 cells
     used, drawn from above with his head to the upper left: `climb` is
     his legs stepping, `look` has him stopped, turning his head about.
     Both end on their first pose, so both loop.

     He lives on the wall, so these are the -pixel sheets halved from
     64px to 32px cells — a clean factor of two — and drawn at the wall
     furniture's scale rather than the animals'. */
  'pittuki/climb': {
    src: pittukiClimbSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 4,
    frames: 14,
    duration: 700,
    label: 'Pittuki the house lizard, climbing',
  },
  'pittuki/look': {
    src: pittukiLookSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 4,
    frames: 14,
    duration: 1500,
    iterations: 1,
    label: 'Pittuki the house lizard, looking around',
  },
  /* The look sheet's first cell, held: frozen flat to the wall. */
  'pittuki/still': {
    src: pittukiLookSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 4,
    frames: 1,
    duration: 0,
    label: 'Pittuki the house lizard, frozen',
  },
  /* Full resolution, for his reveal. */
  'pittuki/hi-climb': {
    src: pittukiClimbHiSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    frames: 14,
    duration: 700,
    label: 'Pittuki the house lizard, climbing',
  },
  'pittuki/hi-look': {
    src: pittukiLookHiSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    frames: 14,
    duration: 1500,
    label: 'Pittuki the house lizard, looking around',
  },
  /* Croakyangs, the singing frog. One 12-cell sheet on a 4x3 grid,
     facing left, in three parts: 0-2 draw breath and open up, 3-8 are
     the song itself — eyes shut, notes coming off him — and 9-11 settle
     him back. Only the middle part loops.

     He sits in the right-hand window, so the room uses a -pixel sheet
     halved to 32px cells at the wall's scale, like Pittuki. */
  'croakyangs/still': {
    src: croakSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 3,
    frames: 1,
    firstFrame: 0,
    duration: 0,
    label: 'Croakyangs the frog, sitting quietly',
  },
  'croakyangs/start': {
    src: croakSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 3,
    frames: 3,
    firstFrame: 0,
    duration: 330,
    iterations: 1,
    label: 'Croakyangs the frog, drawing breath',
  },
  'croakyangs/sing': {
    src: croakSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 3,
    frames: 6,
    firstFrame: 3,
    duration: 900,
    label: 'Croakyangs the frog, singing',
  },
  'croakyangs/stop': {
    src: croakSheet,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 3,
    frames: 3,
    firstFrame: 9,
    duration: 330,
    iterations: 1,
    label: 'Croakyangs the frog, finishing his song',
  },
  /* Full resolution, for his reveal. */
  'croakyangs/hi-sing': {
    src: croakHiSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 3,
    frames: 6,
    firstFrame: 3,
    duration: 900,
    label: 'Croakyangs the frog, singing',
  },
  /* Room furniture. Single frames, all of them. */
  'props/pumpkin': {
    src: pumpkinSheet,
    frameWidth: 64,
    frameHeight: 64,
    columns: 1,
    rows: 1,
    frames: 1,
    duration: 0,
    label: 'A golden pumpkin, half hidden behind the curtain',
  },
  'props/aircon': {
    src: airconSheet,
    frameWidth: 128,
    frameHeight: 64,
    columns: 1,
    rows: 1,
    frames: 1,
    duration: 0,
    label: 'An air conditioner mounted high on the wall',
  },
  'props/music-box': {
    src: musicBoxSheet,
    frameWidth: 128,
    frameHeight: 128,
    columns: 1,
    rows: 1,
    frames: 1,
    duration: 0,
    label: 'A jukebox standing beside the desk',
  },
  'props/ring-light': {
    src: ringLightSheet,
    frameWidth: 49,
    frameHeight: 98,
    columns: 1,
    rows: 1,
    frames: 1,
    duration: 0,
    label: 'A streaming ring light on a stand',
  },
} as const satisfies Record<string, SpriteDefinition>

export type SpriteName = keyof typeof sprites
export const spriteNames = Object.keys(sprites) as SpriteName[]

/** Wall-clock length of one full play, ping-pong included. */
export function playDuration(name: SpriteName): number {
  const sprite: SpriteDefinition = sprites[name]
  return sprite.duration * (sprite.pingPong ? 2 : 1)
}
