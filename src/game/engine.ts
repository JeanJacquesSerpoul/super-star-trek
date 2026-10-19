import { COURSE_VECTORS, DEV, DEVICES, KLINGON_BASE_ENERGY, MAX_ENERGY, MAX_TORPEDOES, regionName } from './constants'
import type { GameEvent, GameState, Klingon, Outcome, Pos, Tone } from './types'

/*
 * Moteur de jeu : transcription des règles de « Super Star Trek » (Mike Mayfield 1971,
 * Bob Leedom 1974, publié par David Ahl en 1978). Chaque commande prend un état,
 * en renvoie une copie modifiée et la liste des événements à animer.
 */

const rnd = Math.random
const randInt = (n: number) => Math.floor(rnd() * n)

export const fmtPos = (p: Pos) => `${p.r + 1},${p.c + 1}`
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

class Ctx {
  s: GameState
  events: GameEvent[] = []
  constructor(state: GameState) {
    this.s = structuredClone(state)
  }
  log(text: string, tone: Tone = 'info') {
    this.events.push({ type: 'log', text, tone })
  }
  emit(e: GameEvent) {
    this.events.push(e)
  }
  snap() {
    this.events.push({ type: 'state', state: structuredClone(this.s) })
  }
  done(): Outcome {
    this.snap()
    return { state: this.s, events: this.events }
  }
}

// ---------------------------------------------------------------- utilitaires

export function condition(s: GameState): 'docked' | 'red' | 'yellow' | 'green' {
  if (s.docked) return 'docked'
  if (s.klingons.length > 0) return 'red'
  if (s.energy < MAX_ENERGY * 0.1) return 'yellow'
  return 'green'
}

export function cellAt(s: GameState, p: Pos): 'ship' | 'klingon' | 'star' | 'base' | null {
  if (s.sector.r === p.r && s.sector.c === p.c) return 'ship'
  if (s.klingons.some((k) => k.r === p.r && k.c === p.c)) return 'klingon'
  if (s.stars.some((k) => k.r === p.r && k.c === p.c)) return 'star'
  if (s.base && s.base.r === p.r && s.base.c === p.c) return 'base'
  return null
}

function randomEmpty(s: GameState): Pos {
  for (;;) {
    const p = { r: randInt(8), c: randInt(8) }
    if (!cellAt(s, p)) return p
  }
}

const dist = (a: Pos, b: Pos) => Math.hypot(a.r - b.r, a.c - b.c)

export function courseVector(course: number): [number, number] {
  const c = course >= 9 ? 1 : course
  const i = Math.floor(c) - 1
  const f = c - Math.floor(c)
  const [r0, c0] = COURSE_VECTORS[i]
  const [r1, c1] = COURSE_VECTORS[i + 1]
  return [r0 + (r1 - r0) * f, c0 + (c1 - c0) * f]
}

/**
 * Calculateur de direction : retrouve le cap BASIC exact (interpolation linéaire
 * entre les huit vecteurs, pas un angle) et le nombre de pas pour atteindre une cible.
 */
export function courseTo(from: Pos, to: Pos): { course: number; steps: number; distance: number } | null {
  const dE = to.c - from.c
  const dN = from.r - to.r
  if (dE === 0 && dN === 0) return null
  for (let i = 0; i < 8; i++) {
    const [ar, ac] = COURSE_VECTORS[i]
    const [br, bc] = COURSE_VECTORS[i + 1]
    const A = [ac, -ar]
    const B = [bc - ac, -(br - ar)]
    const crossA = A[0] * dN - A[1] * dE
    const crossB = B[0] * dN - B[1] * dE
    let f: number
    if (crossB === 0) {
      if (crossA !== 0) continue
      f = 0
    } else f = -crossA / crossB
    if (f < -1e-9 || f > 1 + 1e-9) continue
    const vx = A[0] + f * B[0]
    const vy = A[1] + f * B[1]
    if (vx * dE + vy * dN <= 0) continue
    return {
      course: Math.min(8.999, 1 + i + Math.max(0, Math.min(1, f))),
      steps: Math.max(Math.abs(dE), Math.abs(dN)),
      distance: Math.hypot(dE, dN),
    }
  }
  return null
}

