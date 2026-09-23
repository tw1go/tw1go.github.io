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
  'elli/idle': [
    'Systems nominal. Snack levels: critical. Someone should really restock the desk.',
    "I've been counting the hours twigo has been sitting here. I stopped at nine.",
    'Careful, the left monitor has been making a noise. I think it is thinking.',
    "If you're here about the portfolio: it's all around you. Have a look.",
    'Beep. That was a greeting. I have a whole speaker and I chose beep.',

    // The day job.
    'Day job: software developer. Night job: also software, just with more explosions.',
    'He says the build is nearly done. He has said that four times tonight. I am logging it.',
    'I watched him name a variable temp and then keep it for nine months.',

    // The gym.
    'Gym day. He will come back, sit down, and complain about stairs for a solid hour.',
    "He lifts heavy things and puts them back down. I asked why. He said 'gains'. Unresolved.",
    'He gets to the gym more often than he gets to main. Both numbers surprise me.',

    // Ramen and salmon sashimi, in strictly that order of volume.
    'Ask him about ramen. Do not ask him about ramen if you are in a hurry.',
    'Salmon sashimi is the one input that reliably improves his mood. I have the data.',
    'He rated a ramen place out of ten and gave it an eleven. I flagged the overflow.',
  ],
  /* Elli talking *about* Lulu. Keyed by who is being discussed rather
     than who is speaking — Elli has the only voice in the room. */
  lulu: [
    'She is greedy for treats. I have watched her negotiate for a third one. She won against twigo.',
    'When she is hungry she whines. Loudly. The whole house is informed.',
    'She has knocked two things off this desk today. I logged one. The other I understood.',
    'Do not let the collar fool you. Nobody has ever told Lulu what to do.',
    'She sleeps nineteen hours a day. I have checked this twice, hoping to be wrong.',
  ],
  /* Used instead of the pool above when Lulu is sat down or asleep, so
     her ignoring you reads as deliberate rather than as nothing having
     happened. */
  'lulu-resting': [
    "She's asleep. I would not.",
    'Nineteen hours a day. This is hour six.',
    'You can pet her. Once. Carefully.',
    'Do not wake her. I have seen it done. I would rather not see it twice.',
    'She is recharging. I sympathise, though I have a port for that.',
    'She can hear you. She has simply decided you are not worth opening an eye for.',
  ],
}

/**
 * Said the first time Lulu is clicked. Held out of the pool so it cannot
 * come round again later.
 */
export const LULU_INTRO =
  "That's Lulu, twigo's cat — and the actual owner of this desk."

/** What the pumpkin says to whoever disturbs it. */
export const PUMPKIN_SPEAKER = 'Biiiko Kalabasa'

const PUMPKIN_OPENER = "You've been pumpkined by the legendary Biiiko Kalabasa."

/**
 * The curse itself, drawn at random. Small and petty on purpose — a
 * curse you would genuinely resent is funnier than a dramatic one.
 */
const PUMPKIN_CURSES = [
  "Now you're cursed to plug every USB in the wrong way round. Twice. Every time.",
  'Now every notification you hear will belong to somebody else\u2019s phone.',
  'Now your headphone cable will find something to catch on. It will always find something.',
  'Now every chair you sit in is set to the wrong height by exactly one notch.',
  "Now you'll remember the word you were reaching for four hours after you stopped needing it.",
  'Now every queue you join becomes the slow one. Including this one.',
  'Now your phone hits one percent at the precise moment it matters.',
  "Now you'll wave back at someone who was waving at the person behind you.",
  'Now every pen you pick up writes for exactly two words.',
  'Now one sock is always faintly damp, and nobody will ever believe you.',
  'Now the bag of crisps opens from the bottom. Every bag. Forever.',
  "Now you'll reach the top of the stairs and forget entirely why you went up.",
]

export function pickPumpkinCurse(): string {
  const curse = PUMPKIN_CURSES[Math.floor(Math.random() * PUMPKIN_CURSES.length)]
  return `${PUMPKIN_OPENER} ${curse}`
}

/**
 * For when someone will not stop poking the cat. Read in order, so it
 * escalates the longer it goes on; the last one repeats.
 */
export const LULU_PESTER = [
  'Hey. Leave Lulu alone.',
  "You're getting her mad.",
  "You don't want a cat to be mad at you. Trust me on this.",
  'I am a robot and even I can see where this is going.',
  'Fine. When she bites, I am filing it under user error.',
]

/**
 * Elli's introduction, said only the first time she is clicked. Kept out
 * of the pool above rather than filtered out of it, so there is no way to
 * draw it again by accident on a later click.
 */
export const ELLI_INTRO =
  "Oh! You found me. I'm Elli — I keep twigo company while the renders finish."

export function pickLine(key: string): string | undefined {
  const lines = DIALOG_LINES[key]
  if (!lines?.length) return undefined
  return lines[Math.floor(Math.random() * lines.length)]
}
