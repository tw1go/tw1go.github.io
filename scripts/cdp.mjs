#!/usr/bin/env node
/**
 * Drives headless Chrome in real time over the DevTools protocol, for
 * checking the room the way a visitor sees it.
 *
 *   node scripts/cdp.mjs <url> <steps.json>
 *
 * steps.json is a list of [kind, arg]:
 *   ["wait", ms]       sleep
 *   ["eval", js]       run in the page
 *   ["probe", js]      run, await, and print the result
 *   ["shot", path]     screenshot to a PNG
 *   ["mouse", js]      real click at {x, y} returned by js (JSON string)
 *   ["tap", js]        real touch tap at {x, y}
 *
 * Env: VP=844x390 viewport, MOBILE=1 touch + coarse pointer,
 * PRELOAD=<js> run before any page script (e.g. wrap WebSocket).
 *
 * Why not element.click(): it skips hit-testing, so it "works" on things a
 * real pointer can never reach. Why not --virtual-time-budget: it stalls
 * animation events and rAF. See .claude/commands/twigo-resume.md.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const [url, stepsPath] = process.argv.slice(2)
const steps = JSON.parse(readFileSync(stepsPath, 'utf8'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--hide-scrollbars','--remote-debugging-port=9334','--window-size=1440,900',`--user-data-dir=${mkdtempSync(join(tmpdir(), 'twigo-cdp-'))}`,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
for (let i = 0; i < 50; i++) { try { const l = await (await fetch('http://127.0.0.1:9334/json')).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break } } catch {} await sleep(100) }
await new Promise((r) => ws.addEventListener('open', r))
let id = 0; const pending = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const [W, H] = (process.env.VP ?? '1440x900').split('x').map(Number)
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: !!process.env.MOBILE })
if (process.env.MOBILE) { await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' }) }
await send('Page.enable')
if (process.env.PRELOAD) await send('Page.addScriptToEvaluateOnNewDocument', { source: process.env.PRELOAD }); await send('Page.navigate', { url }); await sleep(1500)
for (const [kind, arg] of steps) {
  if (kind === 'wait') await sleep(arg)
  else if (kind === 'eval') await send('Runtime.evaluate', { expression: arg })
  else if (kind === 'probe') console.log((await send('Runtime.evaluate', { expression: arg, returnByValue: true, awaitPromise: true })).result?.value)
  else if (kind === 'mouse') {
    const r = await send('Runtime.evaluate', { expression: arg, returnByValue: true })
    const { x, y } = JSON.parse(r.result.value)
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
  }
  else if (kind === 'tap') {
    const r = await send('Runtime.evaluate', { expression: arg, returnByValue: true })
    const { x, y } = JSON.parse(r.result.value)
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  else if (kind === 'shot') { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(arg, Buffer.from(r.data, 'base64')) }
}
ws.close(); chrome.kill()
