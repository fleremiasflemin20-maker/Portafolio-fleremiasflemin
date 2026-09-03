import { useEffect, useRef, useState } from 'react'

/**
 * Islas de Aether: la única pieza del portfolio que se juega aquí dentro.
 *
 * Va embebida en un `iframe` y no portada a React a propósito. El mundo es un
 * documento suelto de 68 KB con su propio Worker, su `<canvas>`, su teclado y
 * su audio; meterlo en el árbol de React significaría pelear con Lenis por la
 * rueda del ratón, con GSAP por los `requestAnimationFrame` y con el resto de
 * la página por el foco del teclado. Aislado en su propio documento, no se
 * pisan.
 *
 * Se monta cuando entra en pantalla y se desmonta al salir. Sin eso, un motor
 * 3D corriendo a 60 fps se queda quemando batería en el fondo de una página
 * que ya no se está mirando — y en móvil eso se nota en el resto del sitio.
 *
 * El bloque de datos de abajo son medidas reales del build actual, no
 * aproximaciones de escaparate.
 */

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const MUNDO = `${BASE}/aether/index.html`
const CODIGO = 'https://github.com/fleremiasflemin20-maker/islas-de-aether'
const VIVO = 'https://fleremiasflemin20-maker.github.io/islas-de-aether/'

const DATOS: [string, string][] = [
  ['Puntos en memoria', '~500 000'],
  ['Sectores', 'infinitos'],
  ['Regiones', '6 + confines'],
  ['Dependencias', 'ninguna'],
  ['Peso total', '68 KB'],
  ['Hilos', 'render en Worker'],
]

export function IslasDeAether() {
  const marco = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [listo, setListo] = useState(false)

  /*
    En táctil el mundo se queda inerte hasta que lo tocas a propósito.

    Dentro del iframe, el juego llama a `preventDefault` en cada `touchmove`
    para que el joystick no arrastre la página. Perfecto en su propia pestaña y
    una trampa aquí: quien pasa el dedo por encima para seguir bajando se queda
    encallado en la sección. Con `pointer-events: none` hasta el toque
    explícito, el dedo atraviesa el marco y la página sigue corriendo; una vez
    dentro, un botón lo suelta. Con ratón no hace falta: la rueda no la toca
    nadie ahí dentro.
  */
  const [activo, setActivo] = useState(() =>
    typeof matchMedia === 'undefined' ? true : !matchMedia('(pointer: coarse)').matches,
  )

  /* Un solo observador con dos umbrales: entra al 25 % y se apaga cuando ya no
     queda nada en pantalla, con 300 px de margen para que un scroll rápido de
     ida y vuelta no lo reinicie. */
  useEffect(() => {
    const nodo = marco.current
    if (!nodo) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
        else if (e.intersectionRatio === 0) { setVisible(false); setListo(false) }
      },
      { threshold: [0, 0.25], rootMargin: '300px 0px' },
    )
    obs.observe(nodo)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <header className="max-w-2xl">
        <p className="font-mono text-caption uppercase" style={{ color: 'var(--tinta)' }}>
          Pieza jugable · corriendo aquí mismo
        </p>
        <h2 className="mt-3 font-display text-headline uppercase leading-none">Islas de Aether</h2>
        <p className="mt-4 text-body text-paper/70">
          Un mundo de fantasía sin borde renderizado <strong className="text-paper">solo con caracteres</strong>. Sin
          texturas, sin mallas, sin WebGL: un canvas 2D dibujando glifos sobre una rejilla, con z-buffer propio,
          luz calculada en tiempo real y sectores que se generan mientras vuelas.
        </p>
      </header>

      <div
        ref={marco}
        className="relative mt-10 overflow-hidden border border-paper/10 bg-ink"
        style={{ aspectRatio: '16 / 9', minHeight: '360px' }}
      >
        {visible && (
          <iframe
            src={MUNDO}
            title="Islas de Aether — mundo ASCII interactivo"
            loading="lazy"
            onLoad={() => setListo(true)}
            allow="autoplay"
            className={`absolute inset-0 h-full w-full border-0 ${activo ? '' : 'pointer-events-none'}`}
          />
        )}

        {/* Puerta táctil: cubre el marco hasta que alguien decide entrar. */}
        {listo && !activo && (
          <button
            onClick={() => setActivo(true)}
            className="absolute inset-0 grid place-content-center bg-ink/45 font-mono text-caption uppercase tracking-[0.2em] backdrop-blur-[1px]"
            style={{ color: 'var(--tinta)' }}
          >
            Tocar para volar
          </button>
        )}
        {listo && activo && (
          <button
            onClick={() => setActivo(false)}
            className="absolute right-3 top-3 border border-paper/20 bg-ink/70 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/70 md:hidden"
          >
            Soltar
          </button>
        )}

        {/* Mientras arranca: el mismo lenguaje del propio mundo, para que la
            espera no parezca un hueco roto. */}
        {!listo && (
          <div className="pointer-events-none absolute inset-0 grid place-content-center justify-items-center gap-4 bg-ink">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-paper/45">
              Levantando el archipiélago
            </p>
            <span className="block h-px w-40 overflow-hidden bg-paper/15">
              <span
                className="block h-full w-1/3 animate-pulse"
                style={{ background: 'linear-gradient(90deg, var(--desde), var(--hasta))' }}
              />
            </span>
          </div>
        )}

        {/* Marco de acento, igual que las tarjetas de la galería. */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, var(--desde), var(--hasta))' }}
        />
      </div>

      <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-paper/40">
        Haz clic dentro para volar · W A S D moverte · arrastrar para mirar · M el mapa · en móvil, joystick a la izquierda
      </p>

      <div className="mt-12 grid gap-x-10 gap-y-5 border-t border-paper/10 pt-8 font-mono text-[0.72rem] sm:grid-cols-2 lg:grid-cols-3">
        {DATOS.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-paper/40">{etiqueta}</dt>
            <dd className="mt-1" style={{ color: 'var(--tinta)' }}>{valor}</dd>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
        <a
          href={VIVO}
          target="_blank"
          rel="noreferrer"
          className="inline-block border-2 px-9 py-3.5 font-mono text-caption font-bold uppercase transition-colors duration-300 hover:text-ink"
          style={{ borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tinta)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Pantalla completa
        </a>
        <a
          href={CODIGO}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-caption uppercase text-paper/55 underline decoration-paper/20 underline-offset-[6px] transition-colors duration-200 hover:text-paper hover:decoration-current"
        >
          Código en GitHub
        </a>
      </div>
    </section>
  )
}
