import { useEffect, useMemo, useRef, useState } from 'react'
import { DEV, regionName } from '../game/constants'
import { courseVector, exitSide } from '../game/engine'
import type { Aim, AimExit, GameState, NavBlock, Pos } from '../game/types'
import type { Fx, WarpPhase } from '../useGame'
import { Enterprise, Klingon, Star, StarGlowDefs, Starbase } from './art'

const CELL = 100
const cx = (p: Pos) => p.c * CELL + CELL / 2
const cy = (p: Pos) => p.r * CELL + CELL / 2

function headingDeg(course: number) {
  const [dr, dc] = courseVector(course)
  return (Math.atan2(dr, dc) * 180) / Math.PI
}

function angleTo(a: Pos, b: Pos) {
  return (Math.atan2(b.r - a.r, b.c - a.c) * 180) / Math.PI
}

function lcg(seed: number) {
  let s = seed * 2654435761 + 1013904223
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

interface Props {
  state: GameState
  fx: Fx[]
  warp: WarpPhase
  shake: number
  moveMs: number
  aim: Aim | null
  describe: (p: Pos) => string | null
  onCell: (p: Pos) => void
  interactive: boolean
}

export function SectorView({ state, fx, warp, shake, moveMs, aim, describe, onCell, interactive }: Props) {
  const [hover, setHover] = useState<Pos | null>(null)
  const srsDown = state.damage[DEV.srs] < 0
  const seed = state.quad.r * 8 + state.quad.c

  const field = useMemo(() => {
    const r = lcg(seed + 7)
    return Array.from({ length: 160 }, () => ({
      x: r() * 880 - 40,
      y: r() * 880 - 40,
      s: r() < 0.08 ? 1.6 : r() * 0.9 + 0.3,
      o: r() * 0.6 + 0.2,
    }))
  }, [seed])

  const streaks = useMemo(() => {
    const r = lcg(seed + 99)
    return Array.from({ length: 70 }, () => ({ a: r() * 360, d: 40 + r() * 260, l: 60 + r() * 220 }))
  }, [seed])

  const shakeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = shakeRef.current
    if (!el || shake === 0) return
    el.classList.remove('shaking')
    void el.offsetWidth
    el.classList.add('shaking')
  }, [shake])

  const aimPath = useMemo(() => {
    if (!aim) return null
    const [dr, dc] = courseVector(aim.course)
    const pts: Pos[] = [state.sector]
    let x = state.sector.r
    let y = state.sector.c
    // Devant un obstacle, la ligne s'arrête au dernier pas avant lui (case où les moteurs couperont).
    const max = aim.block ? aim.block.step - 1 : (aim.steps ?? 20)
    for (let i = 0; i < max; i++) {
      x += dr
      y += dc
      if (x < -0.5 || x > 7.5 || y < -0.5 || y > 7.5) {
        pts.push(aim.exit ? aim.exit.edge : { r: x, c: y })
        break
      }
      pts.push({ r: x, c: y })
    }
    return pts
  }, [aim, state.sector])

  const shield = state.shields > 0 ? Math.min(1, state.shields / 1500) : 0
  const label = hover && interactive ? describe(hover) : null

  return (
    <div className={`sector-view ${warp ? `warp-${warp}` : ''}`} ref={shakeRef}>
      <svg viewBox="-40 -40 880 880" role="img" aria-label={`Scan courte portée du quadrant ${regionName(state.quad.r, state.quad.c)}`}>
        <defs>
          <radialGradient id="space" cx="50%" cy="45%" r="75%">
            <stop offset="0" stopColor="#0E1638" />
            <stop offset="0.6" stopColor="#060A1E" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <radialGradient id="shield-grad">
            <stop offset="0.55" stopColor="#7A8CFF" stopOpacity="0" />
            <stop offset="0.92" stopColor="#7A8CFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#B9C4FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="boom">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.25" stopColor="#FFE08A" />
            <stop offset="0.6" stopColor="#F2A65A" stopOpacity="0.8" />
            <stop offset="1" stopColor="#E2574C" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <StarGlowDefs />
        </defs>

        <rect x="-40" y="-40" width="880" height="880" fill="url(#space)" />
        <g className="field">
          {field.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />
          ))}
        </g>

        {/* Graduations 1 à 8, comme les coordonnées du BASIC */}
        <g className="grid">
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0} x2={i * CELL} y2={800} />
              <line x1={0} y1={i * CELL} x2={800} y2={i * CELL} />
            </g>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <g key={`l${i}`} className="grid-label">
              <text x={i * CELL + 50} y={-14} textAnchor="middle">{i + 1}</text>
              <text x={-16} y={i * CELL + 57} textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </g>

        <g className="scene">
          {aimPath && (
            <polyline
              className={`aim aim-${aim!.kind}`}
              points={aimPath.map((p) => `${cx(p)},${cy(p)}`).join(' ')}
            />
          )}
          {aim?.exit && <ExitGate exit={aim.exit} course={aim.course} />}
          {aim?.block && aimPath && <BlockMark block={aim.block} end={aimPath[aimPath.length - 1]} course={aim.course} />}

          {!srsDown &&
            state.stars.map((s, i) => (
              <g key={`s${i}`} transform={`translate(${cx(s)} ${cy(s)})`}>
                <Star seed={(s.r * 13 + s.c * 7 + seed) % 17} />
              </g>
            ))}

          {!srsDown && state.base && (
            <g transform={`translate(${cx(state.base)} ${cy(state.base)})`}>
              <Starbase />
            </g>
          )}

          {!srsDown &&
            state.klingons.map((k, i) => {
              const frac = Math.max(0, k.energy / k.maxEnergy)
              return (
                <g key={`k${i}`} className="klingon-wrap" transform={`translate(${cx(k)} ${cy(k)})`}>
                  <g transform={`rotate(${angleTo(k, state.sector)})`}>
                    <Klingon />
                  </g>
                  <g transform="translate(-28 40)">
                    <rect width="56" height="4" rx="2" fill="#1A2A1E" />
                    <rect width={56 * frac} height="4" rx="2" fill="#6EE7A0" />
                  </g>
                </g>
              )
            })}

          <g
            className="ship"
            style={{
              transform: `translate(${cx(state.sector)}px, ${cy(state.sector)}px)`,
              transition: moveMs ? `transform ${moveMs}ms cubic-bezier(.5,0,.3,1)` : 'none',
            }}
          >
            {shield > 0 && <circle r="44" fill="url(#shield-grad)" opacity={0.35 + shield * 0.65} className="shield-bubble" />}
            <g style={{ transform: `rotate(${headingDeg(state.heading)}deg)`, transition: 'transform 300ms ease-out' }}>
              <Enterprise />
            </g>
          </g>

          {fx.map((f) => (
            <Effect key={f.id} fx={f} />
          ))}
        </g>

        {srsDown && (
          <g className="srs-down">
            <rect x="0" y="0" width="800" height="800" />
            <text x="400" y="390" textAnchor="middle">Senseurs courte portée hors service</text>
            <text x="400" y="430" textAnchor="middle" className="sub">Seule la position de l’Enterprise est connue</text>
          </g>
        )}

        {warp && (
          <g className="streaks" transform="translate(400 400)">
            {streaks.map((s, i) => (
              <line key={i} transform={`rotate(${s.a})`} x1={s.d} x2={s.d + s.l} y1="0" y2="0" pathLength={1} />
            ))}
          </g>
        )}

        {interactive &&
          Array.from({ length: 64 }, (_, i) => {
            const p = { r: Math.floor(i / 8), c: i % 8 }
            const on = hover && hover.r === p.r && hover.c === p.c
            return (
              <rect
                key={i}
                x={p.c * CELL}
                y={p.r * CELL}
                width={CELL}
                height={CELL}
                className={`hit ${on ? 'on' : ''}`}
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onCell(p)}
              />
            )
          })}
      </svg>
      {aim?.exit && <ExitTag exit={aim.exit} />}
      {label && hover && (
        <div
          className="cell-tip"
          style={{ left: `${((hover.c * CELL + 90) / 880) * 100}%`, top: `${((hover.r * CELL + 40) / 880) * 100}%` }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

/** Porte lumineuse sur le bord du quadrant, à l'endroit où l'Enterprise passera en distorsion. */
function ExitGate({ exit, course }: { exit: AimExit; course: number }) {
  const side = exitSide(exit.edge)
  const x = cx(exit.edge)
  const y = cy(exit.edge)
  const along = side === 'e' || side === 'w'
  const h = 46
  return (
    <g className={`exit-gate ${exit.perimeter ? 'blocked' : ''}`}>
      <line x1={along ? x : x - h} y1={along ? y - h : y} x2={along ? x : x + h} y2={along ? y + h : y} className="gate-glow" />
      <line x1={along ? x : x - h} y1={along ? y - h : y} x2={along ? x : x + h} y2={along ? y + h : y} className="gate-core" />
      <g transform={`translate(${x} ${y}) rotate(${headingDeg(course)})`}>
        {exit.perimeter ? (
          <path d="M-9 -9 L9 9 M9 -9 L-9 9" className="gate-mark" />
        ) : (
          [0, 1, 2].map((i) => <path key={i} d={`M${-8 + i * 9} -10 L${i * 9} 0 L${-8 + i * 9} 10`} className="gate-mark" style={{ animationDelay: `${i * 0.15}s` }} />)
        )}
      </g>
    </g>
  )
}

/** Arrêt prévu : barre devant la proue au point d'arrêt, cercle pointillé autour de l'obstacle. */
function BlockMark({ block, end, course }: { block: NavBlock; end: Pos; course: number }) {
  return (
    <g className="aim-block">
      <circle cx={cx(block.at)} cy={cy(block.at)} r="42" className="block-ring" />
      <g transform={`translate(${cx(end)} ${cy(end)}) rotate(${headingDeg(course)})`}>
        <line x1="36" y1="-16" x2="36" y2="16" className="block-bar" />
      </g>
    </g>
  )
}

/** Étiquette de destination, posée à l'intérieur du plateau contre le bord franchi. */
function ExitTag({ exit }: { exit: AimExit }) {
  const side = exitSide(exit.edge)
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const x = side === 'e' || side === 'w' ? cx(exit.edge) : clamp(cx(exit.edge), 130, 670)
  const y = side === 'n' || side === 's' ? cy(exit.edge) : clamp(cy(exit.edge), 40, 760)
  return (
    <div className={`exit-tag side-${side} ${exit.perimeter ? 'blocked' : ''}`} style={{ left: `${((x + 40) / 880) * 100}%`, top: `${((y + 40) / 880) * 100}%` }}>
      <strong>{exit.title}</strong>
      <span>{exit.sub}</span>
    </div>
  )
}

function Effect({ fx }: { fx: Fx }) {
  switch (fx.kind) {
    case 'phaser': {
      const len = Math.hypot(cx(fx.to) - cx(fx.from), cy(fx.to) - cy(fx.from))
      return (
        <g className="fx-phaser" style={{ ['--len' as string]: len }}>
          <line x1={cx(fx.from)} y1={cy(fx.from)} x2={cx(fx.to)} y2={cy(fx.to)} className="beam-outer" />
          <line x1={cx(fx.from)} y1={cy(fx.from)} x2={cx(fx.to)} y2={cy(fx.to)} className="beam-core" />
          {fx.hit && <circle cx={cx(fx.to)} cy={cy(fx.to)} r="18" className="spark" />}
        </g>
      )
    }
    case 'disruptor': {
      const len = Math.hypot(cx(fx.to) - cx(fx.from), cy(fx.to) - cy(fx.from))
      return (
        <g className="fx-disruptor" style={{ ['--len' as string]: len }}>
          <line x1={cx(fx.from)} y1={cy(fx.from)} x2={cx(fx.to)} y2={cy(fx.to)} className="bolt" />
          <circle cx={cx(fx.to)} cy={cy(fx.to)} r="46" className="shield-flash" />
        </g>
      )
    }
    case 'torpedo':
      return <Torpedo from={fx.from} path={fx.path} ms={fx.ms} />
    case 'explode':
      return (
        <g transform={`translate(${cx(fx.at)} ${cy(fx.at)})`} className={`fx-explode ${fx.big ? 'big' : ''}`}>
          <circle r="46" fill="url(#boom)" className="fireball" />
          <circle r="30" className="ring" />
          <g className="shards">
            {Array.from({ length: 12 }, (_, i) => (
              <line key={i} transform={`rotate(${i * 30 + (i % 3) * 7})`} x1="10" x2="22" className="shard" />
            ))}
          </g>
        </g>
      )
    case 'absorb':
      return <circle cx={cx(fx.at)} cy={cy(fx.at)} r="40" className="fx-absorb" />
  }
}

function Torpedo({ from, path, ms }: { from: Pos; path: Pos[]; ms: number }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      setT(k)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ms])
  const pts = [from, ...path]
  const seg = t * (pts.length - 1)
  const i = Math.min(pts.length - 2, Math.floor(seg))
  const f = seg - i
  const a = pts[i]
  const b = pts[i + 1] ?? a
  const x = cx(a) + (cx(b) - cx(a)) * f
  const y = cy(a) + (cy(b) - cy(a)) * f
  const trail = [...pts.slice(0, i + 1), { r: 0, c: 0 }].map((p, j) =>
    j === i + 1 ? `${x},${y}` : `${cx(p)},${cy(p)}`,
  )
  return (
    <g className="fx-torpedo">
      <polyline points={trail.join(' ')} className="trail" />
      <circle cx={x} cy={y} r="14" className="halo" />
      <circle cx={x} cy={y} r="6" className="core" filter="url(#glow)" />
    </g>
  )
}
