import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Pos } from '../../game/types'
import type { Fx } from '../../useGame'
import { radialTexture } from './models'

export const toV = (p: Pos, y = 0) => new THREE.Vector3(p.c - 3.5, y, p.r - 3.5)
const UP = new THREE.Vector3(0, 1, 0)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

/** Horloge locale d'un effet : temps écoulé depuis son montage, en secondes. */
function useLocalTime(fn: (t: number) => void) {
  const start = useRef<number | null>(null)
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime
    fn(clock.elapsedTime - start.current)
  })
}

// ---------------------------------------------------------------- matériau de bouclier (effet de Fresnel)

export function makeShieldMaterial(color = '#7a8cff') {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.3 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main() {
        // borné : un pow() sur une valeur négative donne NaN, que le bloom étale sur tout l'écran
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.2);
        gl_FragColor = vec4(uColor * (0.6 + 2.2 * f), clamp((0.08 + f) * uOpacity, 0.0, 1.0));
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

// ---------------------------------------------------------------- effets

function Beam({ from, to, hit }: { from: Pos; to: Pos; hit: boolean }) {
  const a = toV(from, 0.14)
  const b = toV(to, 0.06)
  const dir = b.clone().sub(a)
  const len = dir.length()
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.MeshBasicMaterial>(null)
  const outer = useRef<THREE.MeshBasicMaterial>(null)
  const spark = useRef<THREE.Sprite>(null)
  useLocalTime((t) => {
    const grow = clamp01(t / 0.14)
    const fade = 1 - clamp01((t - 0.5) / 0.25)
    if (group.current) {
      group.current.scale.set(1, grow, 1)
      group.current.position.copy(a).addScaledVector(dir, grow / 2)
    }
    if (core.current) core.current.opacity = fade
    if (outer.current) outer.current.opacity = 0.5 * fade * (0.8 + 0.2 * Math.sin(t * 90))
    if (spark.current) {
      const k = clamp01((t - 0.12) / 0.5)
      spark.current.scale.setScalar(hit ? 0.3 + k * 0.9 : 0)
      ;(spark.current.material as THREE.SpriteMaterial).opacity = (1 - k) * fade
    }
  })
  return (
    <>
      <group ref={group} quaternion={quat}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.018, len, 8, 1, true]} />
          <meshBasicMaterial ref={core} color={new THREE.Color('#fff3d6').multiplyScalar(5)} toneMapped={false} transparent />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, len, 12, 1, true]} />
          <meshBasicMaterial
            ref={outer}
            color={new THREE.Color('#f2a65a').multiplyScalar(3)}
            toneMapped={false}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <sprite ref={spark} position={b}>
        <spriteMaterial map={radialTexture()} color="#ffe08a" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </>
  )
}

function Bolt({ from, to }: { from: Pos; to: Pos }) {
  const a = toV(from, 0.06)
  const b = toV(to, 0.12)
  const dir = b.clone().sub(a)
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
  const bolt = useRef<THREE.Mesh>(null)
  const shield = useMemo(() => makeShieldMaterial('#9eabff'), [])
  const bubble = useRef<THREE.Mesh>(null)
  useLocalTime((t) => {
    const k = clamp01(t / 0.3)
    if (bolt.current) {
      bolt.current.position.copy(a).addScaledVector(dir, k)
      bolt.current.visible = k < 1
    }
    const s = clamp01((t - 0.27) / 0.33)
    shield.uniforms.uOpacity.value = t < 0.27 ? 0 : (1 - s) * 1.6
    if (bubble.current) bubble.current.scale.setScalar(0.9 + s * 0.25)
  })
  return (
    <>
      <mesh ref={bolt} quaternion={quat}>
        <capsuleGeometry args={[0.03, 0.28, 4, 8]} />
        <meshBasicMaterial color={new THREE.Color('#6ee7a0').multiplyScalar(5)} toneMapped={false} />
      </mesh>
      <mesh ref={bubble} position={toV(to, 0.08)} material={shield}>
        <sphereGeometry args={[0.5, 32, 24]} />
      </mesh>
    </>
  )
}

