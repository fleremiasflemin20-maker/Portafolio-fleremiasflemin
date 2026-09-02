import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Desktop: fija el contenedor y desplaza el contenido en X mientras se hace
 * scroll vertical. Móvil: no hace nada y las escenas quedan apiladas, que es
 * lo correcto — el scroll horizontal táctil pelea con el gesto de "atrás".
 *
 * Cada hijo debe llevar: className="scene lg:h-screen lg:w-screen lg:shrink-0"
 * El shrink-0 es imprescindible o flexbox comprime las escenas y no hay nada
 * que desplazar.
 */
export function HorizontalDeck({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(min-width: 1024px) and (pointer: fine)', () => {
        const el = track.current!
        const distance = () => el.scrollWidth - window.innerWidth

        gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            // 1px de scroll vertical = 1px horizontal: la sensación es directa.
            end: () => '+=' + distance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="lg:overflow-hidden">
      <div ref={track} className="flex flex-col lg:h-screen lg:w-max lg:flex-row lg:flex-nowrap">
        {children}
      </div>
    </div>
  )
}
