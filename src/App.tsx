import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { FACETAS } from './lib/facetas'
import { CAPITULOS } from './lib/capitulos'
import { crearLineaDeTiempo } from './lib/scroll-state'
import { initSmoothScroll, refreshOnAssetsLoaded } from './lib/smooth-scroll'
import { Escena } from './components/Escena'
import { RuedaPersonaje } from './components/RuedaPersonaje'
import { Grano } from './components/Atmosfera'
import { Expediente } from './components/Expediente'
import { Cinematica } from './components/Cinematica'
import { Boton } from './components/Boton'
import { Golpes } from './components/Golpes'

export default function App() {
  const relato = useRef<HTMLDivElement>(null)
  const [activa, setActiva] = useState(0)
  const f = FACETAS[activa]

  /* La paleta viaja por variables CSS: un solo sitio que escribir y un solo
     sitio donde mirar cuando algo no cambia de color. */
  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--desde', f.desde)
    r.setProperty('--hasta', f.hasta)
    r.setProperty('--tinta', f.tinta)
  }, [f])

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiva((i) => (i + 1) % FACETAS.length)
      if (e.key === 'ArrowLeft') setActiva((i) => (i - 1 + FACETAS.length) % FACETAS.length)
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [])

  useLayoutEffect(() => {
    const pararScroll = initSmoothScroll()
    const pararRefresco = refreshOnAssetsLoaded()

    const ctx = gsap.context(() => {
      crearLineaDeTiempo(relato.current!)

      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        // Cada capítulo entra y sale con su propio disparador, suelto de la
        // línea maestra: el texto tiene que aparecer cuando su sección está en
        // pantalla, no en un momento fijo de la película.
        document.querySelectorAll<HTMLElement>('.capitulo').forEach((cap) => {
          const copia = cap.querySelector('.copia')
          if (!copia) return
          gsap
            .timeline({
              scrollTrigger: { trigger: cap, start: 'top 78%', end: 'bottom 22%', scrub: true },
            })
            // `fromTo` y no `from`: con `from`, un elemento que además tenga
            // transición CSS en opacity puede quedarse invisible para siempre.
            .fromTo(copia, { opacity: 0, y: 42 }, { opacity: 1, y: 0, ease: 'none', duration: 1 })
            .to(copia, { opacity: 1, duration: 1.5 })
            .to(copia, { opacity: 0, y: -42, ease: 'none', duration: 1 })
        })
      })

      gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.copia', { opacity: 1, y: 0 })
      })
    })

    return () => {
      ctx.revert()
      pararScroll()
      pararRefresco()
    }
  }, [])

  const cambiar = useCallback((i: number) => setActiva(i), [])

  return (
    <>
      <Cinematica />
      <Escena faceta={f} />
      <Golpes />

      {/* El grano va sobre la escena y bajo el relato: le quita el acabado de
          render limpio, que es lo que delata que algo está hecho por ordenador. */}
      <div className="pointer-events-none fixed inset-0 z-[2] mix-blend-overlay">
        <Grano />
      </div>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-30 p-5 md:p-8">
        <div className="flex items-start justify-between font-mono text-[0.68rem] uppercase tracking-[0.2em]">
          <span className="text-paper/70">Lenin Bonilla</span>
          <span style={{ color: 'var(--tinta)' }}>{f.clave} · en línea</span>
        </div>
        {[
          'left-5 top-5 border-l border-t md:left-8 md:top-8',
          'right-5 top-5 border-r border-t md:right-8 md:top-8',
          'left-5 bottom-5 border-l border-b md:left-8 md:bottom-8',
          'right-5 bottom-5 border-r border-b md:right-8 md:bottom-8',
        ].map((c) => (
          <span key={c} className={`absolute h-8 w-8 ${c}`} style={{ borderColor: 'var(--tinta)', opacity: 0.5 }} />
        ))}
      </div>

      {/* La rueda queda fija: es el selector de personaje, y en GTA el selector
          está siempre disponible, no solo en la primera pantalla. */}
      <div className="fixed bottom-5 left-1/2 z-30 h-20 w-20 -translate-x-1/2 md:bottom-7 md:h-24 md:w-24">
        <RuedaPersonaje activa={activa} onCambio={cambiar} />
      </div>

      {/*
        El relato entero no recibe clics; se los devuelven solo los bloques que
        los necesitan. Es el único reparto que deja el lienzo accesible: main,
        el envoltorio de capítulos y las secciones cubren la pantalla completa,
        y cualquiera de los tres que quede "auto" se traga el clic antes de que
        llegue a la figura.
      */}
      <main className="pointer-events-none relative z-10">
        {/* El envoltorio de los capítulos tampoco puede recibir clics: cubre la
            pantalla entera y se los quitaba al lienzo igual que las secciones.
            Solo el bloque de texto los recupera. */}
        <div ref={relato} className="pointer-events-none">
        {CAPITULOS.map((c, i) => (
          <section
            key={i}
            /*
              `pointer-events-none` en la sección y `auto` en el texto.

              Las secciones ocupan la pantalla entera por encima del lienzo, así
              que se tragaban todos los clics: pulsar sobre la figura no llegaba
              nunca al 3D. Comprobado con `elementFromPoint` — devolvía SECTION,
              no el canvas. Devolviéndoselos al bloque de texto, los enlaces
              siguen funcionando y el resto de la pantalla es del personaje.
            */
            className={`capitulo pointer-events-none relative flex min-h-[100svh] flex-col justify-end px-6 pb-40 md:justify-center md:pb-28 md:px-12 lg:px-20 ${
              c.lado === 'der' ? 'md:items-end' : ''
            }`}
          >
            {/* Velo de legibilidad, fijo al capítulo: sin él el cuerpo del texto
                se pierde sobre las partes claras del atardecer. */}
            <div
              className={`velo pointer-events-none absolute inset-0 -z-10 ${
                c.lado === 'der' ? 'velo-der' : 'velo-izq'
              }`}
            />

            <div className={`copia pointer-events-auto w-full max-w-xl ${c.lado === 'der' ? 'md:text-right' : ''}`}>
              <p className="font-mono text-caption uppercase" style={{ color: 'var(--tinta)' }}>
                {c.anio ? `${c.anio} · ` : ''}{c.rotulo}
              </p>
              <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper/40">
                {c.lugar}
              </p>

              <h2 className="rotulo mt-5 font-display uppercase leading-[0.85]" style={{ fontSize: i === 0 ? 'clamp(3.2rem,9vw,8rem)' : 'clamp(2.2rem,6vw,5rem)' }}>
                {c.titulo.map((linea, k) => (
                  <span key={k} className="block">
                    {k === c.titulo.length - 1 && i === 0 ? (
                      <span
                        style={{
                          backgroundImage: 'linear-gradient(100deg, var(--desde), var(--hasta))',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          /*
                           * `drop-shadow`, no `text-shadow`.
                           *
                           * Con el relleno transparente que exige el degradado,
                           * la sombra de texto se pinta DENTRO de las letras y
                           * la palabra desaparece en negro. `drop-shadow` actúa
                           * sobre el resultado ya compuesto, así que rodea el
                           * degradado en vez de taparlo.
                           */
                          filter:
                            'drop-shadow(0.035em 0.04em 0 #0A0A12) drop-shadow(-0.02em -0.02em 0 #0A0A12) drop-shadow(0.06em 0.07em 0 #0A0A1288)',
                          textShadow: 'none',
                        }}
                      >
                        {linea}
                      </span>
                    ) : (
                      linea
                    )}
                  </span>
                ))}
              </h2>

              <p className="mt-6 text-body text-paper/75">{c.texto}</p>

              {/* Solo en el primer capítulo: quien llega y decide en diez
                  segundos que le interesa, tiene que poder ir al código sin
                  recorrer la página entera. */}
              {i === 0 && (
                <div className={`mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 ${c.lado === 'der' ? 'md:justify-end' : ''}`}>
                  <Boton href="https://github.com/fleremiasflemin20-maker">GitHub</Boton>
                  <Boton href="https://www.linkedin.com/in/fleremahiaslenin" secundario>
                    LinkedIn
                  </Boton>
                </div>
              )}
            </div>
          </section>
        ))}
        </div>

        <div className="pointer-events-auto">
          <Expediente faceta={f} />
        </div>

        <section className="pointer-events-auto relative px-6 pb-32 pt-8 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl border-t border-paper/10 pt-14">
            <h2 className="max-w-2xl font-display text-headline uppercase leading-[0.95]">
              Tres oficios,
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(100deg, var(--desde), var(--hasta))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                una sola persona
              </span>
            </h2>

            <dl className="mt-8 grid gap-x-10 gap-y-4 font-mono text-[0.72rem] sm:grid-cols-2">
              {[
                ['Correo', 'fleremias@outlook.com', 'mailto:fleremias@outlook.com'],
                ['Teléfono', '+593 979 523 040', 'tel:+593979523040'],
                ['Web', 'fleremias.dev', 'https://fleremias.dev'],
                ['Dónde', 'Quito, EC · Los Angeles, CA', ''],
              ].map(([etiqueta, valor, enlace]) => (
                <div key={etiqueta}>
                  <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-paper/40">{etiqueta}</dt>
                  <dd className="mt-1">
                    {enlace ? (
                      <a href={enlace} className="underline decoration-paper/20 underline-offset-4" style={{ color: 'var(--tinta)' }}>
                        {valor}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--tinta)' }}>{valor}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Boton href="https://github.com/fleremiasflemin20-maker">GitHub</Boton>
              <Boton href="https://www.linkedin.com/in/fleremahiaslenin">LinkedIn</Boton>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
