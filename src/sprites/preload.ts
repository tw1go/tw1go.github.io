import { sprites, spriteNames } from './manifest'

let started = false

/**
 * Fetch and decode every sheet up front.
 *
 * A sheet is otherwise only requested at the moment its background-image
 * first applies — so the very first switch to an action pays for a network
 * round trip plus decoding a 1024x1024 PNG on the frame it appears, which
 * shows up as a stutter. Idle runs for seconds before the first action, so
 * warming them here costs nothing visible.
 */
export function preloadSprites(): void {
  if (started || typeof window === 'undefined') return
  started = true

  for (const name of spriteNames) {
    const img = new Image()
    img.src = sprites[name].src
    // decode() resolves once the bitmap is ready, not just downloaded.
    void img.decode().catch(() => {
      /* a sheet that fails here will simply load on demand */
    })
  }
}
