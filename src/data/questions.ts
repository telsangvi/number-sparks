export type QuestionType =
  | 'next' | 'before' | 'missing' | 'skip'
  | 'count' | 'biggest' | 'smallest'
  | 'even'  | 'odd'    | 'double'
  | 'wordname' | 'between'

export type Tier = 1 | 2 | 3

export interface NumberQuestion {
  type:       QuestionType
  prompt:     string
  spoken:     string
  answer:     number
  options:    number[]
  missingSeq?: (number | null)[]  // 'missing' and 'skip'
  emoji?:      string              // 'count'
  emojiCount?: number              // 'count'  (same as answer, explicit for render)
  wordLabel?:  string              // 'wordname'
}

export const UNLOCK_THRESHOLD = 10
export const SESSION_SIZE = 6

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function generateOptions(answer: number, min: number, max: number): number[] {
  const pool = new Set<number>()
  for (const d of shuffle([-3, -2, -1, 1, 2, 3])) {
    const n = answer + d
    if (n >= min && n <= max && n !== answer) pool.add(n)
    if (pool.size >= 3) break
  }
  let tries = 0
  while (pool.size < 3 && tries++ < 50) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min
    if (n !== answer) pool.add(n)
  }
  return shuffle([answer, ...Array.from(pool).slice(0, 3)])
}

// ── Builders ──────────────────────────────────────────────────────────────────

function buildNext(min: number, max: number): NumberQuestion {
  const n = Math.floor(Math.random() * (max - min)) + min
  const answer = n + 1
  return { type: 'next', prompt: `What comes after ${n}?`, spoken: `What comes after ${n}?`, answer, options: generateOptions(answer, min, max) }
}

function buildBefore(min: number, max: number): NumberQuestion {
  const n = Math.floor(Math.random() * (max - min)) + min + 1
  const answer = n - 1
  return { type: 'before', prompt: `What comes before ${n}?`, spoken: `What comes before ${n}?`, answer, options: generateOptions(answer, min, max) }
}

function buildMissing(min: number, max: number): NumberQuestion {
  const start = Math.floor(Math.random() * (max - min - 2)) + min
  const answer = start + 2
  return {
    type: 'missing', prompt: 'Fill in the missing number!', spoken: 'What is the missing number?',
    answer, options: generateOptions(answer, min, max),
    missingSeq: [start, start + 1, null, start + 3],
  }
}

function buildSkip(min: number, max: number, step: number): NumberQuestion {
  const maxStart = max - 3 * step
  if (maxStart < min) return buildNext(min, max)
  const start = Math.floor(Math.random() * (maxStart - min + 1)) + min
  const answer = start + 3 * step
  return {
    type: 'skip', prompt: 'What comes next in the pattern?', spoken: 'What is the next number in the pattern?',
    answer, options: generateOptions(answer, min, Math.min(max, answer + step * 2)),
    missingSeq: [start, start + step, start + 2 * step, null],
  }
}

const COUNT_EMOJIS = ['🐸', '⭐', '🦋', '🍎', '🌸', '🐝', '🐠', '🦄', '🐢', '🎈']
const EMOJI_SPOKEN: Record<string, string> = {
  '🐸':'frogs','⭐':'stars','🦋':'butterflies','🍎':'apples',
  '🌸':'flowers','🐝':'bees','🐠':'fish','🦄':'unicorns','🐢':'turtles','🎈':'balloons',
}

function buildCount(): NumberQuestion {
  const answer = Math.floor(Math.random() * 8) + 2   // 2–9 emojis
  const emoji  = COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)]
  return {
    type: 'count',
    prompt: `How many ${emoji} do you see?`,
    spoken: `How many ${EMOJI_SPOKEN[emoji] ?? 'things'} do you see?`,
    answer, options: generateOptions(answer, 1, 10),
    emoji, emojiCount: answer,
  }
}

