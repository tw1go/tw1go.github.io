/**
 * Fairy dust, fireflies and falling sparkles, drawn on one canvas.
 *
 * The canvas is allocated at one cell per *art pixel* and stretched up
 * with `image-rendering: pixelated`, so every particle is a hard square
 * on the same grid as Cha's own sprite. Drawing at full resolution and
 * rounding would still antialias sub-pixel positions; this cannot.
 *
 * Everything lives in grid units, not screen pixels. Callers pass screen
 * coordinates and the engine converts at the boundary.
 *
 * The engine runs its own rAF loop, started by any emit and stopped once
 * the last particle has faded, so it idles at zero cost between visits
 * and a particle still in the air outlives the flight that dropped it.
 */

/* Palette for the dust: her dress, her wings and the swirl's white. */
const DUST_COLOURS = ['#ffffff', '#fdf4ff', '#f5d0fe', '#e9d5ff', '#d946ef', '#fde68a']
/* Fireflies stay in the brand's greens, so they read as the room's own
   light rather than more of her dust. */
const FIREFLY_CORE = '#f7fee7'
const FIREFLY_HALO = '#a3e635'
const FIREFLY_OUTER = '#22c55e'

interface Mote {
  kind: 'dust' | 'sparkle'
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  colour: string
  /* Twinkle phase, so neighbouring sparkles do not blink in unison. */
  phase: number
}

interface Firefly {
  x: number
  y: number
  /* Wander is a pair of slow sine waves rather than a random walk: a
     random walk jitters on a grid this coarse. */
  ax: number
  ay: number
  fx: number
  fy: number
  phase: number
  pulse: number
  delay: number
  age: number
  life: number
}

/* Falling stars: white-hot centres with coloured arms. Mostly white and
   gold so the shower reads as light, with her pinks mixed through. */
const STAR_COLOURS = ['#ffffff', '#fef3c7', '#fde68a', '#f5d0fe', '#e9d5ff', '#fbcfe8']

interface Star {
  x: number
  y: number
  vy: number
  /* A slow side-to-side sway, like something light settling. */
  sway: number
  swayRate: number
  /* Arm length in cells. The big ones flare by one more at their peak. */
  size: number
  twinkleRate: number
  phase: number
  colour: string
  age: number
}

export interface DustEngine {
  /** Drop a trail behind a point moving in `direction`. */
  trail: (x: number, y: number, direction: number, dt: number) => void
  /** A puff in every direction, for when she is caught. */
  burst: (x: number, y: number) => void
  /** A shower of sparkles falling from the top of the screen. */
  rain: (dt: number, perSecond: number) => void
  /** Light `count` fireflies inside a screen-space box. */
  fireflies: (count: number, box: Box, delay?: [number, number]) => void
  destroy: () => void
}

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

