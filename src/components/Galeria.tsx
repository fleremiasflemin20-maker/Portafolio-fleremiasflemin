import { PROYECTOS } from '../lib/proyectos'

/**
 * La galería: una captura real por proyecto, sin filtrar por faceta.
 *
 * El Expediente se reparte entre las tres facetas y solo muestra la que está
 * activa — es correcto para "quién es este personaje", pero deja fuera una
 * vista de conjunto. Esta sección es esa vista: todo el trabajo, de un
 * vistazo, en la misma rejilla.
 *
 * Solo entran los proyectos con `imagen`. Uno sin pantalla que enseñar (una
 * API) o sin captura tomada todavía se queda fuera antes que ocupar un hueco
 * con un placeholder — el resto del sitio ya dejó claro que aquí no hay nada
 * fingido.
 *
 * Va después del Expediente y antes del cierre a propósito: el cierre es la
 * despedida y los datos de contacto, y tiene que seguir siendo lo último que
 * se lee.
 */
export function Galeria() {
  const lista = PROYECTOS.filter((p) => p.imagen)

  return (
    <section
      id="galeria"
      className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-32 lg:px-20"
    >
      <header className="max-w-2xl">
        <p className="font-mono text-caption uppercase" style={{ color: 'var(--tinta)' }}>
          Galería · capturas reales
        </p>
        <h2 className="mt-3 font-display text-headline uppercase leading-none">Todo el trabajo</h2>
        <p className="mt-4 text-body text-paper/70">
          {lista.length} piezas, cada una con su captura tomada directo del sitio o de la app corriendo — nada
          maquetado a mano.
        </p>
      </header>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p, i) => (
          <a
            key={p.nombre}
            href={p.sitio ?? p.codigo}
            target="_blank"
            rel="noreferrer"
            className="entra group relative block overflow-hidden border border-paper/10 bg-ink/55"
            style={{ animationDelay: `${i * 60}ms` }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--tinta)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
          >
            <div className="aspect-video w-full overflow-hidden bg-ink">
              <img
                src={p.imagen}
                alt={`Captura de ${p.nombre}`}
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              />
            </div>

            {/* Velo permanente abajo, para que el título se lea sobre
                cualquier captura, clara u oscura. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
              style={{ background: 'linear-gradient(to top, #0A0A12F0 0%, #0A0A1299 45%, transparent 100%)' }}
            />

            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-paper/40">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-1 font-display text-lg uppercase leading-none md:text-xl">{p.nombre}</h3>
              <p className="mt-2 text-[0.78rem] text-paper/65">{p.resumen}</p>
            </div>

            {/* La misma barra de acento que el Expediente, para que se lea
                como parte del mismo sistema y no como una sección aparte. */}
            <span
              className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, var(--desde), var(--hasta))' }}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
