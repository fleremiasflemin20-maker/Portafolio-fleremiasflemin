import { PROYECTOS } from '../lib/proyectos'
import type { Faceta } from '../lib/facetas'
import { Habilidades } from './Habilidades'

/**
 * El expediente: los proyectos de la faceta elegida.
 *
 * La rejilla nace de las pantallas de carga de GTA, que son un collage de
 * paneles con un personaje en cada uno. Aquí cada panel es un proyecto, y el
 * collage se rehace entero al girar la rueda — que es lo que hace que el
 * selector no sea un adorno del hero: **filtra la página**.
 *
 * Las tarjetas se numeran como fichas de expediente. Es lenguaje de videojuego
 * y a la vez resuelve algo real: da una referencia corta para hablar de una
 * pieza sin repetir el nombre entero.
 */
export function Expediente({ faceta }: { faceta: Faceta }) {
  const lista = PROYECTOS.filter((p) => p.faceta === faceta.id)

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-caption uppercase" style={{ color: 'var(--tinta)' }}>
            Expediente · {faceta.clave}
          </p>
          <h2 className="mt-3 font-display text-headline uppercase leading-none">
            {faceta.nombre}
          </h2>
        </div>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-paper/40">
          {lista.length} {lista.length === 1 ? 'pieza' : 'piezas'}
        </p>
      </header>

      {/* Las barras van antes de la rejilla: primero quién es este personaje,
          después lo que ha hecho. */}
      <div className="mt-12">
        <Habilidades faceta={faceta} />
      </div>

      {/*
        `key` en la faceta: al cambiarla, React remonta la rejilla entera y la
        animación de entrada se dispara sola. Sin eso, las tarjetas cambian de
        texto en su sitio y el cambio se pierde de vista.
      */}
      <div key={faceta.id} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p, i) => (
          <article
            key={p.nombre}
            className="entra group relative overflow-hidden border border-paper/10 bg-ink/55 p-6 backdrop-blur-sm transition-colors duration-300"
            style={{ animationDelay: `${i * 70}ms`, borderColor: undefined }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--tinta)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
          >
            {/* La barra de color es lo único que cambia de tono con la faceta:
                con la tarjeta entera teñida, seis juntas se vuelven ilegibles. */}
            <span
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, var(--desde), var(--hasta))' }}
            />

            <p className="font-mono text-[0.62rem] tracking-[0.2em] text-paper/30">
              {String(i + 1).padStart(2, '0')}
            </p>

            <h3 className="mt-3 font-display text-xl uppercase leading-none md:text-2xl">
              {p.nombre}
            </h3>

            <p className="mt-3 text-body text-paper/70">{p.resumen}</p>

            <p className="mt-3 font-mono text-[0.72rem] leading-relaxed" style={{ color: 'var(--tinta)' }}>
              {p.nota}
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.16em]">
              {p.sitio && (
                <a
                  href={p.sitio}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-paper/25 underline-offset-4 transition-colors hover:decoration-current"
                  style={{ color: 'var(--tinta)' }}
                >
                  Ver sitio ↗
                </a>
              )}
              <a
                href={p.codigo}
                target="_blank"
                rel="noreferrer"
                className="text-paper/45 underline decoration-paper/15 underline-offset-4 transition-colors hover:text-paper"
              >
                Código
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
