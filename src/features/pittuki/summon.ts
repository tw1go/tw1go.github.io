export const PITTUKI_SUMMON_EVENT = 'pittuki:summon'

/**
 * Sends Pittuki out onto the wall right now, skipping the dice roll. Also
 * on `window.summonPittuki()` for the console. Ignored if he is already
 * out.
 */
export function summonPittuki(): void {
  window.dispatchEvent(new Event(PITTUKI_SUMMON_EVENT))
}

declare global {
  interface Window {
    summonPittuki?: typeof summonPittuki
  }
}

if (typeof window !== 'undefined') {
  window.summonPittuki = summonPittuki
}
