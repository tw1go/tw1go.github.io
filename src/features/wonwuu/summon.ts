export interface WonwuuSummonOptions {
  /** Which edge he sneaks in from. Random when omitted. */
  from?: 'left' | 'right'
}

export const WONWUU_SUMMON_EVENT = 'wonwuu:summon'

/**
 * Sends Wonwuu into the room right now, skipping the dice roll. Also on
 * `window.summonWonwuu()` for the console. Ignored if he is already out.
 */
export function summonWonwuu(options: WonwuuSummonOptions = {}): void {
  window.dispatchEvent(
    new CustomEvent<WonwuuSummonOptions>(WONWUU_SUMMON_EVENT, { detail: options }),
  )
}

declare global {
  interface Window {
    summonWonwuu?: typeof summonWonwuu
  }
}

if (typeof window !== 'undefined') {
  window.summonWonwuu = summonWonwuu
}
