import { useCallback, useEffect, useState } from 'react'
import { FACETAS } from './lib/facetas'
import { RuedaPersonaje } from './components/RuedaPersonaje'
import { Puesta, Grano, Palmeras, Velo } from './components/Atmosfera'
import { Expediente } from './components/Expediente'

export default function App() {
  const [activa, setActiva] = useState(0)
  const f = FACETAS[activa]

  /*
   * La paleta viaja por variables CSS en el <html>, no por props.
   *
   * Así el degradado, el HUD, los bordes y el texto de acento cambian todos a la
   * vez y con la misma transición, sin pasar el color por seis componentes. Un
   * solo sitio que escribir, un solo sitio donde mirar cuando algo no cambia.
   */
  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--desde', f.desde)
    r.setProperty('--hasta', f.hasta)
    r.setProperty('--tinta', f.tinta)
  }, [f])

  // Flechas para cambiar de faceta desde cualquier sitio, no solo con el foco
  // en la rueda: es una rueda de personaje, se espera poder cambiarla siempre.
  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiva((i) => (i + 1) % FACETAS.length)
      if (e.key === 'ArrowLeft') setActiva((i) => (i - 1 + FACETAS.length) % FACETAS.length)
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [])

  const cambiar = useCallback((i: number) => setActiva(i), [])

  return (
    <main className="relative min-h-[100svh] bg-ink text-paper">
      {/* El fondo va FIJO y nunca se desmonta: es lo que hace que el scroll se
          lea como una sola escena continua y no como secciones apiladas. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <Puesta />
        <Palmeras />
        <Velo />
        <Grano />
      </div>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-20 p-5 md:p-8">
        <div className="flex items-start justify-between font-mono text-[0.68rem] uppercase tracking-[0.2em]">
          <span className="text-paper/70">Lenin Bonilla</span>
          <span style={{ color: 'var(--tinta)' }}>{f.clave} · en línea</span>
        </div>

        {/* Esquinas: cuatro escuadras finas. Es lo que dice "interfaz de juego"
            sin dibujar un marco entero, que taparía la escena. */}
        {[
          'left-5 top-5 border-l border-t md:left-8 md:top-8',
          'right-5 top-5 border-r border-t md:right-8 md:top-8',
          'left-5 bottom-5 border-l border-b md:left-8 md:bottom-8',
          'right-5 bottom-5 border-r border-b md:right-8 md:bottom-8',
        ].map((c) => (
          <span key={c} className={`absolute h-8 w-8 ${c}`} style={{ borderColor: 'var(--tinta)', opacity: 0.55 }} />
        ))}
      </div>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col-reverse justify-center gap-9 px-6 py-16 md:px-12 md:py-24 lg:flex-row lg:items-center lg:gap-16 lg:px-20">
        <div className="lg:flex-1">
          <p className="font-mono text-caption uppercase" style={{ color: 'var(--tinta)' }}>
            {f.papel}
          </p>

          {/* El titular no cambia con la faceta: la persona es la misma. Lo que
              cambia es todo lo que la rodea, que es justo el argumento. */}
          <h1 className="mt-4 font-display text-display uppercase leading-[0.85]">
            Lenin
            <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(100deg, var(--desde), var(--hasta))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Bonilla
            </span>
          </h1>

          <p key={f.id} className="entra mt-7 max-w-md text-body text-paper/75">
            {f.descripcion}
          </p>

          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
            {f.stats.map((s) => (
              <div key={s.etiqueta}>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-paper/40">
                  {s.etiqueta}
                </dt>
                <dd className="mt-1 font-mono text-sm" style={{ color: 'var(--tinta)' }}>
                  {s.valor}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href="https://www.linkedin.com/in/fleremahiaslenin"
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-block border-2 px-10 py-4 font-mono text-caption font-bold uppercase transition-colors duration-300 hover:text-ink"
            style={{ borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tinta)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Contactar
          </a>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[13.5rem] shrink-0 sm:max-w-[16rem] md:max-w-sm lg:mx-0">
          <RuedaPersonaje activa={activa} onCambio={cambiar} />

          {/* El centro va fuera del SVG: es texto que cambia, y en HTML se
              compone y se lee mejor que dentro del gráfico. */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div key={f.id} className="entra text-center">
              <p className="font-display text-xl uppercase leading-none tracking-tight md:text-2xl" style={{ color: 'var(--tinta)' }}>
                {f.nombre}
              </p>
              <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-paper/45">
                {activa + 1} / {FACETAS.length}
              </p>
            </div>
          </div>
        </div>

        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-[0.6rem] uppercase tracking-[0.25em] text-paper/35">
          Pulsa la rueda · o usa ← →
        </p>
      </div>

      <Expediente faceta={f} />

      {/* ── Cierre ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-32 pt-8 md:px-12 lg:px-20">
        <div className="border-t border-paper/10 pt-14">
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

          <p className="mt-6 max-w-lg text-body text-paper/70">
            Escribo el software, entiendo cómo se rompe y conozco el negocio para el que se
            escribe. No son tres carreras sueltas: es la misma, mirada desde tres sitios.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <a
              href="https://www.linkedin.com/in/fleremahiaslenin"
              target="_blank"
              rel="noreferrer"
              className="border-2 px-10 py-4 font-mono text-caption font-bold uppercase transition-colors duration-300 hover:text-ink"
              style={{ borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tinta)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/fleremiasflemin20-maker"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-caption uppercase text-paper/50 underline decoration-paper/20 underline-offset-[6px] transition-colors hover:text-paper"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