export function repairEstimate(s: GameState): number {
  let d = s.repairBias
  for (const v of s.damage) if (v < 0) d += 0.1
  return Math.min(d, 0.9)
}

export const missionEnd = (s: GameState) => s.startDate + s.missionDays
export const daysLeft = (s: GameState) => Math.max(0, missionEnd(s) - s.stardate)

// ---------------------------------------------------------------- nouvelle partie

export function newGame(): Outcome {
  const galaxy: number[][] = []
  let klingons = 0
  let bases = 0
  for (let r = 0; r < 8; r++) {
    galaxy.push([])
    for (let c = 0; c < 8; c++) {
      const x = rnd()
      const k = x > 0.98 ? 3 : x > 0.95 ? 2 : x > 0.8 ? 1 : 0
      const b = rnd() > 0.96 ? 1 : 0
      klingons += k
      bases += b
      galaxy[r].push(k * 100 + b * 10 + randInt(8) + 1)
    }
  }
  if (bases === 0) {
    const r = randInt(8)
    const c = randInt(8)
    if (galaxy[r][c] < 200) {
      galaxy[r][c] += 100
      klingons++
    }
    galaxy[r][c] += 10
    bases = 1
  }
  const startDate = Math.floor(rnd() * 20 + 20) * 100
  let missionDays = 25 + randInt(10)
  if (klingons > missionDays) missionDays = klingons + 1

  const s: GameState = {
    galaxy,
    known: galaxy.map((row) => row.map(() => null)),
    quad: { r: randInt(8), c: randInt(8) },
    sector: { r: randInt(8), c: randInt(8) },
    klingons: [],
    stars: [],
    base: null,
    energy: MAX_ENERGY,
    shields: 0,
    torpedoes: MAX_TORPEDOES,
    damage: DEVICES.map(() => 0),
    stardate: startDate,
    startDate,
    missionDays,
    klingonsStart: klingons,
    klingonsLeft: klingons,
    basesLeft: bases,
    docked: false,
    repairBias: 0,
    heading: 3,
    lastScan: null,
    status: 'playing',
  }
  const ctx = new Ctx(s)
  ctx.s = s
  enterQuadrant(ctx, true)
  return ctx.done()
}

function enterQuadrant(ctx: Ctx, first = false) {
  const s = ctx.s
  const g = s.galaxy[s.quad.r][s.quad.c]
  const k3 = Math.floor(g / 100)
  const b3 = Math.floor(g / 10) % 10
  const s3 = g % 10
  s.repairBias = 0.5 * rnd()
  s.known[s.quad.r][s.quad.c] = g
  s.klingons = []
  s.stars = []
  s.base = null
  const name = regionName(s.quad.r, s.quad.c)
  if (first) {
    ctx.log(`Votre mission commence dans le quadrant ${name}.`, 'info')
  } else {
    ctx.log(`Entrée dans le quadrant ${name}…`, 'quiet')
  }
  for (let i = 0; i < k3; i++) {
    const p = randomEmpty(s)
    const e = KLINGON_BASE_ENERGY * (0.5 + rnd())
    s.klingons.push({ ...p, energy: e, maxEnergy: e })
  }
  if (b3 > 0) s.base = randomEmpty(s)
  for (let i = 0; i < s3; i++) s.stars.push(randomEmpty(s))
  checkDocking(ctx)
  if (k3 > 0) {
    ctx.emit({ type: 'alert' })
    ctx.log('Zone de combat : condition ROUGE', 'danger')
    if (s.shields <= 200) ctx.log('Boucliers dangereusement bas', 'danger')
  }
}

