import { useRef, type PointerEvent } from 'react'
import { courseTo, courseVector } from '../game/engine'

interface Props {
  value: number
  onChange: (v: number) => void
  tone: 'nav' | 'tor'
}

const R = 80

/** Cadran de cap : 1 = est, 3 = nord, 5 = ouest, 7 = sud. Le cap suit l'interpolation du BASIC. */
export function CourseDial({ value, onChange, tone }: Props) {
  const svg = useRef<SVGSVGElement>(null)

  const set = (e: PointerEvent) => {
    const el = svg.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * 200 - 100
    const y = ((e.clientY - box.top) / box.height) * 200 - 100
    if (Math.hypot(x, y) < 6) return
    const res = courseTo({ r: 0, c: 0 }, { r: y, c: x })
    if (res) onChange(Math.round(res.course * 100) / 100)
  }

  const [dr, dc] = courseVector(value)
  const n = Math.hypot(dr, dc)
  const px = (dc / n) * (R - 8)
  const py = (dr / n) * (R - 8)

  return (
    <div className={`dial dial-${tone}`}>
      <svg
        ref={svg}
        viewBox="-100 -100 200 200"
        onPointerDown={(e) => {
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          set(e)
        }}
        onPointerMove={(e) => e.buttons && set(e)}
        role="slider"
        aria-label="Cap"
        aria-valuemin={1}
        aria-valuemax={9}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onChange(wrap(value + (e.shiftKey ? 1 : 0.1)))
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onChange(wrap(value - (e.shiftKey ? 1 : 0.1)))
        }}
      >
        <circle r={R} className="dial-face" />
        <circle r={R - 22} className="dial-inner" />
        {Array.from({ length: 40 }, (_, i) => {
          const c = 1 + i / 5
          const [r1, c1] = courseVector(c)
          const m = Math.hypot(r1, c1)
          const major = i % 5 === 0
          return (
            <line
              key={i}
              x1={(c1 / m) * (R - (major ? 12 : 6))}
              y1={(r1 / m) * (R - (major ? 12 : 6))}
              x2={(c1 / m) * R}
              y2={(r1 / m) * R}
              className={major ? 'tick major' : 'tick'}
            />
          )
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const [r1, c1] = courseVector(i + 1)
          const m = Math.hypot(r1, c1)
          return (
            <text key={`n${i}`} x={(c1 / m) * (R + 12)} y={(r1 / m) * (R + 12) + 5} textAnchor="middle" className="dial-num">
              {i + 1}
            </text>
          )
        })}
        <line x1="0" y1="0" x2={px} y2={py} className="needle" />
        <circle cx={px} cy={py} r="6" className="needle-tip" />
        <circle r="5" className="hub" />
      </svg>
    </div>
  )
}

function wrap(v: number) {
  let x = Math.round(v * 100) / 100
  if (x >= 9) x -= 8
  if (x < 1) x += 8
  return x
}

export function CourseInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>Cap</span>
      <input
        type="number"
        min={1}
        max={8.99}
        step={0.1}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (v >= 1 && v < 9) onChange(v)
        }}
      />
    </label>
  )
}
