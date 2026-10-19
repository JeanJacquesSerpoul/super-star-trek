import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { isMuted, setMuted, sfx } from './audio'
import { DEV, MAX_ENERGY, MAX_TORPEDOES, regionName } from './game/constants'
import {
  authorizeRepairs,
  cellAt,
  condition,
  courseTo,
  daysLeft,
  firePhasers,
  fireTorpedo,
  fmtPos,
  longRangeScan,
  navBlock,
  navExit,
  navigate,
  setShields,
} from './game/engine'
import type { Aim, GameState, LogLine, Pos } from './game/types'
import { GalaxyMap } from './components/GalaxyMap'
import {
  ComputerPanel,
  DamagePanel,
  NavPanel,
  PANELS,
  PhaserPanel,
  ScanPanel,
  ShieldPanel,
  TorpedoPanel,
  type PanelId,
} from './components/Panels'
import { SectorView } from './components/SectorView'
import { useGame } from './useGame'

const SectorView3D = lazy(() => import('./components/three/SectorView3D'))

const WEBGL = (() => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

function initialView(): '3d' | '2d' {
  if (!WEBGL) return '2d'
  try {
    return localStorage.getItem('st-view') === '2d' ? '2d' : '3d'
  } catch {
    return '3d'
  }
}

const COND_LABEL = { docked: 'Amarré', red: 'Condition rouge', yellow: 'Condition jaune', green: 'Condition verte' }
const CELL_NAME = { ship: 'Enterprise', klingon: 'Croiseur klingon', star: 'Étoile', base: 'Base stellaire' }

export default function App() {
  const game = useGame()
  const { state, shown, busy } = game
  const [briefed, setBriefed] = useState(false)
  const [panel, setPanel] = useState<PanelId>('nav')
  const [navCourse, setNavCourse] = useState(1)
  const [warp, setWarpFactor] = useState(1)
  const [torCourse, setTorCourse] = useState(1)
  const [phaser, setPhaser] = useState(300)
  const [shieldLevel, setShieldLevel] = useState(0)
  const [names, setNames] = useState(false)
  const [muted, setMute] = useState(isMuted())
  const [view, setView] = useState(initialView)
  const toggleView = () => {
    const v = view === '3d' ? '2d' : '3d'
    setView(v)
    try {
      localStorage.setItem('st-view', v)
    } catch {
      /* stockage indisponible */
    }
  }

  const playing = state.status === 'playing'
  const ready = briefed && playing && !busy
  const computerOk = state.damage[DEV.computer] >= 0
  // Prévoir les obstacles demande l'ordinateur de bord et des senseurs courte portée qui les voient.
  const foresee = computerOk && state.damage[DEV.srs] >= 0
  const cond = condition(shown)

  const choose = (id: PanelId) => {
    sfx.beep(id === panel ? 520 : 780)
    // Le curseur des boucliers repart de l'état réel à chaque ouverture du panneau.
    if (id === 'she') setShieldLevel(Math.round(state.shields))
    setPanel(id)
  }

  const commands = {
    nav: () => game.apply((s) => navigate(s, navCourse, warp)),
    tor: () => game.apply((s) => fireTorpedo(s, torCourse)),
    pha: () => game.apply((s) => firePhasers(s, phaser)),
    she: () => game.apply((s) => setShields(s, shieldLevel)),
    lrs: () => game.apply(longRangeScan),
    rep: () => game.apply(authorizeRepairs),
  }

  // Raccourcis clavier : N T P S L D C, Entrée pour exécuter.
  const keys = useRef({ choose, commands, panel, ready })
  useEffect(() => {
    keys.current = { choose, commands, panel, ready }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'range') return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = keys.current
      const p = PANELS.find((x) => x.key === e.key.toLowerCase())
      if (p) {
        k.choose(p.id)
        return
      }
      if (e.key === 'Enter' && k.ready && t.tagName !== 'BUTTON') {
        const run = { nav: k.commands.nav, tor: k.commands.tor, pha: k.commands.pha, she: k.commands.she, lrs: k.commands.lrs } as Record<string, () => void>
        run[k.panel]?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const describeCell = (p: Pos) => {
    const what = cellAt(shown, p)
    const name = what ? CELL_NAME[what] : `Secteur ${fmtPos(p)}`
    if (what === 'ship') return 'Enterprise'
    if (!computerOk) return `${name} : ordinateur hors service`
    const res = courseTo(shown.sector, p)
    if (!res) return name
    if (what === 'klingon' || panel === 'tor') return `${name} : cap ${res.course.toFixed(2)}`
    const steps = what ? res.steps - 1 : res.steps
    const block = foresee && steps > 0 ? navBlock(shown, res.course, steps / 8) : null
    return `${name} : cap ${res.course.toFixed(2)}, ${steps} secteur${steps > 1 ? 's' : ''}${block ? `, obstacle en ${fmtPos(block.at)}` : ''}`
  }

  const onCell = (p: Pos) => {
    if (!computerOk) return
    const res = courseTo(shown.sector, p)
    if (!res) return
    const what = cellAt(shown, p)
    if (what === 'klingon' || panel === 'tor') {
      setTorCourse(res.course)
      setPanel('tor')
    } else {
      const steps = what ? res.steps - 1 : res.steps
      if (steps < 1) return
      setNavCourse(res.course)
      setWarpFactor(steps / 8)
      setPanel('nav')
    }
    sfx.beep(1040)
  }

  const absFrom = (s: GameState) => ({ r: s.quad.r * 8 + s.sector.r, c: s.quad.c * 8 + s.sector.c })
  const describeQuad = (q: Pos) => {
    const code = shown.known[q.r][q.c]
    const name = regionName(q.r, q.c)
    if (q.r === shown.quad.r && q.c === shown.quad.c) return `${name} : position actuelle`
    const res = courseTo(absFrom(shown), { r: q.r * 8 + shown.sector.r, c: q.c * 8 + shown.sector.c })
    const info = code === null ? 'inexploré' : `${Math.floor(code / 100)} K, ${Math.floor(code / 10) % 10} B, ${code % 10} étoiles`
    return res ? `${name} (${info}) : cap ${res.course.toFixed(2)}, warp ${(res.steps / 8).toFixed(2)}` : name
  }
  const onQuadrant = (q: Pos) => {
    const res = courseTo(absFrom(shown), { r: q.r * 8 + shown.sector.r, c: q.c * 8 + shown.sector.c })
    if (!res) return
    setNavCourse(res.course)
    setWarpFactor(Math.min(8, res.steps / 8))
    setPanel('nav')
    sfx.beep(1040)
  }

  const navBlocked = useMemo(() => (foresee ? navBlock(state, navCourse, warp) : null), [foresee, state, navCourse, warp])

  const aim = useMemo((): Aim | null => {
    if (!briefed || busy || !playing) return null
    if (panel === 'nav') return { course: navCourse, steps: Math.floor(warp * 8 + 0.5), kind: 'nav', exit: describeExit(state, navCourse, warp), block: navBlocked }
    if (panel === 'tor') return { course: torCourse, steps: null, kind: 'tor', exit: null, block: null }
    return null
  }, [panel, navCourse, warp, torCourse, busy, playing, briefed, state, navBlocked])

  const viewProps = {
    state: shown,
    fx: game.fx,
    warp: game.warp,
    shake: game.shake,
    moveMs: game.moveMs,
    aim,
    describe: describeCell,
    onCell,
    interactive: ready,
  }

  // Ligne de commande façon 1978.
  const runText = (raw: string) => {
    const [cmd, ...args] = raw.trim().toLowerCase().split(/[\s,;]+/)
    const nums = args.map((a) => parseFloat(a))
    game.say(`> ${raw.trim().toUpperCase()}`, 'quiet')
    if (!ready) return
    switch (cmd) {
      case 'nav':
        if (nums.length < 2 || nums.some(isNaN)) return game.say('Usage : NAV cap warp, par exemple NAV 3 1')
        setNavCourse(nums[0])
        setWarpFactor(nums[1])
        setPanel('nav')
        return game.apply((s) => navigate(s, nums[0], nums[1]))
      case 'tor':
        if (isNaN(nums[0])) return game.say('Usage : TOR cap, par exemple TOR 4.5')
        setTorCourse(nums[0])
        setPanel('tor')
        return game.apply((s) => fireTorpedo(s, nums[0]))
      case 'pha':
        if (isNaN(nums[0])) return game.say('Usage : PHA énergie, par exemple PHA 500')
        setPanel('pha')
        return game.apply((s) => firePhasers(s, nums[0]))
      case 'she':
        if (isNaN(nums[0])) return game.say('Usage : SHE unités, par exemple SHE 800')
        setShieldLevel(Math.floor(nums[0]))
        setPanel('she')
        return game.apply((s) => setShields(s, nums[0]))
      case 'lrs':
        setPanel('lrs')
        return game.apply(longRangeScan)
      case 'srs':
        return game.say('Le scan courte portée est affiché en permanence sur l’écran principal.')
      case 'dam':
        return setPanel('dam')
      case 'com':
        return setPanel('com')
      case 'xxx':
        return game.restart()
      default:
        game.say('Commandes : NAV, TOR, PHA, SHE, LRS, SRS, DAM, COM, XXX (abandon)')
    }
  }

  const toggleMute = () => {
    setMuted(!muted)
    setMute(!muted)
  }

  return (
    <div className={`console cond-${cond}`}>
      <header className="topbar">
        <div className="elbow top" />
        <div className="topbar-main">
          <h1>
            USS Enterprise <span>NCC-1701</span>
          </h1>
          <div className="bar-fill" />
          <div className="readout">
            <span className="lbl">Date stellaire</span>
            <span className="val">{shown.stardate.toFixed(1)}</span>
          </div>
          <div className="readout">
            <span className="lbl">Jours restants</span>
            <span className="val">{daysLeft(shown).toFixed(1)}</span>
          </div>
          <div className={`cond-pill ${cond}`} key={game.alertPulse}>
            {COND_LABEL[cond]}
          </div>
          <button className="bar-btn" onClick={toggleMute} aria-pressed={!muted}>
            {muted ? 'Son coupé' : 'Son actif'}
          </button>
          <button className="bar-btn alt" onClick={() => (confirm('Abandonner cette mission et en commencer une nouvelle ?') ? game.restart() : null)}>
            Nouvelle mission
          </button>
        </div>
      </header>

      <nav className="sidebar" aria-label="Postes de commande">
        {PANELS.map((p) => (
          <button
            key={p.id}
            className={`side-btn ${p.tone} ${panel === p.id ? 'active' : ''}`}
            onClick={() => choose(p.id)}
            aria-pressed={panel === p.id}
            title={`Raccourci : ${p.key.toUpperCase()}`}
          >
            <span className="code">{p.code}</span>
            <span className="name">{p.label}</span>
          </button>
        ))}
        <div className="side-fill" />
        <div className="elbow bottom" />
      </nav>

      <main className="bridge">
        <div className="viewscreen">
          <div className="viewscreen-head">
            <h2>Scan courte portée</h2>
            <span className="loc">
              {regionName(shown.quad.r, shown.quad.c)}, secteur {fmtPos(shown.sector)}
            </span>
            {WEBGL && (
              <button className="view-toggle" onClick={toggleView} aria-pressed={view === '3d'}>
                {view === '3d' ? 'Vue 2D' : 'Vue 3D'}
              </button>
            )}
          </div>
          {view === '3d' ? (
            <Suspense fallback={<SectorView {...viewProps} />}>
              <SectorView3D {...viewProps} />
            </Suspense>
          ) : (
            <SectorView {...viewProps} />
          )}
          {game.refuel && (
            <div className="dock-banner" key={game.refuel.id} role="status">
              <strong>Amarrage à la base stellaire</strong>
              <span className="dock-lines">
                <span>Énergie <b>{game.refuel.energy > 0 ? `+${game.refuel.energy}` : 'pleine'}</b></span>
                <span>Torpilles <b>{game.refuel.torpedoes > 0 ? `+${game.refuel.torpedoes}` : 'pleines'}</b></span>
                <span>
                  {game.refuel.repairs > 0
                    ? `${game.refuel.repairs} système${game.refuel.repairs > 1 ? 's' : ''} à réparer : poste DAM`
                    : 'Aucune avarie'}
                </span>
              </span>
            </div>
          )}
          {view === '3d' && <p className="view-hint">Glissez pour faire pivoter la caméra, double-cliquez pour la recentrer.</p>}
          {briefed && !busy && state.status !== 'playing' && (
            <div className={`ending ${state.status}`}>
              <h2>{state.endTitle}</h2>
              <p>{state.endText}</p>
              <button className="action peach" onClick={game.restart}>
                Nouvelle mission
              </button>
            </div>
          )}
        </div>

        <section className="station" aria-label={PANELS.find((p) => p.id === panel)!.label}>
          <h2 className={`station-head head-${PANELS.find((p) => p.id === panel)!.tone}`}>{PANELS.find((p) => p.id === panel)!.label}</h2>
          {panel === 'nav' && (
            <NavPanel
              state={state}
              busy={!ready}
              course={navCourse}
              warp={warp}
              block={navBlocked}
              setCourse={setNavCourse}
              setWarp={setWarpFactor}
              onLeg={(leg) => {
                setNavCourse(leg.course)
                setWarpFactor(leg.steps / 8)
                sfx.beep(1040)
              }}
              onEngage={commands.nav}
            />
          )}
          {panel === 'tor' && <TorpedoPanel state={state} busy={!ready} course={torCourse} setCourse={setTorCourse} onFire={commands.tor} />}
          {panel === 'pha' && <PhaserPanel state={state} busy={!ready} amount={phaser} setAmount={setPhaser} onFire={commands.pha} />}
          {panel === 'she' && <ShieldPanel state={state} busy={!ready} level={shieldLevel} setLevel={setShieldLevel} onSet={commands.she} />}
          {panel === 'lrs' && <ScanPanel state={state} busy={!ready} onScan={commands.lrs} />}
          {panel === 'dam' && <DamagePanel state={state} busy={!ready} onRepair={commands.rep} />}
          {panel === 'com' && (
            <ComputerPanel
              state={state}
              busy={!ready}
              names={names}
              setNames={setNames}
              onAim={(c, kind, steps) => {
                if (kind === 'tor') {
                  setTorCourse(c)
                  setPanel('tor')
                } else {
                  setNavCourse(c)
                  if (steps) setWarpFactor(steps / 8)
                  setPanel('nav')
                }
              }}
            />
          )}
        </section>
      </main>

      <aside className="sidecol">
        <GalaxyMap state={shown} names={names} onQuadrant={onQuadrant} describe={describeQuad} interactive={ready} />
        <Status state={shown} refueling={!!game.refuel} />
        <CaptainsLog log={game.log} onCommand={runText} />
      </aside>

      {!briefed && <Briefing state={state} onAccept={() => { setBriefed(true); game.begin() }} />}
    </div>
  )
}

/** Libellé du marqueur de sortie : quadrant d'arrivée, ou arrêt au périmètre galactique. */
function describeExit(s: GameState, course: number, warp: number): Aim['exit'] {
  const e = navExit(s, course, warp)
  if (!e) return null
  const name = regionName(e.quad.r, e.quad.c)
  if (e.perimeter) {
    const same = e.quad.r === s.quad.r && e.quad.c === s.quad.c
    return { edge: e.edge, perimeter: true, title: 'Périmètre galactique', sub: same ? `arrêt au secteur ${fmtPos(e.sector)}` : `arrêt en ${name}, secteur ${fmtPos(e.sector)}` }
  }
  const code = s.known[e.quad.r][e.quad.c]
  const intel = code === null ? 'inexploré' : code >= 100 ? `${Math.floor(code / 100)} Klingon${code >= 200 ? 's' : ''} signalé${code >= 200 ? 's' : ''}` : 'aucun Klingon signalé'
  return { edge: e.edge, perimeter: false, title: `Vers ${name}`, sub: `secteur ${fmtPos(e.sector)} · ${intel}` }
}

function Gauge({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={`gauge tone-${tone}`}>
      <div className="gauge-top">
        <span>{label}</span>
        <span className="num">{Math.round(value)}</span>
      </div>
      <div className="gauge-track">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Status({ state, refueling }: { state: GameState; refueling: boolean }) {
  const hurt = state.damage.filter((d) => d < 0).length
  return (
    <section className={`status panel-frame ${refueling ? 'refueling' : ''}`} aria-label="État du vaisseau">
      <header className="frame-head">
        <h2>État du vaisseau</h2>
        <span className={hurt ? 'legend bad' : 'legend'}>{hurt ? `${hurt} système${hurt > 1 ? 's' : ''} endommagé${hurt > 1 ? 's' : ''}` : 'Tous systèmes opérationnels'}</span>
      </header>
      <Gauge label="Énergie" value={state.energy} max={MAX_ENERGY} tone={state.energy < MAX_ENERGY * 0.1 ? 'rust' : 'peach'} />
      <Gauge label="Boucliers" value={state.shields} max={MAX_ENERGY} tone="cobalt" />
      <div className="stat-row">
        <div>
          <span className="lbl">Torpilles</span>
          <span className="torps small">
            {Array.from({ length: MAX_TORPEDOES }, (_, i) => (
              <span key={i} className={i < state.torpedoes ? 'pip on' : 'pip'} />
            ))}
          </span>
        </div>
        <div>
          <span className="lbl">Klingons</span>
          <span className="big k">
            {state.klingonsLeft}
            <small> / {state.klingonsStart}</small>
          </span>
        </div>
        <div>
          <span className="lbl">Bases</span>
          <span className="big b">{state.basesLeft}</span>
        </div>
      </div>
    </section>
  )
}

const TONE_CLASS: Record<LogLine['tone'], string> = {
  info: 'info',
  alert: 'alert',
  danger: 'danger',
  success: 'success',
  computer: 'computer',
  quiet: 'quiet',
}

function CaptainsLog({ log, onCommand }: { log: LogLine[]; onCommand: (s: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  useEffect(() => {
    const el = box.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])
  return (
    <section className="log panel-frame" aria-label="Journal de bord">
      <header className="frame-head">
        <h2>Journal de bord</h2>
      </header>
      <div className="log-lines" aria-live="polite" ref={box}>
        {log.map((l) => (
          <p key={l.id} className={TONE_CLASS[l.tone]}>
            {l.text}
          </p>
        ))}
      </div>
      <form
        className="cli"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) onCommand(text)
          setText('')
        }}
      >
        <label htmlFor="cli">Commande</label>
        <input id="cli" value={text} onChange={(e) => setText(e.target.value)} placeholder="NAV 3 1, TOR 4.5, PHA 500…" autoComplete="off" spellCheck={false} />
      </form>
    </section>
  )
}

function Briefing({ state, onAccept }: { state: GameState; onAccept: () => void }) {
  const end = state.startDate + state.missionDays
  return (
    <div className="briefing" role="dialog" aria-modal="true" aria-labelledby="brief-title">
      <div className="brief-card">
        <div className="brief-art" aria-hidden>
          <span>STAR</span>
          <span>TREK</span>
        </div>
        <div className="brief-body">
          <h2 id="brief-title">Ordres de mission</h2>
          <p className="lead">
            Détruisez les <strong>{state.klingonsStart} croiseurs klingons</strong> qui ont envahi la galaxie avant qu’ils
            n’attaquent le quartier général de la Fédération à la date stellaire <strong>{end}</strong>. Vous disposez de{' '}
            <strong>{state.missionDays} jours</strong> et de <strong>{state.basesLeft} base{state.basesLeft > 1 ? 's' : ''} stellaire{state.basesLeft > 1 ? 's' : ''}</strong> pour vous ravitailler.
          </p>
          <ul className="brief-tips">
            <li>Montez les boucliers dès qu’une zone de combat est signalée : à zéro, le premier tir vous détruit.</li>
            <li>Cliquez un croiseur pour le viser, une case pour vous y rendre, un quadrant de la carte pour y voyager.</li>
            <li>Amarrez-vous à côté d’une base stellaire pour refaire le plein et réparer.</li>
          </ul>
          <button className="action peach big" onClick={onAccept} autoFocus>
            Accepter la mission
          </button>
          <p className="credit">
            D’après <em>Star Trek</em> de Mike Mayfield (1971) et <em>Super Star Trek</em> de Bob Leedom (1974), publiés en BASIC par David Ahl.
          </p>
        </div>
      </div>
    </div>
  )
}
