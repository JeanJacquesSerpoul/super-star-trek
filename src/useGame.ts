import { useCallback, useEffect, useRef, useState } from 'react'
import { sfx } from './audio'
import { MAX_ENERGY, MAX_TORPEDOES } from './game/constants'
import { newGame } from './game/engine'
import type { GameEvent, GameState, LogLine, Outcome, Pos } from './game/types'

export type Fx =
  | { id: number; kind: 'phaser'; from: Pos; to: Pos; hit: boolean }
  | { id: number; kind: 'torpedo'; from: Pos; path: Pos[]; ms: number }
  | { id: number; kind: 'explode'; at: Pos; big: boolean }
  | { id: number; kind: 'disruptor'; from: Pos; to: Pos }
  | { id: number; kind: 'absorb'; at: Pos }
  | { id: number; kind: 'dock'; base: Pos; ship: Pos; ms: number }

/** Ravitaillement en cours, pour le bandeau d'amarrage et les jauges. */
export interface Refuel {
  id: number
  energy: number
  torpedoes: number
  repairs: number
}

export type WarpPhase = 'out' | 'in' | null

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

let uid = 1

export function useGame() {
  // Un seul tirage de galaxie, même quand StrictMode appelle l'initialiseur deux fois.
  const [boot] = useState<Outcome>(() => newGame())
  const begun = useRef(false)
  const [state, setState] = useState<GameState>(boot.state)
  const [shown, setShown] = useState<GameState>(state)
  const [log, setLog] = useState<LogLine[]>([])
  const [fx, setFx] = useState<Fx[]>([])
  const [busy, setBusy] = useState(false)
  const [warp, setWarp] = useState<WarpPhase>(null)
  const [shake, setShake] = useState(0)
  const [alertPulse, setAlertPulse] = useState(0)
  const [moveMs, setMoveMs] = useState(0)
  const [refuel, setRefuel] = useState<Refuel | null>(null)
  const run = useRef(0)

  const play = useCallback(async (events: GameEvent[], final: GameState) => {
    const token = ++run.current
    const alive = () => run.current === token
    const speed = reduced() ? 0.35 : 1
    // Un amarrage annoncé pendant le saut en distorsion attend l'arrivée dans le nouveau quadrant.
    let warping = false
    let pendingDock: Extract<GameEvent, { type: 'dock' }> | null = null

    const dock = async (e: Extract<GameEvent, { type: 'dock' }>) => {
      const id = uid++
      const ms = 1500 * speed
      const gained = { energy: Math.round(MAX_ENERGY - e.before.energy), torpedoes: MAX_TORPEDOES - e.before.torpedoes }
      sfx.dock()
      setFx((f) => [...f, { id, kind: 'dock', base: e.base, ship: e.ship, ms }])
      setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), ms + 400)
      setRefuel({ id, ...gained, repairs: e.repairs })
      setTimeout(() => setRefuel((r) => (r?.id === id ? null : r)), ms + 2600)
      // Les jauges se remplissent pendant que l'énergie afflue de la base.
      const steps = 24
      for (let i = 1; i <= steps; i++) {
        if (!alive()) return
        const k = i / steps
        setShown((s) => ({
          ...s,
          docked: true,
          energy: e.before.energy + (MAX_ENERGY - e.before.energy) * k,
          shields: e.before.shields * (1 - k),
          torpedoes: Math.max(s.torpedoes, Math.floor(e.before.torpedoes + gained.torpedoes * k)),
        }))
        await sleep(ms / steps)
      }
    }

    setBusy(true)
    for (const e of events) {
      if (!alive()) return
      switch (e.type) {
        case 'log': {
          const line: LogLine = { id: uid++, text: e.text, tone: e.tone, stardate: final.stardate }
          setLog((l) => [...l.slice(-199), line])
          await sleep(70 * speed)
          break
        }
        case 'state':
          setShown(e.state)
          break
        case 'phaser': {
          const id = uid++
          sfx.phaser()
          setFx((f) => [...f, { id, kind: 'phaser', from: e.from, to: e.to, hit: e.hit }])
          setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 800)
          await sleep(700 * speed)
          break
        }
        case 'torpedo': {
          const id = uid++
          const ms = Math.max(300, e.path.length * 120) * speed
          sfx.torpedo()
          setShown((s) => ({ ...s, heading: final.heading }))
          setFx((f) => [...f, { id, kind: 'torpedo', from: e.from, path: e.path, ms }])
          setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), ms + 60)
          await sleep(ms)
          break
        }
        case 'explode': {
          const id = uid++
          sfx.explosion(e.big)
          setFx((f) => [...f, { id, kind: 'explode', at: e.at, big: !!e.big }])
          setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 1100)
          await sleep(450 * speed)
          break
        }
        case 'absorb': {
          const id = uid++
          setFx((f) => [...f, { id, kind: 'absorb', at: e.at }])
          setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 900)
          await sleep(400 * speed)
          break
        }
        case 'disruptor': {
          const id = uid++
          sfx.disruptor()
          setFx((f) => [...f, { id, kind: 'disruptor', from: e.from, to: e.to }])
          setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 600)
          await sleep(260 * speed)
          if (!reduced()) setShake((n) => n + 1)
          await sleep(320 * speed)
          break
        }
        case 'impulse': {
          const steps = Math.max(1, e.path.length - 1)
          const ms = Math.min(1100, 90 * steps + 200) * speed
          const to = e.path[e.path.length - 1]
          setMoveMs(ms)
          setShown((s) => ({ ...s, heading: final.heading, sector: to }))
          await sleep(ms + 60)
          setMoveMs(0)
          break
        }
        case 'warp':
          if (e.leaving) {
            warping = true
            sfx.warp()
            setShown((s) => ({ ...s, heading: final.heading }))
            setWarp('out')
            await sleep(900 * speed)
          } else {
            setWarp('in')
            await sleep(650 * speed)
            setWarp(null)
            warping = false
            if (pendingDock) {
              await dock(pendingDock)
              pendingDock = null
            }
          }
          break
        case 'alert':
          sfx.alert()
          setAlertPulse((n) => n + 1)
          break
        case 'dock':
          if (warping) pendingDock = e
          else await dock(e)
          break
      }
    }
    if (!alive()) return
    setShown(final)
    setWarp(null)
    setBusy(false)
  }, [])

  const apply = useCallback(
    (fn: (s: GameState) => Outcome) => {
      if (busy || state.status !== 'playing') return
      const out = fn(state)
      setState(out.state)
      void play(out.events, out.state)
    },
    [busy, state, play],
  )

  const restart = useCallback(() => {
    run.current++
    const out = newGame()
    setLog([])
    setFx([])
    setRefuel(null)
    setState(out.state)
    setShown(out.state)
    void play(out.events, out.state)
  }, [play])

  // Après le briefing : rejoue les messages d'entrée de la partie déjà générée.
  const begin = useCallback(() => {
    if (begun.current) return
    begun.current = true
    void play(boot.events, boot.state)
  }, [play, boot])

  const say = useCallback((text: string, tone: LogLine['tone'] = 'computer') => {
    setLog((l) => [...l.slice(-199), { id: uid++, text, tone, stardate: state.stardate }])
  }, [state.stardate])

  useEffect(() => () => void run.current++, [])

  return { state, shown, log, fx, busy, warp, shake, alertPulse, moveMs, refuel, apply, restart, begin, say }
}
