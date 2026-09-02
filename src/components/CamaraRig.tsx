import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { estadoInicial, muestrear } from '../lib/recorrido'
import { scroll } from '../lib/scroll-state'

/** Constante de amortiguación. Más alto, más pegada al scroll. */
const LAMBDA = 4.2

/**
 * La cámara, gobernada por el scroll.
 *
 * Doble amortiguación a propósito: el `scrub` de GSAP ya suaviza el valor, y
 * encima se amortigua por frame con `damp`. Lo primero convierte los saltos de
 * la rueda en un valor continuo; lo segundo evita que un frame perdido se note
 * como un tirón. Con solo una de las dos, el movimiento se siente barato.
 */
export function CamaraRig() {
  const camara = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const tamano = useThree((s) => s.size)
  const objetivo = useRef(estadoInicial())
  const actual = useRef(estadoInicial())
  const mira = useRef(new THREE.Vector3())
  const asentada = useRef(false)

  useFrame((_, dt) => {
    const t = muestrear(scroll.progreso, objetivo.current)
    const c = actual.current

    for (const k of ['theta', 'phi', 'radio', 'miraY', 'fov', 'desvio'] as const) {
      c[k] = THREE.MathUtils.damp(c[k], t[k], LAMBDA, dt)
    }

    // Esféricas → cartesianas. Con phi medido desde el polo norte.
    const x = c.radio * Math.sin(c.phi) * Math.sin(c.theta)
    const y = c.radio * Math.cos(c.phi) + c.miraY
    const z = c.radio * Math.sin(c.phi) * Math.cos(c.theta)

    /*
     * El desvío lateral se aplica en metros, no en píxeles.
     *
     * Va en fracción de media anchura de encuadre porque el mismo valor tiene
     * que servir al plano general (radio 4.3) y al primer plano (radio 2.05).
     * Aquí se convierte usando el FOV y la proporción de la ventana de ESTE
     * frame: así la figura queda en el mismo sitio de la pantalla en cualquier
     * tamaño, que es lo que hace que el texto y la figura nunca se pisen.
     */
    const aspecto = tamano.width / Math.max(1, tamano.height)
    const mitad = Math.tan((c.fov * Math.PI) / 360) * c.radio * aspecto

    /*
     * En pantallas estrechas el desvío se recorta.
     *
     * El texto ocupa el ancho completo en vertical, así que ahí no hay "un
     * lado" al que apartar la figura: empujarla lo mismo que en escritorio la
     * sacaría de cuadro. La escala baja con la proporción y no llega a cero,
     * para que siempre quede algo de descentrado.
     */
    const escala = THREE.MathUtils.clamp((aspecto - 0.62) / 0.95, 0.22, 1)

    /*
     * Signo NEGADO: mover la cámara a la derecha desplaza la figura a la
     * IZQUIERDA en pantalla. Medido — con desvío +0.26 la figura acababa 261 px
     * a la izquierda del centro, justo encima del texto. Así `desvio` positivo
     * significa lo que dice su comentario: figura a la derecha.
     */
    const corrimiento = -c.desvio * mitad * escala

    // Perpendicular al eje de mirada, para que el desvío sea siempre lateral
    // en pantalla y no se convierta en acercamiento al girar la cámara.
    const lateralX = Math.cos(c.theta)
    const lateralZ = -Math.sin(c.theta)

    camara.position.set(x + lateralX * corrimiento, y, z + lateralZ * corrimiento)
    mira.current.set(lateralX * corrimiento, c.miraY, lateralZ * corrimiento)
    camara.lookAt(mira.current)

    // El FOV se pone de golpe en el primer frame: amortiguarlo desde el valor
    // que traiga la cámara por defecto se ve como un zoom al entrar.
    camara.fov = asentada.current && Number.isFinite(camara.fov)
      ? THREE.MathUtils.damp(camara.fov, c.fov, LAMBDA, dt)
      : c.fov
    asentada.current = true
    camara.updateProjectionMatrix()
  })

  return null
}
