import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Tier, type NumberQuestion, UNLOCK_THRESHOLD, SESSION_SIZE, buildSession } from '../data/questions'

interface GameState {
  phase: 'idle' | 'character' | 'tiers' | 'quiz' | 'summary'
  character: 'boy' | 'girl' | null
  tier: Tier
  session: NumberQuestion[]
  currentIndex: number
  score: number
  streak: number
  maxStreak: number
  tier1Correct: number
  tier2Correct: number

  selectCharacter: (c: 'boy' | 'girl') => void
  startSession: (tier: Tier) => void
  recordCorrect: () => void
  resetStreak: () => void
  nextQuestion: () => void
  goIdle: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'idle',
      character: null,
      tier: 1,
      session: [],
      currentIndex: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      tier1Correct: 0,
      tier2Correct: 0,

      selectCharacter: (c) => set({ character: c, phase: 'tiers' }),

      startSession: (tier) => set({
        phase: 'quiz',
        tier,
        session: buildSession(tier),
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
      }),

      recordCorrect: () => set(s => {
        const newStreak = s.streak + 1
        const newMax    = Math.max(s.maxStreak, newStreak)
        const t1 = s.tier === 1 ? s.tier1Correct + 1 : s.tier1Correct
        const t2 = s.tier === 2 ? s.tier2Correct + 1 : s.tier2Correct
        return { score: s.score + 1, streak: newStreak, maxStreak: newMax, tier1Correct: t1, tier2Correct: t2 }
      }),

      resetStreak: () => set({ streak: 0 }),

      nextQuestion: () => {
        const { currentIndex, session } = get()
        if (currentIndex + 1 >= SESSION_SIZE || currentIndex + 1 >= session.length) {
          set({ phase: 'summary' })
        } else {
          set({ currentIndex: currentIndex + 1 })
        }
      },

      goIdle: () => set({ phase: 'tiers' }),
    }),
    {
      name: 'number-sparks-state',
      partialize: (s) => ({
        character: s.character,
        tier1Correct: s.tier1Correct,
        tier2Correct: s.tier2Correct,
      }),
    }
  )
)

export function tier2Unlocked(t1: number) { return t1 >= UNLOCK_THRESHOLD }
export function tier3Unlocked(t2: number) { return t2 >= UNLOCK_THRESHOLD }
export { UNLOCK_THRESHOLD }
