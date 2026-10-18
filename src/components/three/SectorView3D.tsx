import { Line, OrbitControls, Stars, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import antonio from '@fontsource/antonio/files/antonio-latin-600-normal.woff?url'
import { DEV, regionName } from '../../game/constants'
import { courseVector } from '../../game/engine'
import type { GameState, Klingon as KlingonT, Pos } from '../../game/types'
import type { Fx, WarpPhase } from '../../useGame'
import { Effect3D, makeShieldMaterial, toV } from './effects'
import { Enterprise, Klingon, Star, Starbase, radialTexture } from './models'

export interface View3DProps {
  state: GameState
  fx: Fx[]
  warp: WarpPhase
  shake: number
  moveMs: number
  aim: { course: number; steps: number | null; kind: 'nav' | 'tor' } | null
  describe: (p: Pos) => string | null
  onCell: (p: Pos) => void
  interactive: boolean
}

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)

/** Angle (rotation Y) qui oriente un modèle tourné vers +X selon un vecteur ligne/colonne. */
const yaw = (dr: number, dc: number) => Math.atan2(-dr, dc)

function headingYaw(course: number) {
  const [dr, dc] = courseVector(course)
  return yaw(dr, dc)
}

function lerpAngle(a: number, b: number, k: number) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}

// ---------------------------------------------------------------- plateau

function Board() {
  const lines = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= 8; i++) {
      const v = i - 4
      pts.push(v, 0, -4, v, 0, 4, -4, 0, v, 4, 0, v)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#0b1438" transparent opacity={0.42} metalness={0.2} roughness={0.9} depthWrite={false} />
      </mesh>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#7a8cff" transparent opacity={0.22} />
      </lineSegments>
      <Line
        points={[[-4, 0, -4], [4, 0, -4], [4, 0, 4], [-4, 0, 4], [-4, 0, -4]]}
        color={new THREE.Color('#c49bd1').multiplyScalar(1.6)}
        lineWidth={1.6}
        toneMapped={false}
      />
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <Text font={antonio} fontSize={0.3} color="#c49bd1" position={[i - 3.5, 0, -4.4]} rotation={[-Math.PI / 2, 0, 0]}>
            {i + 1}
          </Text>
          <Text font={antonio} fontSize={0.3} color="#c49bd1" position={[-4.4, 0, i - 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
            {i + 1}
          </Text>
        </group>
      ))}
    </group>
  )
}

function Nebula() {
  return (
    <group position={[0, -9, -6]}>
      <sprite scale={[34, 34, 1]} position={[-8, 0, -6]}>
        <spriteMaterial map={radialTexture()} color="#5a3d8a" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[28, 28, 1]} position={[10, 2, 2]}>
        <spriteMaterial map={radialTexture()} color="#2a4aa8" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[18, 18, 1]} position={[2, -2, -14]}>
        <spriteMaterial map={radialTexture()} color="#a8603a" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

// ---------------------------------------------------------------- vaisseaux

function Ship({ state, moveMs, warp, shield }: { state: GameState; moveMs: number; warp: WarpPhase; shield: number }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const { r, c } = state.sector
  const anim = useRef({ from: toV(state.sector), to: toV(state.sector), start: 0, dur: 0 })
  const targetYaw = headingYaw(state.heading)
  const shieldMat = useMemo(() => makeShieldMaterial(), [])
  const clock = useThree((s) => s.clock)

  useEffect(() => {
    const cur = group.current ? group.current.position.clone() : toV({ r, c })
    anim.current = { from: cur, to: toV({ r, c }), start: clock.elapsedTime, dur: moveMs / 1000 }
  }, [r, c, moveMs, clock])

  useFrame(({ clock: ck }, dt) => {
    const g = group.current
    const b = body.current
    if (!g || !b) return
    const a = anim.current
    const k = a.dur > 0 ? Math.min(1, (ck.elapsedTime - a.start) / a.dur) : 1
    g.position.lerpVectors(a.from, a.to, ease(k))
    b.rotation.y = lerpAngle(b.rotation.y, targetYaw, Math.min(1, dt * 7))
    // léger roulis pendant le déplacement, et flottement au repos
    b.rotation.x = k < 1 ? Math.sin(k * Math.PI) * 0.25 : 0
    b.position.y = 0.12 + Math.sin(ck.elapsedTime * 1.4) * 0.015
    shieldMat.uniforms.uOpacity.value = shield * (0.55 + 0.15 * Math.sin(ck.elapsedTime * 2.2))
    if (warp === 'out') b.scale.x = THREE.MathUtils.lerp(b.scale.x, 2.2, dt * 3)
    else b.scale.x = THREE.MathUtils.lerp(b.scale.x, 1, dt * 6)
  })

  return (
    <group ref={group}>
      <group ref={body} rotation={[0, targetYaw, 0]}>
        <Enterprise />
      </group>
      {shield > 0 && (
        <mesh position={[0, 0.12, 0]} material={shieldMat}>
          <sphereGeometry args={[0.48, 32, 24]} />
        </mesh>
      )}
      <pointLight position={[0, 0.6, 0]} intensity={0.6} distance={2} color="#cfe0ff" />
    </group>
  )
}

