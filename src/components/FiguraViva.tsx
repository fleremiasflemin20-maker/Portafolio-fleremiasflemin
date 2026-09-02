import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scroll } from '../lib/scroll-state'

const TAU = Math.PI * 2

/** Radianes por segundo mientras se hace scroll. Casi quieta: manda la cámara. */
const GIRO_SCROLL = 0.022
/** Con la página parada gira más: si no, la escena se congela. */
const GIRO_QUIETO = 0.1
/** Por debajo de esta velocidad se considera que la página está detenida. */
const UMBRAL_QUIETO = 0.0004

/** Hasta este progreso la figura vuelve al frente por sí sola. */
const IMAN_HASTA = 0.12
const IMAN_FUERZA = 2.4

/** Respiración: estiramiento, ciclo y fracción que dura inhalar. */
const RESPIRA = 0.005
const CICLO = 4.2
const INHALA = 0.42

/**
 * Mantiene la figura viva: gira sobre su eje y respira.
 *
 * Dos reglas conviven. **Mientras hay scroll manda la cámara**, que ya orbita:
 * si además la figura girase rápido, los dos movimientos se sumarían y se
 * perdería la sensación de estar rodeándola. **Con la página quieta manda la
 * figura**, porque una escena 3D detenida se lee como una foto.
 *
 * Y en el plano general un imán la devuelve al frente: si el visitante vuelve
 * arriba, tiene que encontrarla mirándole, no de espaldas.
 *
 * La respiración es asimétrica —inhala en el 42% del ciclo y exhala en el 58%—
 * porque un seno puro se lee como un motor, no como alguien respirando.
 */
export function FiguraViva({ children }: { children: ReactNode }) {
  const grupo = useRef<THREE.Group>(null)
  const giro = useRef(0)
  const reloj = useRef(0)
  const anterior = useRef(0)

  useFrame((_, delta) => {
    const g = grupo.current
    if (!g) return
    const dt = Math.min(delta, 1 / 30)
    reloj.current += dt

    const velocidad = Math.abs(scroll.progreso - anterior.current)
    anterior.current = scroll.progreso
    const quieto = velocidad < UMBRAL_QUIETO

    giro.current += (quieto ? GIRO_QUIETO : GIRO_SCROLL) * dt

    // Imán al frente en el plano general: tira hacia el múltiplo de 2π más
    // cercano, así nunca deshace más de media vuelta.
    if (scroll.progreso < IMAN_HASTA) {
      const fuerza = (1 - scroll.progreso / IMAN_HASTA) * IMAN_FUERZA
      const cerca = Math.round(giro.current / TAU) * TAU
      giro.current = THREE.MathUtils.damp(giro.current, cerca, fuerza, dt)
    }

    g.rotation.y = giro.current

    const fase = (reloj.current % CICLO) / CICLO
    const t = fase < INHALA ? fase / INHALA : 1 - (fase - INHALA) / (1 - INHALA)
    const aire = Math.sin(t * Math.PI * 0.5) * RESPIRA
    g.scale.set(1 - aire * 0.5, 1 + aire, 1 - aire * 0.5)
  })

  return <group ref={grupo}>{children}</group>
}
