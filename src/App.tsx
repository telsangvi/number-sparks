import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useGameStore, tier2Unlocked, tier3Unlocked, UNLOCK_THRESHOLD } from './store/gameStore'

import { startAmbient, stopAmbient } from './utils/ambientMusic'
import NumberQuiz from './components/NumberQuiz'
import Summary from './components/Summary'
import CharacterBoy from './components/CharacterBoy'
import CharacterGirl from './components/CharacterGirl'
import MountainBackground from './components/MountainBackground'
import './index.css'

// ─── Rotate Gate ───────────────────────────────────────────────────────────────
function RotateGate() {
  return (
    <div className="rotate-gate fixed inset-0 z-[200] bg-indigo-950
      flex-col items-center justify-center gap-6 text-center px-6 select-none">
      <motion.div
        animate={{ rotate: [0, 0, 90, 90, 0] }}
        transition={{ repeat: Infinity, duration: 3, times: [0, 0.3, 0.55, 0.7, 1], ease: 'easeInOut' }}
        className="text-7xl"
      >
        📱
      </motion.div>
      <div>
        <p className="text-white text-2xl font-extrabold drop-shadow">Rotate your device</p>
        <p className="text-sky-300 text-sm mt-1.5 font-semibold">This game plays in landscape mode</p>
      </div>
    </div>
  )
}

