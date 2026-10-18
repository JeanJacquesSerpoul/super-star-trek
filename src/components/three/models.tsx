import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/*
 * Modèles procéduraux, tous orientés vers +X (cap 1 = est) et tenant dans une case
 * d'une unité. Les couleurs « > 1 » servent au bloom : toneMapped=false les fait briller.
 */

const hull = new THREE.MeshStandardMaterial({ color: '#dfe5f2', metalness: 0.35, roughness: 0.45 })
const hullDark = new THREE.MeshStandardMaterial({ color: '#aab4c9', metalness: 0.4, roughness: 0.5 })
const glow = (c: string, k = 3) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false })

const bussardMat = glow('#ff5a3c', 4)
const nacelleBlue = glow('#7a8cff', 3)
const deflector = glow('#f2a65a', 3)
const windows = glow('#fff2d0', 1.6)

export function Enterprise() {
  return (
    <group scale={1.05}>
      {/* Soucoupe */}
      <mesh position={[0.13, 0.07, 0]} material={hull} castShadow>
        <cylinderGeometry args={[0.25, 0.21, 0.045, 48]} />
      </mesh>
      <mesh position={[0.13, 0.1, 0]} material={hull}>
        <sphereGeometry args={[0.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0.13, 0.13, 0]} material={windows}>
        <sphereGeometry args={[0.022, 12, 8]} />
      </mesh>
      <mesh position={[0.13, 0.072, 0]} rotation={[Math.PI / 2, 0, 0]} material={windows}>
        <torusGeometry args={[0.228, 0.004, 6, 64]} />
      </mesh>
      {/* Cou */}
      <mesh position={[-0.04, 0.02, 0]} rotation={[0, 0, -0.55]} material={hullDark}>
        <boxGeometry args={[0.16, 0.035, 0.03]} />
      </mesh>
      {/* Coque secondaire */}
      <mesh position={[-0.17, -0.03, 0]} rotation={[0, 0, Math.PI / 2]} material={hull}>
        <capsuleGeometry args={[0.055, 0.22, 8, 20]} />
      </mesh>
      <mesh position={[-0.02, -0.03, 0]} rotation={[0, 0, -Math.PI / 2]} material={deflector}>
        <circleGeometry args={[0.035, 20]} />
      </mesh>
      {/* Pylônes et nacelles */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[-0.24, 0.05, s * 0.08]} rotation={[s * 0.9, 0, 0.35]} material={hullDark}>
            <boxGeometry args={[0.05, 0.19, 0.012]} />
          </mesh>
          <mesh position={[-0.3, 0.13, s * 0.15]} rotation={[0, 0, Math.PI / 2]} material={hull}>
            <capsuleGeometry args={[0.032, 0.36, 6, 16]} />
          </mesh>
          <mesh position={[-0.09, 0.13, s * 0.15]} material={bussardMat}>
            <sphereGeometry args={[0.034, 16, 12]} />
          </mesh>
          <mesh position={[-0.31, 0.13, s * 0.15 + s * 0.031]} rotation={[0, 0, Math.PI / 2]} material={nacelleBlue}>
            <boxGeometry args={[0.012, 0.3, 0.004]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const klingonHull = new THREE.MeshStandardMaterial({ color: '#7f9c80', emissive: '#14301c', metalness: 0.45, roughness: 0.4 })
const klingonDark = new THREE.MeshStandardMaterial({ color: '#56705a', emissive: '#0c2012', metalness: 0.5, roughness: 0.45 })
const klingonGlow = glow('#6ee7a0', 3.2)
const klingonEngine = glow('#ff6a3a', 3)

export function Klingon() {
  const wing = useMemo(() => {
    const pts: [number, number][] = [
      [4, -4], [-6, -24], [-17, -28], [-13, -7], [-19, 0], [-13, 7], [-17, 28], [-6, 24], [4, 4],
    ]
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * 0.014, y * 0.014)))
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 })
    g.rotateX(Math.PI / 2)
    g.translate(0, 0.02, 0)
    return g
  }, [])
  return (
    <group>
      <mesh geometry={wing} material={klingonHull} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[-0.21, 0.03, s * 0.395]} material={klingonDark}>
            <boxGeometry args={[0.24, 0.05, 0.07]} />
          </mesh>
          <mesh position={[-0.335, 0.03, s * 0.395]} material={klingonEngine}>
            <boxGeometry args={[0.01, 0.035, 0.05]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.1, 0.035, 0]} material={klingonDark}>
        <sphereGeometry args={[0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0.17, 0.035, 0]} rotation={[0, 0, Math.PI / 2]} material={klingonHull}>
        <cylinderGeometry args={[0.022, 0.03, 0.26, 12]} />
      </mesh>
      <mesh position={[0.33, 0.035, 0]} scale={[1.1, 0.7, 1]} material={klingonHull}>
        <sphereGeometry args={[0.085, 24, 16]} />
      </mesh>
      <mesh position={[0.41, 0.04, 0]} material={klingonGlow}>
        <sphereGeometry args={[0.022, 12, 8]} />
      </mesh>
      <mesh position={[-0.12, 0.08, 0]} material={klingonGlow}>
        <sphereGeometry args={[0.03, 12, 8]} />
      </mesh>
    </group>
  )
}

