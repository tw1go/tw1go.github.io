/**
 * Where a pet is, for other pets to look at.
 *
 * Both animals move by CSS transition, so React state only ever holds
 * where they are *going*. A track records the move in flight — from,
 * to, when it started, how long it takes — and `liveX` interpolates it,
 * which is exactly what the linear transition on screen is doing.
 */
export interface Track {
  fromX: number
  toX: number
  start: number
  ms: number
  facing: 1 | -1
  action: string
  surface: 'floor' | 'desk'
}

/** How long both animals hold still under their "!" before the chase. */
export const ALERT_MS = 900

export function liveX(track: Track, now = performance.now()): number {
  if (track.ms <= 0) return track.toX
  const t = Math.min(1, Math.max(0, (now - track.start) / track.ms))
  return track.fromX + (track.toX - track.fromX) * t
}

/** Record a new move, starting from wherever the last one had got to. */
export function nextTrack(
  prev: Track | null,
  move: Omit<Track, 'fromX' | 'start'>,
): Track {
  const now = performance.now()
  return { ...move, fromX: prev ? liveX(prev, now) : move.toX, start: now }
}

/**
 * The x, in percent of the pets' layer, just past each edge of the
 * *viewport*. The layer is the character's frame, which can be narrower
 * or wider than the screen, so its own 0% and 100% are not "off screen".
 * `margin` is in percent too, enough to clear the animal's own width.
 */
export function offstage(layer: HTMLElement | null, margin = 8): { left: number; right: number } {
  if (!layer) return { left: -margin, right: 100 + margin }
  const box = layer.getBoundingClientRect()
  return {
    left: (-box.left / box.width) * 100 - margin,
    right: ((window.innerWidth - box.left) / box.width) * 100 + margin,
  }
}