// ─── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onStart}
      className="fixed inset-0 z-50 cursor-pointer select-none overflow-hidden"
    >
      <MountainBackground />
      <div className="relative z-10 flex h-full items-center justify-center">
        {/* Centre card */}
        <div className="flex flex-col items-center gap-5">
          <motion.div
            animate={{ scale: [1, 1.08, 1], y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="text-7xl drop-shadow-2xl"
          >
            🔢
          </motion.div>
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-white drop-shadow-2xl tracking-tight">
              Number Sparks
            </h1>
            <p className="text-sky-200 mt-1.5 text-base font-semibold">
              count · discover · explore
            </p>
          </div>
          <motion.div
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mt-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full
              px-6 py-2.5 text-white font-bold text-base"
          >
            Tap anywhere to start!
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Character Select ──────────────────────────────────────────────────────────
function CharacterSelect() {
  const { selectCharacter } = useGameStore()

  return (
    <motion.div
      key="character-select"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 overflow-hidden"
    >
      <MountainBackground />
      <div className="relative z-10 flex h-full items-center justify-center gap-12 px-8">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center shrink-0"
        >
          <h2 className="text-4xl font-extrabold text-white drop-shadow-2xl leading-tight">
            Who's<br />climbing<br />today?
          </h2>
          <p className="text-sky-200 text-sm mt-2 font-semibold">Pick your adventurer!</p>
        </motion.div>

        {/* Characters */}
        <div className="flex gap-8">
          {/* Boy */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.06, y: -10 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            onClick={() => selectCharacter('boy')}
            className="flex flex-col items-end bg-white/12 backdrop-blur-md
              hover:bg-white/22 border-2 border-white/25 hover:border-white/60
              rounded-3xl px-6 pt-4 pb-0 transition-all shadow-2xl overflow-hidden"
            style={{ minWidth: 155 }}
          >
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <CharacterBoy size={145} />
            </motion.div>
          </motion.button>

          {/* Girl */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.06, y: -10 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            onClick={() => selectCharacter('girl')}
            className="flex flex-col items-end bg-white/12 backdrop-blur-md
              hover:bg-white/22 border-2 border-white/25 hover:border-white/60
              rounded-3xl px-6 pt-4 pb-0 transition-all shadow-2xl overflow-hidden"
            style={{ minWidth: 155 }}
          >
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}>
              <CharacterGirl size={145} />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Tier Card ─────────────────────────────────────────────────────────────────
function TierCard({ label, sublabel, emoji, unlocked, correctSoFar, prerequisiteLabel, onClick }: {
  label: string; sublabel: string; emoji: string
  unlocked: boolean; correctSoFar: number; prerequisiteLabel?: string; onClick: () => void
}) {
  return (
    <motion.button
      whileTap={unlocked ? { scale: 0.96 } : {}}
      whileHover={unlocked ? { scale: 1.02, x: 4 } : {}}
      onClick={unlocked ? onClick : undefined}
      className={`w-full rounded-2xl p-4 text-left flex items-center gap-4 shadow transition-all
        ${unlocked ? 'bg-white/92 hover:bg-white cursor-pointer' : 'bg-white/35 cursor-not-allowed opacity-65'}`}
    >
      <div className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0
        ${unlocked ? 'bg-blue-100' : 'bg-gray-200/60'}`}>
        {unlocked ? emoji : '🔒'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-400 truncate">{sublabel}</p>
        {!unlocked && (
          <div className="mt-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${Math.min((correctSoFar / UNLOCK_THRESHOLD) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-blue-500 shrink-0 tabular-nums">{correctSoFar}/{UNLOCK_THRESHOLD}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              🔓 Complete {prerequisiteLabel ?? 'level above'}
            </p>
          </div>
        )}
      </div>
      {unlocked && <span className="text-blue-400 text-lg shrink-0">→</span>}
    </motion.button>
  )
}

// ─── Tier Select ───────────────────────────────────────────────────────────────
function TierSelect() {
  const { startSession, character, tier1Correct, tier2Correct } = useGameStore()
  const t2 = tier2Unlocked(tier1Correct)
  const t3 = tier3Unlocked(tier2Correct)
  const CharComponent = character === 'girl' ? CharacterGirl : CharacterBoy

  return (
    <motion.div
      key="tier-select"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 overflow-hidden"
    >
      <MountainBackground />
      <div className="relative z-10 flex h-full items-center justify-center gap-10 px-8">

        {/* Left: character + title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center gap-3 shrink-0"
        >
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <CharComponent size={110} />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white drop-shadow-xl">Number Sparks</h1>
            <p className="text-sky-200 text-xs font-semibold mt-0.5">Choose your challenge!</p>
          </div>
        </motion.div>

        {/* Right: tier cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col gap-3 w-64"
        >
          <TierCard label="Counting" sublabel="Numbers 1–10, next & before"
            emoji="1️⃣" unlocked correctSoFar={tier1Correct}
            onClick={() => startSession(1)} />
          <TierCard label="Up to 20" sublabel="Numbers 1–20 + missing numbers"
            emoji="2️⃣" unlocked={t2} correctSoFar={tier1Correct} prerequisiteLabel="Counting"
            onClick={() => startSession(2)} />
          <TierCard label="Challenge" sublabel="Mixed questions, all ranges"
            emoji="🔥" unlocked={t3} correctSoFar={tier2Correct} prerequisiteLabel="Up to 20"
            onClick={() => startSession(3)} />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { phase } = useGameStore()
  const [started, setStarted] = useState(false)
  const [musicOn, setMusicOn] = useState(true)

  const handleStart = () => {
    setStarted(true)
    startAmbient()
    // Request fullscreen on the user gesture — hides browser chrome on Android/desktop
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>
    }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
  }

  const toggleMusic = () => {
    if (musicOn) { stopAmbient(); setMusicOn(false) }
    else         { startAmbient(); setMusicOn(true)  }
  }

  return (
    <>
      {/* Portrait gate — always on top, CSS-only show/hide */}
      <RotateGate />

      <AnimatePresence>
        {!started && <SplashScreen onStart={handleStart} />}
      </AnimatePresence>

      {started && (
        <button
          onClick={toggleMusic}
          className="fixed top-3 right-4 z-50 text-xl text-white/60 hover:text-white transition-colors"
          title={musicOn ? 'Mute' : 'Play music'}
        >
          {musicOn ? '🔊' : '🔇'}
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'idle'    && <CharacterSelect key="character" />}
        {phase === 'tiers'   && <TierSelect      key="tiers" />}
        {phase === 'quiz'    && <NumberQuiz       key="quiz" />}
        {phase === 'summary' && <Summary          key="summary" />}
      </AnimatePresence>
    </>
  )
}
