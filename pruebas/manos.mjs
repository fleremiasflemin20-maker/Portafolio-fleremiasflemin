/*
 * Los gestos, comprobados con manos sintéticas.
 *
 * Aquí no hay cámara ni manos de verdad, y esa es justo la razón de que esto
 * exista: la aritmética de los gestos es la parte que más fácil se equivoca y
 * la más cara de probar a mano —hay que levantarse, encender la webcam y
 * repetir el gesto veinte veces—. Con puntos inventados se comprueba en un
 * segundo, y ya ha servido para cazar dos errores: un tramo de zoom que dejaba
 * la mano abierta clavada en el tope, y un cero de referencia que una lectura
 * mala podía mandar a un sitio absurdo.
 *
 *   npm run prueba
 */
import { esPuno, pinza, centro, palanca, zoomDesdePinza, referenciaValida } from '../.pruebas/manos.mjs'

// Manos sintéticas en coordenadas de imagen (0..1, la y crece hacia abajo).
// Mano vertical, muñeca abajo y dedos hacia arriba.
const base = () => {
  const p = new Array(21).fill(0).map(() => ({ x: 0.5, y: 0.5, z: 0 }))
  p[0] = { x: 0.50, y: 0.90, z: 0 }                       // muñeca
  p[1] = { x: 0.42, y: 0.84, z: 0 }                       // pulgar CMC
  p[2] = { x: 0.36, y: 0.76, z: 0 }
  p[3] = { x: 0.32, y: 0.69, z: 0 }
  p[4] = { x: 0.29, y: 0.62, z: 0 }                       // punta pulgar
  const dedos = [[5, 0.44], [9, 0.50], [13, 0.56], [17, 0.62]]
  for (const [mcp, x] of dedos) {
    p[mcp]     = { x, y: 0.62, z: 0 }   // nudillo
    p[mcp + 1] = { x, y: 0.48, z: 0 }   // media
    p[mcp + 2] = { x, y: 0.38, z: 0 }
    p[mcp + 3] = { x, y: 0.30, z: 0 }   // punta
  }
  return p
}

const puno = () => {
  const p = base()
  // Puntas recogidas por debajo de las medias: más cerca de la muñeca.
  for (const mcp of [5, 9, 13, 17]) {
    p[mcp + 1] = { x: p[mcp].x, y: 0.52, z: 0 }
    p[mcp + 2] = { x: p[mcp].x, y: 0.58, z: 0 }
    p[mcp + 3] = { x: p[mcp].x, y: 0.62, z: 0 }
  }
  return p
}

// Pulgar pegado al índice (pinza cerrada) y bien separado (mano abierta).
const pinzaCerrada = () => { const p = base(); p[4] = { x: 0.455, y: 0.315, z: 0 }; return p }
const pinzaAbierta = () => { const p = base(); p[4] = { x: 0.16, y: 0.60, z: 0 }; return p }

let fallos = 0
const comprobar = (nombre, ok, detalle) => {
  console.log(`${ok ? '  ok ' : 'FALLA'}  ${nombre}${detalle ? '   → ' + detalle : ''}`)
  if (!ok) fallos++
}

comprobar('palma abierta no es puño', esPuno(base()) === false)
comprobar('puño es puño', esPuno(puno()) === true)

const pc = pinza(pinzaCerrada()), pa = pinza(pinzaAbierta()), pn = pinza(base())
comprobar('pinza cerrada < abierta', pc < pa, `cerrada ${pc.toFixed(2)} · neutra ${pn.toFixed(2)} · abierta ${pa.toFixed(2)}`)

// El zoom se mide contra la pose con la que apareció la mano.
const z = zoomDesdePinza
comprobar('la pose de entrada deja el encuadre intacto', z(pn, pn) === 1)
comprobar('juntar los dedos aleja', z(pc, pn) > 1, `desde neutra ${pn.toFixed(2)} a cerrada ${pc.toFixed(2)} → ${z(pc, pn).toFixed(2)}`)
comprobar('separarlos acerca', z(pa, pn) < 1, `desde neutra ${pn.toFixed(2)} a abierta ${pa.toFixed(2)} → ${z(pa, pn).toFixed(2)}`)
// Fuera de saturación el gesto es monótono: más apertura, más cerca.
const r = referenciaValida(pn)
comprobar('monótono entre los topes', z(1.0, r) > z(1.2, r) && z(1.2, r) > z(1.4, r))
comprobar('entrar con la mano cerrada no rompe nada, solo satura',
  z(pn, referenciaValida(pc)) === 0.55, `ref recortada ${referenciaValida(pc).toFixed(2)}`)
comprobar('una lectura absurda no deja el cero fuera de rango',
  referenciaValida(0) === 0.35 && referenciaValida(99) === 1.45)
comprobar('el zoom nunca se sale de 0.55..1.6',
  [[pc, pn], [pa, pn], [0, 3], [3, 0], [pn, pa]].every(([a, b]) => z(a, b) >= 0.55 && z(a, b) <= 1.6))

// La palanca del scroll, con los valores del componente: MUERTA 0.1, TOPE 0.3
const MUERTA = 0.1, TOPE = 0.3
const vel = (y) => palanca(0.5, y, MUERTA, TOPE)
comprobar('mano en el centro no mueve nada', vel(0.5) === 0)
comprobar('temblor de 0.08 no mueve nada', vel(0.42) === 0 && vel(0.58) === 0)
comprobar('mano arriba avanza', vel(0.20) > 0, `${vel(0.2).toFixed(2)}`)
comprobar('mano abajo retrocede', vel(0.80) < 0, `${vel(0.8).toFixed(2)}`)
comprobar('la palanca satura en ±1', vel(0.0) === 1 && vel(1.0) === -1)

const c = centro(base())
comprobar('el centro es el nudillo del corazón', c.x === 0.5 && c.y === 0.62)

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo correcto')
process.exit(fallos ? 1 : 0)
