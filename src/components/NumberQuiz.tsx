import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameStore } from '../store/gameStore'
import { speak } from '../utils/speech'
import { TimerBar, StreakBadge, ComboFlash, getMilestone, TIMER_TOTAL } from './QuizExtras'
import FloatingStone from './FloatingStone'
import CharacterBoy from './CharacterBoy'
import CharacterGirl from './CharacterGirl'
import MountainBackground from './MountainBackground'

type StoneState = 'idle' | 'correct' | 'wrong' | 'disabled'
type CharState  = 'idle' | 'celebrate' | 'wrong'
type FlashType  = 'none' | 'correct' | 'wrong'

interface Bubble { text: string; emoji: string }

// Platform anchor points — left = horizontal center of platform, bottom = bottom of platform div
const STONE_POSITIONS = [
  { left: 20, bottom: 22 },
  { left: 40, bottom: 29 },
  { left: 62, bottom: 25 },
  { left: 82, bottom: 21 },
]

// PLATFORM_H is 70px. On a 414px landscape phone: 70/414*100 ≈ 17%.
// Character feet land at stone.bottom + this offset so they sit on top of the platform.
const STONE_LAND_OFFSET = 17

// Character starts on the left cliff, vertically matching the first stone surface
const CHAR_START = { left: 5, bottom: STONE_POSITIONS[0].bottom + STONE_LAND_OFFSET }

const CORRECT_PHRASES = [
  (n: number) => `Yes! ${n}!`,
  (n: number) => `${n}! Amazing!`,
  (n: number) => `Brilliant! ${n}!`,
  (n: number) => `You got it! ${n}!`,
]
const CORRECT_BUBBLES = ['Yes!', 'Yay!', 'Perfect!', '🎉']
const WRONG_BUBBLES   = ['Oops!', 'Try again!', 'Careful!']

function useTimer(onExpire: () => void, active: boolean) {
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL)
  const cbRef   = useRef(onExpire)
  const firedRef = useRef(false)
  cbRef.current = onExpire
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

