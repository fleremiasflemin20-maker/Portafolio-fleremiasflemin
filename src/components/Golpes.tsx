import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { alGolpear } from '../lib/golpes'

/**
 * Las onomatopeyas. Cortas y secas, que es como suenan en una viñeta: un golpe
 * dura un instante y la palabra tiene que durar lo mismo.
 */
const PALABRAS = ['BOOM', 'AUCH', 'POW', 'HIT', 'BAM', 'ZAS', 'CRASH', 'WHAM', 'PLAF', 'THWACK']

/**
 * Cuántas pueden verse a la vez.
 *
 * Se reciclan en círculo en vez de crear y destruir nodos: pulsando rápido
 * salen varias por segundo, y montar y desmontar elementos a ese ritmo provoca
 * recálculos de estilo justo mientras la escena 3D pelea por sus fotogramas.
 */
const POOL = 8

/** Margen para que ninguna nazca pegada al borde y salga cortada. */
const MARGEN = 90

/**
 * Golpes de cómic al pulsar sobre la figura.
 *
 * El disparo no lo decide este componente: llega desde el propio modelo 3D
 * (ver `golpear` en lib/golpes), que es quien sabe si el clic cayó sobre la
 * malla y no sobre el fondo. Aquí solo se dibuja.
 */
export function Golpes() {
  const raiz = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const nodos = gsap.utils.toArray<HTMLElement>('[data-golpe]', raiz.current)
    if (!nodos.length) return

    let siguiente = 0
    let bolsa: string[] = []

    /*
     * Bolsa barajada, no azar puro.
     *
     * Con `Math.random()` cada golpe es independiente y en una racha corta sale
     * la misma palabra tres veces — y repetida no se lee como otro golpe, se lee
     * como que el efecto está roto. Con bolsa se agotan todas antes de repetir.
     */
    const sacar = () => {
      if (!bolsa.length) bolsa = gsap.utils.shuffle([...PALABRAS])
      return bolsa.pop()!
    }

    const dibujar = (x: number, y: number) => {
      const el = nodos[siguiente]
      siguiente = (siguiente + 1) % nodos.length
      el.textContent = sacar()

      const inclina = gsap.utils.random(-18, 18)

      gsap.set(el, {
        left: gsap.utils.clamp(MARGEN, window.innerWidth - MARGEN, x + gsap.utils.random(-40, 40)),
        top: gsap.utils.clamp(MARGEN, window.innerHeight - MARGEN, y + gsap.utils.random(-50, 20)),
        fontSize: `${gsap.utils.random(2.6, 5.4)}rem`,
        xPercent: -50,
        yPercent: -50,
        rotate: inclina,
        scale: 0.3,
        opacity: 0,
      })

      gsap
        .timeline({ overwrite: true })
        // Entra en un solo frame largo: en una viñeta el efecto ya está
        // dibujado cuando lo ves. Si entra suave parece un rótulo.
        .to(el, { scale: 1, opacity: 1, duration: 0.11, ease: 'power4.out' })
        // Un respiro quieta, o el ojo registra un destello pero no la palabra.
        .to(el, { scale: 1.08, duration: 0.17, ease: 'none' })
        .to(el, {
          scale: 1.4,
          opacity: 0,
          y: -38,
          rotate: inclina * 1.5,
          duration: 0.5,
          ease: 'power2.out',
        })
    }

    alGolpear(dibujar)
    return () => {
      alGolpear(null)
      gsap.killTweensOf(nodos)
    }
  }, [])

  return (
    <div ref={raiz} className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {Array.from({ length: POOL }, (_, i) => (
        <span key={i} data-golpe className="golpe absolute left-0 top-0 leading-none opacity-0" />
      ))}
    </div>
  )
}
