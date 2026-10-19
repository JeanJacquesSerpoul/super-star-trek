export interface Pos {
  r: number
  c: number
}

export interface Klingon extends Pos {
  energy: number
  maxEnergy: number
}

export type Tone = 'info' | 'alert' | 'danger' | 'success' | 'computer' | 'quiet'

export interface LogLine {
  id: number
  text: string
  tone: Tone
  stardate: number
}

export type Status = 'playing' | 'won' | 'lost'

export interface GameState {
  /** Contenu de chaque quadrant, codé comme dans le BASIC : K*100 + B*10 + S */
  galaxy: number[][]
  /** Mémoire de l'ordinateur de bord (null = jamais scanné) */
  known: (number | null)[][]
  quad: Pos
  sector: Pos
  klingons: Klingon[]
  stars: Pos[]
  base: Pos | null
  energy: number
  shields: number
  torpedoes: number
  damage: number[]
  stardate: number
  startDate: number
  missionDays: number
  klingonsStart: number
  klingonsLeft: number
  basesLeft: number
  docked: boolean
  /** Temps de réparation supplémentaire propre à la base du quadrant (D4 du BASIC) */
  repairBias: number
  /** Cap du dernier déplacement, pour orienter le vaisseau à l'écran */
  heading: number
  lastScan: { quad: Pos; cells: (number | null)[][] } | null
  status: Status
  endTitle?: string
  endText?: string
}

export type GameEvent =
  | { type: 'log'; text: string; tone: Tone }
  | { type: 'state'; state: GameState }
  | { type: 'phaser'; from: Pos; to: Pos; hit: boolean }
  | { type: 'torpedo'; path: Pos[]; from: Pos }
  | { type: 'explode'; at: Pos; big?: boolean }
  | { type: 'disruptor'; from: Pos; to: Pos; amount: number }
  | { type: 'absorb'; at: Pos }
  | { type: 'warp'; leaving: boolean }
  | { type: 'impulse'; path: Pos[] }
  | { type: 'alert' }
  | {
      type: 'dock'
      base: Pos
      ship: Pos
      /** Réserves juste avant le ravitaillement, pour animer les jauges. */
      before: { energy: number; shields: number; torpedoes: number }
      /** Systèmes endommagés que la base peut réparer. */
      repairs: number
    }

export interface Outcome {
  state: GameState
  events: GameEvent[]
}

/** Sortie de quadrant prévue par la visée NAV, prête à afficher. */
export interface AimExit {
  edge: Pos
  title: string
  sub: string
  perimeter: boolean
}

/** Obstacle qui coupera les moteurs warp, d'après la prévision de NAV. */
export interface NavBlock {
  /** Case occupée rencontrée par la trajectoire. */
  at: Pos
  what: 'klingon' | 'star' | 'base'
  /** Case où l'Enterprise s'immobilisera. */
  stop: Pos
  /** Pas de la trajectoire (1 à n) où l'obstacle est atteint. */
  step: number
}

/** Un saut proposé par l'ordinateur : cap, nombre de secteurs et case d'arrivée. */
export interface Leg {
  course: number
  steps: number
  to: Pos
}

export interface Aim {
  course: number
  steps: number | null
  kind: 'nav' | 'tor'
  exit: AimExit | null
  block: NavBlock | null
}
