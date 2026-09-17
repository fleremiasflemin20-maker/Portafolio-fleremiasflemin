import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { CamaraRig } from './CamaraRig'

/**
 * Deja la escena a mano en la consola durante el desarrollo.
 *
 * Sin esto, encuadrar es adivinar: no hay forma de saber dónde están los pies
 * de la figura ni a qué altura mira la cámara. No se compila en producción.
 */
function Sonda() {
  const { scene, camera } = useThree()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    Object.assign(window, { __escena: scene, __camara: camera })
  }, [scene, camera])
  return null
}
import { Horizonte } from './Horizonte'
import { FiguraViva } from './FiguraViva'
import { Sombra } from './Sombra'
import { Figura } from './Personaje3D'
import { estadoInicial } from '../lib/recorrido'
import type { Faceta } from '../lib/facetas'

const inicio = estadoInicial()

/**
 * El escenario. Va fijo a pantalla completa y no se desmonta nunca: el relato
 * pasa por encima y la escena permanece, que es lo que hace que el recorrido se
 * lea como una sola toma y no como secciones animándose por separado.
 */
export function Escena({ faceta }: { faceta: Faceta }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <color attach="background" args={['#0A0A12']} />
        {/* Empieza más allá del cilindro para no lavarlo, y se cierra antes de
            su pared opuesta: es lo que le da profundidad al fondo. */}
        <fog attach="fog" args={['#0A0A12', 9, 24]} />

        <PerspectiveCamera makeDefault fov={inicio.fov} near={0.1} far={40} position={[0, 1, 5]} />

        <Suspense fallback={null}>
          <Horizonte />
          <Environment preset="sunset" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 2]} intensity={1.5} />
          {/* Contra en el color de la faceta: es lo que ata la figura al
              atardecer en vez de dejarla flotando como un recorte. */}
          <spotLight position={[-3, 4, -3.5]} intensity={55} color={faceta.tinta} angle={0.9} penumbra={1} />

          <Sombra />
          <FiguraViva>
            <Figura key={faceta.modelo} modelo={faceta.modelo} />
          </FiguraViva>
        </Suspense>

        <CamaraRig />
        {import.meta.env.DEV && <Sonda />}
      </Canvas>
    </div>
  )
}
