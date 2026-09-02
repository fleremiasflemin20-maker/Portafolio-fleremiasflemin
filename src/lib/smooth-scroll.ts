import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Lenis y ScrollTrigger tienen que compartir el mismo tick. Si cada uno corre
 * por su cuenta el contenido fijado tiembla al hacer scroll.
 */
export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
  const raf = (time: number) => lenis.raf(time * 1000)

  // Expuesto para poder posicionar el scroll al verificar: window.scrollTo
  // pelea con Lenis y deja a ScrollTrigger leyendo una posicion que no es.
  ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(raf)
    lenis.destroy()
  }
}

/**
 * ScrollTrigger mide al montar. Si las imágenes y las fuentes aún no tienen
 * tamaño, el recorrido del deck sale corto y la última escena queda cortada.
 */
export function refreshOnAssetsLoaded() {
  const refresh = () => ScrollTrigger.refresh()

  if (document.readyState === 'complete') refresh()
  else window.addEventListener('load', refresh)

  document.fonts?.ready.then(refresh)

  return () => window.removeEventListener('load', refresh)
}
