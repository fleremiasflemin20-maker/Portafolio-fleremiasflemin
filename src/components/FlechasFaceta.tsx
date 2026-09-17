import { useEffect, useState } from 'react'
import { FACETAS } from '../lib/facetas'

const N = FACETAS.length

/**
 * Las flechas de selector de personaje, a los lados de la pantalla.
 *
 * La rueda de abajo ya cambia de faceta, y las flechas del teclado también
 * —ver `App.tsx`—, pero ninguna de las dos se ve sin buscarla: la rueda es
 * pequeña y discreta a propósito, y el teclado no se anuncia solo. Esto es
 * el mismo salto, con el lenguaje visual de un selector de personaje de
 * videojuego: una flecha a cada lado de la pantalla, siempre a la vista.
 *
 * Van fijas a los bordes y no dentro del flujo de cada capítulo: tienen que
 * poder cambiar de personaje sin importar en qué parte del recorrido esté
 * el visitante, igual que la rueda.
 */
export function FlechasFaceta({
  activa,
  onCambio,
  panelLateral,
}: {
  activa: number
  onCambio: (i: number) => void
  /** Si el panel de herramientas está montado a la derecha — ver `PanelRetro`
      en App.tsx. La flecha derecha tiene que apartarse o queda encima. */
  panelLateral: boolean
}) {
  const anterior = () => onCambio((activa - 1 + N) % N)
  const siguiente = () => onCambio((activa + 1) % N)

  /*
   * El panel de herramientas vive dentro del primer capítulo, no en toda la
   * página: solo estorba mientras ese capítulo está en pantalla, y en el
   * resto del recorrido el hueco a la derecha vuelve a estar libre. Mismo
   * patrón que `carrusel3D.enVista` — un `IntersectionObserver` sobre el
   * propio capítulo, y solo se monta si `panelLateral` dice que el panel
   * puede llegar a existir.
   */
  const [capituloUnoVisible, setCapituloUnoVisible] = useState(false)
  useEffect(() => {
    if (!panelLateral) return
    const capitulo = document.querySelector('.capitulo')
    if (!capitulo) return
    const obs = new IntersectionObserver(([entrada]) => setCapituloUnoVisible(entrada.isIntersecting), {
      threshold: 0.2,
    })
    obs.observe(capitulo)
    return () => obs.disconnect()
  }, [panelLateral])

  const clase =
    'rueda-pulso pointer-events-auto fixed top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-ink/60 backdrop-blur-sm transition-[right,left,background-color] duration-300 hover:bg-ink/85 md:flex'

  return (
    <>
      <button
        type="button"
        onClick={anterior}
        aria-label={`Personaje anterior — ${FACETAS[(activa - 1 + N) % N].nombre}`}
        className={`${clase} left-1 lg:left-3`}
        style={{ borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={siguiente}
        aria-label={`Personaje siguiente — ${FACETAS[(activa + 1) % N].nombre}`}
        /* `right-[23rem]` con el panel a la vista: mide hasta 19rem y empieza
           hasta a 3rem del borde (`right-12` en 2xl) — 23rem de margen lo
           deja siempre despejado, en vez de perseguir sus dos anchos
           posibles con un cálculo más fino. */
        className={`${clase} ${panelLateral && capituloUnoVisible ? 'right-[23rem]' : 'right-1 lg:right-3'}`}
        style={{ borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  )
}
