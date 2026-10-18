import { useState } from 'react'
import { DEV, regionName } from '../game/constants'
import type { GameState, Pos } from '../game/types'

interface Props {
  state: GameState
  names: boolean
  onQuadrant: (q: Pos) => void
  describe: (q: Pos) => string | null
  interactive: boolean
}

export function Digits({ code }: { code: number | null }) {
  if (code === null) return <span className="digits unknown">···</span>
  const k = Math.floor(code / 100)
  const b = Math.floor(code / 10) % 10
  const s = code % 10
  return (
    <span className="digits">
      <span className={k ? 'k on' : 'k'}>{k}</span>
      <span className={b ? 'b on' : 'b'}>{b}</span>
      <span className="s">{s}</span>
    </span>
  )
}

export function GalaxyMap({ state, names, onQuadrant, describe, interactive }: Props) {
  const [hover, setHover] = useState<Pos | null>(null)
  const offline = state.damage[DEV.computer] < 0
  const tip = hover ? describe(hover) : null

  return (
    <section className="galaxy panel-frame" aria-label="Carte galactique">
      <header className="frame-head">
        <h2>Archives galactiques</h2>
        <span className="legend">
          <span className="k on">K</span> Klingons <span className="b on">B</span> bases <span className="s">S</span> étoiles
        </span>
      </header>
      <div className={`galaxy-grid ${offline ? 'offline' : ''} ${names ? 'names' : ''}`}>
        {state.galaxy.map((row, r) =>
          row.map((_, c) => {
            const here = state.quad.r === r && state.quad.c === c
            const code = state.known[r][c]
            return (
              <button
                key={`${r}-${c}`}
                className={`quad ${here ? 'here' : ''} ${code !== null && code >= 100 ? 'hostile' : ''} ${c === 3 ? 'divide' : ''}`}
                disabled={!interactive || offline || here}
                onMouseEnter={() => setHover({ r, c })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ r, c })}
                onBlur={() => setHover(null)}
                onClick={() => onQuadrant({ r, c })}
                aria-label={`${regionName(r, c)}${here ? ', position actuelle' : ''}`}
              >
                {names ? (
                  <span className="qname">
                    {c % 4 === 0 ? regionName(r, c, false) : ''}
                    <small>{['I', 'II', 'III', 'IV'][c % 4]}</small>
                  </span>
                ) : (
                  <Digits code={offline ? null : code} />
                )}
              </button>
            )
          }),
        )}
        {offline && <div className="offline-note">Ordinateur hors service : archives inaccessibles</div>}
      </div>
      <footer className="galaxy-foot">
        {tip ?? `Quadrant actuel : ${regionName(state.quad.r, state.quad.c)}`}
      </footer>
    </section>
  )
}
