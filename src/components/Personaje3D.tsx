import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { Faceta } from '../lib/facetas'

const RUTA = (m: string) => `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/models/${m}.glb`
const DRACO = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/draco/`

/**
 * La figura, girando despacio.
 *
 * El giro es continuo y lento a propósito: una figura quieta se lee como una
 * foto y no justifica cargar un motor 3D. Moviéndose, el visitante entiende en
 * dos segundos que puede mirarla por detrás.
 */
function Figura({ modelo, tinta }: { modelo: string; tinta: string }) {
  const { scene } = useGLTF(RUTA(modelo), DRACO)
  const grupo = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (grupo.current) grupo.current.rotation.y += dt * 0.22
  })

  return (
    <group ref={grupo}>
      {/* `clone` en cada cambio de faceta: sin él, los dos personajes
          compartirían el mismo objeto de escena y el segundo aparecería con la
          rotación acumulada del primero. */}
      <primitive object={scene.clone()} position={[0, -1.02, 0]} />
      {/* Luz de contra en el color de la faceta: es lo que ata la figura al
          atardecer del fondo en vez de dejarla flotando como un recorte. */}
      <spotLight position={[-2.5, 3, -3]} intensity={40} color={tinta} angle={0.9} penumbra={1} />
    </group>
  )
}

/**
 * El personaje del hero, que cambia con la rueda.
 *
 * Los dos modelos vienen de un escaneo generado con Meshy: 3 millones de
 * triángulos y 117 MB cada uno. Servirlos así habría hecho que cada visita
 * descargara 233 MB antes de ver nada. Están decimados a ~120.000 triángulos,
 * con las texturas a 1024 en WebP y la malla comprimida con Draco: **1 MB
 * cada uno**, unas 120 veces menos, y a esta distancia no se nota.
 *
 * `dpr` tope 1.5: a 2 en una pantalla retina se pintan cuatro veces los píxeles
 * para una figura que ocupa un tercio de la pantalla y gira despacio.
 */
export function Personaje3D({ faceta }: { faceta: Faceta }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.05, 4.1], fov: 32 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      /*
       * `pointerEvents: 'none'` en el propio lienzo, no solo en el div que lo
       * envuelve: R3F le escribe estilos al <canvas> y anula lo que herede del
       * padre. Sin esto el lienzo se traga los clics de la rueda —está encima y
       * es más grande— y los sectores dejan de responder.
       */
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <Environment preset="sunset" />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 2]} intensity={1.6} />
        <Figura key={faceta.modelo} modelo={faceta.modelo} tinta={faceta.tinta} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(RUTA('paseo'), DRACO)
