import { DEV, DEVICES, MAX_TORPEDOES, regionName } from '../game/constants'
import { cellAt, condition, courseTo, daysLeft, detour, fmtPos, navBlock, navDetour, repairEstimate } from '../game/engine'
import type { GameState, Leg, NavBlock, Pos } from '../game/types'
import { CourseDial, CourseInput } from './CourseDial'
import { Digits } from './GalaxyMap'

export type PanelId = 'nav' | 'tor' | 'pha' | 'she' | 'lrs' | 'dam' | 'com'

export const PANELS: { id: PanelId; code: string; label: string; key: string; tone: string }[] = [
  { id: 'nav', code: 'NAV', label: 'Navigation', key: 'n', tone: 'peach' },
  { id: 'tor', code: 'TOR', label: 'Torpilles', key: 't', tone: 'rust' },
  { id: 'pha', code: 'PHA', label: 'Phasers', key: 'p', tone: 'butter' },
  { id: 'she', code: 'SHE', label: 'Boucliers', key: 's', tone: 'cobalt' },
  { id: 'lrs', code: 'LRS', label: 'Scan longue portée', key: 'l', tone: 'lilac' },
  { id: 'dam', code: 'DAM', label: 'Avaries', key: 'd', tone: 'peach' },
  { id: 'com', code: 'COM', label: 'Ordinateur', key: 'c', tone: 'lilac' },
]

interface Common {
  state: GameState
  busy: boolean
}

