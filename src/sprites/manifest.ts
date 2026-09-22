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
   * Frames that actually contain art. May be fewer than
   * columns * rows when the last row is partially filled.
   */
  frames: number
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
  /** Describes the sprite for assistive tech. */
  label: string
}

/**
 * Every sheet under `assets/sprites` is registered here. Frame counts
 * were read off the sheets — `animation-idle` and `animation-random-movement`
 * are 3x3 grids with 8 used cells, `animation-drinking` is a 4x4 grid
 * with 14 used cells.
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
} as const satisfies Record<string, SpriteDefinition>

export type SpriteName = keyof typeof sprites
export const spriteNames = Object.keys(sprites) as SpriteName[]

/** Wall-clock length of one full play, ping-pong included. */
export function playDuration(name: SpriteName): number {
  const sprite: SpriteDefinition = sprites[name]
  return sprite.duration * (sprite.pingPong ? 2 : 1)
}
