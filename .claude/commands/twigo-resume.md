---
description: Load full context for the twigo pixel-art hero site and continue work
---

You are resuming work on **twigo portfolio**. Read this briefing, confirm the
environment, then ask what to work on (or act on `$ARGUMENTS` if given).

---

## 1. What this is

A **gaming portfolio for "twigo"** — deliberately *not* a multi-section website.
It is a **single hero screen**: one pixel-art character at a desk, centred in a
dark room, with animations that play on their own. No scrolling, no nav.

- Style: pixel art throughout. Hard edges, no blur, `image-rendering: pixelated`.
- Brand palette (in `src/styles/variables.css`, everything derives from it):
  `#7C2AE8` violet · `#D946EF` magenta · `#A3E635` lime · `#22C55E` green · `#111827` ink
- Type: self-hosted `Minecraft.ttf` (`src/styles/fonts.css`), no webfont CDN.
- Stack: Vite 8 + React 19 + TypeScript 6, `oxlint`. **Not a git repo** — don't
  assume `git` works; offer `git init` if the user wants version control.

---

## 2. Environment — check this FIRST

The user's default Node is **22.4.1**, but Vite 8's bundler (rolldown) requires
**Node ≥22.12**. Below that, npm silently skips the platform binary as an
optional dep and the build dies with `Cannot find module @rolldown/binding-*`.

Node 22.23.2 is installed via nvm and `.nvmrc` pins the project. **Every shell
command that runs npm must activate it first:**

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 22 >/dev/null && npm run build
```

The user's global nvm default was deliberately left untouched.

Verify after every change: `npm run build` (includes `tsc -b`) **and**
`npm run lint`. Both must be clean.

---

## 3. File map

```
src/
├── App.tsx                      scene composition + dialog latch
├── App.css                      scene, floor, sign, dialog layer
├── index.css                    reset, black room, scanlines, vignette
├── components/Sprite.tsx        renders one sheet, drives CSS vars
├── hooks/useCharacterAnimation  idle ↔ random action scheduler
├── sprites/
│   ├── manifest.ts              per-sheet geometry + timing + playDuration()
│   └── preload.ts               fetch+decode all sheets on mount
├── styles/
│   ├── variables.css            palette, wood, pixel grid, fonts
│   ├── sprite.css               the sprite-sheet animation engine
│   └── fonts.css                @font-face for Minecraft.ttf
└── features/
    ├── dialog/                  speech bubble (lines, typewriter, component)
    └── spotify/                 STUB — types + hook + corner readout