function checkDocking(ctx: Ctx) {
  const s = ctx.s
  const near = s.base && Math.abs(s.base.r - s.sector.r) <= 1 && Math.abs(s.base.c - s.sector.c) <= 1
  if (near) {
    if (!s.docked) {
      ctx.emit({ type: 'dock' })
      ctx.log('Amarrage à la base stellaire. Boucliers abaissés pour l’amarrage.', 'success')
      ctx.log('Énergie et torpilles réapprovisionnées.', 'success')
    }
    s.docked = true
    s.energy = MAX_ENERGY
    s.torpedoes = MAX_TORPEDOES
    s.shields = 0
  } else s.docked = false
}

// ---------------------------------------------------------------- fins de partie

function lose(ctx: Ctx, title: string, text: string) {
  const s = ctx.s
  s.status = 'lost'
  s.endTitle = title
  s.endText = `${text} Il restait ${s.klingonsLeft} croiseur${s.klingonsLeft > 1 ? 's' : ''} klingon${s.klingonsLeft > 1 ? 's' : ''} dans la galaxie.`
  ctx.log(title, 'danger')
}

function win(ctx: Ctx) {
  const s = ctx.s
  const elapsed = Math.max(0.1, s.stardate - s.startDate)
  const rating = Math.round(1000 * (s.klingonsStart / elapsed) ** 2)
  s.status = 'won'
  s.endTitle = 'Félicitations, capitaine !'
  s.endText = `Le dernier croiseur klingon menaçant la Fédération a été détruit en ${fmt1(elapsed)} jours. Votre indice d’efficacité est de ${rating}.`
  ctx.log('Le dernier croiseur klingon a été détruit.', 'success')
}

function checkVitals(ctx: Ctx) {
  const s = ctx.s
  if (s.status !== 'playing') return
  if (s.stardate > missionEnd(s)) {
    lose(ctx, 'Le temps est écoulé', `Nous sommes à la date stellaire ${fmt1(s.stardate)} : les Klingons ont atteint le quartier général de la Fédération.`)
  } else if (s.shields + s.energy <= 10 || (s.energy <= 10 && s.damage[DEV.shields] < 0)) {
    lose(ctx, 'Vaisseau à la dérive', 'Erreur fatale : vous venez d’immobiliser votre vaisseau dans l’espace, sans énergie pour manœuvrer.')
  }
}

function destroyKlingon(ctx: Ctx, k: Klingon) {
  const s = ctx.s
  ctx.emit({ type: 'explode', at: { r: k.r, c: k.c }, big: true })
  ctx.log(`Croiseur klingon détruit au secteur ${fmtPos(k)}`, 'success')
  s.klingons = s.klingons.filter((x) => x !== k)
  s.klingonsLeft--
  s.galaxy[s.quad.r][s.quad.c] -= 100
  s.known[s.quad.r][s.quad.c] = s.galaxy[s.quad.r][s.quad.c]
}

// ---------------------------------------------------------------- riposte klingonne

function klingonsFire(ctx: Ctx) {
  const s = ctx.s
  if (s.klingons.length === 0 || s.status !== 'playing') return
  if (s.docked) {
    ctx.log('Les boucliers de la base stellaire protègent l’Enterprise.', 'quiet')
    return
  }
  for (const k of s.klingons) {
    if (k.energy <= 0) continue
    const h = Math.floor((k.energy / dist(k, s.sector)) * (2 + rnd()))
    k.energy = k.energy / (3 + rnd())
    if (h <= 0) continue
    s.shields -= h
    ctx.emit({ type: 'disruptor', from: { r: k.r, c: k.c }, to: { ...s.sector }, amount: h })
    ctx.log(`Impact de ${h} unités sur l’Enterprise depuis le secteur ${fmtPos(k)}`, 'danger')
    if (s.shields <= 0) {
      s.shields = 0
      ctx.snap()
      ctx.emit({ type: 'explode', at: { ...s.sector }, big: true })
      lose(ctx, 'L’Enterprise a été détruit', 'Les boucliers ont cédé sous le feu klingon. La Fédération sera conquise.')
      return
    }
    ctx.log(`Boucliers réduits à ${Math.round(s.shields)} unités`, 'alert')
    if (h >= 20 && rnd() <= 0.6 && h / s.shields > 0.02) {
      const d = randInt(8)
      s.damage[d] -= h / s.shields + 0.5 * rnd()
      ctx.log(`Avaries causées par l’impact : ${DEVICES[d]}`, 'alert')
    }
    ctx.snap()
  }
}

