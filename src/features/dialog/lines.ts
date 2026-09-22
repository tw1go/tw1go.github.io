/**
 * What twigo says while drinking. One is picked at random per play.
 *
 * Keyed by sprite name so the upcoming interaction box can pull from the
 * same place without this becoming drink-specific.
 */
export const DIALOG_LINES: Record<string, string[]> = {
  'main-body/drinking': [
    'Gotta hydrate!',
    'Sip happens, stay hydrated.',
    "It's a pour decision not to drink up.",
    'Hydration in progress... Do not disturb.',
    'Brb, maximizing my liquid assets.',
    'Error 404: Thirst detected. Fixed',
    'Taking a quick fluid dynamic pause.',
    'Ah, pure liquid motivation.',
  ],
}

export function pickLine(key: string): string | undefined {
  const lines = DIALOG_LINES[key]
  if (!lines?.length) return undefined
  return lines[Math.floor(Math.random() * lines.length)]
}
