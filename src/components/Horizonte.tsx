import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { scroll } from '../lib/scroll-state'

const RUTA = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/textures/horizonte.webp`

/** Radio del cilindro. La cámara no pasa de ~5, así que siempre queda dentro. */
const RADIO = 9
const ALTURA = 14
/** Vueltas de la tira alrededor: más repeticiones, ciudad más pequeña. */
const REPITE = 2.2
/** Radianes por segundo. Lento: tiene que notarse vivo, no girando. */
const GIRO = 0.03

// De casi apagado en el plano general a presente en la órbita alta: la ciudad
// entra en escena según avanza el relato.
const TENUE = new THREE.Color('#6B5F82')
const VIVO = new THREE.Color('#BFB2D6')

/**
 * La ciudad envolviendo la escena, vista desde dentro de un cilindro.
 *
 * Un plano detrás de la figura se vería de canto en cuanto la cámara pasara de
 * los 90°, y aquí da una vuelta entera. El cilindro está detrás mires donde
 * mires, y como gira despacio la escena no se congela aunque el visitante deje
 * de hacer scroll.
 *
 * Material `basic`: es un telón, no una superficie. Iluminarlo con las mismas
 * luces que la figura lo llenaría de degradados y perdería el aire de cartel.
 */
export function Horizonte() {
  const malla = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const textura = useTexture(RUTA)

  useLayoutEffect(() => {
    textura.wrapS = THREE.RepeatWrapping
    textura.wrapT = THREE.ClampToEdgeWrapping
    textura.repeat.set(REPITE, 1)
    textura.colorSpace = THREE.SRGBColorSpace
    textura.needsUpdate = true
  }, [textura])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    if (malla.current) malla.current.rotation.y += GIRO * dt

    // Girar la malla y desplazar la textura al revés da dos velocidades sobre
    // la misma superficie: el fondo no repite fotograma aunque el cilindro sí
    // complete vueltas.
    textura.offset.x -= GIRO * 0.3 * dt

    if (material.current) {
      material.current.color.lerpColors(
        TENUE, VIVO, THREE.MathUtils.smoothstep(scroll.progreso, 0.1, 0.85),
      )
    }
  })

  return (
    <mesh ref={malla} position={[0, ALTURA / 2 - 3.2, 0]}>
      <cylinderGeometry args={[RADIO, RADIO, ALTURA, 64, 1, true]} />
      <meshBasicMaterial
        ref={material}
        map={textura}
        side={THREE.BackSide}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}
