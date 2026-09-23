import type { CSSProperties } from 'react'
import {
  sprites,
  type SpriteDefinition,
  type SpriteName,
} from '../sprites/manifest'
import '../styles/sprite.css'

interface SpriteProps {
  name: SpriteName
  /**
   * Multiplier applied to the source frame size. Whole numbers keep
   * the pixel grid perfectly square — prefer 1, 2, 3 over 1.5.
   * Omit it to let CSS drive `--sprite-scale` (e.g. per breakpoint);
   * passing it writes an inline value that stylesheets can't override.
   */
  scale?: number
  paused?: boolean
  /** Overrides the manifest duration, in milliseconds. */
  duration?: number
  /** Overrides the manifest iteration count. */
  iterations?: number | 'infinite'
  className?: string
  style?: CSSProperties
}

/**
 * Renders one frame of a sprite sheet and steps through the rest in CSS.
 * See `styles/sprite.css` for how the frame index becomes an offset.
 */
export function Sprite({
  name,
  scale,
  paused = false,
  duration,
  iterations,
  className,
  style,
}: SpriteProps) {
  // Widened from the manifest's literal types so optional fields resolve.
  const sprite: SpriteDefinition = sprites[name]
  const isStatic = sprite.frames <= 1

  // One "play" of a ping-pong sprite is two CSS iterations: out and back.
  const plays = iterations ?? sprite.iterations ?? 'infinite'
  const cssIterations =
    plays === 'infinite' || !sprite.pingPong ? plays : plays * 2

  const spriteVars = {
    '--sprite-src': `url(${sprite.src})`,
    '--sprite-frame-w': sprite.frameWidth,
    '--sprite-frame-h': sprite.frameHeight,
    '--sprite-cols': sprite.columns,
    // The sheet's real row count. The stylesheet can only guess this from
    // the frame count, which is wrong whenever the animation is a slice of
    // a larger sheet.
    '--sprite-rows': sprite.rows ?? Math.ceil(sprite.frames / sprite.columns),
    '--sprite-frames': sprite.frames,
    '--sprite-first': sprite.firstFrame ?? 0,
    '--sprite-duration': `${duration ?? sprite.duration}ms`,
    '--sprite-iterations': `${cssIterations}`,
    '--sprite-direction': sprite.pingPong
      ? 'alternate'
      : sprite.reverse
        ? 'reverse'
        : 'normal',
    ...(scale === undefined ? null : { '--sprite-scale': scale }),
  } as CSSProperties

  return (
    <div
      className={className ? `sprite ${className}` : 'sprite'}
      style={{ ...spriteVars, ...style }}
      data-static={isStatic || undefined}
      data-paused={paused || undefined}
      role="img"
      aria-label={sprite.label}
    />
  )
}
