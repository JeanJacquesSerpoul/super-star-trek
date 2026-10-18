/* Effets sonores synthétisés en WebAudio : aucun fichier à charger. */

let ctx: AudioContext | null = null
let muted = (() => {
  try {
    return localStorage.getItem('st-muted') === '1'
  } catch {
    return false
  }
})()

export const isMuted = () => muted
export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem('st-muted', m ? '1' : '0')
  } catch {
    /* stockage indisponible */
  }
}

function ac(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function out(a: AudioContext, gain: number) {
  const g = a.createGain()
  g.gain.value = gain
  g.connect(a.destination)
  return g
}

function noise(a: AudioContext, seconds: number) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  return src
}

export const sfx = {
  beep(freq = 880) {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    const o = a.createOscillator()
    const g = out(a, 0)
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o.connect(g)
    o.start(t)
    o.stop(t + 0.14)
  },

  phaser() {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    const o = a.createOscillator()
    const lfo = a.createOscillator()
    const lfoGain = a.createGain()
    const f = a.createBiquadFilter()
    const g = out(a, 0)
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(1400, t)
    o.frequency.exponentialRampToValueAtTime(700, t + 0.7)
    lfo.frequency.value = 38
    lfoGain.gain.value = 120
    lfo.connect(lfoGain).connect(o.frequency)
    f.type = 'bandpass'
    f.frequency.value = 1600
    f.Q.value = 2
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.04)
    g.gain.setValueAtTime(0.12, t + 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75)
    o.connect(f).connect(g)
    o.start(t)
    lfo.start(t)
    o.stop(t + 0.8)
    lfo.stop(t + 0.8)
  },

  torpedo() {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    const o = a.createOscillator()
    const g = out(a, 0)
    o.type = 'triangle'
    o.frequency.setValueAtTime(220, t)
    o.frequency.exponentialRampToValueAtTime(1800, t + 0.25)
    o.frequency.exponentialRampToValueAtTime(400, t + 0.6)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    o.connect(g)
    o.start(t)
    o.stop(t + 0.62)
  },

  explosion(big = true) {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    const dur = big ? 1.4 : 0.6
    const src = noise(a, dur)
    const f = a.createBiquadFilter()
    const g = out(a, 0)
    f.type = 'lowpass'
    f.frequency.setValueAtTime(1800, t)
    f.frequency.exponentialRampToValueAtTime(80, t + dur)
    g.gain.setValueAtTime(big ? 0.5 : 0.25, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g)
    src.start(t)
  },

  disruptor() {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    const o = a.createOscillator()
    const g = out(a, 0)
    o.type = 'square'
    o.frequency.setValueAtTime(320, t)
    o.frequency.linearRampToValueAtTime(90, t + 0.35)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    o.connect(g)
    o.start(t)
    o.stop(t + 0.42)
    setTimeout(() => sfx.explosion(false), 260)
  },

  alert() {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    for (let i = 0; i < 2; i++) {
      const o = a.createOscillator()
      const g = out(a, 0)
      o.type = 'sawtooth'
      const s = t + i * 0.55
      o.frequency.setValueAtTime(380, s)
      o.frequency.linearRampToValueAtTime(760, s + 0.4)
      g.gain.setValueAtTime(0.0001, s)
      g.gain.exponentialRampToValueAtTime(0.06, s + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.48)
      o.connect(g)
      o.start(s)
      o.stop(s + 0.5)
    }
  },

  warp() {
    const a = ac()
    if (!a) return
    const t = a.currentTime
    const src = noise(a, 1.6)
    const f = a.createBiquadFilter()
    const g = out(a, 0)
    f.type = 'bandpass'
    f.Q.value = 6
    f.frequency.setValueAtTime(200, t)
    f.frequency.exponentialRampToValueAtTime(3200, t + 1.2)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.8)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    src.connect(f).connect(g)
    src.start(t)
  },

  dock() {
    sfx.beep(660)
    setTimeout(() => sfx.beep(990), 140)
    setTimeout(() => sfx.beep(1320), 280)
  },
}
