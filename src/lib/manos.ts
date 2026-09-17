/*
 * El WASM y el modelo se piden a una CDN y no van en el repositorio.
 *
 * Son 11 MB de WASM y 7.5 MB de modelo. Meterlos en el repo multiplicaría por
 * seis lo que pesa clonarlo, y todo eso solo lo necesita quien encienda una
 * cámara. Versión clavada a propósito: `@latest` en una CDN es una
 * dependencia que cambia sola. Un solo sitio: lo usan tanto `ControlManos`
 * como `FiguraFlotante`, y las dos cámaras tienen que pedir siempre el mismo
 * modelo.
 */
export const RUTA_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
export const RUTA_MODELO_MANO =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/**
 * Control por gestos: estado compartido y la aritmética de los gestos.
 *
 * Objeto mutable, igual que `scroll` o `golpes`: lo escribe el bucle de
 * detección (unas 24 veces por segundo) y lo lee `useFrame`. Si fuera estado de
 * React, cada frame de la cámara repintaría el árbol entero.
 */
export const manos = {
  /** Multiplicador del radio de cámara. 1 = el encuadre que manda el guion. */
  zoom: 1,
}

/** Un punto del esqueleto de la mano, en coordenadas de imagen (0..1). */
export type Punto = { x: number; y: number; z: number }

/*
 * Índices de MediaPipe que se usan aquí. Los 21 puntos van de la muñeca (0) a
 * la punta del meñique (20); estos son los únicos que hacen falta.
 */
const MUNECA = 0
const PULGAR = 4
const PULGAR_IP = 3
const INDICE = 8
const NUDILLO_MEDIO = 9
/** Punta y nudillo medio de índice, corazón, anular y meñique. */
const DEDOS: [number, number][] = [
  [8, 6],
  [12, 10],
  [16, 14],
  [20, 18],
]

const dist = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Tamaño aparente de la mano, para que todo lo demás no dependa de lo cerca
 * que esté de la cámara. Muñeca → nudillo del corazón: es el segmento más
 * estable de la mano, no cambia al abrir o cerrar los dedos.
 */
const escala = (p: Punto[]) => Math.max(1e-3, dist(p[MUNECA], p[NUDILLO_MEDIO]))

/**
 * ¿Puño cerrado?
 *
 * Cada punta de dedo más cerca de la muñeca que su propio nudillo medio. Se
 * exige en tres de los cuatro dedos y no en los cuatro: el meñique se queda
 * medio estirado en mucha gente y con el criterio estricto el puño no se
 * detecta nunca.
 */
export function esPuno(p: Punto[]): boolean {
  let cerrados = 0
  for (const [punta, nudillo] of DEDOS) {
    if (dist(p[punta], p[MUNECA]) < dist(p[nudillo], p[MUNECA])) cerrados++
  }
  return cerrados >= 3
}

/**
 * ¿Un dedo señalando?
 *
 * Índice estirado —más lejos de la muñeca que su propio nudillo, el mismo
 * criterio que `esPuno` pero al revés— y al menos dos de los otros tres
 * doblados. Con los tres exigidos el gesto no se detectaba en manos donde el
 * meñique no dobla del todo, igual que en `esPuno`.
 *
 * El pulgar queda fuera a propósito: tiene que poder moverse libre para
 * juntarse con el índice y disparar el clic sin deshacer el gesto.
 */
export function unDedo(p: Punto[]): boolean {
  const indiceEstirado = dist(p[INDICE], p[MUNECA]) > dist(p[6], p[MUNECA])
  if (!indiceEstirado) return false
  let doblados = 0
  for (const [punta, nudillo] of DEDOS.slice(1)) {
    if (dist(p[punta], p[MUNECA]) < dist(p[nudillo], p[MUNECA])) doblados++
  }
  return doblados >= 2
}

/** La punta del índice: dónde apunta el gesto de un dedo. */
export function puntaIndice(p: Punto[]): Punto {
  return p[INDICE]
}

/**
 * Cuántos dedos están estirados, de 0 a 5.
 *
 * Mismo criterio que `esPuno`/`unDedo` —cada punta más lejos de la muñeca
 * que su propia articulación media cuenta como estirado—, pero contando los
 * cinco en vez de exigir un número fijo. La usa `FiguraFlotante` para elegir
 * figura por número: sacar N dedos selecciona la N-ésima directamente, sin
 * tener que recorrerlas una a una.
 */
export function contarDedos(p: Punto[]): number {
  let n = dist(p[PULGAR], p[MUNECA]) > dist(p[PULGAR_IP], p[MUNECA]) ? 1 : 0
  for (const [punta, nudillo] of DEDOS) {
    if (dist(p[punta], p[MUNECA]) > dist(p[nudillo], p[MUNECA])) n++
  }
  return n
}