export function NavPanel({
  state,
  busy,
  course,
  warp,
  block,
  setCourse,
  setWarp,
  onLeg,
  onEngage,
}: Common & {
  course: number
  warp: number
  /** Obstacle prévu sur la trajectoire (null si dégagée ou si les senseurs ne le voient pas). */
  block: NavBlock | null
  setCourse: (v: number) => void
  setWarp: (v: number) => void
  onLeg: (leg: Leg) => void
  onEngage: () => void
}) {
  const maxWarp = state.damage[DEV.warp] < 0 ? 0.2 : 8
  const n = Math.floor(warp * 8 + 0.5)
  const days = warp < 1 ? 0.1 * Math.floor(10 * warp) : 1
  const short = state.energy < n
  const around = block ? navDetour(state, course, warp) : null
  return (
    <div className="cmd-panel">
      <CourseDial value={course} onChange={setCourse} tone="nav" />
      <div className="cmd-body">
        <p className="hint">Choisissez un cap sur le cadran, ou cliquez une case du secteur ou un quadrant de la carte.</p>
        <div className="row">
          <CourseInput value={course} onChange={setCourse} />
          <label className="field grow">
            <span>Facteur warp {warp.toFixed(1)}</span>
            <input
              type="range"
              min={0.1}
              max={maxWarp}
              step={0.1}
              value={Math.min(warp, maxWarp)}
              onChange={(e) => setWarp(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <dl className="facts">
          <div><dt>Distance</dt><dd>{warp >= 1 ? `${fmt(warp)} quadrant${warp >= 2 ? 's' : ''}` : `${n} secteur${n > 1 ? 's' : ''}`}</dd></div>
          <div><dt>Énergie</dt><dd className={short ? 'bad' : ''}>{n + 10} unités</dd></div>
          <div><dt>Durée</dt><dd>{fmt(days)} jour{days > 1 ? 's' : ''}</dd></div>
        </dl>
        {block && (
          <p className="warn">
            Trajectoire obstruée : {blockText(block, state.sector, 'couperont')}
          </p>
        )}
        {around && <DetourLine legs={around} busy={busy} onLeg={onLeg} />}
        {maxWarp < 8 && <p className="warn">Moteurs warp endommagés : warp 0,2 maximum.</p>}
        <button className="action peach" disabled={busy || warp > maxWarp} onClick={onEngage}>
          Engager
        </button>
      </div>
    </div>
  )
}

export function TorpedoPanel({
  state,
  busy,
  course,
  setCourse,
  onFire,
}: Common & { course: number; setCourse: (v: number) => void; onFire: () => void }) {
  const down = state.damage[DEV.torpedoes] < 0
  return (
    <div className="cmd-panel">
      <CourseDial value={course} onChange={setCourse} tone="tor" />
      <div className="cmd-body">
        <p className="hint">Cliquez un croiseur klingon pour calculer la solution de tir.</p>
        <div className="row">
          <CourseInput value={course} onChange={setCourse} />
          <div className="torps" aria-label={`${state.torpedoes} torpilles`}>
            {Array.from({ length: MAX_TORPEDOES }, (_, i) => (
              <span key={i} className={i < state.torpedoes ? 'pip on' : 'pip'} />
            ))}
          </div>
        </div>
        {down && <p className="warn">Tubes lance-torpilles hors service.</p>}
        <button className="action rust" disabled={busy || down || state.torpedoes <= 0} onClick={onFire}>
          Feu
        </button>
      </div>
    </div>
  )
}

export function PhaserPanel({
  state,
  busy,
  amount,
  setAmount,
  onFire,
}: Common & { amount: number; setAmount: (v: number) => void; onFire: () => void }) {
  const down = state.damage[DEV.phasers] < 0
  const max = Math.floor(state.energy)
  const per = state.klingons.length ? Math.floor(amount / state.klingons.length) : 0
  return (
    <div className="cmd-panel single">
      <div className="cmd-body">
        <p className="hint">L’énergie se répartit entre tous les croiseurs du quadrant, et faiblit avec la distance.</p>
        <label className="field grow">
          <span>Énergie à tirer : {amount} unités</span>
          <input type="range" min={0} max={max} step={10} value={Math.min(amount, max)} onChange={(e) => setAmount(parseInt(e.target.value))} />
        </label>
        <div className="presets">
          {[100, 250, 500, 1000].map((v) => (
            <button key={v} className="chip" disabled={v > max} onClick={() => setAmount(v)}>
              {v}
            </button>
          ))}
        </div>
        <ul className="targets">
          {state.klingons.length === 0 && <li className="quiet">Aucun ennemi dans ce quadrant.</li>}
          {state.klingons.map((k, i) => {
            const d = Math.hypot(k.r - state.sector.r, k.c - state.sector.c)
            return (
              <li key={i}>
                <span>Klingon en {fmtPos(k)}</span>
                <span>distance {d.toFixed(1)}</span>
                <span>≈ {Math.floor((per / d) * 2.5)} de dégâts</span>
              </li>
            )
          })}
        </ul>
        {down && <p className="warn">Phasers hors service.</p>}
        <button className="action butter" disabled={busy || down || amount <= 0} onClick={onFire}>
          Tirer les phasers
        </button>
      </div>
    </div>
  )
}

export function ShieldPanel({
  state,
  busy,
  level,
  setLevel,
  onSet,
}: Common & { level: number; setLevel: (v: number) => void; onSet: () => void }) {
  const total = Math.floor(state.energy + state.shields)
  const down = state.damage[DEV.shields] < 0
  return (
    <div className="cmd-panel single">
      <div className="cmd-body">
        <p className="hint">L’énergie des boucliers est prélevée sur la réserve du vaisseau. Avec des boucliers à zéro, le premier tir klingon est fatal.</p>
        <label className="field grow">
          <span>Boucliers : {level} unités</span>
          <input type="range" min={0} max={total} step={10} value={Math.min(level, total)} onChange={(e) => setLevel(parseInt(e.target.value))} />
        </label>
        <div className="split-bar" aria-hidden>
          <span className="shields" style={{ width: `${(level / Math.max(1, total)) * 100}%` }} />
        </div>
        <dl className="facts">
          <div><dt>Boucliers</dt><dd>{level}</dd></div>
          <div><dt>Réserve</dt><dd>{total - level}</dd></div>
        </dl>
        {state.docked && <p className="hint">Amarré : la base stellaire vous protège.</p>}
        {down && <p className="warn">Contrôle des boucliers hors service.</p>}
        <button className="action cobalt" disabled={busy || down} onClick={onSet}>
          Transférer l’énergie
        </button>
      </div>
    </div>
  )
}

export function ScanPanel({ state, busy, onScan }: Common & { onScan: () => void }) {
  const scan = state.lastScan
  const fresh = scan && scan.quad.r === state.quad.r && scan.quad.c === state.quad.c
  const down = state.damage[DEV.lrs] < 0
  return (
    <div className="cmd-panel single">
      <div className="cmd-body lrs">
        <div className="lrs-grid">
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const code = fresh ? scan!.cells[r][c] : undefined
              return (
                <div key={`${r}${c}`} className={`lrs-cell ${r === 1 && c === 1 ? 'center' : ''}`}>
                  {code === undefined ? <span className="digits unknown">···</span> : code === null ? <span className="digits void">***</span> : <Digits code={code} />}
                </div>
              )
            }),
          )}
        </div>
        <div>
          <p className="hint">Le scan révèle les huit quadrants voisins et les enregistre dans les archives. Il ne coûte ni temps ni énergie.</p>
          {down && <p className="warn">Senseurs longue portée hors service.</p>}
          <button className="action lilac" disabled={busy || down} onClick={onScan}>
            Lancer le scan
          </button>
        </div>
      </div>
    </div>
  )
}

