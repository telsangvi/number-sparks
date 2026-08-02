import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { SESSION_SIZE } from '../data/questions'
import { speak } from '../utils/speech'
import CharacterBoy from './CharacterBoy'
import CharacterGirl from './CharacterGirl'
import MountainBackground from './MountainBackground'

export default function Summary() {
  const { score, maxStreak, character, goIdle } = useGameStore()
  const total = SESSION_SIZE
  const pct   = Math.round((score / total) * 100)

  useEffect(() => {
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.4 },
      colors: ['#3B82F6','#A78BFA','#34D399','#FCD34D','#F472B6'] })
    if (pct === 100)    speak('Perfect score! You are a number superstar!')
    else if (pct >= 70) speak('Great job! You did amazing!')
    else                speak('Good try! Keep practising!')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const CharComponent = character === 'girl' ? CharacterGirl : CharacterBoy
  const ring   = 2 * Math.PI * 48
  const filled = ring * (pct / 100)

  return (
    <div className="fixed inset-0 overflow-hidden">
      <MountainBackground />

      <div className="relative z-10 flex h-full items-center justify-center gap-10 px-8">

        {/* Left: character celebrating */}
        <motion.div
          animate={{ y: [0, -22, 0, -14, 0] }}
          transition={{ duration: 1.2, repeat: 2, ease: 'easeOut' }}
          className="shrink-0"
          style={{ filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.65))' }}
        >
          <CharComponent size={120} />
        </motion.div>

        {/* Right: score card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.1 }}
          className="flex flex-col items-center gap-5 bg-black/40 backdrop-blur-md
            border border-white/15 rounded-3xl px-8 py-6 shadow-2xl"
        >
          <h2 className="text-2xl font-extrabold text-white drop-shadow">Session Complete!</h2>

          {/* Score ring */}
          <div className="relative flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#34D399" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${ring}`}
                strokeDashoffset={ring / 4}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-extrabold text-white">{pct}%</p>
              <p className="text-xs text-white/55">{score}/{total}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-yellow-300">{score}</p>
              <p className="text-xs text-white/55">Correct</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-orange-300">🔥 {maxStreak}</p>
              <p className="text-xs text-white/55">Best streak</p>
            </div>
          </div>

          {/* Emoji rating */}
          <p className="text-3xl">
            {pct === 100 ? '🏆' : pct >= 70 ? '⭐⭐⭐' : pct >= 50 ? '⭐⭐' : '⭐'}
          </p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.04 }}
            onClick={goIdle}
            className="bg-white text-indigo-700 font-extrabold text-base px-8 py-3 rounded-2xl shadow-xl"
          >
            Play Again 🎮
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
