/**
 * Getting about on the wall, for a sprite that cannot be rotated.
 *
 * His sheets are drawn from above with his head to the upper left, and
 * turning pixel art knocks it off its grid. Flipping does not: mirrored
 * across either axis, the one pose gives four headings, all diagonals —
 * and upside down is exactly how a house lizard spends half its life.
 * He only ever travels the way his head points, so every move is along
 * one of these four.
 */

export interface Heading {
  /** CSS flips. 1 is as drawn. */
  sx: 1 | -1
  sy: 1 | -1
  /** Unit vector of travel, in frame percent (the frame is square). */
  dx: number
  dy: number
}

/* His body axis, head end, measured off the sheet: tail root at the
   lower right, head at the upper left. */
const AX = -0.62
const AY = -0.79

export const HEADINGS = {
  upLeft: { sx: 1, sy: 1, dx: AX, dy: AY },
  upRight: { sx: -1, sy: 1, dx: -AX, dy: AY },
  downLeft: { sx: 1, sy: -1, dx: AX, dy: -AY },
  downRight: { sx: -1, sy: -1, dx: -AX, dy: -AY },
} satisfies Record<string, Heading>

export const ALL_HEADINGS: Heading[] = Object.values(HEADINGS)

/** The stretch of wall he may cross, in frame percent. Above the desk,
    inside the room's walls. */
export const ZONE = { left: 7, right: 93, top: 9, bottom: 45 }

export interface Spot {
  x: number
  y: number
  /** Which way he comes out from behind it — away from what hides him. */
  out: Heading[]
  /** How far he must crawl to be clear of it. */
  clear: number
}

/**
 * Where he can hide: behind the air conditioner and behind either window.
 * He lives in the wall layer underneath them, so standing on one of
 * these points he is out of sight. Positions follow their CSS — the
 * aircon spans 40-60% across and 13.5-23.5% down, and each window is
 * 15.6% wide from 6% in, 23-39% down.
 */
export const SPOTS: Spot[] = [
  { x: 50, y: 18, out: [HEADINGS.downLeft, HEADINGS.downRight], clear: 13 },
  { x: 14, y: 30, out: [HEADINGS.upRight, HEADINGS.downRight], clear: 15 },
  { x: 86, y: 30, out: [HEADINGS.upLeft, HEADINGS.downLeft], clear: 15 },
]

export const inZone = (x: number, y: number) =>
  x >= ZONE.left && x <= ZONE.right && y >= ZONE.top && y <= ZONE.bottom

export interface Leg {
  x: number
  y: number
  heading: Heading
}

/**
 * Two diagonal legs from one point to another. Any direction can be made
 * from the right pair of diagonals: mostly up or down, the two that
 * share that vertical; mostly sideways, the two that share that side.
 * Solving for how far along each always comes out non-negative.
 */
export function route(fromX: number, fromY: number, toX: number, toY: number): Leg[] {
  const vx = toX - fromX
  const vy = toY - fromY
  const vertical = Math.abs(vy) / -AY >= Math.abs(vx) / -AX
  let first: Heading
  let second: Heading
  if (vertical) {
    ;[first, second] = vy < 0 ? [HEADINGS.upLeft, HEADINGS.upRight] : [HEADINGS.downLeft, HEADINGS.downRight]
  } else {
    ;[first, second] = vx < 0 ? [HEADINGS.upLeft, HEADINGS.downLeft] : [HEADINGS.upRight, HEADINGS.downRight]
  }
  // v = a * first + b * second, for the two unknown lengths a and b.
  const det = first.dx * second.dy - first.dy * second.dx
  const a = (vx * second.dy - vy * second.dx) / det
  const midX = fromX + a * first.dx
  const midY = fromY + a * first.dy
  const legs: Leg[] = []
  if (a > 0.5) legs.push({ x: midX, y: midY, heading: first })
  legs.push({ x: toX, y: toY, heading: second })
  return legs
}
