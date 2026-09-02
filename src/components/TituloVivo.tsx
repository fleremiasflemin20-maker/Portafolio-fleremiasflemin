import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Las cuatro entradas. Cada titular de la página usa una distinta.
 *
 * No es variedad por capricho: seis titulares con la misma entrada se leen como
 * una plantilla repetida, y en una pieza cuyo argumento es «esto no es una
 * plantilla», eso es justo lo que no puede pasar.
 *
 * Todas van letra a letra con `stagger`, que es lo que las hace parecer una ola
 * atravesando el texto y no un bloque moviéndose.
 */
const ENTRADAS = {
  /** Caen desde arriba y rebotan. Para el titular que anuncia algo. */
  caida: {
    desde: { yPercent: -130, opacity: 0, rotate: -12 },
    hasta: { yPercent: 0, opacity: 1, rotate: 0, ease: 'back.out(2.1)', stagger: 0.038 },
  },
  /** Entran de lado inclinadas y se enderezan. Como algo que se despliega. */
  barrido: {
    desde: { xPercent: -65, opacity: 0, skewX: 26 },
    hasta: { xPercent: 0, opacity: 1, skewX: 0, ease: 'power4.out', stagger: 0.03 },
  },
  /** Llegan enormes y se contraen desde el centro. Es el impacto. */
  impacto: {
    desde: { scale: 2.6, opacity: 0 },
    hasta: {
      scale: 1,
      opacity: 1,
      ease: 'power4.out',
      stagger: { each: 0.032, from: 'center' as const },
    },
  },
  /** Voltean sobre su eje horizontal, como fichas que se dan la vuelta. */
  giro: {
    desde: { rotateX: -92, opacity: 0, transformOrigin: '50% 50% -0.4em' },
    hasta: { rotateX: 0, opacity: 1, ease: 'back.out(1.6)', stagger: 0.042 },
  },
} as const

export type Entrada = keyof typeof ENTRADAS

/**
 * Cada letra son DOS `<span>`.
 *
 * El de fuera lo anima la entrada por scroll; el de dentro, el puntero.
 * Compartiendo elemento, el `transform` de uno borraría el del otro y bastaría
 * pasar el ratón mientras entra para dejar letras a medio camino.
 *
 * Van bajo `aria-hidden` y el texto real viaja en el `aria-label` del `<h2>`:
 * partido en letras, un lector de pantalla deletrearía el titular.
 */
function Letras({ texto, degradado = false }: { texto: string; degradado?: boolean }) {
  const total = Math.max(1, texto.length - 1)
  return (
    // `whitespace-nowrap`: con cada letra en `inline-block`, el navegador puede
    // romper la línea ENTRE letras, y "BONILLA" perdía la A en un renglón
    // aparte. La palabra tiene que romperse donde diga el diseño, no donde
    // quepa una letra suelta.
    <span className="block whitespace-nowrap">
      {texto.split('').map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="titulo-entrada inline-block will-change-transform"
          // Los espacios en un `inline-block` colapsan y las palabras se pegan.
          style={ch === ' ' ? { width: '0.26em' } : undefined}
        >
          <span
            className="titulo-letra inline-block"
            /*
             * El degradado se hace letra a letra, no con `background-clip`.
             *
             * `background-clip: text` NO atraviesa descendientes con
             * `transform`, y al animar letra a letra cada una es un
             * `inline-block` transformado: el degradado del padre no las alcanza
             * y la palabra desaparece en negro. Dando a cada letra un color
             * sólido interpolado según su posición se ve igual —el ojo lee el
             * degradado a lo largo de la palabra— y además se anima sin peleas.
             */
            style={
              degradado
                ? { color: `color-mix(in oklab, var(--hasta) ${Math.round((i / total) * 100)}%, var(--desde))` }
                : undefined
            }
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </span>
  )
}

export function TituloVivo({
  lineas,
  entrada = 'caida',
  className = '',
  style,
  gradienteUltima = false,
}: {
  lineas: string[]
  entrada?: Entrada
  className?: string
  style?: React.CSSProperties
  gradienteUltima?: boolean
}) {
  const raiz = useRef<HTMLHeadingElement>(null)
  const corriendo = useRef(false)

  useLayoutEffect(() => {
    const el = raiz.current
    if (!el) return

    const ctx = gsap.context(() => {
      const letras = el.querySelectorAll('.titulo-entrada')

      gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(letras, { opacity: 1, clearProps: 'transform' })
      })

      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const { desde, hasta } = ENTRADAS[entrada]
        gsap.fromTo(letras, desde, {
          ...hasta,
          duration: 0.7,
          scrollTrigger: {
            trigger: el,
            start: 'top 84%',
            // `restart` al volver a entrar: si solo se reprodujera una vez,
            // quien sube y vuelve a bajar se encuentra el titular ya puesto y se
            // pierde justo lo que se ha trabajado.
            toggleActions: 'restart none none reverse',
          },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [entrada])

  const golpear = () => {
    if (!raiz.current || corriendo.current) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    corriendo.current = true
    gsap.fromTo(
      raiz.current.querySelectorAll('.titulo-letra'),
      { yPercent: 0, scale: 1 },
      {
        yPercent: -20,
        scale: 1.1,
        duration: 0.26,
        ease: 'back.out(3)',
        stagger: 0.022,
        // Ida y vuelta en el mismo tween: con dos encadenados, mover el puntero
        // rápido dejaba letras arriba a mitad de camino.
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          corriendo.current = false
        },
      },
    )
  }

  return (
    <h2
      ref={raiz}
      onPointerEnter={golpear}
      aria-label={lineas.join(' ')}
      className={`rotulo font-display uppercase leading-[0.85] ${className}`}
      // `perspective` para que el volteo de la entrada `giro` tenga profundidad;
      // sin ella, rotar en X solo aplasta las letras.
      style={{ perspective: '700px', ...style }}
    >
      {lineas.map((linea, k) => {
        const conGradiente = gradienteUltima && k === lineas.length - 1
        return (
          <span
            key={k}
            className="block"
            aria-hidden="true"
          >
            <Letras texto={linea} degradado={conGradiente} />
          </span>
        )
      })}
    </h2>
  )
}