// ---------------------------------------------------------------- commandes

export function navigate(state: GameState, course: number, warp: number): Outcome {
  const ctx = new Ctx(state)
  const s = ctx.s
  if (!(course >= 1 && course <= 9)) {
    ctx.log('Officier de navigation Sulu : cap invalide (1 à 9).', 'alert')
    return ctx.done()
  }
  const maxWarp = s.damage[DEV.warp] < 0 ? 0.2 : 8
  if (!(warp > 0)) return ctx.done()
  if (warp > maxWarp) {
    ctx.log(`Moteurs warp endommagés : vitesse maximale warp ${maxWarp}.`, 'alert')
    return ctx.done()
  }
  const n = Math.floor(warp * 8 + 0.5)
  if (s.energy - n < 0) {
    ctx.log(`Ingénierie : énergie insuffisante pour manœuvrer à warp ${warp}.`, 'alert')
    if (s.shields >= n - s.energy && s.damage[DEV.shields] >= 0) {
      ctx.log(`La salle de contrôle des boucliers dispose de ${Math.round(s.shields)} unités déployées.`, 'quiet')
    }
    return ctx.done()
  }

  // Les Klingons repositionnent leurs croiseurs et tirent avant notre départ.
  if (s.klingons.length > 0) {
    for (const k of s.klingons) {
      k.r = -1 // libère sa case avant de chercher une nouvelle position
      Object.assign(k, randomEmpty(s))
    }
    ctx.snap()
    klingonsFire(ctx)
    if (s.status !== 'playing') return ctx.done()
  }

  // Réparations en cours de route et incidents aléatoires.
  const repair = warp >= 1 ? 1 : warp
  for (let i = 0; i < s.damage.length; i++) {
    if (s.damage[i] >= 0) continue
    s.damage[i] += repair
    if (s.damage[i] > -0.1 && s.damage[i] < 0) s.damage[i] = -0.1
    else if (s.damage[i] >= 0) {
      s.damage[i] = 0
      ctx.log(`Contrôle des avaries : réparation terminée, ${DEVICES[i]}`, 'success')
    }
  }
  if (rnd() <= 0.2) {
    const d = randInt(8)
    if (rnd() < 0.6) {
      s.damage[d] -= rnd() * 5 + 1
      ctx.log(`Contrôle des avaries : ${DEVICES[d]} en panne`, 'alert')
    } else {
      s.damage[d] = Math.min(0, s.damage[d]) + rnd() * 3 + 1
      if (s.damage[d] > 0) s.damage[d] = 0
      ctx.log(`Contrôle des avaries : état amélioré, ${DEVICES[d]}`, 'success')
    }
  }

  s.heading = course
  const [dr, dc] = courseVector(course)
  const start = { ...s.sector }
  let x = start.r
  let y = start.c
  const path: Pos[] = [{ ...start }]
  let leaving = false
  for (let i = 0; i < n; i++) {
    x += dr
    y += dc
    const p = { r: Math.round(x), c: Math.round(y) }
    if (p.r < 0 || p.r > 7 || p.c < 0 || p.c > 7) {
      leaving = true
      break
    }
    const occ = cellAt(s, p)
    if (occ && occ !== 'ship') {
      x -= dr
      y -= dc
      ctx.log(`Moteurs warp coupés au secteur ${fmtPos({ r: Math.round(x), c: Math.round(y) })} : obstacle sur la trajectoire.`, 'alert')
      break
    }
    path.push(p)
  }

  if (leaving) {
    const { quad: nq, sector: ns, perimeter } = exitTarget(s.quad, start, n, dr, dc)
    if (perimeter) {
      ctx.log('Lt Uhura : Starfleet refuse l’autorisation de franchir le périmètre galactique.', 'alert')
      ctx.log(`Scotty : moteurs coupés au secteur ${fmtPos(ns)} du quadrant ${regionName(nq.r, nq.c)}.`, 'quiet')
    }
    if (nq.r === s.quad.r && nq.c === s.quad.c) {
      s.sector = ns
      if (cellAt(s, ns) !== 'ship' && cellAt(s, ns)) s.sector = randomEmpty(s)
      ctx.emit({ type: 'impulse', path: [start, { ...s.sector }] })
    } else {
      ctx.emit({ type: 'warp', leaving: true })
      s.quad = nq
      s.sector = ns
      s.klingons = []
      s.stars = []
      s.base = null
      spendTravel(ctx, n, warp)
      if (s.status !== 'playing') return ctx.done()
      enterQuadrant(ctx)
      ctx.snap()
      ctx.emit({ type: 'warp', leaving: false })
      checkVitals(ctx)
      return ctx.done()
    }
  } else {
    s.sector = { r: Math.round(x), c: Math.round(y) }
    ctx.emit({ type: 'impulse', path })
  }
  spendTravel(ctx, n, warp)
  if (s.status !== 'playing') return ctx.done()
  checkDocking(ctx)
  checkVitals(ctx)
  return ctx.done()
}

