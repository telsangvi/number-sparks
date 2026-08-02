export type QuestionType = 'next' | 'before' | 'missing'
export type Tier = 1 | 2 | 3

export interface NumberQuestion {
  type: QuestionType
  prompt: string
  spoken: string
  answer: number
  options: number[]
  missingSeq?: (number | null)[]  // for 'missing' type display
}

export const UNLOCK_THRESHOLD = 10
export const SESSION_SIZE = 10

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function generateOptions(answer: number, min: number, max: number): number[] {
  const pool = new Set<number>()
  const offsets = shuffle([-3, -2, -1, 1, 2, 3])
  for (const d of offsets) {
    const n = answer + d
    if (n >= min && n <= max && n !== answer) pool.add(n)
    if (pool.size >= 3) break
  }
  // fallback: any valid number not already in pool
  let attempts = 0
  while (pool.size < 3 && attempts < 50) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min
    if (n !== answer) pool.add(n)
    attempts++
  }
  return shuffle([answer, ...Array.from(pool).slice(0, 3)])
}

function buildNext(min: number, max: number): NumberQuestion {
  const n = Math.floor(Math.random() * (max - min)) + min  // n in [min, max-1]
  const answer = n + 1
  return {
    type: 'next',
    prompt: `What comes after ${n}?`,
    spoken: `What comes after ${n}?`,
    answer,
    options: generateOptions(answer, min, max),
  }
}

function buildBefore(min: number, max: number): NumberQuestion {
  const n = Math.floor(Math.random() * (max - min)) + min + 1  // n in [min+1, max]
  const answer = n - 1
  return {
    type: 'before',
    prompt: `What comes before ${n}?`,
    spoken: `What comes before ${n}?`,
    answer,
    options: generateOptions(answer, min, max),
  }
}

function buildMissing(min: number, max: number): NumberQuestion {
  // pick a number that has room for a 4-item sequence around it
  const start = Math.floor(Math.random() * (max - min - 2)) + min  // start in [min, max-3]
  // sequence: start, start+1, ?, start+3   → answer = start+2
  const answer = start + 2
  const seq: (number | null)[] = [start, start + 1, null, start + 3]
  return {
    type: 'missing',
    prompt: `Fill in the missing number!`,
    spoken: `What is the missing number?`,
    answer,
    options: generateOptions(answer, min, max),
    missingSeq: seq,
  }
}

export function buildSession(tier: Tier): NumberQuestion[] {
  const [min, max] = [1, tier === 1 ? 10 : 20]
  const qs: NumberQuestion[] = []

  if (tier === 1) {
    // 5 next + 5 before
    for (let i = 0; i < 5; i++) qs.push(buildNext(min, max))
    for (let i = 0; i < 5; i++) qs.push(buildBefore(min, max))
  } else {
    // 4 next + 3 before + 3 missing
    for (let i = 0; i < 4; i++) qs.push(buildNext(min, max))
    for (let i = 0; i < 3; i++) qs.push(buildBefore(min, max))
    for (let i = 0; i < 3; i++) qs.push(buildMissing(min, max))
  }

  return shuffle(qs)
}
