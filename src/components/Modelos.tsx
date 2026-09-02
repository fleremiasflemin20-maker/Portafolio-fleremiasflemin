import { MODELOS } from '../lib/modelos'

/**
 * El muro de modelos y herramientas de IA.
 *
 * Va con su frase encima, y esa frase no es relleno: un muro de logos a secas
 * sugiere alianzas o patrocinios que no existen. Diciendo para qué se usan, el
 * mismo muro pasa de "mira con quién trabajo" a "mira con qué trabajo", que es
 * lo cierto y además lo que interesa contar.
 *
 * Los logos van monocromos y toman color al pasar el puntero. Diecisiete marcas
 * con su color de marca a la vez son un arcoíris que compite con la paleta de
 * la página; apagados, se leen como una fila de herramientas.
 */
export function Modelos({ compacto = false }: { compacto?: boolean }) {
  return (
    <section className={compacto ? '' : 'w-full'}>
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">
        Herramientas de trabajo
      </p>

      <p className={`mt-3 text-body text-paper/70 ${compacto ? 'max-w-md' : 'max-w-2xl'}`}>
        Uso estas IA como <span className="text-paper">apoyo</span>: agilizan el trabajo y me
        quitan de encima lo repetitivo. Las decisiones siguen siendo de oficio — qué construir,
        cómo y por qué. La herramienta pone la velocidad.
      </p>

      {/*
        `flex-wrap` y no una marquesina animada. Una fila deslizándose sola
        obliga a esperar a que pase el logo que buscas, y aquí el objetivo es
        que se lean todos de un vistazo.
      */}
      <ul className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-5">
        {MODELOS.map((m) => (
          <li key={m.nombre} className="group flex items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 transition-colors duration-300 md:h-[22px] md:w-[22px]"
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

      {/* Se dice en voz alta en vez de dejar el hueco: quien conoce el sector
          nota la ausencia y es mejor explicarla que fingir que no está. */}
      <p className="mt-6 font-mono text-[0.62rem] leading-relaxed text-paper/25">
        Faltan algunos logos —OpenAI entre ellos— porque sus marcas no se
        publican en el paquete de iconos libres que usa esta página.
      </p>
    </section>
  )
}