/** Arrivée d'un saut qui sort du quadrant, bornée au périmètre galactique comme dans le BASIC. */
function exitTarget(quad: Pos, start: Pos, n: number, dr: number, dc: number) {
  const ar = Math.round(quad.r * 8 + start.r + n * dr)
  const ac = Math.round(quad.c * 8 + start.c + n * dc)
  const perimeter = ar < 0 || ar > 63 || ac < 0 || ac > 63
  const r = Math.max(0, Math.min(63, ar))
  const c = Math.max(0, Math.min(63, ac))
  return { quad: { r: Math.floor(r / 8), c: Math.floor(c / 8) }, sector: { r: r % 8, c: c % 8 }, perimeter }
}

export interface NavExit {
  /** Point où la trajectoire franchit le bord du quadrant (coordonnées de secteur, fractionnaires). */
  edge: Pos
  quad: Pos
  sector: Pos
  /** Starfleet bloque le saut au bord de la galaxie. */
  perimeter: boolean
}

/**
 * Prévision de NAV : si la trajectoire quitte le quadrant sans heurter d'obstacle,
 * renvoie le point de sortie et le quadrant d'arrivée ; sinon null.
 */
export function navExit(s: GameState, course: number, warp: number): NavExit | null {
  if (!(course >= 1 && course <= 9) || !(warp > 0)) return null
  const n = Math.floor(warp * 8 + 0.5)
  const [dr, dc] = courseVector(course)
  let x = s.sector.r
  let y = s.sector.c
  for (let i = 0; i < n; i++) {
    x += dr
    y += dc
    const p = { r: Math.round(x), c: Math.round(y) }
    if (p.r < 0 || p.r > 7 || p.c < 0 || p.c > 7) {
      const along = (pos: number, d: number) => (d > 0 ? (7.5 - pos) / d : d < 0 ? (-0.5 - pos) / d : Infinity)
      const t = Math.min(along(s.sector.r, dr), along(s.sector.c, dc))
      return { edge: { r: s.sector.r + t * dr, c: s.sector.c + t * dc }, ...exitTarget(s.quad, s.sector, n, dr, dc) }
    }
    const occ = cellAt(s, p)
    if (occ && occ !== 'ship') return null
  }
  return null
}

/** Côté du quadrant franchi par la trajectoire. */
export function exitSide(e: Pos): 'n' | 's' | 'e' | 'w' {
  if (e.c >= 7.49) return 'e'
  if (e.c <= -0.49) return 'w'
  return e.r <= -0.49 ? 'n' : 's'
}

function spendTravel(ctx: Ctx, n: number, warp: number) {
  const s = ctx.s
  s.energy -= n + 10
  if (s.energy < 0) {
    ctx.log('Le contrôle des boucliers fournit l’énergie nécessaire pour achever la manœuvre.', 'alert')
    s.shields = Math.max(0, s.shields + s.energy)
    s.energy = 0
  }
  s.stardate += warp < 1 ? 0.1 * Math.floor(10 * warp) : 1
  checkVitals(ctx)
}

