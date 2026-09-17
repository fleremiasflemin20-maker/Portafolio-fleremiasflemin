import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Puente entre el scroll del DOM y el bucle de render de R3F.
 *
 * Objeto mutable a propósito: si el progreso fuera estado de React, cada píxel
 * de scroll dispararía un render del árbol entero. GSAP escribe aquí y
 * `useFrame` lee de aquí; React no se entera.
 */
export const scroll = { progreso: 0 }

/**
 * Cuánto tarda la cámara en alcanzar al scroll.
 *
 * Con rueda de ratón un segundo es lo correcto: la rueda da saltos gruesos y el
 * retardo los convierte en movimiento. Con el dedo el problema es el contrario
 * —la señal ya es continua— y ese retardo solo hace que la cámara siga viajando
 * después de soltar.
 */
const PERSECUCION = matchMedia('(pointer: coarse)').matches ? 0.4 : 1

/** Una sola línea de tiempo maestra para todo el recorrido. */
export function crearLineaDeTiempo(relato: HTMLElement) {
  return gsap.to(scroll, {
    progreso: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: relato,
      start: 'top top',
      end: 'bottom bottom',
      scrub: PERSECUCION,
      invalidateOnRefresh: true,
    },
  })
}
