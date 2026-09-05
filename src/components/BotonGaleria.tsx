/**
 * El botón que salta directo a "Todo el trabajo" (la Galería), desde el hero.
 *
 * Es un `<button>` y no un `<a href="#galeria">` a propósito: con Lenis
 * gobernando el scroll, un salto de ancla normal del navegador y el scroll
 * suave se pisan — el navegador coloca la página de golpe y Lenis, que no se
 * enteró, sigue creyendo que sigue donde estaba. Pedirle el desplazamiento a
 * Lenis directamente es lo que deja la animación intacta.
 *
 * El texto lleva la clave de la faceta activa (DEV, PMS, 3D) porque el botón
 * vive en el primer capítulo, que cambia con la rueda de personaje — decir
 * "todo el trabajo" a secas no avisa de que la Galería no filtra por faceta
 * y enseña las piezas de las tres.
 */
export function BotonGaleria({ clave }: { clave: string }) {
  const saltar = () => {
    const destino = document.getElementById('galeria')
    if (!destino) return
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: Element, o?: object) => void } }).__lenis
    if (lenis) lenis.scrollTo(destino, { offset: -32 })
    else destino.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <button
      type="button"
      onClick={saltar}
      className="inline-flex items-center gap-2 font-mono text-caption uppercase text-paper/55 underline decoration-paper/20 underline-offset-[6px] transition-colors duration-200 hover:text-paper hover:decoration-current"
    >
      Ver todo el trabajo
      <span style={{ color: 'var(--tinta)' }}>· {clave}</span>
      <span aria-hidden>↓</span>
    </button>
  )
}
