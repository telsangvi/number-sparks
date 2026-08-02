import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameStore } from '../store/gameStore'
import { speak } from '../utils/speech'
import { SESSION_SIZE } from '../data/questions'
import { TimerBar, StreakBadge, ComboFlash, getMilestone, TIMER_TOTAL } from './QuizExtras'
import FloatingStone from './FloatingStone'
import CharacterBoy from './CharacterBoy'
import CharacterGirl from './CharacterGirl'
import MountainBackground from './MountainBackground'

type AnswerState = 'idle' | 'correct' | 'wrong' | 'disabled'
type CharState   = 'idle' | 'celebrate' | 'wrong'
type FlashType   = 'none' | 'correct' | 'wrong'

interface Bubble { text: string; emoji: string }

// ── Journey path: 6 stones evenly spread across the chasm ─────────────────────
// left = horizontal centre of stone (%), bottom = stone container bottom (%)
const JOURNEY_STONES = [
  { left: 14 },
  { left: 26 },
  { left: 39 },
  { left: 52 },
  { left: 65 },
  { left: 78 },
]
const STONE_BOTTOM     = 40   // % from bottom — all path stones float at this height
const CHAR_FEET_BOTTOM = 50   // % — character feet (stone top ≈ STONE_BOTTOM + 10%)

// charStoneIdx meaning:
//   0          = left cliff (start, before any correct answer)
//   1 … n      = on stone n-1
//   SESSION_SIZE+1 = right cliff (all correct!)
const LEFT_CLIFF  = { left:  4, bottom: CHAR_FEET_BOTTOM }
const RIGHT_CLIFF = { left: 92, bottom: CHAR_FEET_BOTTOM }

function charPosition(idx: number): { left: number; bottom: number } {
  if (idx <= 0)              return LEFT_CLIFF
  if (idx > SESSION_SIZE)    return RIGHT_CLIFF
  return { left: JOURNEY_STONES[idx - 1].left, bottom: CHAR_FEET_BOTTOM }
}

// ── Journey stone visual marker ────────────────────────────────────────────────
function JourneyMarker({ state }: { state: 'done' | 'current' | 'upcoming' }) {
  const base: React.CSSProperties = {
    width: 54, height: 32, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.4s',
  }
  if (state === 'done') return (
    <motion.div
      style={{ ...base, background: 'rgba(6,78,59,0.92)', border: '2px solid #34D399',
        boxShadow: '0 0 14px rgba(52,211,153,0.55)' }}
      initial={{ scale: 0.8 }} animate={{ scale: 1 }}
    >
      <span style={{ color: '#34D399', fontSize: 16, fontWeight: 800 }}>✓</span>
    </motion.div>
  )
  if (state === 'current') return (
    <motion.div
      style={{ ...base, background: 'rgba(92,46,8,0.92)', border: '2px solid #D97706',
        boxShadow: '0 0 18px rgba(217,119,6,0.65)' }}
      animate={{ boxShadow: ['0 0 14px rgba(217,119,6,0.5)', '0 0 26px rgba(217,119,6,0.9)', '0 0 14px rgba(217,119,6,0.5)'] }}
      transition={{ duration: 1.4, repeat: Infinity }}
    />
  )
  return (
    <div style={{ ...base, background: 'rgba(20,14,8,0.55)', border: '2px solid #3A2A18' }} />
  )
}

// ── Timer hook ─────────────────────────────────────────────────────────────────
function useTimer(onExpire: () => void, active: boolean) {
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL)
  const cbRef    = useRef(onExpire)
  const firedRef = useRef(false)
  cbRef.current  = onExpire
  useEffect(() => {
    firedRef.current = false
    setTimeLeft(TIMER_TOTAL)
    if (!active) return
    const id = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(id); return 0 } return t - 1 }), 1000)
    return () => clearInterval(id)
  }, [active])
  useEffect(() => {
    if (active && timeLeft === 0 && !firedRef.current) { firedRef.current = true; cbRef.current() }
  }, [active, timeLeft]) // eslint-disable-line
  return timeLeft
}

