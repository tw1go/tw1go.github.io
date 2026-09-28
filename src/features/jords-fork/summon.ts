export const JORDS_FORK_SUMMON_EVENT = 'jords-fork:summon'

/**
 * Starts the ritual right now, skipping the dice roll. Also on
 * `window.summonJordsFork()` for the console. Ignored if the fork is
 * already out.
 */
export function summonJordsFork(): void {
  window.dispatchEvent(new Event(JORDS_FORK_SUMMON_EVENT))
}

declare global {
  interface Window {
    summonJordsFork?: typeof summonJordsFork
  }
}

if (typeof window !== 'undefined') {
  window.summonJordsFork = summonJordsFork
}
