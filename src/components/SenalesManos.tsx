/**
 * Señalética del control por gestos: un icono por movimiento, a juego con el
 * texto que ya explica cada uno en `ControlManos`.
 *
 * El texto solo ("sube o baja la mano...") exige leer con calma; un dibujo se
 * entiende de un vistazo. Van juntos —el icono no sustituye la frase, la
 * refuerza— y comparten los mismos dos colores que ya usa el resto del
 * control por gestos: turquesa para la mano derecha, rosa para la izquierda.
 * Así el propio color ya dice qué mano es, antes de leer una palabra.
 */
const DERECHA = '#3BE0D0'
const IZQUIERDA = '#FF3DA6'
/** Ninguna de las dos manos es "la" mano en el gesto del marco: es de las
    dos manos a la vez, así que no le toca ni el turquesa ni el rosa. */
const NEUTRO = '#F5F4F1'

type Props = { className?: string }

/** Mano abierta, flecha arriba y abajo: sube o baja para avanzar o retroceder. */
export function IconoDeslizar({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 14V8.5a1.5 1.5 0 0 1 3 0V13m0-1.5v-3a1.5 1.5 0 0 1 3 0V13m0-.5V13.8a1.5 1.5 0 0 1 3 0V16"
        stroke={DERECHA}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9 16.5v-3a1.5 1.5 0 0 1 3-.2M9 16.5V19c0 3 2.5 5.5 6 5.5s6-2.2 6-5.5v-5.7c0-.9-.7-1.8-1.8-1.8-.7 0-1.2.3-1.7.8"
        stroke={DERECHA}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25 9v6m0-6 2.4 2.6M25 9l-2.4 2.6M25 15l2.4-2.6M25 15l-2.4-2.6" stroke={DERECHA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Puño cerrado: frena el recorrido. */
export function IconoPuno({ className, color = DERECHA }: Props & { color?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="13" width="14" height="11" rx="4" stroke={color} strokeWidth="1.4" />
      <path d="M12.5 13v-2.4a1.4 1.4 0 0 1 2.8 0V13M15.7 13v-3.2a1.4 1.4 0 0 1 2.8 0V13M18.9 13v-2.6a1.4 1.4 0 0 1 2.8 0V13" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 18.5c-1.7-.4-2.6-1.4-2.6-2.7 0-1 .6-1.8 1.6-1.8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Mano centrada, flecha a los lados: mover a un lado cambia de personaje. */
export function IconoLateral({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="11" y="10" width="10" height="13" rx="4.5" stroke={DERECHA} strokeWidth="1.4" />
      <path d="M13.4 10v-1.6a1.3 1.3 0 0 1 2.6 0V10M16 10V8a1.3 1.3 0 0 1 2.6 0v2M18.6 10.2V9a1.3 1.3 0 0 1 2.6 0v1.6" stroke={DERECHA} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 16.5h5.5m0 0-2.3-2.3m2.3 2.3-2.3 2.3" stroke={DERECHA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 16.5h-5.5m0 0 2.3-2.3m-2.3 2.3 2.3 2.3" stroke={DERECHA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Pulgar e índice separándose o juntándose: acerca o aleja la cámara. */
export function IconoPellizco({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M10 22c-2.4-1.6-3.6-4-3.6-6.6 0-3.6 2.2-6.6 5.4-8" stroke={IZQUIERDA} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="1.7" fill={IZQUIERDA} />
      <path d="M22 22c2.4-1.6 3.6-4 3.6-6.6 0-3.6-2.2-6.6-5.4-8" stroke={IZQUIERDA} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="19.5" cy="12.5" r="1.7" fill={IZQUIERDA} />
      <path d="M9 5.5 6.8 3.3M9 5.5l-3 .3M9 5.5l.3-3" stroke={IZQUIERDA} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M23 5.5 25.2 3.3M23 5.5l3 .3M23 5.5l-.3-3" stroke={IZQUIERDA} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/** Solo el índice estirado, con un anillo: aparece el cursor. */
export function IconoDedo({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M15.3 24.5h4.4c2.6 0 4.3-1.8 4.3-4.3v-5c0-.9-.7-1.6-1.6-1.6-.9 0-1.6.7-1.6 1.6v-1.4"
        stroke={DERECHA}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20.8 13.8V7.4a1.6 1.6 0 0 0-3.2 0v6" stroke={DERECHA} strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M15.3 24.5c-2.7-.3-3.9-1.8-4.6-3.6L9 17.3c-.4-1 0-1.9.8-2.3.8-.4 1.7 0 2.2.9l1.6 2.7v-8a1.6 1.6 0 0 1 3.2 0v6.7"
        stroke={DERECHA}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="8" r="4" stroke={DERECHA} strokeWidth="1.3" strokeDasharray="2.2 2.2" />
    </svg>
  )
}

/** Dos escuadras de pulgar e índice, una por mano, abriendo un hueco entre
    ellas: el marco de foto que alterna blanco y negro. */
export function IconoMarco({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Escuadra izquierda: pulgar hacia abajo, índice hacia la derecha. */}
      <path d="M6 8v9" stroke={NEUTRO} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 8h9" stroke={NEUTRO} strokeWidth="1.5" strokeLinecap="round" />
      {/* Escuadra derecha: pulgar hacia arriba, índice hacia la izquierda —
          la misma esquina, girada 180°, mirando a la de la izquierda. */}
      <path d="M26 24v-9" stroke={NEUTRO} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 24h-9" stroke={NEUTRO} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="6" y="8" width="20" height="16" rx="1" stroke={NEUTRO} strokeWidth="1" strokeDasharray="1.6 2.2" opacity="0.5" />
    </svg>
  )
}