function KlingonShip({ k, ship, index }: { k: KlingonT; ship: Pos; index: number }) {
  const group = useRef<THREE.Group>(null)
  const anim = useRef({ from: toV(k), to: toV(k), start: -1 })
  const clock = useThree((s) => s.clock)
  const { r, c } = k
  useEffect(() => {
    const cur = group.current ? group.current.position.clone() : toV({ r, c })
    anim.current = { from: cur, to: toV({ r, c }), start: clock.elapsedTime }
  }, [r, c, clock])
  const face = yaw(ship.r - k.r, ship.c - k.c)
  const body = useRef<THREE.Group>(null)
  useFrame(({ clock: ck }, dt) => {
    const a = anim.current
    const t = Math.min(1, (ck.elapsedTime - a.start) / 0.45)
    group.current?.position.lerpVectors(a.from, a.to, ease(t))
    if (body.current) {
      body.current.rotation.y = lerpAngle(body.current.rotation.y, face, Math.min(1, dt * 5))
      body.current.position.y = 0.1 + Math.sin(ck.elapsedTime * 1.1 + index * 2) * 0.02
    }
  })
  const frac = Math.max(0, k.energy / k.maxEnergy)
  return (
    <group ref={group}>
      <group ref={body} rotation={[0, face, 0]}>
        <Klingon />
      </group>
      <group position={[0, 0.005, 0.42]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, 0.05]} />
          <meshBasicMaterial color="#14261a" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3 + 0.3 * frac, 0.002, 0]} scale={[Math.max(0.001, frac), 1, 1]}>
          <planeGeometry args={[0.6, 0.05]} />
          <meshBasicMaterial color={new THREE.Color('#6ee7a0').multiplyScalar(2)} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------- caméra, warp et secousses

function Rig({ warp, shake, children }: { warp: WarpPhase; shake: number; children: ReactNode }) {
  const world = useRef<THREE.Group>(null)
  const shakeAt = useRef(-10)
  const warpAt = useRef(0)
  const { camera, clock } = useThree()
  useEffect(() => {
    if (shake) shakeAt.current = clock.elapsedTime
  }, [shake, clock])
  useEffect(() => {
    warpAt.current = clock.elapsedTime
  }, [warp, clock])
  useFrame(({ clock: ck }) => {
    const g = world.current
    if (!g) return
    const s = Math.max(0, 1 - (ck.elapsedTime - shakeAt.current) / 0.4)
    g.position.set((Math.random() - 0.5) * 0.18 * s, (Math.random() - 0.5) * 0.1 * s, (Math.random() - 0.5) * 0.18 * s)
    const cam = camera as THREE.PerspectiveCamera
    const t = ck.elapsedTime - warpAt.current
    let fov = 42
    if (warp === 'out') fov = 42 + 50 * Math.min(1, t / 0.9) ** 2
    else if (warp === 'in') fov = 92 - 50 * (1 - (1 - Math.min(1, t / 0.65)) ** 3)
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
  })
  return <group ref={world}>{children}</group>
}

/** Le contenu du quadrant file vers l'arrière pendant le passage en distorsion. */
function WarpShift({ warp, heading, children }: { warp: WarpPhase; heading: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  const at = useRef(0)
  const clock = useThree((s) => s.clock)
  useEffect(() => {
    at.current = clock.elapsedTime
  }, [warp, clock])
  useFrame(({ clock: ck }) => {
    if (!g.current) return
    const [dr, dc] = courseVector(heading)
    const dir = new THREE.Vector3(dc, 0, dr).normalize()
    const t = ck.elapsedTime - at.current
    let d = 0
    if (warp === 'out') d = -18 * Math.min(1, t / 0.9) ** 3
    else if (warp === 'in') d = 18 * (1 - Math.min(1, t / 0.65)) ** 3
    g.current.position.copy(dir.multiplyScalar(d))
  })
  return <group ref={g}>{children}</group>
}

function AimLine({ aim, from }: { aim: NonNullable<View3DProps['aim']>; from: Pos }) {
  const pts = useMemo(() => {
    const [dr, dc] = courseVector(aim.course)
    const out: THREE.Vector3[] = [toV(from, 0.03)]
    let x = from.r
    let y = from.c
    const max = aim.steps ?? 20
    for (let i = 0; i < max; i++) {
      x += dr
      y += dc
      out.push(toV({ r: x, c: y }, 0.03))
      if (x < -0.5 || x > 7.5 || y < -0.5 || y > 7.5) break
    }
    return out
  }, [aim, from])
  const ref = useRef<{ material: { dashOffset: number } } | null>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.material.dashOffset -= dt * 0.6
  })
  return (
    <Line
      ref={ref as never}
      points={pts}
      color={new THREE.Color(aim.kind === 'nav' ? '#f2a65a' : '#e2574c').multiplyScalar(1.8)}
      toneMapped={false}
      lineWidth={2.2}
      dashed
      dashSize={0.12}
      gapSize={0.14}
    />
  )
}