export function createDust(canvas: HTMLCanvasElement): DustEngine {
  const ctx = canvas.getContext('2d')
  let unit = 2
  let motes: Mote[] = []
  let flies: Firefly[] = []
  let stars: Star[] = []
  let raf = 0
  let last = 0
  // Fractional particles owed by the trail, carried between frames so the
  // emission rate is exact at any frame rate.
  let owed = 0
  let owedRain = 0

  /* One grid cell per art pixel of her sprite, which is drawn at 0.3 of
     the room's scale. Clamped to a whole screen pixel so the smallest
     breakpoints do not end up with a canvas wider than the screen. */
  const fit = () => {
    const scale = Number.parseFloat(
      getComputedStyle(canvas).getPropertyValue('--scene-scale'),
    )
    unit = Math.max(1, Math.round((Number.isFinite(scale) ? scale : 5) * 0.3))
    const cols = Math.ceil(window.innerWidth / unit)
    const rows = Math.ceil(window.innerHeight / unit)
    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols
      canvas.height = rows
    }
    canvas.style.width = `${cols * unit}px`
    canvas.style.height = `${rows * unit}px`
  }

  const dot = (x: number, y: number, colour: string, alpha: number) => {
    if (!ctx || alpha <= 0.01) return
    ctx.globalAlpha = Math.min(1, alpha)
    ctx.fillStyle = colour
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1)
  }

  /* A four-point star, one cell arms. */
  const plus = (x: number, y: number, colour: string, alpha: number) => {
    dot(x - 1, y, colour, alpha)
    dot(x + 1, y, colour, alpha)
    dot(x, y - 1, colour, alpha)
    dot(x, y + 1, colour, alpha)
  }

  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    for (const m of motes) {
      m.age += dt
      m.x += m.vx * dt
      m.y += m.vy * dt
      // Air drag, then a light fall — dust hangs before it drifts down.
      const drag = Math.pow(0.18, dt)
      m.vx *= drag
      m.vy = m.vy * drag + 9 * dt
    }
    motes = motes.filter((m) => m.age < m.life)

    for (const f of flies) f.age += dt
    flies = flies.filter((f) => f.age < f.delay + f.life)

    for (const star of stars) {
      star.age += dt
      star.y += star.vy * dt
    }
    // Gone once clear of the bottom edge, arms and all.
    stars = stars.filter((star) => star.y < canvas.height + 4)

    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Additive, so overlapping motes brighten into a glow instead of
    // stacking as opaque squares.
    ctx.globalCompositeOperation = 'lighter'

    for (const m of motes) {
      const fade = 1 - m.age / m.life
      const twinkle = 0.55 + 0.45 * Math.sin(m.age * 22 + m.phase)
      if (m.kind === 'sparkle') {
        dot(m.x, m.y, '#ffffff', fade * twinkle)
        plus(m.x, m.y, m.colour, fade * twinkle * 0.7)
      } else {
        dot(m.x, m.y, m.colour, fade * (0.6 + 0.4 * twinkle))
      }
    }

    for (const f of flies) {
      const t = f.age - f.delay
      if (t < 0) continue
      // Eased in and out over the first and last second of its life.
      const env = Math.min(1, t / 1, (f.life - t) / 1.2)
      // Squared, so it spends longer dim than lit — a blink, not a throb.
      const glow = Math.pow(0.5 + 0.5 * Math.sin(t * f.pulse + f.phase), 2)
      const x = f.x + Math.sin(t * f.fx + f.phase) * f.ax
      const y = f.y + Math.sin(t * f.fy + f.phase * 1.7) * f.ay - t * 1.5
      const a = env * (0.2 + 0.8 * glow)
      // A 2x2 core, which has no single centre pixel, so the rings are
      // drawn around the four of them: a bright plus, then a soft
      // diamond, then a faint wide halo that only shows when it flares.
      for (let dy = -3; dy <= 4; dy++) {
        for (let dx = -3; dx <= 4; dx++) {
          const d = Math.abs(dx - 0.5) + Math.abs(dy - 0.5)
          if (d <= 1) dot(x + dx, y + dy, FIREFLY_CORE, a)
          else if (d <= 2) dot(x + dx, y + dy, FIREFLY_HALO, a * 0.6)
          else if (d <= 3) dot(x + dx, y + dy, FIREFLY_OUTER, a * 0.26)
          else if (d <= 4) dot(x + dx, y + dy, FIREFLY_OUTER, a * 0.1 * glow)
        }
      }
    }
    for (const star of stars) {
      const x = star.x + Math.sin(star.age * star.swayRate + star.phase) * star.sway
      const y = star.y
      // Fades in at the top and out over the last stretch of the room,
      // so nothing pops into or out of existence at an edge.
      const fall = y / canvas.height
      const env = Math.min(1, star.age / 0.4, (1 - fall) / 0.18)
      const shine = 0.5 + 0.5 * Math.sin(star.age * star.twinkleRate + star.phase)
      const a = env * (0.35 + 0.65 * shine)
      const arms = star.size + (shine > 0.85 ? 1 : 0)
      dot(x, y, '#ffffff', a)
      for (let r = 1; r <= arms; r++) {
        const fade = a * (1 - (r - 1) / (arms + 0.5)) * 0.85
        dot(x - r, y, star.colour, fade)
        dot(x + r, y, star.colour, fade)
        dot(x, y - r, star.colour, fade)
        dot(x, y + r, star.colour, fade)
      }
      // The diagonal glints only on the big ones, and only when they flare.
      if (star.size > 1 && shine > 0.7) {
        const glint = a * 0.35
        dot(x - 1, y - 1, star.colour, glint)
        dot(x + 1, y - 1, star.colour, glint)
        dot(x - 1, y + 1, star.colour, glint)
        dot(x + 1, y + 1, star.colour, glint)
      }
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  const loop = (now: number) => {
    step(now)
    if (motes.length || flies.length || stars.length) {
      raf = requestAnimationFrame(loop)
    } else {
      raf = 0
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const wake = () => {
    if (raf) return
    fit()
    last = performance.now()
    raf = requestAnimationFrame(loop)
  }

  window.addEventListener('resize', fit)

  return {
    trail(x, y, direction, dt) {
      owed += dt * 85
      const gx = x / unit
      const gy = y / unit
      while (owed >= 1) {
        owed -= 1
        const sparkle = Math.random() < 0.16
        motes.push({
          kind: sparkle ? 'sparkle' : 'dust',
          x: gx + rand(-5, 5),
          y: gy + rand(-6, 6),
          // Shed backwards off her, slower than she is flying, so the
          // trail stretches out behind her instead of keeping pace.
          vx: -direction * rand(2, 14),
          vy: rand(-7, 3),
          age: 0,
          life: rand(0.7, sparkle ? 1.9 : 1.5),
          colour: pick(DUST_COLOURS),
          phase: rand(0, Math.PI * 2),
        })
      }
      wake()
    },

    burst(x, y) {
      const gx = x / unit
      const gy = y / unit
      for (let i = 0; i < 90; i++) {
        const angle = rand(0, Math.PI * 2)
        const speed = rand(8, 46)
        motes.push({
          kind: Math.random() < 0.3 ? 'sparkle' : 'dust',
          x: gx + rand(-3, 3),
          y: gy + rand(-3, 3),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          age: 0,
          life: rand(0.8, 1.8),
          colour: pick(DUST_COLOURS),
          phase: rand(0, Math.PI * 2),
        })
      }
      wake()
    },

    rain(dt, perSecond) {
      owedRain += dt * perSecond
      while (owedRain >= 1) {
        owedRain -= 1
        const big = Math.random() < 0.3
        stars.push({
          x: rand(0, canvas.width),
          // Just above the top edge, so they fall into view.
          y: rand(-6, canvas.height * 0.05),
          // Slow enough to hang in the air, fast enough to read as rain:
          // four to seven seconds from top to bottom.
          vy: (canvas.height / rand(4, 7)) * (big ? 0.85 : 1),
          sway: rand(1, 4),
          swayRate: rand(0.8, 2),
          size: big ? 2 : 1,
          twinkleRate: rand(5, 11),
          phase: rand(0, Math.PI * 2),
          colour: pick(STAR_COLOURS),
          age: 0,
        })
      }
      wake()
    },

    fireflies(count, box, [minDelay, maxDelay] = [0, 0]) {
      for (let i = 0; i < count; i++) {
        flies.push({
          x: rand(box.left, box.right) / unit,
          y: rand(box.top, box.bottom) / unit,
          ax: rand(3, 9),
          ay: rand(2, 6),
          fx: rand(0.4, 1.1),
          fy: rand(0.5, 1.3),
          phase: rand(0, Math.PI * 2),
          pulse: rand(2.4, 4.6),
          delay: rand(minDelay, maxDelay),
          age: 0,
          life: rand(3.2, 5.8),
        })
      }
      wake()
    },

    destroy() {
      window.removeEventListener('resize', fit)
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      motes = []
      flies = []
      stars = []
    },
  }
}
