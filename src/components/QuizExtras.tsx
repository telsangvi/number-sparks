import { motion, AnimatePresence } from 'framer-motion'

export const TIMER_TOTAL = 15

export function getMilestone(streak: number): string | null {
  if (streak === 3)  return '🔥 On fire!'
  if (streak === 5)  return '⚡ Lightning!'
  if (streak === 10) return '🌟 Unstoppable!'
  return null
}

export function TimerBar({ timeLeft }: { timeLeft: number }) {
  const pct = (timeLeft / TIMER_TOTAL) * 100
  const color = pct > 50 ? '#22C55E' : pct > 25 ? '#F59E0B' : '#EF4444'
  return (
    <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}

export function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1 bg-orange-400 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow"
    >
      🔥 {streak} streak
    </motion.div>
  )
}

export function ComboFlash({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1.1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
            bg-yellow-300 text-yellow-900 font-extrabold text-2xl px-6 py-3 rounded-3xl shadow-xl pointer-events-none"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
