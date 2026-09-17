/**
 * Botón de enlace externo.
 *
 * Existe como componente y no como clases sueltas repetidas porque aparece en
 * los dos extremos de la página — al presentarse y al despedirse — y dos
 * botones que deberían ser iguales acaban divergiendo en cuanto uno se retoca.
 *
 * El color sale de `--tinta`, así que cambia con la faceta como todo lo demás.
 * El relleno al pasar el puntero se pone por JavaScript y no con `hover:` de
 * Tailwind porque el valor es una variable CSS, y Tailwind necesita clases
 * conocidas en tiempo de compilación.
 */
export function Boton({
  href,
  children,
  secundario = false,
}: {
  href: string
  children: React.ReactNode
  secundario?: boolean
}) {
  if (secundario) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-caption uppercase text-paper/55 underline decoration-paper/20 underline-offset-[6px] transition-colors duration-200 hover:text-paper hover:decoration-current"
      >
        {children}
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-block border-2 px-9 py-3.5 font-mono text-caption font-bold uppercase transition-colors duration-300 hover:text-ink"
      style={{ borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tinta)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </a>
  )
}
