/** Which way she crosses the room. 1 is left to right. */
export type FairyDirection = 1 | -1

export interface SummonOptions {
  /** Force a direction. Random when omitted. */
  direction?: 'left-to-right' | 'right-to-left'
}

export const FAIRY_SUMMON_EVENT = 'fairy-cha:summon'

/**
 * Sends Fairy Cha across the room right now, skipping the dice roll.
 *
 * A window event rather than a React callback, so it can be called from
 * anywhere — another component, a test, or the browser console, where it
 * is exposed as `window.summonFairyCha()`. Ignored if she is already
 * flying, or if nothing is mounted to hear it.
 */
export function summonFairyCha(options: SummonOptions = {}): void {
  window.dispatchEvent(
    new CustomEvent<SummonOptions>(FAIRY_SUMMON_EVENT, { detail: options }),
  )
}

declare global {
  interface Window {
    summonFairyCha?: typeof summonFairyCha
  }
}

if (typeof window !== 'undefined') {
  window.summonFairyCha = summonFairyCha
}
