You are resuming work on **twigo portfolio**. Read this briefing, confirm the
environment, then ask what to work on (or act on `$ARGUMENTS` if given).

---

## 1. What this is

A **gaming portfolio for "twigo"** — deliberately *not* a multi-section site.
One screen: a pixel-art character at a desk in a dark room, full of things
that happen on their own and easter eggs to find. No scrolling, no nav.

- Pixel art throughout: hard edges, no blur, `image-rendering: pixelated`.
- Palette in `src/styles/variables.css`: `#7C2AE8` violet · `#D946EF` magenta ·
  `#A3E635` lime · `#22C55E` green · `#111827` ink.
- Type: self-hosted `Minecraft.ttf` (`src/styles/fonts.css`).
- Stack: Vite 8 + React 19 + TypeScript 6, `oxlint`.
- **Git repo**, `master` → GitHub Pages at `tw1go.github.io` via
  `.github/workflows/deploy.yml` on every push. The user pushes to `master`
  directly and asks for it explicitly ("push the changes").
- Spotify now-playing runs through a Vercel function (`api/now-playing.ts`,
  secrets in Vercel env) — see README.

Many characters are the user's real friends; their lore lives in the line
pools in `src/features/dialog/lines.ts`. Keep their voices consistent.

---

## 2. Environment — check this FIRST

Default Node is 22.4.1; Vite 8 (rolldown) needs **≥ 22.12**. Every npm command:

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 22 >/dev/null && npm run build
```

Verify after every change: `npm run build` (runs `tsc -b`) **and**
`npm run lint`. Both must be clean — oxlint flags `setState` in effects,
writing to props/refs passed in, and bad effect deps.

---

## 3. File map

```
src/
├── App.tsx                 composition, all reveal/dialog state, room light
├── App.css                 scene layers, floor, sign, vignette (.scene::after)
├── components/             Sprite (sheet renderer), WallWindow (curtain + slots)
├── hooks/
│   ├── useCharacterAnimation   idle ↔ actions; reacts to Discord game
│   └── useSceneScale           whole-number scale fitting width AND height
├── sprites/manifest.ts     EVERY sheet: geometry, slices, timing
├── styles/                 variables, sprite engine, fonts, wall-window
└── features/
    ├── companion/   Elli (desk bot, talks), Lulu (cat; chases Wonwuu)
    ├── dialog/      speech bubble, bottom InteractionBox, lines.ts (ALL copy)
    ├── pumpkin/     Biiko Kalabasa — golden pumpkin behind left curtain (curse)
    ├── fairy/       Fairy Cha — 7.16%/10s flyby, dust canvas (blessing)
    ├── wonwuu/      rat on the floor (trade); also Exclaim marks, track.ts
    ├── jords-fork/  ritual circle + hovering trident (prophecy)
    ├── pittuki/     house lizard on the wall (therapy session)
    ├── croakyangs/  frog behind right curtain, sings (serenade)
    ├── showcase/    jukebox → artist record rack
    ├── spotify/     now-playing strip + music notes
    ├── sky/         time of day + Open-Meteo weather in the windows
    ├── discord/     Lanyard presence → "Currently playing" tag over PC
    └── rotate/      portrait-phone "turn sideways" prompt
