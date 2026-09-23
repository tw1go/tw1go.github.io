import curtainBlownSheet from '../assets/sprites/curtain/animation-window-blown.png'
import curtainOpenSheet from '../assets/sprites/curtain/animation-curtain-open.png'
import curtainClosedSheet from '../assets/sprites/curtain/curtain.png'
import elliIdleSheet from '../assets/sprites/elli/animation-idle-desk.png'
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
