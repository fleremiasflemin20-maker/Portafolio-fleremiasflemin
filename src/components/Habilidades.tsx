import { useEffect, useRef, useState } from 'react'
import type { Faceta } from '../lib/facetas'

/**
 * Las barras de habilidad, como las de un personaje de videojuego.
 *
 * En GTA V cada protagonista tiene sus barras y cada uno destaca en lo suyo;
 * aquí es literal, porque los porcentajes son los del CV. Que sean datos reales
 * es lo que evita que el recurso quede como disfraz: una barra inventada se
 * nota, y hunde la credibilidad de todo lo que la rodea.
 *
 * Se rellenan desde cero al entrar en pantalla y cada vez que cambia la faceta.
 * Una barra que ya aparece llena es un gráfico; llenándose, es una estadística
 * de personaje.
 */
export function Habilidades({ faceta }: { faceta: Faceta }) {
  const caja = useRef<HTMLDivElement>(null)
  const [dentro, setDentro] = useState(false)

  /*
   * `IntersectionObserver` y no un ScrollTrigger más: esto solo necesita saber
   * si el bloque está a la vista, no seguir el scroll. Añadir otro disparador a
   * la línea de tiempo sería pagar por precisión que aquí no hace falta.
   */
  useEffect(() => {
    const el = caja.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setDentro(true),
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Al cambiar de faceta vuelven a cero para volver a llenarse: si se quedaran
  // llenas, el cambio de personaje no se notaría aquí.
  useEffect(() => {
    setDentro(false)
    const t = setTimeout(() => setDentro(true), 60)
    return () => clearTimeout(t)
  }, [faceta.id])

  return (
    <div
      ref={caja}
      // Panel con fondo, igual que las tarjetas: sin él las barras finas caen
      // sobre la ciudad y las ventanas encendidas del fondo se confunden con
      // el relleno.
      className="w-full max-w-md border border-paper/10 bg-ink/60 p-6 backdrop-blur-sm"
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">
        Habilidades · {faceta.clave}
      </p>

      <dl className="mt-5 space-y-3.5">
        {faceta.habilidades.map((h, i) => (
          <div key={h.nombre}>
            <div className="flex items-baseline justify-between gap-4 font-mono text-[0.72rem]">
              <dt className="text-paper/75">{h.nombre}</dt>
              <dd style={{ color: 'var(--tinta)' }}>{h.nivel}%</dd>
            </div>

            {/* Pista y relleno. El `transition` va en la anchura y no en un
                `transform`, porque escalar deformaría el borde derecho de la
                barra en vez de moverlo. */}
            <div className="mt-1.5 h-[3px] w-full bg-paper/12">
              <div
                className="h-full"
                style={{
                  width: dentro ? `${h.nivel}%` : '0%',
                  background: 'linear-gradient(90deg, var(--desde), var(--hasta))',
                  boxShadow: '0 0 8px color-mix(in oklab, var(--tinta) 60%, transparent)',
                  transition: `width 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 90}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </dl>

      {faceta.habilidades.length < 3 && (
        // Se dice en voz alta en vez de rellenar con cifras inventadas: el CV
        // solo lista dos competencias hoteleras con porcentaje.
        <p className="mt-5 font-mono text-[0.62rem] leading-relaxed text-paper/30">
          El CV solo cuantifica dos competencias en este ámbito. El resto de la
          trayectoria hotelera está en las misiones, no en porcentajes.
        </p>
      )}
    </div>
  )
}
