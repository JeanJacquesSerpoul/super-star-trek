/* Silhouettes vues de dessus, dessinées pointe vers l'est (cap 1), centrées sur 0,0. */

export function Enterprise() {
  return (
    <g className="enterprise">
      <g stroke="#8E9AB8" strokeWidth="0.8">
        <path d="M-14 0 L-22 -13 M-14 0 L-22 13" strokeWidth="2.6" stroke="#B9C2D6" />
        <rect x="-41" y="-16.5" width="32" height="5.5" rx="2.7" fill="#C9D1E3" />
        <rect x="-41" y="11" width="32" height="5.5" rx="2.7" fill="#C9D1E3" />
        <circle cx="-10" cy="-13.75" r="2.4" fill="#E2574C" stroke="none" className="bussard" />
        <circle cx="-10" cy="13.75" r="2.4" fill="#E2574C" stroke="none" className="bussard" />
        <ellipse cx="-14" cy="0" rx="15" ry="5.2" fill="#D3DAEA" />
        <rect x="-2" y="-2.4" width="12" height="4.8" fill="#C9D1E3" />
        <circle cx="16" cy="0" r="20" fill="#E6EBF5" />
        <circle cx="16" cy="0" r="13" fill="none" stroke="#A7B1C9" strokeWidth="0.7" />
        <circle cx="16" cy="0" r="4.6" fill="#F5F8FF" />
      </g>
      <circle cx="16" cy="0" r="1.6" fill="#7A8CFF" />
    </g>
  )
}

export function Klingon() {
  return (
    <g className="klingon">
      <path
        d="M4 -4 L-6 -24 L-17 -28 L-13 -7 L-19 0 L-13 7 L-17 28 L-6 24 L4 4 Z"
        fill="#3E5640"
        stroke="#8FB28A"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <rect x="-23" y="-31" width="16" height="5" rx="1.5" fill="#56735A" stroke="#8FB28A" strokeWidth="0.8" />
      <rect x="-23" y="26" width="16" height="5" rx="1.5" fill="#56735A" stroke="#8FB28A" strokeWidth="0.8" />
      <rect x="2" y="-2" width="17" height="4" fill="#4F6B4A" stroke="#8FB28A" strokeWidth="0.7" />
      <circle cx="23" cy="0" r="7" fill="#4F6B4A" stroke="#8FB28A" strokeWidth="1.1" />
      <circle cx="26" cy="0" r="1.8" fill="#6EE7A0" className="klingon-eye" />
      <circle cx="-8" cy="0" r="3" fill="#6EE7A0" opacity="0.55" />
    </g>
  )
}

export function Starbase() {
  return (
    <g className="starbase">
      <circle r="31" fill="none" stroke="#7A8CFF" strokeOpacity="0.35" strokeWidth="1" />
      <g className="starbase-ring">
        <circle r="26" fill="none" stroke="#9EABFF" strokeWidth="3" strokeDasharray="10 6" />
      </g>
      {[0, 120, 240].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <rect x="6" y="-2.5" width="18" height="5" fill="#C49BD1" />
          <circle cx="25" cy="0" r="4.5" fill="#E7D3EE" stroke="#C49BD1" />
        </g>
      ))}
      <circle r="10" fill="#E7D3EE" stroke="#C49BD1" strokeWidth="2" />
      <circle r="4" fill="#7A8CFF" className="starbase-core" />
    </g>
  )
}

const STAR_TINTS = ['#FFF4D6', '#FFE08A', '#FFC07A', '#CFE0FF', '#FFFFFF']

export function Star({ seed }: { seed: number }) {
  const tint = STAR_TINTS[seed % STAR_TINTS.length]
  const size = 7 + (seed % 5)
  return (
    <g className="star">
      <circle r={size * 3.4} fill={`url(#glow-${seed % STAR_TINTS.length})`} />
      <circle r={size} fill={tint} />
      <circle r={size * 0.5} fill="#fff" />
    </g>
  )
}

export function StarGlowDefs() {
  return (
    <>
      {STAR_TINTS.map((t, i) => (
        <radialGradient key={t} id={`glow-${i}`}>
          <stop offset="0" stopColor={t} stopOpacity="0.85" />
          <stop offset="0.3" stopColor={t} stopOpacity="0.25" />
          <stop offset="1" stopColor={t} stopOpacity="0" />
        </radialGradient>
      ))}
    </>
  )
}