export function firePhasers(state: GameState, amount: number): Outcome {
  const ctx = new Ctx(state)
  const s = ctx.s
  if (s.damage[DEV.phasers] < 0) {
    ctx.log('Les phasers sont hors service.', 'alert')
    return ctx.done()
  }
  if (s.klingons.length === 0) {
    ctx.log('Officier scientifique Spock : les senseurs ne détectent aucun vaisseau ennemi dans ce quadrant.', 'computer')
    return ctx.done()
  }
  amount = Math.floor(amount)
  if (!(amount > 0)) return ctx.done()
  if (amount > s.energy) {
    ctx.log(`Énergie disponible : ${Math.round(s.energy)} unités seulement.`, 'alert')
    return ctx.done()
  }
  if (s.damage[DEV.computer] < 0) ctx.log('La panne de l’ordinateur réduit la précision du tir.', 'alert')
  s.energy -= amount
  let x = amount
  if (s.damage[DEV.computer] < 0) x *= rnd()
  const h1 = Math.floor(x / s.klingons.length)
  for (const k of [...s.klingons]) {
    if (k.energy <= 0) continue
    const h = Math.floor((h1 / dist(k, s.sector)) * (rnd() + 2))
    if (h <= 0.15 * k.energy) {
      ctx.emit({ type: 'phaser', from: { ...s.sector }, to: { r: k.r, c: k.c }, hit: false })
      ctx.log(`Les senseurs n’indiquent aucun dommage à l’ennemi en ${fmtPos(k)}`, 'quiet')
      continue
    }
    k.energy -= h
    ctx.emit({ type: 'phaser', from: { ...s.sector }, to: { r: k.r, c: k.c }, hit: true })
    ctx.log(`Impact de ${h} unités sur le croiseur klingon en ${fmtPos(k)}`, 'info')
    if (k.energy <= 0) destroyKlingon(ctx, k)
    else ctx.log(`Il lui reste ${Math.round(k.energy)} unités d’énergie.`, 'quiet')
    ctx.snap()
  }
  if (s.klingonsLeft <= 0) {
    win(ctx)
    return ctx.done()
  }
  klingonsFire(ctx)
  checkVitals(ctx)
  return ctx.done()
}

export function fireTorpedo(state: GameState, course: number): Outcome {
  const ctx = new Ctx(state)
  const s = ctx.s
  if (s.torpedoes <= 0) {
    ctx.log('Toutes les torpilles à photons ont été tirées.', 'alert')
    return ctx.done()
  }
  if (s.damage[DEV.torpedoes] < 0) {
    ctx.log('Les tubes lance-torpilles sont hors service.', 'alert')
    return ctx.done()
  }
  if (!(course >= 1 && course <= 9)) {
    ctx.log('Ensign Chekov : cap invalide (1 à 9).', 'alert')
    return ctx.done()
  }
  s.energy -= 2
  s.torpedoes -= 1
  s.heading = course
  const [dr, dc] = courseVector(course)
  let x = s.sector.r
  let y = s.sector.c
  const path: Pos[] = []
  let result: () => void = () => ctx.log('Torpille perdue dans l’espace.', 'quiet')
  for (;;) {
    x += dr
    y += dc
    const p = { r: Math.round(x), c: Math.round(y) }
    if (p.r < 0 || p.r > 7 || p.c < 0 || p.c > 7) {
      path.push({ r: x, c: y })
      break
    }
    path.push(p)
    const what = cellAt(s, p)
    if (what === 'klingon') {
      const k = s.klingons.find((q) => q.r === p.r && q.c === p.c)!
      result = () => destroyKlingon(ctx, k)
      break
    }
    if (what === 'star') {
      result = () => {
        ctx.emit({ type: 'absorb', at: p })
        ctx.log(`L’étoile en ${fmtPos(p)} a absorbé l’énergie de la torpille.`, 'quiet')
      }
      break
    }
    if (what === 'base') {
      result = () => {
        ctx.emit({ type: 'explode', at: p, big: true })
        ctx.log('*** Base stellaire détruite ***', 'danger')
        s.base = null
        s.basesLeft--
        s.galaxy[s.quad.r][s.quad.c] -= 10
        s.known[s.quad.r][s.quad.c] = s.galaxy[s.quad.r][s.quad.c]
        const wasDocked = s.docked
        s.docked = false
        if (s.basesLeft > 0 || s.klingonsLeft > s.stardate - s.startDate - s.missionDays) {
          ctx.log('Starfleet examine votre dossier en vue d’une cour martiale !', 'danger')
        } else {
          lose(ctx, 'Relevé de votre commandement', 'Vous avez détruit la dernière base stellaire de la galaxie.')
        }
        if (wasDocked) ctx.log('Amarrage rompu.', 'alert')
      }
      break
    }
  }
  const inside = (p: Pos) => Number.isInteger(p.r) && Number.isInteger(p.c) && p.r >= 0 && p.r <= 7 && p.c >= 0 && p.c <= 7
  const track = path.filter(inside).map(fmtPos)
  ctx.log(`Trajectoire de la torpille : ${track.length ? track.join(' · ') : 'hors secteur'}`, 'computer')
  ctx.emit({ type: 'torpedo', from: { ...s.sector }, path })
  result()
  ctx.snap()
  if (s.status !== 'playing') return ctx.done()
  if (s.klingonsLeft <= 0) {
    win(ctx)
    return ctx.done()
  }
  klingonsFire(ctx)
  checkVitals(ctx)
  return ctx.done()
}