/**
 * ¿Escuadra de pulgar e índice — la esquina de un marco de foto?
 *
 * Pulgar e índice estirados —cada uno más lejos de la muñeca que su propia
 * articulación media, el mismo criterio de `esPuno`/`unDedo`— y los otros
 * tres dedos doblados en mayoría. No basta con eso solo: una pinza cerrada
 * también estira ambos dedos, así que se exige además que formen una esquina
 * franca y no una V cerrada — el ángulo pulgar–muñeca–índice por encima de
 * 35°, lo justo para descartar el pellizco sin exigir un ángulo recto exacto
 * que casi nadie hace con precisión.
 */
export function esEscuadra(p: Punto[]): boolean {
  const pulgarEstirado = dist(p[PULGAR], p[MUNECA]) > dist(p[PULGAR_IP], p[MUNECA])
  if (!pulgarEstirado) return false
  const indiceEstirado = dist(p[INDICE], p[MUNECA]) > dist(p[6], p[MUNECA])
  if (!indiceEstirado) return false
  let doblados = 0
  for (const [punta, nudillo] of DEDOS.slice(1)) {
    if (dist(p[punta], p[MUNECA]) < dist(p[nudillo], p[MUNECA])) doblados++
  }
  if (doblados < 2) return false
  const v1 = { x: p[PULGAR].x - p[MUNECA].x, y: p[PULGAR].y - p[MUNECA].y }
  const v2 = { x: p[INDICE].x - p[MUNECA].x, y: p[INDICE].y - p[MUNECA].y }
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1e-6)
  return Math.acos(recorta(cos, -1, 1)) > (35 * Math.PI) / 180
}

/**
 * ¿Marco de foto con las dos manos?
 *
 * Las dos en escuadra (ver `esEscuadra`) y separadas más de dos manos de
 * ancho: el hueco es lo que distingue el gesto de encuadrar de cualquier
 * otro momento en que las dos manos, por casualidad, estén en escuadra cerca
 * la una de la otra.
 */
export function esMarco(izquierda: Punto[], derecha: Punto[]): boolean {
  if (!esEscuadra(izquierda) || !esEscuadra(derecha)) return false
  const c1 = centro(izquierda)
  const c2 = centro(derecha)
  const anchoMano = (escala(izquierda) + escala(derecha)) / 2
  return Math.hypot(c1.x - c2.x, c1.y - c2.y) > anchoMano * 2.2
}

/**
 * Apertura de la pinza pulgar–índice, normalizada por el tamaño de la mano.
 *
 * Sale más o menos entre 0.25 con los dedos juntos y 1.2 bien abiertos. Es el
 * mismo gesto que el de una pantalla táctil, que es justo lo que hace que no
 * haya que explicarlo.
 */
export function pinza(p: Punto[]): number {
  return dist(p[PULGAR], p[INDICE]) / escala(p)
}

/** Centro de la mano. El nudillo del corazón tiembla mucho menos que la muñeca. */
export function centro(p: Punto[]): { x: number; y: number } {
  return { x: p[NUDILLO_MEDIO].x, y: p[NUDILLO_MEDIO].y }
}

/** Recorta un valor entre dos topes. */
export const recorta = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Cuánto zoom da un cambio de pinza. 0.9 → media unidad de pinza mueve 0.45. */
const SENSIBILIDAD = 0.9

/**
 * Zoom a partir de la pinza, medido contra la pose con la que apareció la mano.
 *
 * Nada de topes absolutos. Cuánto vale una pinza «neutra» depende del tamaño de
 * la mano y de cómo la levante cada uno: midiendo con manos sintéticas, una
 * mano abierta con el pulgar suelto da 1.26, y un tramo fijo pensado para 1.0
 * la dejaba ya en el zoom máximo, sin margen para acercar. Tomando como cero la
 * primera lectura, el gesto sale calibrado solo: separar los dedos acerca,
 * juntarlos aleja, y da igual qué mano sea.
 */
export function zoomDesdePinza(actual: number, referencia: number) {
  return recorta(1 + (referencia - actual) * SENSIBILIDAD, 0.55, 1.6)
}

/**
 * La referencia se recorta antes de guardarla.
 *
 * Es el cero de todo el gesto y se toma de un solo fotograma: si ese fotograma
 * pilla la mano a medio entrar en cuadro —o directamente mal detectada—, el
 * cero queda en un sitio absurdo y el usuario se encuentra pegado a un tope sin
 * saber por qué. Recortándola a lo que una mano puede dar de sí, lo peor que
 * puede pasar es que el gesto empiece descentrado, no roto.
 */
export const referenciaValida = (v: number) => recorta(v, 0.35, 1.45)

/**
 * Palanca con zona muerta.
 *
 * Devuelve -1..1 según cuánto se aleja `v` del centro, y exactamente 0 dentro
 * de la zona muerta. Sin ella la página no para nunca: una mano quieta en el
 * aire oscila lo suficiente como para ir arrastrando el scroll sola.
 */
export function palanca(v: number, centroV: number, muerta: number, tope: number) {
  const d = v - centroV
  const m = Math.abs(d) - muerta
  if (m <= 0) return 0
  return Math.sign(d) * Math.min(1, m / (tope - muerta))
}