export function DamagePanel({ state, busy, onRepair }: Common & { onRepair: () => void }) {
  const unavailable = state.damage[DEV.damageControl] < 0
  const broken = state.damage.some((d) => d < 0)
  return (
    <div className="cmd-panel single">
      <div className="cmd-body">
        {unavailable && !state.docked ? (
          <p className="warn">Le contrôle des avaries est lui-même endommagé : rapport indisponible.</p>
        ) : (
          <ul className="devices">
            {DEVICES.map((d, i) => {
              const v = state.damage[i]
              return (
                <li key={d} className={v < 0 ? 'hurt' : ''}>
                  <span>{d}</span>
                  <span className="meter">
                    <span style={{ width: `${v < 0 ? Math.max(6, 100 - Math.min(100, -v * 20)) : 100}%` }} />
                  </span>
                  <span className="val">{v < 0 ? `${(-v).toFixed(1)} j` : 'Opérationnel'}</span>
                </li>
              )
            })}
          </ul>
        )}
        {state.docked && broken && (
          <button className="action peach" disabled={busy} onClick={onRepair}>
            Autoriser les réparations ({(repairEstimate(state) + 0.1).toFixed(1)} jours)
          </button>
        )}
        {!state.docked && broken && <p className="hint">Les systèmes se réparent pendant les déplacements, ou d’un coup dans une base stellaire.</p>}
      </div>
    </div>
  )
}

