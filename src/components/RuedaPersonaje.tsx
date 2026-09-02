import { useEffect, useRef, useState } from 'react'
import { FACETAS } from '../lib/facetas'

const N = FACETAS.length
const PASO = 360 / N

/** Radios del anillo, en unidades del viewBox (que va de -100 a 100). */
const R_EXT = 92
const R_INT = 60

/** Hueco entre sectores, en grados. Sin él el anillo se lee como una tarta. */
const HUECO = 4

const rad = (g: number) => ((g - 90) * Math.PI) / 180

/** Sector de corona circular: dos arcos y dos radios. */
function sector(desde: number, hasta: number) {
  const a0 = rad(desde + HUECO / 2)
  const a1 = rad(hasta - HUECO / 2)
  const largo = hasta - desde > 180 ? 1 : 0
  const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`
  return [
    `M ${p(R_EXT, a0)}`,
    `A ${R_EXT} ${R_EXT} 0 ${largo} 1 ${p(R_EXT, a1)}`,
    `L ${p(R_INT, a1)}`,
    `A ${R_INT} ${R_INT} 0 ${largo} 0 ${p(R_INT, a0)}`,
    'Z',
  ].join(' ')
}

/**
 * La rueda de selección de personaje.
 *
 * En GTA V mantienes el stick hacia un lado y el juego cambia de protagonista.
 * Con ratón el equivalente honesto no es arrastrar —nadie lo descubriría— sino
 * pulsar el sector: la rueda gira hasta poner esa faceta arriba, y el resto de
 * la página cambia con ella.
 *
 * Va en SVG y no en WebGL a propósito. Gira bajo control del usuario, que es el
 * criterio para sacar Three.js, pero el giro es de un anillo plano: en SVG sale
 * nítido a cualquier resolución, pesa unos kilobytes y funciona aunque el WebGL
 * falle.
 *
 * Los sectores son `<button>` de verdad, no `<path>` con onClick. Eso da foco,
 * navegación por teclado y lectura por voz sin escribir una línea de más.
 */
export function RuedaPersonaje({
  activa,
  onCambio,
}: {
  activa: number
  onCambio: (i: number) => void
}) {
  /*
   * Giro acumulado, en grados. No se normaliza a 0–360 a propósito.
   *
   * Guardar el ángulo acumulado es lo que evita que al pasar de la última
   * faceta a la primera la rueda dé la vuelta entera hacia atrás: se calcula la
   * diferencia, se lleva al rango [-180, 180] y se suma, así siempre gira por
   * donde menos camino hay.
   *
   * El `+ 0.5` pone el sector elegido ARRIBA del todo, que es donde el ojo lo
   * busca. Rotando por el índice a secas queda de lado y la rueda parece
   * descuadrada.
   */
  const giro = useRef(0)
  const [angulo, setAngulo] = useState(-PASO / 2)

  useEffect(() => {
    const objetivo = -(activa + 0.5) * PASO
    const delta = (((objetivo - giro.current) % 360) + 540) % 360 - 180
    giro.current += delta
    setAngulo(giro.current)
  }, [activa])

  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible" aria-hidden="false">
      <title>Selector de faceta profesional</title>

      <g
        style={{
          transform: `rotate(${angulo}deg)`,
          /*
           * `fill-box`, no `view-box`.
           *
           * Con `view-box` el navegador resuelve el 50% desde la ESQUINA del
           * viewBox, no desde su centro, y el anillo acababa dibujado 251 px por
           * debajo de donde toca — medido, no estimado. `fill-box` usa la caja
           * de la propia figura, cuyo centro es exactamente el eje del anillo.
           */
          transformBox: 'fill-box',
          transformOrigin: '50% 50%',
          transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="rueda-anillo"
      >
        {FACETAS.map((f, i) => {
          const esta = i === activa
          return (
            <g key={f.id}>
              <defs>
                <linearGradient id={`grad-${f.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={f.desde} />
                  <stop offset="100%" stopColor={f.hasta} />
                </linearGradient>
              </defs>

              <path
                d={sector(i * PASO, (i + 1) * PASO)}
                fill={esta ? `url(#grad-${f.id})` : '#17171C'}
                stroke={esta ? f.tinta : '#FFFFFF14'}
                strokeWidth={esta ? 1.2 : 0.8}
                className="transition-[fill,stroke] duration-500"
                style={esta ? { filter: `drop-shadow(0 0 10px ${f.desde}88)` } : undefined}
              />

              {/*
                La etiqueta se contragira lo mismo que el anillo, para que el
                texto siga leyéndose en horizontal mientras la rueda gira. Sin
                esto las palabras acaban boca abajo.
              */}
              <g transform={`rotate(${i * PASO + PASO / 2}) translate(0 -${(R_EXT + R_INT) / 2})`}>
                {/*
                  Contragiro doble: su sitio en la corona MÁS el giro actual del
                  anillo, para que el texto se lea siempre en horizontal.

                  Va como transformación CSS con LA MISMA transición que el
                  anillo, no como atributo SVG. Con el atributo, el contragiro
                  salta al valor final de golpe mientras el anillo tarda 0,7 s en
                  llegar: durante todo ese rato las palabras se ven torcidas.
                  Compartiendo duración y curva, las dos van sincronizadas.
                */}
                <g
                  style={{
                    transform: `rotate(${-(i * PASO + PASO / 2) - angulo}deg)`,
                    transformBox: 'fill-box',
                    transformOrigin: '50% 50%',
                    transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="rueda-anillo"
                >
                  <text
                    textAnchor="middle"
                    dy="4"
                    className="font-mono"
                    style={{
                      fontSize: 8,
                      letterSpacing: '0.18em',
                      fill: esta ? '#0A0A0B' : '#FFFFFF66',
                      fontWeight: 700,
                    }}
                  >
                    {f.clave}
                  </text>
                </g>
              </g>
            </g>
          )
        })}
      </g>

      {/* Los botones van fuera del grupo que gira: si giraran, el área
          pulsable se movería y habría que perseguirla con el ratón. */}
      {FACETAS.map((f, i) => (
        <path
          key={`hit-${f.id}`}
          d={sector(i * PASO, (i + 1) * PASO)}
          fill="transparent"
          role="button"
          tabIndex={0}
          aria-label={`${f.nombre} — ${f.papel}`}
          aria-pressed={i === activa}
          className="cursor-pointer outline-none focus-visible:fill-white/10"
          transform={`rotate(${-(activa + 0.5) * PASO})`}
          onClick={() => onCambio(i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCambio(i) }
            if (e.key === 'ArrowRight') onCambio((activa + 1) % N)
            if (e.key === 'ArrowLeft') onCambio((activa - 1 + N) % N)
          }}
        />
      ))}
    </svg>
  )
}
