/**
 * Aviso de golpe: alguien ha pulsado sobre la figura, y aquí está el punto de
 * la pantalla donde hay que dibujarlo.
 *
 * Va como registro de un solo suscriptor y no como estado de React porque el
 * emisor vive dentro del lienzo 3D y el dibujante en el DOM: pasarlo por React
 * obligaría a subir el estado hasta el ancestro común y a repintar la escena
 * entera en cada golpe.
 */
type Golpe = (x: number, y: number) => void

let escucha: Golpe | null = null

/** Registra quién dibuja. `null` para desengancharse al desmontar. */
export function alGolpear(fn: Golpe | null) {
  escucha = fn
}

export function golpear(x: number, y: number) {
  escucha?.(x, y)
}
