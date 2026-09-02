/**
 * El recorrido de cámara, en coordenadas ESFÉRICAS.
 *
 * Interpolar posiciones cartesianas entre "delante" y "detrás" mete la cámara
 * por dentro de la figura en línea recta. En esféricas —azimut, polar, radio—
 * el mismo tramo describe un arco alrededor, que es lo que uno espera de una
 * órbita. Y el radio se acerca y se aleja sin tocar el ángulo.
 *
 * Convención: theta = azimut (0 = de frente), phi = polar (PI/2 = a la altura
 * de los ojos, menor = cámara por encima).
 *
 * Los `at` coinciden con los límites de capítulo del DOM. Con SEIS capítulos
 * hay cinco tramos, uno cada 1/5 de progreso: así el movimiento que acompaña a
 * un texto empieza cuando ese texto empieza y no a mitad.
 *
 * El disparador cubre solo los capítulos, no el expediente ni el cierre. Si
 * abarcara la página entera, la órbita terminaría a mitad del expediente y el
 * último capítulo se quedaría sin su plano.
 */
export type Fotograma = {
  at: number
  theta: number
  phi: number
  radio: number
  /** Altura del punto al que mira. La figura mide 1.90 y pisa y=0. */
  miraY: number
  fov: number
  /** Desplazamiento lateral en pantalla, en fracción de media anchura. */
  desvio: number
}

const MEDIA = Math.PI
const VUELTA = Math.PI * 2

// prettier-ignore
export const RECORRIDO: Fotograma[] = [
  // 1 · Plano general. La presentación: quién es y qué hace.
  { at: 0.0000, theta:  0.20, phi: 1.52, radio: 4.30, miraY: 0.95, fov: 32, desvio:  0.26 },
  // 2 · 2019 · Houseman. Se acerca, todavía de frente.
  { at: 0.2000, theta: -0.30, phi: 1.50, radio: 3.40, miraY: 1.05, fov: 31, desvio: -0.30 },
  // 3 · 2021 · Polifuncional. Empieza a rodear.
  { at: 0.4000, theta: -0.20 - MEDIA * 0.45, phi: 1.46, radio: 2.70, miraY: 1.20, fov: 30, desvio:  0.32 },
  // 4 · 2022 · Manager. Primer plano corto, casi de espaldas.
  { at: 0.6000, theta: -0.20 - MEDIA * 0.85, phi: 1.44, radio: 2.05, miraY: 1.32, fov: 29, desvio: -0.26 },
  // 5 · 2024 · Founder. Se abre y sube: el punto de inflexión.
  { at: 0.8000, theta: -0.20 - MEDIA - VUELTA * 0.22, phi: 1.24, radio: 3.10, miraY: 1.22, fov: 31, desvio:  0.24 },
  // 6 · Hoy. Órbita alta, y vuelve al frente: se cierra el círculo.
  { at: 1.0000, theta: -0.20 - MEDIA - VUELTA,        phi: 1.50, radio: 4.80, miraY: 0.98, fov: 34, desvio:  0.28 },
]

/** Smootherstep de Perlin: suaviza la unión entre fotogramas sin frenar de golpe. */
const suave = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const mezcla = (a: number, b: number, t: number) => a + (b - a) * t

export type EstadoCamara = Omit<Fotograma, 'at'>

/** Muestrea el recorrido. Escribe sobre `salida` para no asignar en cada frame. */
export function muestrear(progreso: number, salida: EstadoCamara): EstadoCamara {
  const p = Math.min(1, Math.max(0, progreso))
  let i = 0
  while (i < RECORRIDO.length - 2 && p > RECORRIDO[i + 1].at) i++

  const a = RECORRIDO[i]
  const b = RECORRIDO[i + 1]
  const tramo = b.at - a.at
  const t = suave(tramo > 0 ? Math.min(1, Math.max(0, (p - a.at) / tramo)) : 0)

  salida.theta = mezcla(a.theta, b.theta, t)
  salida.phi = mezcla(a.phi, b.phi, t)
  salida.radio = mezcla(a.radio, b.radio, t)
  salida.miraY = mezcla(a.miraY, b.miraY, t)
  salida.fov = mezcla(a.fov, b.fov, t)
  salida.desvio = mezcla(a.desvio, b.desvio, t)
  return salida
}

export const estadoInicial = (): EstadoCamara =>
  muestrear(0, { theta: 0, phi: 0, radio: 0, miraY: 0, fov: 32, desvio: 0 })