function buildBiggest(min: number, max: number): NumberQuestion {
  const pool = new Set<number>()
  while (pool.size < 4) pool.add(Math.floor(Math.random() * (max - min + 1)) + min)
  const nums = shuffle(Array.from(pool))
  return { type: 'biggest', prompt: 'Tap the biggest number!', spoken: 'Which is the biggest number?', answer: Math.max(...nums), options: nums }
}

function buildSmallest(min: number, max: number): NumberQuestion {
  const pool = new Set<number>()
  while (pool.size < 4) pool.add(Math.floor(Math.random() * (max - min + 1)) + min)
  const nums = shuffle(Array.from(pool))
  return { type: 'smallest', prompt: 'Tap the smallest number!', spoken: 'Which is the smallest number?', answer: Math.min(...nums), options: nums }
}

function buildEven(min: number, max: number): NumberQuestion {
  const evens: number[] = [], odds: number[] = []
  for (let n = min; n <= max; n++) (n % 2 === 0 ? evens : odds).push(n)
  const answer = evens[Math.floor(Math.random() * evens.length)]
  return { type: 'even', prompt: 'Which number is even?', spoken: 'Which number is even?', answer, options: shuffle([answer, ...shuffle(odds).slice(0, 3)]) }
}

function buildOdd(min: number, max: number): NumberQuestion {
  const evens: number[] = [], odds: number[] = []
  for (let n = min; n <= max; n++) (n % 2 === 0 ? evens : odds).push(n)
  const answer = odds[Math.floor(Math.random() * odds.length)]
  return { type: 'odd', prompt: 'Which number is odd?', spoken: 'Which number is odd?', answer, options: shuffle([answer, ...shuffle(evens).slice(0, 3)]) }
}

function buildDouble(_min: number, max: number): NumberQuestion {
  const n = Math.floor(Math.random() * Math.floor(max / 2)) + 1
  const answer = n * 2
  return { type: 'double', prompt: `What is double ${n}?`, spoken: `What is double ${n}?`, answer, options: generateOptions(answer, 2, max) }
}

const NUMBER_WORDS: Record<number, string> = {
  1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',
  11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',
  16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen',20:'twenty',
}

function buildWordName(min: number, max: number): NumberQuestion {
  const answer = Math.floor(Math.random() * (max - min + 1)) + min
  const word   = NUMBER_WORDS[answer] ?? String(answer)
  return {
    type: 'wordname', prompt: 'Find the number', spoken: `Find the number ${word}`,
    answer, options: generateOptions(answer, min, max), wordLabel: word,
  }
}

function buildBetween(min: number, max: number): NumberQuestion {
  const x = Math.floor(Math.random() * (max - min - 1)) + min
  const answer = x + 1
  return {
    type: 'between',
    prompt: `Which comes between ${x} and ${x + 2}?`,
    spoken: `Which number comes between ${x} and ${x + 2}?`,
    answer, options: generateOptions(answer, min, max),
  }
}

// ── Session builders ──────────────────────────────────────────────────────────

export function buildSession(tier: Tier): NumberQuestion[] {
  let qs: NumberQuestion[]

  if (tier === 1) {
    // Tier 1 (1–10) — visual and sequential, friendly for youngest kids
    qs = [
      buildNext(1, 10),
      buildBefore(1, 10),
      buildCount(),
      buildBiggest(1, 10),
      buildSmallest(1, 10),
      buildWordName(1, 10),
    ]
  } else if (tier === 2) {
    // Tier 2 (1–20) — arithmetic concepts introduced
    qs = [
      buildNext(1, 20),
      buildMissing(1, 20),
      buildEven(1, 20),
      buildDouble(1, 20),
      buildBetween(1, 20),
      buildCount(),
    ]
  } else {
    // Tier 3 — Challenge: patterns, odd/even, skip counting, word names
    qs = [
      buildMissing(1, 20),
      buildSkip(1, 20, 2),
      buildDouble(1, 20),
      buildOdd(1, 20),
      buildBetween(1, 20),
      buildWordName(1, 20),
    ]
  }

  return shuffle(qs)
}