// ── Main component ─────────────────────────────────────────────────────────────
const CORRECT_PHRASES = [
  (n: number) => `Yes! ${n}!`,
  (n: number) => `${n}! Amazing!`,
  (n: number) => `Brilliant! ${n}!`,
  (n: number) => `You got it! ${n}!`,
]
const CORRECT_BUBBLES = ['Yes!', 'Yay!', 'Perfect!', '🎉']
const WRONG_BUBBLES   = ['Oops!', 'Try again!', 'Careful!']

export default function NumberQuiz() {
  const { session, currentIndex, character, streak, recordCorrect, resetStreak, nextQuestion } = useGameStore()
  const q = session[currentIndex]

  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['idle','idle','idle','idle'])
  const [charState,    setCharState]    = useState<CharState>('idle')
  const [answered,     setAnswered]     = useState(false)
  const [wasWrong,     setWasWrong]     = useState(false)
  const [comboText,    setComboText]    = useState<string | null>(null)
  const [flash,        setFlash]        = useState<FlashType>('none')
  const [bubble,       setBubble]       = useState<Bubble | null>(null)
  const [jumping,      setJumping]      = useState(false)
  const [reachedEnd,   setReachedEnd]   = useState(false)

  // Character's journey position (0 = left cliff, 1-6 = stones, 7 = right cliff)
  const [charStoneIdx, setCharStoneIdx] = useState(0)
  const [charPos,      setCharPos]      = useState(LEFT_CLIFF)
  const posControls = useAnimation()

  const showBubble = (text: string, emoji: string) => {
    setBubble({ text, emoji })
    setTimeout(() => setBubble(null), 1600)
  }
  const triggerFlash = (type: FlashType) => {
    setFlash(type)
    setTimeout(() => setFlash('none'), 380)
  }

  // Reset answer buttons on each new question; reset journey on session start
  useEffect(() => {
    setAnswerStates(['idle','idle','idle','idle'])
    setCharState('idle')
    setAnswered(false)
    setWasWrong(false)
    setBubble(null)
    if (currentIndex === 0) {
      setCharStoneIdx(0)
      setCharPos(LEFT_CLIFF)
      setReachedEnd(false)
      posControls.set({ left: `${LEFT_CLIFF.left}%`, bottom: `${LEFT_CLIFF.bottom}%` })
    }
    speak(q.spoken)
  }, [currentIndex]) // eslint-disable-line

  const timeLeft = useTimer(() => {
    if (!answered) {
      resetStreak()
      speak("Time's up!")
      showBubble('Oh no!', '⏰')
      setTimeout(nextQuestion, 900)
    }
  }, !answered)

  const jumpTo = async (target: { left: number; bottom: number }) => {
    const start = charPos
    const peakLeft   = (start.left + target.left) / 2
    const peakBottom = Math.max(start.bottom, target.bottom) + 18
    setJumping(true)
    await posControls.start({
      left:   [`${start.left}%`,   `${peakLeft}%`,   `${target.left}%`],
      bottom: [`${start.bottom}%`, `${peakBottom}%`, `${target.bottom}%`],
      transition: { duration: 0.55, times: [0, 0.42, 1], ease: ['easeOut', 'easeIn'] },
    })
    setCharPos(target)
    setJumping(false)
  }

  const handleSelect = async (idx: number) => {
    if (answered || jumping) return
    const correct = q.options[idx] === q.answer

    if (correct) {
      setAnswered(true)
      setAnswerStates(q.options.map((_, i) => i === idx ? 'correct' : 'disabled'))
      triggerFlash('correct')

      if (!wasWrong) {
        recordCorrect()
        const newStreak = useGameStore.getState().streak
        const milestone = getMilestone(newStreak)
        if (milestone) { setComboText(milestone); setTimeout(() => setComboText(null), 1300) }
        confetti({
          particleCount: newStreak >= 5 ? 180 : newStreak >= 3 ? 110 : 65,
          spread: 70, origin: { y: 0.45 },
          colors: ['#FCD34D','#34D399','#60A5FA','#F472B6','#A78BFA'],
        })
      }

      // Advance character one stone
      const nextIdx = charStoneIdx + 1
      const target  = charPosition(nextIdx)
      await jumpTo(target)
      setCharStoneIdx(nextIdx)
      setCharState('celebrate')
      showBubble(CORRECT_BUBBLES[Math.floor(Math.random() * CORRECT_BUBBLES.length)], '⭐')

      const phrase = CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)](q.answer)

      if (nextIdx > SESSION_SIZE) {
        // Character already jumped to right cliff — this shouldn't happen here
        // (handled below), but guard against it
        setTimeout(nextQuestion, 500)
      } else if (nextIdx === SESSION_SIZE) {
        // Last stone — now jump all the way to the right cliff!
        speak(phrase, async () => {
          await new Promise(r => setTimeout(r, 300))
          await jumpTo(RIGHT_CLIFF)
          setCharStoneIdx(SESSION_SIZE + 1)
          setCharState('celebrate')
          setReachedEnd(true)
          confetti({ particleCount: 350, spread: 120, origin: { y: 0.4 },
            colors: ['#FCD34D','#34D399','#60A5FA','#F472B6','#A78BFA','#FFFFFF'] })
          speak('You made it! Amazing! You crossed the whole bridge!')
          setTimeout(nextQuestion, 2800)
        })
      } else {
        speak(phrase, () => setTimeout(nextQuestion, 500))
      }

    } else {
      setWasWrong(true)
      resetStreak()
      setAnswerStates(prev => prev.map((s, i) => i === idx ? 'wrong' : s))
      setCharState('wrong')
      triggerFlash('wrong')
      showBubble(WRONG_BUBBLES[Math.floor(Math.random() * WRONG_BUBBLES.length)], '💭')
      speak('Try again!')
      setTimeout(() => {
        setAnswerStates(prev => prev.map((s, i) => i === idx && s === 'wrong' ? 'idle' : s))
        setCharState('idle')
      }, 750)
    }
  }

  const CharComponent = character === 'girl' ? CharacterGirl : CharacterBoy

  return (
    <div className="fixed inset-0 overflow-hidden">
      <MountainBackground />

      {/* Screen flash */}
      <AnimatePresence>
        {flash !== 'none' && (
          <motion.div key={flash + Date.now()}
            className="fixed inset-0 z-40 pointer-events-none"
            initial={{ opacity: flash === 'correct' ? 0.35 : 0.28 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            style={{ background: flash === 'correct' ? '#34D399' : '#EF4444' }}
          />
        )}
      </AnimatePresence>

      {/* "You made it!" overlay */}
      <AnimatePresence>
        {reachedEnd && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4
              bg-black/55 backdrop-blur-sm pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ scale: [1, 1.25, 1], rotate: [-6, 6, -4, 4, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
              className="text-8xl drop-shadow-2xl"
            >
              🎉
            </motion.div>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-2xl text-center">
              You made it across!
            </h1>
            <p className="text-sky-200 text-lg font-bold">What a crossing! 🌟</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HUD ── */}
      <div className="relative z-10 flex flex-col gap-1.5 px-5 pt-3 pb-2 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <StreakBadge streak={streak} />
          <span className="text-white/60 text-sm font-bold tabular-nums">
            {currentIndex + 1} / {session.length}
          </span>
        </div>
        <TimerBar timeLeft={timeLeft} />
      </div>

      {/* ── Scene: journey path + character ── */}
      <div className="absolute inset-0 z-20 pointer-events-none">

        {/* Atmospheric chasm haze — softens background stone imagery */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 12%, rgba(0,10,30,0.45) 28%, rgba(0,10,30,0.50) 62%, transparent 80%)' }}
        />

        {/* Journey path stones */}
        {JOURNEY_STONES.map((pos, i) => {
          const stoneNum = i + 1  // corresponds to charStoneIdx value when character is here
          const state = stoneNum < charStoneIdx ? 'done'
                      : stoneNum === charStoneIdx ? 'current'
                      : 'upcoming'
          return (
            <div
              key={i}
              className="absolute"
              style={{ left: `${pos.left}%`, bottom: `${STONE_BOTTOM}%`, transform: 'translateX(-50%)' }}
            >
              <JourneyMarker state={state} />
            </div>
          )
        })}

        {/* Character */}
        <motion.div
          animate={posControls}
          initial={{ left: `${LEFT_CLIFF.left}%`, bottom: `${LEFT_CLIFF.bottom}%` }}
          className="absolute pointer-events-none"
          style={{ transform: 'translateX(-50%)' }}
        >
          {/* Speech bubble */}
          <AnimatePresence>
            {bubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1,   y: 0 }}
                exit={{    opacity: 0, scale: 0.7, y: -8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="absolute -top-14 left-1/2 -translate-x-1/2
                  bg-white rounded-2xl px-3 py-1.5 shadow-2xl whitespace-nowrap
                  text-sm font-extrabold text-gray-800 flex items-center gap-1.5"
              >
                <span>{bubble.emoji}</span>
                <span>{bubble.text}</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2
                  w-0 h-0 border-l-[7px] border-r-[7px] border-t-[8px]
                  border-l-transparent border-r-transparent border-t-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Character */}
          <motion.div
            animate={
              charState === 'celebrate'
                ? { scaleX: [1, 1.12, 0.92, 1], scaleY: [1, 0.88, 1.08, 1] }
                : charState === 'wrong'
                ? { x: [-5, 5, -4, 4, 0], rotate: [-3, 3, -2, 2, 0] }
                : { y: [0, -5, 0] }
            }
            transition={
              charState === 'celebrate' ? { duration: 0.45 }
              : charState === 'wrong'   ? { duration: 0.42 }
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            }
            style={{ filter: 'drop-shadow(0px 8px 18px rgba(0,0,0,0.70))', originY: '100%' }}
          >
            <CharComponent size={72} />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Answer zone — bottom strip ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)' }}
      >
        {/* Question text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="px-4 pt-3 text-center"
          >
            {q.type === 'missing' && q.missingSeq ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-white/70 text-sm font-bold">Missing:</span>
                {q.missingSeq.map((n, i) => (
                  <span key={i} className={`text-xl font-extrabold ${n === null ? 'text-yellow-300' : 'text-white'}`}
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
                    {n === null ? '?' : n}
                    {i < q.missingSeq!.length - 1 && <span className="text-white/35 ml-1">,</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-2xl font-extrabold text-white"
                style={{ textShadow: '0 2px 14px rgba(0,0,0,0.95)' }}>
                {q.prompt}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 4 Answer buttons */}
        <div className="flex justify-center items-end gap-4 px-4 pt-2 pb-2">
          {q.options.map((num, i) => (
            <FloatingStone
              key={`${currentIndex}-${i}`}
              number={num}
              state={answerStates[i]}
              entryDelay={i * 0.08}
              onClick={() => handleSelect(i)}
            />
          ))}
        </div>

        {/* Skip */}
        <div className="text-center pb-2">
          <button
            onClick={() => { resetStreak(); nextQuestion() }}
            className="text-white/35 hover:text-white/65 text-xs font-bold
              border border-white/12 hover:border-white/30 px-5 py-1 rounded-full transition-colors"
          >
            Skip →
          </button>
        </div>
      </div>

      <ComboFlash text={comboText} />
    </div>
  )
}
