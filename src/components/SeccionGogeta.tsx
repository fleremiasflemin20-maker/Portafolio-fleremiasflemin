const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const galeria = (archivo: string) => `${BASE}/galeria/${archivo}`

const VIVO = 'https://fleremiasflemin20-maker.github.io/gogeta-ssj4-scrollytelling/'
const CODIGO = 'https://github.com/fleremiasflemin20-maker/gogeta-ssj4-scrollytelling'

const ETAPAS: { archivo: string; nombre: string; dato: string }[] = [
  { archivo: 'gogeta-etapa-1-malla.png', nombre: 'La malla', dato: '500K → 150K tris' },
  { archivo: 'gogeta-etapa-2-volumen.png', nombre: 'El volumen', dato: 'Normales 2048²' },
  { archivo: 'gogeta-etapa-3-color.png', nombre: 'El color', dato: 'Difuso 4096²' },
  { archivo: 'gogeta-etapa-4-escena.png', nombre: 'La escena', dato: '52 MB → 692 KB' },
]

/**
 * Sección propia para Gogeta SSJ4, aparte de su ficha en el Expediente.
 *
 * El Expediente cuenta "qué es" en tres líneas, como cualquier otro proyecto;
 * esto cuenta "cómo se hizo", con las cuatro capas del proceso a la vista —
 * mismo argumento que el panel en vivo del sitio original: la malla que hay
 * debajo no se describe, se enseña.
 *
 * Va fija, no filtrada por faceta: es la pieza más trabajada del cajón de 3D
 * y no tiene sentido que desaparezca al girar la rueda a Software o Hotel
 * Tech — por eso vive suelta en `App.tsx` y no dentro de `Expediente.tsx`.
 */
export function SeccionGogeta() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="border border-paper/10 bg-ink/60 p-6 backdrop-blur-sm md:p-10">
        <p className="font-mono text-caption uppercase" style={{ color: 'var(--tinta)' }}>
          Proyecto destacado · 3D
        </p>
        <h2 className="mt-3 font-display text-headline uppercase leading-none">Gogeta SSJ4</h2>

        <p className="mt-5 max-w-2xl text-body text-paper/70">
          Una figura escaneada con el móvil, convertida en modelo 3D con materiales PBR y montada en una
          página que se recorre con el scroll: un solo viaje de cámara —plano general, primer plano y órbita
          de 360°— sin cortes entre secciones. Se puede arrastrar la figura para desviar la cámara, y hay un
          interruptor para verla en sombreado de anime o en render realista sobre el mismo modelo.
        </p>

        <div className="mt-8 overflow-hidden border border-paper/10">
          <img
            src={galeria('gogeta-ssj4-preview.png')}
            alt="Vista previa del sitio de Gogeta SSJ4"
            loading="lazy"
            className="w-full"
          />
        </div>

        <div className="mt-10">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">
            Cómo se hizo — cuatro capas, un mismo escaneo
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {ETAPAS.map((e, i) => (
              <figure key={e.archivo} className="border border-paper/10 bg-ink/40 p-3">
                <div className="aspect-square w-full overflow-hidden bg-ink">
                  <img
                    src={galeria(e.archivo)}
                    alt={e.nombre}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="mt-2">
                  <span className="block font-mono text-[0.6rem] text-paper/35">0{i + 1}</span>
                  <span className="mt-0.5 block text-caption uppercase text-paper/75">{e.nombre}</span>
                  <span className="mt-0.5 block font-mono text-[0.65rem]" style={{ color: 'var(--tinta)' }}>
                    {e.dato}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
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
            Abrir sitio ↗
          </a>
          <a
            href={CODIGO}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-caption uppercase text-paper/55 underline decoration-paper/20 underline-offset-[6px] transition-colors duration-200 hover:text-paper hover:decoration-current"
          >
            Código
          </a>
        </div>

        <p className="mt-8 max-w-2xl font-mono text-[0.65rem] leading-relaxed text-paper/30">
          Dragon Ball es propiedad de Akira Toriyama, Shueisha y Toei Animation. Pieza de estudio sin fines
          comerciales, hecha por afición: el código es propio, el personaje no.
        </p>
      </div>
    </section>
  )
}