function Torpedo({ from, path, ms }: { from: Pos; path: Pos[]; ms: number }) {
  const pts = useMemo(() => [from, ...path].map((p) => toV(p, 0.12)), [from, path])
  const head = useRef<THREE.Group>(null)
  const [trail, setTrail] = useState<THREE.Vector3[]>([pts[0], pts[0]])
  const lastSeg = useRef(-1)
  useLocalTime((t) => {
    const k = clamp01(t / (ms / 1000))
    const seg = k * (pts.length - 1)
    const i = Math.min(pts.length - 2, Math.floor(seg))
    const p = pts[i].clone().lerp(pts[i + 1] ?? pts[i], seg - i)
    if (head.current) {
      head.current.position.copy(p)
      head.current.rotation.z += 0.3
      head.current.visible = k < 1
    }
    const n = Math.floor(seg * 4)
    if (n !== lastSeg.current) {
      lastSeg.current = n
      setTrail([...pts.slice(0, i + 1), p])
    }
  })
  return (
    <>
      <group ref={head}>
        <mesh>
          <icosahedronGeometry args={[0.06, 2]} />
          <meshBasicMaterial color={new THREE.Color('#ff7a4a').multiplyScalar(6)} toneMapped={false} />
        </mesh>
        <sprite scale={[0.7, 0.7, 1]}>
          <spriteMaterial map={radialTexture()} color="#ff5a3c" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
        <pointLight color="#ff7a4a" intensity={3} distance={2.5} decay={2} />
      </group>
      {trail.length > 1 && <Line points={trail} color="#f2a65a" lineWidth={1.5} transparent opacity={0.45} dashed dashSize={0.06} gapSize={0.08} />}
    </>
  )
}

function Explosion({ at, big }: { at: Pos; big: boolean }) {
  const center = toV(at, 0.1)
  const N = big ? 90 : 40
  const { geom, vel } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(N * 3)
    const v: THREE.Vector3[] = []
    for (let i = 0; i < N; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.3) * 0.8, Math.random() - 0.5).normalize()
      v.push(d.multiplyScalar(0.6 + Math.random() * 1.4))
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geom: g, vel: v }
  }, [N])
  const ball = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const flash = useRef<THREE.Sprite>(null)
  const light = useRef<THREE.PointLight>(null)
  const pts = useRef<THREE.PointsMaterial>(null)
  const size = big ? 1 : 0.6
  useLocalTime((t) => {
    const k = clamp01(t / 1.1)
    const ease = 1 - (1 - k) ** 3
    if (ball.current) {
      ball.current.scale.setScalar(size * (0.15 + ease * 0.55))
      ;(ball.current.material as THREE.MeshBasicMaterial).opacity = 1 - k
    }
    if (ring.current) {
      ring.current.scale.setScalar(size * (0.2 + ease * 1.6))
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.9
    }
    if (flash.current) {
      flash.current.scale.setScalar(size * (1.2 + ease * 2.5))
      ;(flash.current.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - k * 2)
    }
    if (light.current) light.current.intensity = 8 * (1 - k) ** 2
    const arr = geom.attributes.position.array as Float32Array
    for (let i = 0; i < N; i++) {
      arr[i * 3] = vel[i].x * ease * size
      arr[i * 3 + 1] = vel[i].y * ease * size
      arr[i * 3 + 2] = vel[i].z * ease * size
    }
    geom.attributes.position.needsUpdate = true
    if (pts.current) pts.current.opacity = 1 - k
  })
  return (
    <group position={center}>
      <mesh ref={ball}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial color={new THREE.Color('#ffd08a').multiplyScalar(4)} toneMapped={false} transparent />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.02, 6, 48]} />
        <meshBasicMaterial color={new THREE.Color('#f2a65a').multiplyScalar(3)} toneMapped={false} transparent />
      </mesh>
      <sprite ref={flash}>
        <spriteMaterial map={radialTexture()} color="#ffb070" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <points geometry={geom}>
        <pointsMaterial
          ref={pts}
          size={0.06}
          color={new THREE.Color('#ffe08a').multiplyScalar(4)}
          toneMapped={false}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <pointLight ref={light} color="#ffa060" distance={5} decay={2} />
    </group>
  )
}

function Absorb({ at }: { at: Pos }) {
  const s = useRef<THREE.Sprite>(null)
  useLocalTime((t) => {
    const k = clamp01(t / 0.9)
    if (s.current) {
      s.current.scale.setScalar(0.4 + k * 2.2)
      ;(s.current.material as THREE.SpriteMaterial).opacity = 1 - k
    }
  })
  return (
    <sprite ref={s} position={toV(at, 0.25)}>
      <spriteMaterial map={radialTexture()} color="#ffe08a" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  )
}

export function Effect3D({ fx }: { fx: Fx }) {
  switch (fx.kind) {
    case 'phaser':
      return <Beam from={fx.from} to={fx.to} hit={fx.hit} />
    case 'disruptor':
      return <Bolt from={fx.from} to={fx.to} />
    case 'torpedo':
      return <Torpedo from={fx.from} path={fx.path} ms={fx.ms} />
    case 'explode':
      return <Explosion at={fx.at} big={fx.big} />
    case 'absorb':
      return <Absorb at={fx.at} />
  }
}
