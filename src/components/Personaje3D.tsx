import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { golpear } from '../lib/golpes'

const RUTA = (m: string) => `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/models/${m}.glb`
const DRACO = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/draco/`

/*
 * Cuánto hay que subir cada modelo para que pise el suelo en y=0.
 *
 * 'paseo' y 'marina' miden 1.90 y van centrados en su origen —la malla va de
 * y=-0.96 a y=+0.95—, así que la mitad fija de siempre les vale a los dos.
 * 'saiyan' es una pose de combate de Meshy, más baja y más ancha: mide 1.59 y
 * su malla va de -0.80 a +0.79. Con el mismo 0.96 quedaría flotando sobre el
 * suelo, así que lleva su propia mitad, medida igual que las otras dos.
 */
const MEDIA_ALTURA: Partial<Record<string, number>> = { saiyan: 0.8 }

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
    <group
      /*
       * El clic sobre la figura, no sobre el fondo. R3F ya hace el raycast, así
       * que basta con escucharlo aquí: si el rayo no toca la malla, este
       * manejador no se llama y el fondo queda libre para el scroll.
       *
       * `stopPropagation` evita que un mismo clic dispare dos golpes al
       * atravesar la malla por delante y por detrás.
       */
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        golpear(e.clientX, e.clientY)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* `clone` en cada cambio: sin él los dos personajes compartirían el
          mismo objeto de escena y el segundo heredaría la transformación del
          primero. */}
      <primitive object={scene.clone()} position={[0, MEDIA_ALTURA[modelo] ?? 0.96, 0]} />
    </group>
  )
}

useGLTF.preload(RUTA('paseo'), DRACO)