```

---

## 4. The scene's coordinate system

Everything is anchored to two numbers on `.scene`, and the sprite frame is
positioned from them. **Do not reintroduce viewport-centring** — the sprite
frame is mostly empty space, so centring it made raising the scale push the
ground line off the bottom of the screen.

| var | value | meaning |
|---|---|---|
| `--scene-scale` | 5 | the pixel grid; sprite, planks and glows are all multiples of it |
| `--scene-pixel` | `scale * 1px` | one art pixel on screen |
| `--frame` | `256 * --scene-pixel` | the sprite frame box |
| `--horizon` | `80dvh` | where the floor line sits in the viewport |
| `--character-depth` | `--scene-pixel * 8` | how far in front of the horizon the feet land |
| `--stage-top` | derived | `horizon + depth - frame * 0.6836` |

`0.6836` is measured, not guessed: the lowest opaque row of the art (chair
wheels) is **row 174 of 256**; the top is **row 87** (34%); art spans columns
**34–220** (188 of 256 wide). Re-measure with a canvas page if sheets change.

`.scene__glow` and `.scene__dialog` both mirror that same box so they track the
character rather than the viewport.

Scale ladder (whole numbers only — half pixels break the grid):
`5` → `4` ≤1100px → `3` ≤900px → `2` ≤700px → `1` ≤420px.

---

## 5. Sprite engine (`src/styles/sprite.css`)

Based on <https://leanrada.com/notes/css-sprite-sheets/> — one element,
`background-position`, `steps()`. The article animates a single horizontal
strip; **our sheets are 2D grids with partially-filled last rows**, so instead
of animating `background-position` directly it animates one `@property`-
registered `<integer>` (`--sprite-frame`) and derives the offset:

```
x = mod(frame, cols) * frameW      y = round(down, frame / cols, 1) * frameH
```

`steps(n)` still does the real work — the index lands exactly on 0…n-1 and
blank trailing cells are never visited. Adding a sheet = one manifest entry.

| sheet | grid | frames | duration |
|---|---|---|---|
| `idle-static` | 1×1 | 1 | — |
| `idle` | 3×3 | 8 | 1150ms |
| `random-movement` | 3×3 | 8 | 1265ms |
| `drinking` | 4×4 | 14 | 1610ms ×2 (ping-pong) |

**Ping-pong**: `drinking` ends mid-motion, so `pingPong: true` sets
`animation-direction: alternate`, which reverses the step timing along with the
keyframes and lands back on frame 0 — the pose idle starts from. One logical
"play" is therefore **two** CSS iterations; `playDuration()` reports real
wall-clock length and the scheduler must use it, not `duration`.

`preload.ts` fetches and `decode()`s every sheet on mount. Without it the first
switch to an action decodes a 1024×1024 PNG on the frame it appears — a visible
stutter.

---

## 6. Non-obvious decisions (these get re-broken if forgotten)

- **Registered custom properties are what make colour/number animation work.**
  An unregistered custom property is an uninterpolated token stream and will
  *jump* between keyframes. `--glow-primary` / `--glow-secondary` are
  `@property … syntax:'<color>'` so the room can fade violet↔green over 24s;
  gradients consume them via `color-mix(…, transparent)`.
- **Glow alpha and blur fight each other.** A blur spreads a colour over its
  whole radius, so a faint colour at a large radius dilutes to nothing. The
  sign's widest spill layer is ~52% green, not 8%. Blur does the falloff; the
  colour stays near-opaque.
- **The sign's glow must follow the glyphs.** It is built only from blurred
  `text-shadow` copies. A radial gradient behind the text always reads as a
  circle on the wall, at any softness.
- **Floor perspective is a fan, not a tilt.** Seams are a
  `repeating-conic-gradient`, so they genuinely converge. `--seam-focus: -70%`
  holds the vanishing point *above* the floor's top edge — on the edge itself
  every seam pinched to one visible point and read as an infinite corridor.
  Cross-joints use hand-placed stops that bunch toward the horizon; equal
  spacing flattens the plane straight back out.
- **The floor cannot sit on the pixel grid** — a receding plane has no constant
  pixel size. Kept shallow and low-contrast on purpose.
- **Dialog needs its own layer.** `.scene__dialog` (`z-index: 10`) is a sibling
  of `.scene__stage`. Inside the stage the bubble was trapped in that element's
  stacking context, so the sign and now-playing strip (both `z-index: 1`, later
  in the DOM) painted over it. Raising the bubble's own z-index cannot fix that.
- **`--dlg-anchor` is a length, not a percentage.** As a percentage the tail
  drifted with line length and landed inside the corner radius on short lines.
  It sets the box shift, the tail position and the pop origin together.
- **The bubble outlives its play.** It keeps un-typing after the character
  returns to idle, so it is latched into `App` state and clears itself via
  `onDone` — it cannot be derived from `play`.
- **The erase is scheduled from one fixed time**, `max(typing end + 600ms,
  animation length)`. That guarantees typing finished first, so the type and
  erase intervals can never overlap and there is no race to guard.
- React: prefer **render-phase state adjustment** over `setState` in an effect —
  oxlint flags the latter (`react(set-state-in-effect)`).

---

## 7. Verifying visual work — harness limits (hard-won)

There is no Playwright. Screenshots come from headless Chrome:

```bash
SP=<scratchpad>
(npm run preview -- --port 4173 &) ; sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --disable-gpu --hide-scrollbars --virtual-time-budget=3000 \
  --window-size=1440,900 --screenshot="$SP/shot.png" http://localhost:4173/