export function ComputerPanel({
  state,
  busy,
  names,
  setNames,
  onAim,
}: Common & { names: boolean; setNames: (v: boolean) => void; onAim: (course: number, kind: 'tor' | 'nav', steps?: number) => void }) {
  if (state.damage[DEV.computer] < 0) {
    return (
      <div className="cmd-panel single">
        <div className="cmd-body">
          <p className="warn">Ordinateur de bord hors service.</p>
        </div>
      </div>
    )
  }
  const cond = { docked: 'Amarré', red: 'Rouge', yellow: 'Jaune', green: 'Vert' }[condition(state)]
  const toBase = state.base ? courseTo(state.sector, state.base) : null
  const baseSteps = toBase ? Math.max(1, toBase.steps - 1) : 0
  // Sans senseurs courte portée, l'ordinateur ne voit pas les obstacles.
  const sees = state.damage[DEV.srs] >= 0
  const baseBlock = toBase && toBase.steps > 1 && sees ? navBlock(state, toBase.course, baseSteps / 8) : null
  const baseDetour = baseBlock && state.base ? detour(state, dockingCells(state, state.base)) : null
  return (
    <div className="cmd-panel single">
      <div className="cmd-body computer">
        <section>
          <h3>Rapport de situation</h3>
          <p>
            Il reste {state.klingonsLeft} croiseur{state.klingonsLeft > 1 ? 's' : ''} klingon{state.klingonsLeft > 1 ? 's' : ''}. La
            mission doit s’achever dans {daysLeft(state).toFixed(1)} jours. La Fédération dispose de {state.basesLeft} base
            {state.basesLeft > 1 ? 's' : ''} stellaire{state.basesLeft > 1 ? 's' : ''}. Condition {cond.toLowerCase()}.
          </p>
        </section>
        <section>
          <h3>Données de tir</h3>
          {state.klingons.length === 0 ? (
            <p className="quiet">Aucune cible dans le quadrant {regionName(state.quad.r, state.quad.c)}.</p>
          ) : (
            <ul className="targets">
              {state.klingons.map((k, i) => {
                const res = courseTo(state.sector, k)!
                return (
                  <li key={i}>
                    <span>Klingon en {fmtPos(k)}</span>
                    <span>cap {res.course.toFixed(2)}</span>
                    <button className="chip" disabled={busy} onClick={() => onAim(res.course, 'tor')}>
                      Viser
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section>
          <h3>Navigation vers la base</h3>
          {toBase ? (
            <>
              <p>
                Base stellaire en {fmtPos(state.base!)} : cap {toBase.course.toFixed(2)}, warp {fmt(baseSteps / 8)}.{' '}
                <button className="chip" disabled={busy} onClick={() => onAim(toBase.course, 'nav', baseSteps)}>
                  Tracer la route
                </button>
              </p>
              {baseBlock && <p className="warn">Route obstruée : {blockText(baseBlock, state.sector, 'couperaient')}</p>}
              {baseBlock &&
                (baseDetour ? (
                  <DetourLine legs={baseDetour} busy={busy} onLeg={(l) => onAim(l.course, 'nav', l.steps)} />
                ) : (
                  <p className="quiet">Aucun contournement en deux sauts : rapprochez-vous d’abord par un autre chemin.</p>
                ))}
            </>
          ) : (
            <p className="quiet">Les senseurs ne détectent aucune base stellaire dans ce quadrant.</p>
          )}
        </section>
        <label className="toggle">
          <input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} />
          <span>Afficher les noms des régions sur la carte</span>
        </label>
      </div>
    </div>
  )
}

const BLOCK_NAME: Record<NavBlock['what'], string> = { star: 'étoile', base: 'base stellaire', klingon: 'croiseur klingon' }

/** « étoile en 3,2. Les moteurs couperont au secteur 2,1. » (verbe au futur ou au conditionnel) */
function blockText(b: NavBlock, from: Pos, verb: string) {
  const where = b.stop.r === from.r && b.stop.c === from.c ? 'aussitôt, sans que l’Enterprise ait bougé' : `au secteur ${fmtPos(b.stop)}`
  const moving = b.what === 'klingon' ? ' Le croiseur se repositionnera avant le départ : la route peut se libérer, ou se fermer ailleurs.' : ''
  return `${BLOCK_NAME[b.what]} en ${fmtPos(b.at)}. Les moteurs ${verb} ${where}.${moving}`
}

/** Cases libres voisines de la base : s'y arrêter suffit pour s'amarrer. */
function dockingCells(s: GameState, base: Pos): Pos[] {
  const out: Pos[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const p = { r: base.r + dr, c: base.c + dc }
      if (p.r < 0 || p.r > 7 || p.c < 0 || p.c > 7) continue
      const what = p.r === s.sector.r && p.c === s.sector.c ? null : cellAt(s, p)
      if (!what) out.push(p)
    }
  }
  return out
}

/** Route de rechange proposée par l'ordinateur, avec un bouton pour régler le premier saut. */
function DetourLine({ legs, busy, onLeg }: { legs: Leg[]; busy: boolean; onLeg: (leg: Leg) => void }) {
  const leg = (l: Leg) => `cap ${l.course.toFixed(2)}, warp ${fmt(l.steps / 8)} jusqu’au secteur ${fmtPos(l.to)}`
  return (
    <p>
      {legs.length === 1 ? `Route dégagée : ${leg(legs[0])}.` : `Contournement : ${leg(legs[0])}, puis ${leg(legs[1])}.`}{' '}
      <button className="chip" disabled={busy} onClick={() => onLeg(legs[0])}>
        {legs.length === 1 ? 'Tracer cette route' : 'Tracer le 1er saut'}
      </button>
    </p>
  )
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',')