function Hover({ cell }: { cell: Pos }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={toV(cell, 0.004)}>
      <planeGeometry args={[0.96, 0.96]} />
      <meshBasicMaterial color="#7a8cff" transparent opacity={0.16} depthWrite={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------- composant principal

export default function SectorView3D({ state, fx, warp, shake, moveMs, aim, describe, onCell, interactive }: View3DProps) {
  const [hover, setHover] = useState<{ cell: Pos; x: number; y: number } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const controls = useRef<{ reset: () => void } | null>(null)
  const srsDown = state.damage[DEV.srs] < 0
  const seed = state.quad.r * 8 + state.quad.c
  const shield = state.shields > 0 ? Math.min(1, 0.35 + state.shields / 1500) : 0

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const c = Math.floor(e.point.x + 4)
    const r = Math.floor(e.point.z + 4)
    if (r < 0 || r > 7 || c < 0 || c > 7) return null
    return { r, c }
  }

  const label = hover && interactive ? describe(hover.cell) : null

  return (
    <div className={`sector-view three ${warp ? `warp-${warp}` : ''}`} ref={wrap} onDoubleClick={() => controls.current?.reset()} aria-label={`Scan courte portée du quadrant ${regionName(state.quad.r, state.quad.c)}`}>
      <Canvas camera={{ position: [0, 10.8, 9.6], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#02040c']} />
        <fog attach="fog" args={['#02040c', 16, 40]} />
        <ambientLight intensity={0.35} color="#9aa8ff" />
        <hemisphereLight args={['#cfd8ff', '#1a1030', 0.5]} />
        <directionalLight position={[-5, 9, 6]} intensity={1.8} color="#fff1dc" />
        <directionalLight position={[5, 3, -7]} intensity={1.4} color="#8fa0ff" />
        <Stars radius={40} depth={30} count={3500} factor={3} saturation={0.2} fade speed={warp ? 6 : 0.6} />
        <Nebula />
        <Rig warp={warp} shake={shake}>
          <Board />
          {aim && !warp && <AimLine aim={aim} from={state.sector} />}
          {hover && interactive && <Hover cell={hover.cell} />}
          <WarpShift warp={warp} heading={state.heading}>
            {!srsDown &&
              state.stars.map((s) => (
                <group key={`s${s.r}-${s.c}-${seed}`} position={toV(s)}>
                  <Star seed={(s.r * 13 + s.c * 7 + seed) % 17} />
                </group>
              ))}
            {!srsDown && state.base && (
              <group position={toV(state.base)}>
                <Starbase />
              </group>
            )}
            {!srsDown && state.klingons.map((k, i) => <KlingonShip key={`k${i}-${seed}`} k={k} ship={state.sector} index={i} />)}
          </WarpShift>
          <Ship key={seed} state={state} moveMs={moveMs} warp={warp} shield={shield} />
          {fx.map((f) => (
            <Effect3D key={f.id} fx={f} />
          ))}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.001, 0]}
            visible={false}
            onPointerMove={(e) => {
              const cell = pick(e)
              const box = wrap.current?.getBoundingClientRect()
              if (!cell || !box) return setHover(null)
              setHover({ cell, x: e.nativeEvent.clientX - box.left, y: e.nativeEvent.clientY - box.top })
            }}
            onPointerOut={() => setHover(null)}
            onClick={(e) => {
              if (!interactive || e.delta > 6) return
              const cell = pick(e)
              if (cell) onCell(cell)
            }}
          >
            <planeGeometry args={[8, 8]} />
            <meshBasicMaterial />
          </mesh>
        </Rig>
        <OrbitControls
          ref={controls as never}
          enableZoom={false}
          target={[0, 0, 0.4]}
          enablePan={false}
          enableDamping
          minDistance={6}
          maxDistance={16}
          minPolarAngle={0.05}
          maxPolarAngle={1.25}
          minAzimuthAngle={-1.1}
          maxAzimuthAngle={1.1}
        />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={1.15} radius={0.75} />
          <Vignette offset={0.3} darkness={0.65} />
        </EffectComposer>
      </Canvas>
      {srsDown && (
        <div className="srs-down-3d">
          <strong>Senseurs courte portée hors service</strong>
          <span>Seule la position de l’Enterprise est connue</span>
        </div>
      )}
      {label && hover && (
        <div className="cell-tip" style={{ left: hover.x + 18, top: hover.y }}>
          {label}
        </div>
      )}
    </div>
  )
}
