let audio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio('/music.m4a')
    audio.loop   = true
    audio.volume = 0.14
  }
  return audio
}

export function startAmbient() {
  const a = getAudio()
  if (!a.paused) return
  a.play().catch(() => {})
}

export function stopAmbient() {
  getAudio().pause()
}
