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

/** Who speaks when Fairy Cha is caught. */
export const FAIRY_SPEAKER = 'Fairy Cha'

const FAIRY_OPENER =
  "Oh! You caught me. Only the luckiest people ever get to see Fairy Cha — so count yourself one of them. I'm twigo's lover, by the way, and he'll be so jealous I stopped for you. So here, a blessing:"

/**
 * The pumpkin's curses turned inside out, one for one. Kept just as small
 * and specific — a blessing you can actually picture coming true lands
 * better than a grand one.
 */
const FAIRY_BLESSINGS = [
  'May every USB you plug in go in the right way round. First try. Every time.',
  'May every notification you hear be good news — and actually be yours.',
  'May your headphone cable never catch on a single door handle again.',
  'May every chair you sit in already be set to exactly the right height.',
  'May the word you are reaching for arrive the very moment you need it.',
  'May every queue you join suddenly turn into the fast one.',
  'May your phone sit at a hundred percent exactly when it matters most.',
  'May everyone waving in your direction really be waving at you.',
  'May every pen you pick up write like it came out of the box today.',
  'May both of your socks stay perfectly, reliably dry. Forever.',
  'May every bag of crisps open cleanly along the top. Every bag.',
  "May you always reach the top of the stairs remembering why you went up.",
]

export function pickFairyBlessing(): string {
  const blessing =
    FAIRY_BLESSINGS[Math.floor(Math.random() * FAIRY_BLESSINGS.length)]
  return `${FAIRY_OPENER} ${blessing}`
}

/** Who speaks when Wonwuu is caught. */
export const WONWUU_SPEAKER = 'Wonwuu the Wandering Rat'

/*
 * The pumpkin curses you and the fairy blesses you. Wonwuu does neither:
 * he is a small-time thief with a strict code, and the code says every
 * theft is a trade. What he takes and what he leaves are drawn
 * separately, so the pairings keep surprising — and the exchange rate is
 * always, reliably, in his favour.
 */
const WONWUU_OPENERS = [
  "Squeak! Nobody spots Wonwuu. Fine. You know the rules — I'm a thief, but I'm a fair one.",
  "You saw me. That's rude. Seeing a rat means a toll, and I'm collecting it now.",
  "Caught, am I? Not for long. But a gentleman never leaves empty-handed. Or without leaving something.",
  // Jord, of the fork, is his night-shift friend: both of them up when
  // they have no business being.
  "Squeak! Jord said you'd come snooping. He's my night-shift buddy — we're both up when we shouldn't be. Anyway. The toll.",
]

/** What he makes off with. */
const WONWUU_TAKES = [
  'the last bite of your snack',
  'your left sock — just the left one',
  'the charger you were about to look for',
  'the good pen',
  'every hair tie you have ever owned',
  'your spot in the queue',
  'the lid to your favourite container',
  'the password you swore you would remember',
  'the crispy bit at the bottom of the pan',
  'one AirPod, and I picked which',
  'the word that was on the tip of your tongue',
  'the ten minutes you had spare this morning',
]

/** What he leaves behind in exchange. Always worse. Always. */
const WONWUU_LEAVES = [
  'a single crouton',
  'a button off a coat you do not own',
  'a slightly damp raisin',
  'a receipt for someone else’s shopping',
  'half a paperclip',
  'one sock — a different one',
  'a very small, very confident pebble',
  'a crumb of an unknown biscuit',
  'a key to a door that no longer exists',
  'a sunflower seed, pre-sniffed',
  'the pen that almost works',
  'a strand of cheese. For luck.',
  // His mortal enemy, the lizard on the wall.
  "the business card of a lizard who calls himself a doctor. Don't book. He bills by the minute",
]

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

export function pickWonwuuTrade(): string {
  return `${pick(WONWUU_OPENERS)} I'll be taking ${pick(WONWUU_TAKES)}, and leaving you ${pick(WONWUU_LEAVES)}. Pleasure doing business. Squeak.`
}

