import { useGLTF } from '@react-three/drei'

const RUTA = (m: string) => `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/models/${m}.glb`
const DRACO = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/draco/`

/**
 * La malla del personaje, sin más.
 *
 * El movimiento —giro y respiración— lo pone `FiguraViva`, que la envuelve, y
 * el recorrido lo pone la cámara. Aquí solo se carga y se coloca: separado así,
 * cambiar de personaje no reinicia la animación de la escena.
 */
export function Figura({ modelo }: { modelo: string }) {
  const { scene } = useGLTF(RUTA(modelo), DRACO)
  return (
    <group>
      {/* `clone` en cada cambio: sin él los dos personajes compartirían el
          mismo objeto de escena y el segundo heredaría la transformación del
          primero. */}
      {/*
        Los modelos de Meshy vienen centrados en su propio origen: medido, la
        malla va de y=-0.96 a y=+0.95. El recorrido de cámara está calculado
        sobre una figura que PISA el suelo en y=0 y mide 1.90, así que hay que
        subirla media altura. Sin esto la cámara apunta por encima de la cabeza.
      */}
      <primitive object={scene.clone()} position={[0, 0.96, 0]} />
    </group>
  )
}

useGLTF.preload(RUTA('paseo'), DRACO)
