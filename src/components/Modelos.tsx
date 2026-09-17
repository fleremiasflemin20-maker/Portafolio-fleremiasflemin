import { HERRAMIENTAS, MODELOS, type Marca } from '../lib/modelos'

/**
 * Una fila de logos con su rótulo.
 *
 * Monocromos, con color solo al pasar el puntero: diecisiete colores de marca a
 * la vez son un arcoíris que compite con la paleta de la página; apagados se
 * leen como lo que son, una lista de herramientas.
 */
function Fila({ marcas, compacto }: { marcas: Marca[]; compacto: boolean }) {
  return (
    <ul className={`flex flex-wrap items-center ${compacto ? 'gap-x-5 gap-y-3.5' : 'gap-x-7 gap-y-5'}`}>
      {marcas.map((m) => (
        <li key={m.nombre} className="group flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 transition-colors duration-300"
            style={{ fill: 'currentColor', color: 'rgba(245,244,241,0.45)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = m.color)}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(245,244,241,0.45)')}
            role="img"
            aria-label={m.nombre}
          >
            <title>{m.nombre}</title>
            <path d={m.d} />
          </svg>
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-paper/40 transition-colors duration-300 group-hover:text-paper/80">
            {m.nombre}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Herramientas y modelos, en dos bloques separados.
 *
 * La separación no es cosmética: Copilot y Cursor son editores, Claude y Gemini
 * son modelos. Puestos en una misma fila daban a entender que todo es lo mismo,
 * y a quien entiende del tema eso le resta credibilidad al resto de la página.
 *
 * Cada bloque lleva su frase, y tampoco son relleno: un muro de logos a secas
 * sugiere alianzas o patrocinios que no existen. Diciendo para qué se usan, el
 * mismo muro pasa de «mira con quién trabajo» a «mira con qué trabajo».
 */
export function Modelos({ compacto = false }: { compacto?: boolean }) {
  const ancho = compacto ? 'max-w-md' : 'max-w-2xl'

  return (
    <div className={compacto ? 'space-y-8' : 'space-y-10'}>
      <section>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">
          Herramientas de programación con IA
        </p>
        <p className={`mt-3 text-body text-paper/70 ${ancho}`}>
          Con esto <span className="text-paper">escribo y ejecuto</span> el código. Editores que
          entienden el proyecto entero, y librerías para servir modelos en local o en la nube.
        </p>
        <div className="mt-6">
          <Fila marcas={HERRAMIENTAS} compacto={compacto} />
        </div>
      </section>

      <section>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">
          Modelos de IA
        </p>
        <p className={`mt-3 text-body text-paper/70 ${ancho}`}>
          Los que responden al otro lado. Los uso como <span className="text-paper">apoyo</span>:
          agilizan el trabajo y me quitan lo repetitivo. Las decisiones siguen siendo de oficio —
          qué construir, cómo y por qué. La herramienta pone la velocidad.
        </p>
        <div className="mt-6">
          <Fila marcas={MODELOS} compacto={compacto} />
        </div>
      </section>

      {/* Se dice en voz alta en vez de dejar el hueco: quien conoce el sector
          nota la ausencia, y explicarla vale más que fingir que no está. */}
      <p className="font-mono text-[0.62rem] leading-relaxed text-paper/25">
        Faltan algunos logos —OpenAI, xAI y Stable Diffusion entre ellos— porque sus marcas no se
        publican en el paquete de iconos libres que usa esta página.
      </p>
    </div>
  )
}