scripts/downsample-sheet.mjs   redraws a fine sheet onto a coarser pixel grid
scripts/cdp.mjs                real-time headless Chrome driver for checks (§7)
```

---

## 4. Coordinates and scale

Everything hangs off `.scene`: `--scene-scale` (set **from JS** by
`useSceneScale`: `floor(min(w/248, h/170))`, clamped 1–10; the CSS `5` is a
first-paint fallback), `--scene-pixel`, `--frame` (256 × pixel), `--horizon`
(80dvh), `--stage-top`. Layers (`scene__stage`, `__props`, `__pets`,
`__dialog`, `__hearts`, `__ritual`, `__wall`…) all mirror the 256px frame
box, so positions are **percent of the character's frame**, not viewport.

Measured art facts: character art rows 87–174, cols 34–220; PC tower cols
188–221 top row 92; right window starts at 78.4% of the frame.

**Never hard-code a pixel size on room art** — use `calc(var(--scene-scale) *
k)`. A fixed `--sprite-scale: 2` on the curtains swamped phones.

Sprite scales in use: room furniture/wall 0.4×, animals 0.6×, Pittuki 0.4×.
Fine source sheets get redrawn with `scripts/downsample-sheet.mjs` into a
`-pixel.png` beside the original (Wonwuu 128→28, fork 128→48, lizard and
frog 64→32); reveals use the original high-res sheet.

---

## 5. Sprite engine

`src/styles/sprite.css`: one `@property --sprite-frame` integer, `steps()`,
`x = mod(frame, cols)`, `y = floor(frame/cols)`. Manifest supports
`firstFrame` + `rows` (slices of one sheet), `pingPong`, `reverse`,
`iterations`. `playDuration()` is the real wall-clock length. `key` the
Sprite on each change so the animation restarts.

---

## 6. Hard-won rules (these get re-broken)

- **Reveal exits need their own keyframes.** Swapping `animation-direction`
  on a finished animation does not restart it; `reverse forwards` jumps to
  invisible. Reveal text boxes use `interaction-drop` (no −50% X).
- **Stacking contexts.** Anything that must paint/receive clicks above a
  layer needs its own layer, not a bigger z-index. The window frame has
  `isolation: isolate` — without it the glass swallowed Croakyangs' clicks.
- **Layers with `pointer-events: none`**: clickable children must opt back in
  (Pittuki was unclickable for this reason).
- **Speed from stride.** Walkers derive speed = stride / loop duration or
  feet skate (Wonwuu, Pittuki, Lulu's chase).
- **No rotating pixel art.** Pittuki gets 4 headings from `scale(±1, ±1)`
  flips only; the fork hovers with a stepped bob + drift, not a spin.
- **Glow follows glyphs** (text-shadow / drop-shadow), never a radial blob.
- **Registered `@property`** for any animated colour/number.
- Render-phase state latching instead of `setState` in effects.
- Console triggers exist for everything — keep adding them:
  `summonFairyCha()`, `summonWonwuu({from})`, `summonJordsFork()`,
  `summonPittuki()`, `setTime(h|'dusk')`, `setWeather('storm')`,
  `setSky({...})`, `resetSky()`, `setGame('Valorant')` / `setGame(null)`.

External services (all free, keyless, CORS `*`): Open-Meteo forecast +
geocoder (location from timezone, cached 20 min in localStorage); Lanyard
WebSocket for Discord presence, user ID `734942189984940063` in
`features/discord/presence.ts` (type 0 activities only).

---

## 7. Verifying — harness facts

No Playwright. Two tools:

- **Real time, scripted:** `scripts/cdp.mjs`, which launches headless
  Chrome with `--remote-debugging-port`, then runs steps: `wait`, `eval`,
  `probe` (awaits promises), `shot`, `mouse` (real `Input.dispatchMouseEvent`
  at an element's centre), `tap` (touch). Env: `VP=844x390`, `MOBILE=1`
  (touch + coarse pointer), `PRELOAD=<js>` (runs before page scripts — e.g.
  to wrap `WebSocket` and log traffic).
- `vite preview --port 4173` for the built site.

Traps, all confirmed:
1. `--virtual-time-budget` suppresses animation events and doesn't advance
   compositor animations or rAF reliably — use the real-time CDP driver.
2. `--disable-gpu` headless screenshots **do not capture canvas** (Fairy
   Cha's dust and fireflies). Drop the flag, as `scripts/cdp.mjs` does.
3. **`element.click()` lies** — it skips hit-testing. Always test clicks with
   real mouse/touch events at the element's coordinates and read
   `document.elementsFromPoint` to see what is on top.
4. WebSockets don't appear in `performance.getEntriesByType('resource')`.
5. Headless Chrome sometimes hangs; wrap with `perl -e 'alarm 40; exec @ARGV'`
   and use a fresh `--user-data-dir` per run.
6. For rare events, temporarily shorten timers / force states, test, and
   **restore from a backup copy**; say so in the report.

Check several viewports (2560×1440, 1920×1080, 1440×900, 1024×768, 844×390
landscape phone, 390×844 portrait) for anything layout-related.

---

## 8. How the user works

Short, iterative, visual requests, often several at once mid-task ("make it
smaller", "lower", "10% not 90%"). Expects screenshots, not assertions, and
plain statements when something couldn't be verified. Fix root causes and
briefly explain the non-obvious ones. Enjoys the characters' writing — make
lines specific and funny, in each friend's voice.

---

## 9. Open ideas

- Room glow following Discord online/idle/DND status; Elli commenting on
  play time.
- Snow weather (currently maps to cloudy); pixel ♪ glyph for Croakyangs.
- Upright tablets / "show anyway" portrait: lots of black above the room.
- Performance pass on a low-end phone (rain, dust, animals all at once).
- Confirm how Discord names Teamfight Tactics (may report as League).
