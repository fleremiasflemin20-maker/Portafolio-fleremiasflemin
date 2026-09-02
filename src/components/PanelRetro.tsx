import { HERRAMIENTAS, MODELOS, type Marca } from '../lib/modelos'

/**
 * Una casilla, con el aire de un menú de consola de los ochenta.
 *
 * Borde de dos píxeles en neón, relleno casi negro y líneas de barrido encima.
 * Las líneas son un degradado repetido de dos píxeles: es lo que convierte un
 * rectángulo limpio en algo que parece visto en un tubo de rayos catódicos, y
 * cuesta cero — ni imagen ni lienzo.
 */
function Casilla({ marca, tono }: { marca: Marca; tono: string }) {
  return (
    <li
      className="group relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden border-2 bg-ink/75 backdrop-blur-sm transition-all duration-300"
      style={{
        borderColor: `${tono}66`,
        /* Esquina cortada arriba a la derecha: es el bisel de las cajas de los
           menús de consola de los ochenta, y basta él para que un rectángulo
           deje de parecer un div y empiece a parecer una casilla de inventario. */
        clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 0 100%)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tono
        e.currentTarget.style.boxShadow = `inset 0 0 18px ${tono}33`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${tono}66`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Líneas de barrido. `pointer-events-none` o se comerían el hover. */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 transition-colors duration-300"
        style={{ fill: 'currentColor', color: 'rgba(245,244,241,0.78)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = marca.color)}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(245,244,241,0.78)')}
        role="img"
        aria-label={marca.nombre}
      >
        <title>{marca.nombre}</title>
        <path d={marca.d} />
      </svg>

      <span className="px-1 text-center font-mono text-[0.55rem] uppercase leading-tight tracking-[0.08em] text-paper/60 transition-colors duration-300 group-hover:text-paper/85">
        {marca.nombre}
      </span>
    </li>
  )
}

/**
 * Panel lateral con las herramientas y los modelos, en casillas.
 *
 * Va en el hueco que queda a la derecha de la figura —medido: 397 px en una
 * pantalla de 1920—, que es el único sitio de la primera pantalla donde no
 * estorba ni al texto ni al personaje.
 *
 * Solo en pantallas anchas. Por debajo de `lg` ese hueco no existe: la figura
 * ocupa el ancho y el panel se comería la escena. Ahí la misma información se
 * sirve en fila dentro del texto (ver `Modelos`).
 *
 * Dos tonos, uno por grupo: el cian para lo que ejecuta código y el magenta
 * para los modelos. Es el par de neones de Vice City, y de paso hace que los
 * dos bloques se distingan de un vistazo sin leer los rótulos.
 */
export function PanelRetro() {
  return (
    <aside
      /*
        Dos anchos. Entre 1280 y 1536 la franja libre da para tres columnas;
        por encima, para cuatro. Quién decide si el panel se monta —y cuándo
        cede el paso al bloque en línea— está en `App`, no aquí.
      */
      className="pointer-events-auto w-[14.5rem] 2xl:w-[19rem]"
      aria-label="Herramientas y modelos"
    >
      <div>
        <p
          className="font-mono text-[0.6rem] uppercase tracking-[0.22em]"
          style={{ color: '#3BE0D0', textShadow: '0 0 12px #3BE0D080' }}
        >
          ▍Herramientas · IA
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-1.5 2xl:grid-cols-4">
          {HERRAMIENTAS.map((m) => (
            <Casilla key={m.nombre} marca={m} tono="#3BE0D0" />
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <p
          className="font-mono text-[0.6rem] uppercase tracking-[0.22em]"
          style={{ color: '#FF3DA6', textShadow: '0 0 12px #FF3DA680' }}
        >
          ▍Modelos de IA
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-1.5 2xl:grid-cols-4">
          {MODELOS.map((m) => (
            <Casilla key={m.nombre} marca={m} tono="#FF3DA6" />
          ))}
        </ul>
      </div>

      <p className="mt-4 font-mono text-[0.55rem] leading-relaxed text-paper/40">
        Apoyo, no sustituto: agilizan el trabajo. Las decisiones siguen siendo de oficio.
      </p>
    </aside>
  )
}