/** Who speaks when Jord's Fork is caught. */
export const JORDS_FORK_SPEAKER = "Jord's Fork"

/*
 * The pumpkin curses, the fairy blesses, the rat trades. The fork
 * foretells.
 *
 * It belongs to Jord, a friend of twigo's from online: works the night
 * shift, runs on four or five hours of sleep, witty, and constitutionally
 * incapable of doing what he is told. The fork has taken after him. It
 * introduces itself with all the dread a flaming trident can muster,
 * then delivers a prophecy that is completely ordinary — and certain to
 * come true. Jord and Wonwuu are friends, which comes up.
 */
const JORDS_FORK_OPENERS = [
  "Mortal. You have laid a hand on the Fork of Jord — forged on the night shift, tempered on four hours of sleep, sworn enemy of every alarm clock ever made. It has seen your future:",
  "Kneel. Or don't — Jord never does. I am his Fork, the flame that clocks in when the sun clocks out. I have seen what is coming for you:",
  "You summoned me at an hour when Jord is either still at work or pretending he is about to sleep. Either way, the Fork sees all. Hear it:",
]

const JORDS_FORK_PROPHECIES = [
  // His, in spirit.
  'You will set five alarms tomorrow. You will snooze all five, and Jord will call it a warm-up.',
  "Tonight you will say 'one more episode' and mean four. Jord respects the rebellion.",
  'Someone will tell you to get an early night. You will not. Jord is quietly proud of you.',
  'You will call four hours of sleep "basically a full night". You are one of us now.',
  'Your coffee will go cold before you drink it. You will drink it anyway, like a professional.',
  'You will be told there is a rule. You will ask "says who?" and nobody will have an answer.',
  // Ordinary, and inescapable.
  "Before the week is out, a waiter will say 'enjoy your meal' and you will answer 'you too'.",
  'A door will say PULL. You will push. It was always going to be this way.',
  'You will open the fridge three times in a row, as though its contents might have changed.',
  "Your next 'quick five-minute task' will take the entire afternoon.",
  'You will find the thing you lost the moment after you buy a replacement.',
  'You will say goodbye to someone, then walk off in the same direction as them.',
]

const JORDS_FORK_CLOSERS = [
  'So it is foretold.',
  "So it is foretold. If you see a rat called Wonwuu, he's with us — Jord vouches for him.",
  'So it is foretold. Now go to sleep. One of us should.',
  'So it is foretold. Jord would add something witty here, but his shift just started.',
]

export function pickJordsProphecy(): string {
  return `${pick(JORDS_FORK_OPENERS)} ${pick(JORDS_FORK_PROPHECIES)} ${pick(JORDS_FORK_CLOSERS)}`
}

/** Who speaks when Pittuki is caught. */
export const PITTUKI_SPEAKER = 'Dr. Pittuki'

/*
 * The pumpkin curses, the fairy blesses, the rat trades, the fork
 * foretells. Pittuki diagnoses.
 *
 * A house lizard and a psychiatrist: dark sense of humour, a weakness
 * for spending money and for matcha, and underneath all of it extra,
 * extra kind. So a session goes diagnosis, prescription, then something
 * genuinely warm to finish. He and Wonwuu are mortal enemies — in real
 * life it is friendly banter, here it is war.
 */
const PITTUKI_OPENERS = [
  'Ah. Dr. Pittuki — house lizard, licensed psychiatrist. Lie back. The wall is fine, I do all my sessions up here. Now, then.',
  "Come in, come in. Dr. Pittuki. If you've met the rat, I'm so sorry. Nobody should have to meet the rat. Let's begin.",
  "Dr. Pittuki will see you now. I've read your file. Twice. Honestly, a page-turner.",
]

