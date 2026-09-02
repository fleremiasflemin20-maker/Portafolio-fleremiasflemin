import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/** Las dos localizaciones, en el orden en que ocurrieron. */
const LUGARES = ['QUITO, ECUADOR', 'SANTA MONICA, CALIFORNIA']

/** Milisegundos por letra. 42 se lee como una máquina, no como una animación. */
const LETRA = 42
/** Lo que se sostiene la pantalla una vez escrita y con todo cargado. */
const SOSTIENE = 700

/**
 * La cinemática de entrada.
 *
 * Es la apertura de GTA: negro, y el rótulo de localización escribiéndose
 * abajo a la izquierda antes de que empiece nada.
 *
 * Pero no es solo atmósfera — resuelve un problema real. El modelo pesa 1 MB y
 * el horizonte otros 65 KB: hasta que llegan, la escena está vacía y la figura
 * aparecía de golpe. Esta pantalla ocupa exactamente ese hueco, así que la
 * espera deja de ser un salto y pasa a ser la intro.
 *
 * La condición de salida son las dos cosas a la vez: que el texto haya
 * terminado de escribirse **y** que las descargas hayan acabado. Si saliera
 * solo con el texto, en una conexión lenta volvería el salto; si saliera solo
 * con la carga, en una rápida ni se leería el rótulo.
 */
export function Cinematica() {
  const { progress } = useProgress()
  const [escrito, setEscrito] = useState('')
  const [terminado, setTerminado] = useState(false)
  const [fuera, setFuera] = useState(false)

  /*
   * Un solo bucle para toda la escritura, montado una vez.
   *
   * El primer intento encadenaba un `setTimeout` por letra con la letra actual
   * en las dependencias del efecto. Cada repintado —y `useProgress` provoca
   * muchos— limpiaba el temporizador y volvía a empezar la cuenta, así que el
   * rótulo tardaba diez segundos en escribirse en vez de uno. Con un intervalo
   * suelto del ciclo de render, el ritmo es el que dice la constante.
   */
  useEffect(() => {
    const completo = LUGARES.join('\n')
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setEscrito(completo.slice(0, i))
      if (i >= completo.length) {
        clearInterval(id)
        setTerminado(true)
      }
    }, LETRA)
    return () => clearInterval(id)
  }, [])

  /*
   * Salida. Dos condiciones y un tope.
   *
   * `progress` sin `active`: el `active` de drei se queda en true aunque la
   * descarga haya acabado —medido: el porcentaje marcaba 100 y el telón no se
   * levantaba nunca—, así que fiarse de él deja al visitante en una pantalla
   * negra para siempre.
   *
   * Y un tope de seguridad: si algo falla al cargar, el telón se levanta igual.
   * Es preferible una escena a medio poner que un negro eterno.
   */
  useEffect(() => {
    if (fuera) return
    if (terminado && progress >= 100) {
      const t = setTimeout(() => setFuera(true), SOSTIENE)
      return () => clearTimeout(t)
    }
    const tope = setTimeout(() => setFuera(true), 9000)
    return () => clearTimeout(tope)
  }, [terminado, progress, fuera])

  useEffect(() => {
    const raiz = document.documentElement
    if (fuera) raiz.classList.remove('cargando')
    else raiz.classList.add('cargando')
    return () => raiz.classList.remove('cargando')
  }, [fuera])

  const lineas = escrito.split('\n')

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] bg-[#0A0A12] transition-opacity duration-[900ms] ease-out"
      style={{ opacity: fuera ? 0 : 1, visibility: fuera ? 'hidden' : 'visible' }}
      aria-hidden={fuera}
    >
      <div className="absolute bottom-16 left-6 md:bottom-20 md:left-12 lg:left-20">
        {LUGARES.map((texto, i) => (
          <p
            key={texto}
            className="font-mono text-[0.8rem] uppercase tracking-[0.3em] md:text-base"
            style={{ color: i === 0 ? 'var(--tinta, #FF9A4D)' : '#F5F4F1' }}
          >
            {lineas[i] ?? ''}
            {/* El cursor, solo en la línea que se está escribiendo. */}
            {!terminado && i === lineas.length - 1 && <span className="cursor-intro">▌</span>}
          </p>
        ))}
      </div>

      {/* El porcentaje, discreto y abajo a la derecha. No es un adorno: en una
          conexión lenta es lo único que dice que la página no se ha colgado. */}
      <p className="absolute bottom-16 right-6 font-mono text-[0.7rem] tracking-[0.2em] text-paper/30 md:bottom-20 md:right-12 lg:right-20">
        {Math.round(progress)}%
      </p>
    </div>
  )
}
