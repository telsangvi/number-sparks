import { motion, AnimatePresence } from 'framer-motion'

type StoneState = 'idle' | 'correct' | 'wrong' | 'disabled'

interface Props {
  number: number
  state: StoneState
  entryDelay: number
  onClick: () => void
}

const COLORS: Record<StoneState, { fill: string; stroke: string; text: string; glow: string }> = {
  idle:     { fill: '#3D2B1A', stroke: '#A07850', text: '#F5DEB3', glow: 'rgba(200,150,80,0.8)'  },
  correct:  { fill: '#064E3B', stroke: '#34D399', text: '#A7F3D0', glow: 'rgba(52,211,153,0.95)' },
  wrong:    { fill: '#450A0A', stroke: '#EF4444', text: '#FECACA', glow: 'rgba(239,68,68,0.85)'  },
  disabled: { fill: '#2A1F14', stroke: '#5C4033', text: '#7C6050', glow: 'transparent'            },
}

export default function FloatingStone({ number, state, entryDelay, onClick }: Props) {
  const c = COLORS[state]

  return (
    <motion.div
      className="relative flex items-center justify-center"
      // ── Entry: fly up from below ──
      initial={{ y: 160, opacity: 0, scale: 0.55 }}
      animate={{ y: 0,   opacity: 1, scale: 1    }}
      transition={{ type: 'spring', stiffness: 280, damping: 22, delay: entryDelay }}
    >
      {/* ── Idle bob / correct launch / wrong shake ── */}
      <motion.div
        animate={
          state === 'idle'
            ? { y: [0, -14, 0] }
            : state === 'correct'
            ? { y: -50, scale: 1.25, opacity: 0 }
            : state === 'wrong'
            ? { x: [-12, 12, -10, 10, -7, 7, 0] }
            : {}
        }
        transition={
          state === 'idle'
            ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            : state === 'correct'
            ? { duration: 0.55, ease: 'easeOut' }
            : state === 'wrong'
            ? { duration: 0.48 }
            : {}
        }
      >
        {/* Burst ring on correct */}
        <AnimatePresence>
          {state === 'correct' && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.7), transparent)' }}
            />
          )}
        </AnimatePresence>

        {/* Stone button */}
        <motion.button
          onClick={state === 'idle' ? onClick : undefined}
          disabled={state !== 'idle'}
          className="focus:outline-none disabled:cursor-default"
          whileHover={state === 'idle' ? {
            scale: 1.1,
            filter: `drop-shadow(0 0 16px ${c.glow}) drop-shadow(0 0 6px ${c.glow})`,
          } : {}}
          whileTap={state === 'idle' ? { scale: 0.93 } : {}}
        >
          <svg viewBox="0 0 130 90" width="130" height="90">
            {/* Outer glow */}
            <ellipse cx="65" cy="85" rx="42" ry="5" fill="rgba(0,0,0,0.3)" />

            {/* Stone body */}
            <path
              d="M20 44 Q16 22 36 11 Q52 3 70 7 Q90 3 104 18 Q116 32 112 52 Q114 70 96 78 Q76 86 50 82 Q26 78 16 62 Q12 52 20 44Z"
              fill={c.fill}
              stroke={c.stroke}
              strokeWidth="2.5"
            />

            {/* Surface sheen */}
            <path
              d="M36 20 Q62 14 88 22"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M28 36 Q54 30 80 36"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Crack lines on wrong */}
            {state === 'wrong' && (
              <>
                <path d="M58 25 L52 45 L62 60" stroke="#EF4444" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />
                <path d="M72 30 L78 50" stroke="#EF4444" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
              </>
            )}

            {/* Number */}
            <text
              x="64" y="54"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="34"
              fontFamily="'Baloo 2', cursive"
              fontWeight="800"
              fill={c.text}
            >
              {number}
            </text>
          </svg>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
