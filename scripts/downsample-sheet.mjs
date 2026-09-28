#!/usr/bin/env node
/**
 * Redraws a fine-grained sprite sheet on a coarser pixel grid, cell by
 * cell, so it can stand in the room at the same pixel size as the rest.
 *
 * Shrinking in CSS cannot do this: nearest-neighbour downscaling just
 * drops rows and columns, which shreds outlines and leaves the art far
 * finer than everything around it. This resamples properly instead:
 *
 *  - each output pixel covers a block of the source; it is solid only if
 *    enough of that block is, so edges stay hard with no half-alpha;
 *  - its colour is the block's most common colour — snapped to what the
 *    artist actually used, never an average that muddies into a new one;
 *  - the darkest colours are weighted up in that vote, so the outline
 *    survives the reduction instead of being outvoted by the fill.
 *
 *   node scripts/downsample-sheet.mjs <in.png> <out.png> <cellIn> <cellOut>
 *
 * Used to produce the Wonwuu sheets (128px cells -> 28px) from the
 * originals, which are kept beside them.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { inflateSync, deflateSync, crc32 } from 'node:zlib'

const [, , inPath, outPath, cellInArg, cellOutArg] = process.argv
if (!inPath || !outPath || !cellInArg || !cellOutArg) {
  console.error('usage: node scripts/downsample-sheet.mjs <in.png> <out.png> <cellIn> <cellOut>')
  process.exit(1)
}
const CELL_IN = Number(cellInArg)
const CELL_OUT = Number(cellOutArg)
/** Share of a block that must be opaque for its pixel to be drawn. */
const COVERAGE = 0.42
/** How much more a dark (outline) pixel counts in the colour vote. */
const OUTLINE_WEIGHT = 1.8
/** Luminance below which a colour counts as outline. */
const OUTLINE_LUMA = 48

function decode(buf) {
  let pos = 8
  const idat = []
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
  const stride = width * 4
  const rows = []
  let prev = Buffer.alloc(stride)
  let p = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]
    const line = Buffer.from(raw.subarray(p, p + stride))
    p += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? line[i - 4] : 0
      const b = prev[i]
      const c = i >= 4 ? prev[i - 4] : 0
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
const cols = Math.round(width / CELL_IN)
const gridRows = Math.round(height / CELL_IN)
const outW = cols * CELL_OUT
const outH = gridRows * CELL_OUT
const out = Array.from({ length: outH }, () => Buffer.alloc(outW * 4))
const k = CELL_IN / CELL_OUT

for (let cy = 0; cy < gridRows; cy++) {
  for (let cx = 0; cx < cols; cx++) {
    for (let ty = 0; ty < CELL_OUT; ty++) {
      for (let tx = 0; tx < CELL_OUT; tx++) {
        // The source block this output pixel stands for, in whole pixels.
        const sx0 = cx * CELL_IN + Math.floor(tx * k)
        const sx1 = cx * CELL_IN + Math.max(Math.floor(tx * k) + 1, Math.floor((tx + 1) * k))
        const sy0 = cy * CELL_IN + Math.floor(ty * k)
        const sy1 = cy * CELL_IN + Math.max(Math.floor(ty * k) + 1, Math.floor((ty + 1) * k))

        const votes = new Map()
        let opaque = 0
        let total = 0
        for (let y = sy0; y < sy1; y++) {
          for (let x = sx0; x < sx1; x++) {
            total++
            const i = x * 4
            if (rows[y][i + 3] < 128) continue
            opaque++
            const r = rows[y][i]
            const g = rows[y][i + 1]
            const b = rows[y][i + 2]
            const luma = 0.299 * r + 0.587 * g + 0.114 * b
            const key = (r << 16) | (g << 8) | b
            votes.set(key, (votes.get(key) ?? 0) + (luma < OUTLINE_LUMA ? OUTLINE_WEIGHT : 1))
          }
        }
        if (opaque / total < COVERAGE) continue

        let best = 0
        let bestVotes = -1
        for (const [key, n] of votes) {
          if (n > bestVotes) {
            best = key
            bestVotes = n
          }
        }
        const o = (cx * CELL_OUT + tx) * 4
        const line = out[cy * CELL_OUT + ty]
        line[o] = (best >> 16) & 255
        line[o + 1] = (best >> 8) & 255
        line[o + 2] = best & 255
        line[o + 3] = 255
      }
    }
  }
}

writeFileSync(outPath, encode(outW, outH, out))
console.log(`  ${inPath} (${width}x${height}, ${CELL_IN}px cells)\n  -> ${outPath} (${outW}x${outH}, ${CELL_OUT}px cells)`)
