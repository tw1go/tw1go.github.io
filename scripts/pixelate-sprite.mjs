#!/usr/bin/env node
/**
 * Resolves a smooth sprite onto a coarse pixel grid.
 *
 * No CSS property can do this: `filter` has no pixelate function, and
 * `image-rendering: pixelated` only affects *upscaling* — it is ignored
 * entirely when the image is used as a mask. A curve stays a curve. So
 * the artwork itself has to be redrawn on a grid, which is what this does:
 * crop away transparent padding, average each block's alpha, threshold it
 * hard so no soft edges survive, then upscale nearest-neighbour.
 *
 *   node scripts/pixelate-sprite.mjs <in.png> <out.png> [gridWidth=25]
 *
 * Used to produce music-note-2-pixel.png from music-note-2.png. The
 * original is kept; this writes a new file beside it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { inflateSync, deflateSync, crc32 } from 'node:zlib'

const [, , inPath, outPath, gridArg] = process.argv
if (!inPath || !outPath) {
  console.error('usage: node scripts/pixelate-sprite.mjs <in.png> <out.png> [gridWidth]')
  process.exit(1)
}
const GRID_W = Number(gridArg ?? 25)
const UPSCALE = 8
/** Alpha above this becomes solid, below it becomes clear. */
const THRESHOLD = 110

function decode(buf) {
  let pos = 8
  let idat = []
  let width, height, depth, colourType
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      depth = data[8]
      colourType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  if (depth !== 8 || colourType !== 6) {
    throw new Error(`expected 8-bit RGBA, got depth ${depth} colourType ${colourType}`)
  }
  const raw = inflateSync(Buffer.concat(idat))
  const ch = 4
  const stride = width * ch
  const rows = []
  let prev = Buffer.alloc(stride)
  let p = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]
    const line = Buffer.from(raw.subarray(p, p + stride))
    p += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0
      const b = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      if (filter === 1) line[i] = (line[i] + a) & 255
      else if (filter === 2) line[i] = (line[i] + b) & 255
      else if (filter === 3) line[i] = (line[i] + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + b - c
        const pa = Math.abs(pp - a)
        const pb = Math.abs(pp - b)
        const pc = Math.abs(pp - c)
        line[i] = (line[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
    }
    rows.push(line)
    prev = line
  }
  return { width, height, rows }
}

function encode(width, height, rows) {
  const raw = Buffer.concat(rows.map((r) => Buffer.concat([Buffer.from([0]), r])))
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body) >>> 0)
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const { width, height, rows } = decode(readFileSync(inPath))
const alphaAt = (x, y) => rows[y][x * 4 + 3]

// Crop to the opaque bounding box — these files are mostly empty padding.
let x0 = width
let x1 = -1
let y0 = height
let y1 = -1
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (alphaAt(x, y) > 127) {
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
}
const cw = x1 - x0 + 1
const chh = y1 - y0 + 1
const GRID_H = Math.max(1, Math.round((GRID_W * chh) / cw))

const out = []
for (let gy = 0; gy < GRID_H; gy++) {
  const line = Buffer.alloc(GRID_W * UPSCALE * 4)
  for (let gx = 0; gx < GRID_W; gx++) {
    const sx0 = x0 + Math.floor((gx * cw) / GRID_W)
    const sx1 = x0 + Math.floor(((gx + 1) * cw) / GRID_W)
    const sy0 = y0 + Math.floor((gy * chh) / GRID_H)
    const sy1 = y0 + Math.floor(((gy + 1) * chh) / GRID_H)
    let total = 0
    let n = 0
    for (let y = sy0; y < Math.max(sy0 + 1, sy1); y++) {
      for (let x = sx0; x < Math.max(sx0 + 1, sx1); x++) {
        total += alphaAt(x, y)
        n++
      }
    }
    const a = total / n > THRESHOLD ? 255 : 0
    for (let i = 0; i < UPSCALE; i++) line[(gx * UPSCALE + i) * 4 + 3] = a
  }
  for (let i = 0; i < UPSCALE; i++) out.push(line)
}

writeFileSync(outPath, encode(GRID_W * UPSCALE, GRID_H * UPSCALE, out))
console.log(
  `  ${inPath} (${width}x${height}, art ${cw}x${chh})\n` +
    `  -> grid ${GRID_W}x${GRID_H} -> ${outPath} (${GRID_W * UPSCALE}x${GRID_H * UPSCALE})`,
)
