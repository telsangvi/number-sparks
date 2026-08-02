import { motion, AnimatePresence } from 'framer-motion'

type StoneState = 'idle' | 'correct' | 'wrong' | 'disabled'

interface Props {
  number: number
  state:  StoneState
  entryDelay: number
  onClick: () => void
}

// Platform dimensions — wide and flat so it reads as something to land on
const PLATFORM_W = 116
const PLATFORM_H = 70

const STYLE: Record<StoneState, { bg: string; border: string; text: string; glow: string; shadow: string }> = {
  idle: {
    bg:     'linear-gradient(160deg, #4A2E0E 0%, #2E1A08 100%)',
    border: '#C27C30',
    text:   '#FDE68A',
    glow:   'rgba(210, 130, 40, 0.65)',
    shadow: '0 0 18px rgba(210,130,40,0.55), 0 0 36px rgba(210,130,40,0.25), inset 0 1px 0 rgba(255,255,255,0.10)',
  },
  correct: {
    bg:     'linear-gradient(160deg, #064E3B 0%, #022C22 100%)',
    border: '#34D399',
    text:   '#A7F3D0',
    glow:   'rgba(52, 211, 153, 0.75)',
    shadow: '0 0 22px rgba(52,211,153,0.65), 0 0 50px rgba(52,211,153,0.30), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  wrong: {
    bg:     'linear-gradient(160deg, #450A0A 0%, #250505 100%)',
    border: '#EF4444',
    text:   '#FECACA',
    glow:   'rgba(239, 68, 68, 0.70)',
    shadow: '0 0 20px rgba(239,68,68,0.60), 0 0 40px rgba(239,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  disabled: {
    bg:     'linear-gradient(160deg, #1E1208 0%, #120B04 100%)',
    border: '#4A3018',
    text:   '#6B5030',
    glow:   'transparent',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  },
}

export default function FloatingStone({ number, state, entryDelay, onClick }: Props) {
  const s = STYLE[state]

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ y: 140, opacity: 0, scale: 0.5 }}
      animate={{ y: 0,   opacity: 1, scale: 1   }}
      transition={{ type: 'spring', stiffness: 280, damping: 22, delay: entryDelay }}
    >
      {/* Bob / correct launch / wrong shake */}
      <motion.div
        animate={
          state === 'idle'
            ? { y: [0, -10, 0] }
            : state === 'correct'
            ? { y: -55, scale: 1.2, opacity: 0 }
            : state === 'wrong'
            ? { x: [-10, 10, -8, 8, -5, 5, 0] }
            : {}
        }
        transition={
          state === 'idle'    ? { duration: 2.3, repeat: Infinity, ease: 'easeInOut' }
          : state === 'correct' ? { duration: 0.50, ease: 'easeOut' }
          : state === 'wrong'   ? { duration: 0.45 }
          : {}
        }
      >
        {/* Burst ring on correct */}
        <AnimatePresence>
          {state === 'correct' && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ scale: 0.7, opacity: 0.9 }}
              animate={{ scale: 2.6, opacity: 0   }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.48 }}
              style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.7), transparent)' }}
            />
          )}
        </AnimatePresence>

        {/* Outer ambient glow */}
        <div
          className="absolute pointer-events-none rounded-2xl"
          style={{
            inset: -10,
            background: s.glow === 'transparent' ? 'none' : s.glow,
            filter: 'blur(14px)',
            opacity: 0.6,
          }}
        />

        {/* The platform button */}
        <motion.button
          onClick={state === 'idle' ? onClick : undefined}
          disabled={state !== 'idle'}
          className="relative flex items-center justify-center rounded-2xl
            focus:outline-none disabled:cursor-default"
          style={{
            width:      PLATFORM_W,
            height:     PLATFORM_H,
            background: s.bg,
            border:     `2.5px solid ${s.border}`,
            boxShadow:  s.shadow,
          }}
          whileHover={state === 'idle' ? { scale: 1.08 } : {}}
          whileTap={state === 'idle'   ? { scale: 0.92 } : {}}
        >
          {/* Top edge highlight */}
          <div
            className="absolute top-0 left-4 right-4 h-px rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          />

          {/* Number */}
          <span
            style={{
              fontSize:   number >= 10 ? 30 : 34,
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 800,
              color:      s.text,
              textShadow: '0 2px 8px rgba(0,0,0,0.7)',
              userSelect: 'none',
            }}
          >
            {number}
          </span>

          {/* Wrong — crack overlay */}
          {state === 'wrong' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 116 70">
              <path d="M52 8 L46 32 L56 44 L50 64" stroke="#EF4444" strokeWidth="1.5" fill="none" opacity="0.55" strokeLinecap="round"/>
              <path d="M70 12 L76 36" stroke="#EF4444" strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round"/>
            </svg>
          )}
        </motion.button>

        {/* Shadow on water/ground below */}
        <div
          className="mt-1 rounded-full"
          style={{
            width: PLATFORM_W * 0.75,
            height: 5,
            background: 'rgba(0,0,0,0.35)',
            filter: 'blur(4px)',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