const baseHull = new THREE.MeshStandardMaterial({ color: '#e7d3ee', metalness: 0.3, roughness: 0.4 })
const baseAccent = new THREE.MeshStandardMaterial({ color: '#c49bd1', metalness: 0.4, roughness: 0.45 })
const baseGlow = glow('#7a8cff', 3)

export function Starbase() {
  const ring = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.y += dt * 0.25
  })
  return (
    <group position={[0, 0.08, 0]}>
      <mesh material={baseHull}>
        <sphereGeometry args={[0.12, 32, 16]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={baseAccent}>
        <cylinderGeometry args={[0.02, 0.05, 0.22, 12]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={baseGlow}>
        <sphereGeometry args={[0.025, 12, 8]} />
      </mesh>
      <mesh position={[0, -0.14, 0]} material={baseAccent}>
        <coneGeometry args={[0.06, 0.18, 16]} />
      </mesh>
      <group ref={ring}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={baseHull}>
          <torusGeometry args={[0.34, 0.025, 10, 64]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={baseGlow}>
          <torusGeometry args={[0.34, 0.006, 6, 64]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={baseAccent}>
              <cylinderGeometry args={[0.014, 0.014, 0.22, 8]} />
            </mesh>
            <mesh position={[0.34, 0, 0]} material={baseHull}>
              <sphereGeometry args={[0.045, 14, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

const STAR_TINTS = ['#fff4d6', '#ffe08a', '#ffc07a', '#cfe0ff', '#ffffff']

let glowTexture: THREE.Texture | null = null
export function radialTexture(): THREE.Texture {
  if (glowTexture) return glowTexture
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.2, 'rgba(255,255,255,0.45)')
  grd.addColorStop(0.5, 'rgba(255,255,255,0.1)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  glowTexture = new THREE.CanvasTexture(c)
  return glowTexture
}

export function Star({ seed }: { seed: number }) {
  const tint = STAR_TINTS[seed % STAR_TINTS.length]
  const size = 0.1 + (seed % 5) * 0.02
  const core = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (core.current) core.current.rotation.y = clock.elapsedTime * 0.2
  })
  return (
    <group position={[0, 0.25, 0]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[size, 3]} />
        <meshBasicMaterial color={new THREE.Color(tint).multiplyScalar(2.6)} toneMapped={false} />
      </mesh>
      <sprite scale={[size * 9, size * 9, 1]}>
        <spriteMaterial map={radialTexture()} color={tint} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight color={tint} intensity={1.6} distance={2.6} decay={2} />
    </group>
  )
}
