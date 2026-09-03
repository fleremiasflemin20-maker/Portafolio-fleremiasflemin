/**
 * El botón del CV. Maximalista a propósito: relleno sólido desde el primer
 * fotograma y no solo al pasar el ratón, como el `Boton` normal — el CV es
 * la acción que un reclutador busca primero, así que tiene que ganar el
 * pulso visual a "GitHub" y "LinkedIn", no quedar al mismo nivel que ellos.
 *
 * Igual que `Boton`, existe como componente porque aparece dos veces —al
 * presentarse y al despedirse— y dos botones "iguales" copiados a mano
 * acaban divergiendo en cuanto se retoca uno solo.
 */
export function BotonCV({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2.5 border-2 px-9 py-3.5 font-mono text-caption font-bold uppercase tracking-[0.06em] transition-transform duration-200 hover:scale-[1.04]"
      style={{ borderColor: 'var(--tinta)', color: '#0A0A12', background: 'var(--tinta)' }}
    >
      <span aria-hidden>📄</span>
      {children}
    </a>
  )
}