export default function NumberQuiz() {
  const { session, currentIndex, character, streak, recordCorrect, resetStreak, nextQuestion } = useGameStore()
  const q = session[currentIndex]

  const [stoneStates, setStoneStates] = useState<StoneState[]>(['idle','idle','idle','idle'])
  const [charState,   setCharState]   = useState<CharState>('idle')
  const [answered,    setAnswered]    = useState(false)
  const [wasWrong,    setWasWrong]    = useState(false)
  const [comboText,   setComboText]   = useState<string | null>(null)
  const [flash,       setFlash]       = useState<FlashType>('none')
  const [bubble,      setBubble]      = useState<Bubble | null>(null)
  const [jumping,     setJumping]     = useState(false)

  const [charPos, setCharPos] = useState(CHAR_START)
  const posControls = useAnimation()

  const showBubble = (text: string, emoji: string) => {
    setBubble({ text, emoji })
    setTimeout(() => setBubble(null), 1600)
  }
  const triggerFlash = (type: FlashType) => {
    setFlash(type)
    setTimeout(() => setFlash('none'), 380)
  }

  useEffect(() => {
    setStoneStates(['idle','idle','idle','idle'])
    setCharState('idle')
    setAnswered(false)
    setWasWrong(false)
    setBubble(null)
    if (currentIndex === 0) {
      setCharPos(CHAR_START)
      posControls.set({ left: `${CHAR_START.left}%`, bottom: `${CHAR_START.bottom}%` })
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

  const jumpToStone = async (stoneIdx: number) => {
    const start  = charPos
    const target = {
      left:   STONE_POSITIONS[stoneIdx].left,                        // centers align (both translateX -50%)
      bottom: STONE_POSITIONS[stoneIdx].bottom + STONE_LAND_OFFSET,  // feet land on stone surface
    }
    const peakLeft   = (start.left + target.left) / 2
    const peakBottom = Math.max(start.bottom, target.bottom) + 20

    setJumping(true)
    await posControls.start({
      left:   [`${start.left}%`,   `${peakLeft}%`,   `${target.left}%`],
      bottom: [`${start.bottom}%`, `${peakBottom}%`, `${target.bottom}%`],
      transition: { duration: 0.60, times: [0, 0.42, 1], ease: ['easeOut', 'easeIn'] },
    })
    setCharPos(target)
    setJumping(false)
  }

  const handleSelect = async (idx: number) => {
    if (answered || jumping) return
    const correct = q.options[idx] === q.answer

    if (correct) {
      setAnswered(true)
      setStoneStates(q.options.map((_, i) => i === idx ? 'correct' : 'disabled'))
      triggerFlash('correct')
      await jumpToStone(idx)
      setCharState('celebrate')
      showBubble(CORRECT_BUBBLES[Math.floor(Math.random() * CORRECT_BUBBLES.length)], '⭐')

      if (!wasWrong) {
        recordCorrect()
        const newStreak = useGameStore.getState().streak
        const milestone = getMilestone(newStreak)
        if (milestone) { setComboText(milestone); setTimeout(() => setComboText(null), 1300) }
        confetti({
          particleCount: newStreak >= 5 ? 200 : newStreak >= 3 ? 130 : 80,
          spread: 80, origin: { y: 0.55 },
          colors: ['#FCD34D','#34D399','#60A5FA','#F472B6','#A78BFA'],
        })
      }

      const phrase = CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)](q.answer)
      speak(phrase, () => setTimeout(nextQuestion, 500))

    } else {
      setWasWrong(true)
      resetStreak()
      setStoneStates(prev => prev.map((s, i) => i === idx ? 'wrong' : s))
      setCharState('wrong')
      triggerFlash('wrong')
      showBubble(WRONG_BUBBLES[Math.floor(Math.random() * WRONG_BUBBLES.length)], '💭')
      speak('Try again!')
      setTimeout(() => {
        setStoneStates(prev => prev.map((s, i) => i === idx && s === 'wrong' ? 'idle' : s))
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
            initial={{ opacity: flash === 'correct' ? 0.38 : 0.30 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            style={{ background: flash === 'correct' ? '#34D399' : '#EF4444' }}
          />
        )}
      </AnimatePresence>

      {/* ─── UI layer ─────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col pointer-events-none">

        {/* Top bar */}
        <div className="flex flex-col gap-1.5 px-5 pt-4 pb-2 pointer-events-auto">
          <div className="flex items-center justify-between">
            <StreakBadge streak={streak} />
            <span className="text-white/60 text-sm font-bold tabular-nums">
              {currentIndex + 1} / {session.length}
            </span>
          </div>
          <TimerBar timeLeft={timeLeft} />
        </div>

        {/* Question — centered, large */}
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex}
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -10, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.04 }}
            className="px-6 mt-2 pointer-events-auto"
          >
            {q.type === 'missing' && q.missingSeq ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xl font-extrabold text-white text-center"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
                  Fill in the missing number!
                </p>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-2">
                  {q.missingSeq.map((n, i) => (
                    <span key={i}>
                      <span className={`text-2xl font-extrabold ${n === null ? 'text-yellow-300' : 'text-white'}`}
                        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
                        {n === null ? '?' : n}
                      </span>
                      {i < q.missingSeq!.length - 1 && <span className="text-white/35 ml-2 mr-1">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-white text-center"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.95)' }}>
                {q.prompt}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip — pinned bottom center */}
        <div className="mt-auto pb-3 text-center pointer-events-auto">
          <button
            onClick={() => { resetStreak(); nextQuestion() }}
            className="text-white/35 hover:text-white/65 text-xs font-bold
              border border-white/12 hover:border-white/30 px-5 py-1.5 rounded-full transition-colors"
          >
            Skip →
          </button>
        </div>
      </div>

      {/* ─── Game arena — full screen, absolute ───────────── */}
      <div className="absolute inset-0 z-20 pointer-events-none">

        {/* Chasm atmospheric haze — darkens the background stone imagery
            so our glowing platforms are the only stones the kid focuses on */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 15%, rgba(0,10,30,0.48) 32%, rgba(0,10,30,0.52) 68%, transparent 82%)',
          }}
        />

        {/* Stepping platforms */}
        {q.options.map((num, i) => (
          <div
            key={`${currentIndex}-${i}`}
            className="absolute pointer-events-auto"
            style={{
              left:      `${STONE_POSITIONS[i].left}%`,
              bottom:    `${STONE_POSITIONS[i].bottom}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <FloatingStone
              number={num}
              state={stoneStates[i]}
              entryDelay={i * 0.11}
              onClick={() => handleSelect(i)}
            />
          </div>
        ))}

        {/* Character */}
        <motion.div
          animate={posControls}
          initial={{ left: `${CHAR_START.left}%`, bottom: `${CHAR_START.bottom}%` }}
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
                className="absolute -top-16 left-1/2 -translate-x-1/2
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

          {/* Character with state animations */}
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
            style={{
              filter: 'drop-shadow(0px 8px 18px rgba(0,0,0,0.70))',
              originY: '100%',
            }}
          >
            <CharComponent size={88} />
          </motion.div>
        </motion.div>

      </div>

      <ComboFlash text={comboText} />
    </div>
  )
}