const PITTUKI_DIAGNOSES = [
  "you've been saying you're 'fine' for years. Clinically, that is a scream wearing a nice jumper.",
  'you doom-scroll at 2am like it is a job. It does not pay, and the benefits are terrible.',
  'you apologise to furniture when you walk into it. The furniture is fine. You should be too.',
  'forty tabs open, because closing one feels like a small death. It is. Close them anyway.',
  "you make the joke about your own misfortune before anyone else can. Textbook. Also, genuinely funny.",
  "you're running on caffeine and spite, and the spite is load-bearing.",
  "you've said 'I'll sleep when I'm dead' so often your body has started treating it as a booking.",
  'you replay one conversation from years ago every night. The other person has forgotten it. They may also have been eaten by something. Let it go.',
  "you've been talking to a rat called Wonwuu. That alone explains a great deal.",
]

const PITTUKI_PRESCRIPTIONS = [
  'one iced matcha latte, oat milk, taken immediately',
  'buy the thing sitting in your basket. Yes, that one. Checkout is a clinical procedure',
  'ceremonial-grade matcha, and something small and unnecessary from a shop with nice lighting',
  'retail therapy, twice daily, with meals',
  'a matcha, a nap, and one purchase you cannot quite justify',
  "treat yourself. I've already put it on your card. No, don't thank me",
]

const PITTUKI_CLOSERS = [
  "And listen — you're doing so much better than you think. I mean it. This session's free. For you, always.",
  "Also, I'm proud of you. That isn't in my notes. It's just true.",
  "Be gentle with yourself today. Doctor's orders. The matcha's on me.",
  'And whatever that rat told you: you are wonderful, and he is a rat.',
]

export function pickPittukiSession(): string {
  return `${pick(PITTUKI_OPENERS)} Diagnosis: ${pick(PITTUKI_DIAGNOSES)} Prescription: ${pick(PITTUKI_PRESCRIPTIONS)}. ${pick(PITTUKI_CLOSERS)}`
}

/** Who speaks when Croakyangs is found. */
export const CROAK_SPEAKER = 'Croakyangs'

/*
 * The pumpkin curses, the fairy blesses, the rat trades, the fork
 * foretells, the lizard diagnoses. Croakyangs serenades.
 *
 * A friend of twigo's, and a frog because on night after night of group
 * calls there was a frog audible in his background. He is lonesome —
 * out of a bad relationship and looking for someone who will stay — so
 * every song is a love song, a little bruised and a lot hopeful.
 */
const CROAK_OPENERS = [
  "Oh — you found me. Everyone on the group call can always hear me, nobody ever finds me. Croakyangs. This one's for you:",
  "Every night someone on the call says 'wait, is that a frog?'. Yes. It's me. It's always been me. Anyway, I wrote a song:",
  "Shh. Don't open the curtain all the way, the moon's doing my lighting. Croakyangs, singer, frog, currently single. Ahem:",
]

/* Two lines each, written for him. The '/' is sung as a pause. */
const CROAK_SONGS = [
  "I sat by the window and sang to the rain / the rain didn't answer — it's my ex all over again",
  'One lily pad, and a table for two / the second chair is empty, and it is waiting for you',
  "They said that I croak too much, loudly, at night / they just never learned how to listen right",
  "I'm on every group call, just out of view / singing in the background, singing it for you",
  'My last love was a pond full of rain gone sour / now I am clean water, and I bloom by the hour',
  "Kiss me and maybe I'll turn into a prince / or don't — I'm still lovely, I've been lovely since",
  "The moon's in the window, the curtain's half drawn / I'll sing until somebody stays until dawn",
  'I gave all my flies to a heart that was cold / now I am saving the warm ones for someone to hold',
]

const CROAK_CLOSERS = [
  'Too much? My ex said it was too much. Anyway. Are you single? No pressure. Croak.',
  'If you know anyone who likes a frog with feelings, tell them where the window is.',
  "That one's for whoever's out there. I'll be here. I'm always here. Croak.",
  'Thank you, thank you. Tips accepted in flies. And in love — mostly love.',
]

export function pickCroakSong(): string {
  // The song on a line of its own, so it reads as sung rather than said.
  return `${pick(CROAK_OPENERS)}\n♪ ${pick(CROAK_SONGS)} ♪\n${pick(CROAK_CLOSERS)}`
}