sips -c 200 560 --cropOffset 160 620 "$SP/shot.png" --out "$SP/c.png"   # zoom in
sips -z 330 920 "$SP/c.png" --out "$SP/big.png"
```

**Three traps, all confirmed:**

1. `--virtual-time-budget` **suppresses animation events entirely** —
   `animationiteration` / `animationend` never fire, even for a plain `opacity`
   animation. Do not conclude event-driven code is broken from this.
2. It also **does not advance compositor animations** (`opacity`, `transform`).
   Those render pinned at their start frame, so an element animating in from
   `opacity: 0` looks invisible. **Main-thread animations** (custom properties,
   `color`, `text-shadow`) *do* advance and are observable.
   → To check an element's *appearance*, temporarily set `animation: none`,
   screenshot, then restore.
3. `--dump-dom` fires right after load, before any animation iteration. It is
   good for *state* (`grep -o 'aria-label="[^"]*"'` tells you which sprite and
   which dialog line are mounted) but not for timing.

Idle occupies ~80% of the timeline, so random sampling rarely catches an action.
**Force a deterministic schedule** by temporarily setting
`IDLE_LOOPS_MIN/MAX = 1` and trimming `ACTIONS` to one entry — always back the
file up first and restore it afterwards:

```bash
cp src/hooks/useCharacterAnimation.ts "$SP/hook.bak"   # ... test ...
cp "$SP/hook.bak" src/hooks/useCharacterAnimation.ts && npm run build
```

Headless Chrome reports `prefers-reduced-motion: reduce` = **false**, so
reduced-motion blocks are not the explanation when something looks static.

---

## 8. Tunable knobs

| want | change |
|---|---|
| character bigger/smaller | `--scene-scale` on `.scene` + the breakpoint ladder |
| character up/down | `--character-depth` (floor stays put) |
| floor higher/lower | `--horizon` |
| floor depth / plank count | `--seam-focus`, `--seam-period`, `--seam-width` |
| board-end spacing | the stop list in the "Board ends" gradient |
| wood tone | `--wood-base/-plank/-seam` in `variables.css` |
| sign size | `font-size` + `--sign-px` on `.scene__wordmark` |
| sign glow strength | `--sign-glow`…`--sign-spill-far` alphas (raise alpha before radius) |
| room colour cycle | `glow-cycle` keyframes + the `24s` on `.scene` |
| bubble shape/offset | `--dlg-px`, `--dlg-anchor`, `border-radius`, `padding` |
| animation speed | `duration` per sheet in `manifest.ts` |

---

## 9. What's next

1. **Bottom interaction dialog box** — the planned second dialog: a large box at
   the bottom of the screen shown when the user interacts with the sprite. Put
   it in `src/features/dialog/` and render it inside `.scene__dialog`.
   `DIALOG_LINES` is already keyed by sprite name, so it needs a new key, not a
   refactor. Note the layer is `pointer-events: none` — an interactive box must
   opt back in on its own element.
2. **Spotify API** — `features/spotify/` has the target type, a stub hook
   returning `offline`, and a live corner readout. Swap the stub body for a
   fetch against **your own endpoint**, never `api.spotify.com` directly: the
   refresh token cannot live in the browser.

Known loose ends: `public/icons.svg` is an unreferenced Vite-template file kept
in case socials are wanted. The scene has a lot of black headroom on tall narrow
screens (fixed `80dvh` horizon) — could be made breakpoint-dependent.

---

## 10. How the user works

Short, iterative visual requests ("make it bigger", "more glow", "closer to the
character"). They expect you to **verify with a screenshot** rather than assert,
and to **say plainly when the harness cannot verify something** instead of
claiming it works. Fix root causes, not symptoms, and explain the counter-
intuitive ones briefly — they engage with the reasoning and ask good follow-ups.