export function setShields(state: GameState, level: number): Outcome {
  const ctx = new Ctx(state)
  const s = ctx.s
  if (s.damage[DEV.shields] < 0) {
    ctx.log('Le contrôle des boucliers est hors service.', 'alert')
    return ctx.done()
  }
  level = Math.floor(level)
  if (!(level >= 0) || level === Math.round(s.shields)) {
    ctx.log('Boucliers inchangés.', 'quiet')
    return ctx.done()
  }
  if (level > s.energy + s.shields) {
    ctx.log('Contrôle des boucliers : « Nous ne sommes pas le trésor de la Fédération. »', 'alert')
    return ctx.done()
  }
  s.energy = s.energy + s.shields - level
  s.shields = level
  ctx.log(`Salle des déflecteurs : boucliers à ${level} unités, selon vos ordres.`, 'info')
  checkVitals(ctx)
  return ctx.done()
}

export function longRangeScan(state: GameState): Outcome {
  const ctx = new Ctx(state)
  const s = ctx.s
  if (s.damage[DEV.lrs] < 0) {
    ctx.log('Les senseurs longue portée sont hors service.', 'alert')
    return ctx.done()
  }
  const cells: (number | null)[][] = []
  for (let dr = -1; dr <= 1; dr++) {
    const row: (number | null)[] = []
    for (let dc = -1; dc <= 1; dc++) {
      const r = s.quad.r + dr
      const c = s.quad.c + dc
      if (r < 0 || r > 7 || c < 0 || c > 7) row.push(null)
      else {
        row.push(s.galaxy[r][c])
        s.known[r][c] = s.galaxy[r][c]
      }
    }
    cells.push(row)
  }
  s.lastScan = { quad: { ...s.quad }, cells }
  ctx.log(`Scan longue portée autour du quadrant ${regionName(s.quad.r, s.quad.c)} terminé.`, 'computer')
  return ctx.done()
}

export function authorizeRepairs(state: GameState): Outcome {
  const ctx = new Ctx(state)
  const s = ctx.s
  if (!s.docked || !s.damage.some((d) => d < 0)) return ctx.done()
  const t = repairEstimate(s)
  s.damage = s.damage.map(() => 0)
  s.stardate += t + 0.1
  ctx.log(`Les techniciens de la base ont réparé l’Enterprise en ${fmt1(t + 0.1)} jours.`, 'success')
  checkVitals(ctx)
  return ctx.done()
}