/*
 * twigo while a game is running on his Discord. `{game}` is filled in
 * with its name. Kept short: these share the speech bubble with the
 * drinking lines, above his head, and a long one would bury the room.
 */
const GAME_START = [
  'Booting up {game}. Wish me luck.',
  'Okay. {game}. Just one round.',
  "Loading into {game}. Don't talk to me.",
  '{game} time. Hydrated? No. Ready? Yes.',
]

const GAME_END = [
  'GG. {game} is done with me.',
  "That's enough {game} for now. Probably.",
  'Logging off {game}. My back thanks me.',
  "{game} closed. I'll be back. I'm always back.",
]

const GAME_CHATTER = [
  'Locked in.',
  'One more round. Then I stop. Definitely.',
  'Shh. {game} is getting good.',
  'Was that lag? That was lag.',
  "I'm not tilted. You're tilted.",
  'Focus mode: on. Snacks: gone.',
  "Still in {game}. Don't wait up.",
  'Clip it. Somebody clip that.',
]

/*
 * The games twigo actually plays get their own lines. Keyed by a
 * normalised name — lower case, letters and digits only — so however
 * Discord styles it ("VALORANT", "Dota 2", "PEAK") it still matches.
 */
const GAME_SPECIFIC: Record<string, string[]> = {
  phasmophobia: [
    'Is it cold in here, or is that the ghost?',
    'The EMF just hit five. I am not okay.',
    "I'm not scared. I'm just hiding in the van.",
    'Spirit box says hi. I did not say hi back.',
  ],
  apexlegends: [
    'Third party. Of course it is a third party.',
    'Champion squad? That is us. Hopefully.',
    'Hot drop. Instant regret.',
    'One shot. They were ONE shot.',
  ],
  valorant: [
    'One tap. Or one miss. Mostly the miss.',
    'Eco round again. Classic.',
    "Planting the spike. Nobody push. Please don't push.",
    'Clutch or kick. No pressure.',
  ],
  leagueoflegends: [
    'Where was the jungle? Where is the jungle ever?',
    'Ganked again. Bot lane is a war crime.',
    'Typing /ff at fifteen. Respectfully.',
    'Just one more game. League said, "no".',
  ],
  crystalofatlan: [
    'Combo into combo into combo. Beautiful.',
    'Dungeon run. Wish me loot.',
    'Magitech is just magic with extra steps.',
  ],
  aniimo: [
    'Got to catch that one. Look at its little face.',
    'My team is adorable and deeply unserious.',
    'One more Aniimo. Then bed. Then one more.',
  ],
  peak: [
    'Stamina gone. Hands gone. Friends gone.',
    'Nobody look down. I looked down.',
    'We are going to reach the top. Probably.',
  ],
  dota2: [
    'Forty minutes in. Forty more to go.',
    'Somebody take Roshan. Anybody. Please.',
    "Denied. Don't ask me what, just denied.",
  ],
  deadlock: [
    'Farming souls like a responsible adult.',
    'Lane is mine. The lane is everyone\'s, actually.',
    'Zipline, zipline, dead.',
  ],
  teamfighttactics: [
    'Rolling down. Again. For the last time. Again.',
    'Top four is a win. Top four is a WIN.',
    'Augments have forsaken me.',
    "Hitting the three-star. Don't breathe.",
  ],
  minecraft: ['Just one more block. Then bed.', 'Heard a creeper. Did not see it.'],
}

const gameKey = (game: string) => game.toLowerCase().replace(/[^a-z0-9]/g, '')

const fill = (line: string, game: string) => line.replaceAll('{game}', game)

export function gameStartLine(game: string): string {
  return fill(pick(GAME_START), game)
}

export function gameEndLine(game: string): string {
  return fill(pick(GAME_END), game)
}

export function gameChatterLine(game: string): string {
  const own = GAME_SPECIFIC[gameKey(game)] ?? []
  // Half the time from the game's own lines, if it has any.
  const pool = own.length && Math.random() < 0.5 ? own : GAME_CHATTER
  return fill(pick(pool), game)
}
