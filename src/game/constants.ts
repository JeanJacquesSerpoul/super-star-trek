export const MAX_ENERGY = 3000
export const MAX_TORPEDOES = 10
export const KLINGON_BASE_ENERGY = 200

export const DEVICES = [
  'Moteurs warp',
  'Senseurs courte portée',
  'Senseurs longue portée',
  'Contrôle des phasers',
  'Tubes lance-torpilles',
  'Contrôle des avaries',
  'Contrôle des boucliers',
  'Ordinateur de bord',
] as const

export const DEV = {
  warp: 0,
  srs: 1,
  lrs: 2,
  phasers: 3,
  torpedoes: 4,
  damageControl: 5,
  shields: 6,
  computer: 7,
} as const

/** Vecteurs de cap du BASIC : 1 = est, 3 = nord, 5 = ouest, 7 = sud (lignes, colonnes) */
export const COURSE_VECTORS: [number, number][] = [
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
]

const REGIONS_WEST = ['Antarès', 'Rigel', 'Procyon', 'Véga', 'Canopus', 'Altaïr', 'Sagittaire', 'Pollux']
const REGIONS_EAST = ['Sirius', 'Deneb', 'Capella', 'Bételgeuse', 'Aldébaran', 'Régulus', 'Arcturus', 'Spica']
const ROMAN = ['I', 'II', 'III', 'IV']

export function regionName(r: number, c: number, withNumber = true): string {
  const name = c < 4 ? REGIONS_WEST[r] : REGIONS_EAST[r]
  return withNumber ? `${name} ${ROMAN[c % 4]}` : name
}
