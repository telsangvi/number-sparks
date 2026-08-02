const PREFERRED = [
  'Samantha', 'Google US English', 'Google UK English Female',
  'Microsoft Zira', 'Karen', 'Moira', 'Tessa',
]

let _voice: SpeechSynthesisVoice | null = null

function resolveVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? []
  if (!voices.length) return null
  for (const name of PREFERRED) {
    const v = voices.find(v => v.name.includes(name))
    if (v) return v
  }
  return voices.find(v => v.lang === 'en-US') ?? voices.find(v => v.lang.startsWith('en')) ?? null
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => { _voice = resolveVoice() })
  setTimeout(() => { if (!_voice) _voice = resolveVoice() }, 300)
}

export function speak(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) { onEnd?.(); return }
  try {
    window.speechSynthesis.cancel()
    const u  = new SpeechSynthesisUtterance(text)
    u.rate   = 0.8
    u.pitch  = 1.3
    u.volume = 1.0
    u.lang   = 'en-US'
    const voice = _voice ?? resolveVoice()
    if (voice) u.voice = voice
    if (onEnd) u.onend = onEnd
    window.speechSynthesis.speak(u)
  } catch { onEnd?.() }
}
