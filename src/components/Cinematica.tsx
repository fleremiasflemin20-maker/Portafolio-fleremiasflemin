import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/** Las dos localizaciones, en el orden en que ocurrieron. */
const LUGARES = ['QUITO, ECUADOR', 'SANTA MONICA, CALIFORNIA']

/** Milisegundos por letra. 42 se lee como una máquina, no como una animación. */
const LETRA = 42
/** Lo que se sostiene la pantalla una vez escrita y con todo cargado. */
const SOSTIENE = 900

/** El nombre artístico, partido para animarlo letra a letra. */
const NOMBRE = 'FLEREMIASFLEMIN'

const VIDEO = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/video/intro.mp4`

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
      /*
       * Salida suave, no un corte.
       *
       * Solo con opacidad el paso se sentía tosco: el negro se iba de golpe y
       * la escena aparecía ya montada. Añadiendo un empujón de escala y un
       * desenfoque, el telón parece abrirse hacia el espectador y la escena
       * entra desde detrás. Es la misma diferencia que entre cortar un plano y
       * fundirlo.
       *
       * 1400 ms y `cubic-bezier(0.16, 1, 0.3, 1)`: arranca deprisa y frena
       * mucho al final, que es lo que hace que no se note dónde termina.
       */
      className="pointer-events-none fixed inset-0 z-[60] bg-[#0A0A12]"
      style={{
        opacity: fuera ? 0 : 1,
        visibility: fuera ? 'hidden' : 'visible',
        transform: fuera ? 'scale(1.08)' : 'scale(1)',
        filter: fuera ? 'blur(14px)' : 'blur(0px)',
        transition:
          'opacity 1400ms cubic-bezier(0.16, 1, 0.3, 1), transform 1400ms cubic-bezier(0.16, 1, 0.3, 1), filter 1100ms ease-out, visibility 0s linear 1400ms',
      }}
      aria-hidden={fuera}
    >
      {/*
        El vídeo a un lado, mientras carga.
        
        Da algo que mirar durante los segundos que tardan el modelo y las
        texturas, que es el problema real de una pantalla de carga: no que dure,
        sino que no ofrezca nada. Va mudo porque la reproducción automática lo
        exige y porque una web que suena sola molesta.

        `playsInline` es obligatorio en iOS: sin él, Safari lo saca a pantalla
        completa en cuanto empieza y se lleva por delante toda la puesta en
        escena.
      */}
      <video
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-0 md:w-[38%]"
        style={{
          animation: 'entraVideo 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards',
          WebkitMaskImage: 'linear-gradient(to left, #000 55%, transparent 100%)',
          maskImage: 'linear-gradient(to left, #000 55%, transparent 100%)',
        }}
        src={VIDEO}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/*
        El nombre artístico, en el hueco que deja el vídeo.

        Entra letra a letra con retardo escalonado en CSS y no con GSAP: aquí no
        hay nada que sincronizar con el scroll ni con la carga, y un `animation-delay`
        por letra no depende del ciclo de render — que es justo lo que hizo que
        el rótulo de abajo tardara diez segundos en el primer intento.

        Cabe de sobra en los cinco segundos del vídeo: la última letra entra
        antes del segundo y medio.
      */}
      <div className="absolute inset-y-0 left-6 z-10 flex flex-col justify-center md:left-12 lg:left-20">
        <h1
          className="rotulo font-display uppercase leading-[0.82]"
          style={{ fontSize: 'clamp(2.4rem, 7vw, 6.5rem)' }}
          aria-label="Fleremiasflemin"
        >
          {NOMBRE.split('').map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="letra-intro inline-block"
              style={{ animationDelay: `${400 + i * 55}ms` }}
            >
              {ch}
            </span>
          ))}
        </h1>

        <p
          className="letra-intro mt-4 max-w-md font-mono text-[0.78rem] uppercase tracking-[0.24em] md:text-sm"
          style={{ animationDelay: `${400 + NOMBRE.length * 55 + 260}ms`, color: 'var(--tinta, #FF9A4D)' }}
        >
          O dime solo Flemin
        </p>
      </div>

      <div className="absolute bottom-16 left-6 z-10 md:bottom-20 md:left-12 lg:left-20">
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
