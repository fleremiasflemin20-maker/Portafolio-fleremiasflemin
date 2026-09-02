import { useCallback, useEffect, useState } from 'react'
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
 * La condición para llegar a "listo" son las dos cosas a la vez: que el texto
 * haya terminado de escribirse **y** que las descargas hayan acabado. Si
 * llegara solo con el texto, en una conexión lenta volvería el salto; si
 * llegara solo con la carga, en una rápida ni se leería el rótulo.
 *
 * De "listo" no se sale solo. Antes lo hacía —un `setTimeout` de 900 ms y
 * fuera—, pero eso convertía la pantalla en un trámite: nadie llega a leer
 * "Quito, Ecuador · Santa Monica, California" en menos de un segundo. Ahora
 * hace falta un toque, como el "PRESS START" de un cartucho. Es la misma
 * pantalla resuelta como arranque de videojuego en vez de como cortina.
 */
export function Cinematica() {
  const { progress } = useProgress()
  const [escrito, setEscrito] = useState('')
  const [terminado, setTerminado] = useState(false)
  const [listo, setListo] = useState(false)
  const [fuera, setFuera] = useState(false)
  const [desmontado, setDesmontado] = useState(false)

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
   * "Listo". Dos condiciones y un tope.
   *
   * `progress` sin `active`: el `active` de drei se queda en true aunque la
   * descarga haya acabado —medido: el porcentaje marcaba 100 y el telón no se
   * levantaba nunca—, así que fiarse de él deja al visitante en una pantalla
   * negra para siempre.
   *
   * Y un tope de seguridad: si algo falla al cargar, se ofrece el botón igual.
   * Es preferible dejar pasar con una descarga a medias que un negro eterno.
   */
  useEffect(() => {
    if (listo) return
    if (terminado && progress >= 100) {
      const t = setTimeout(() => setListo(true), SOSTIENE)
      return () => clearTimeout(t)
    }
    const tope = setTimeout(() => setListo(true), 9000)
    return () => clearTimeout(tope)
  }, [terminado, progress, listo])

  /* La salida de verdad. Antes se disparaba sola; ahora la pide un toque —
     clic, Enter o espacio— para que la pantalla deje de ser un trámite y pase
     a ser el "PRESS START" de la intro. */
  const continuar = useCallback(() => {
    if (!listo || fuera) return
    setFuera(true)
  }, [listo, fuera])

  useEffect(() => {
    if (!listo) return
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        continuar()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [listo, continuar])

  useEffect(() => {
    const raiz = document.documentElement
    if (fuera) raiz.classList.remove('cargando')
    else raiz.classList.add('cargando')
    return () => raiz.classList.remove('cargando')
  }, [fuera])

  /*
   * Y cuando el telón termina de irse, se desmonta.
   *
   * Con `visibility: hidden` bastaba para no verlo, pero seguía ocupando sitio:
   * la escala de 1.08 sobre una capa del tamaño de la ventana la dejaba en
   * -76..1996 en una pantalla de 1920, y eso son 30 px de barra horizontal en
   * toda la página. Medido con `scrollWidth`. Se espera a que acabe la
   * transición —1400 ms, más un margen— y se quita del árbol.
   */
  useEffect(() => {
    if (!fuera) return
    const t = setTimeout(() => setDesmontado(true), 1600)
    return () => clearTimeout(t)
  }, [fuera])

  if (desmontado) return null

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
      className={`fixed inset-0 z-[60] bg-[#0A0A12] ${listo ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
      style={{
        opacity: fuera ? 0 : 1,
        visibility: fuera ? 'hidden' : 'visible',
        transform: fuera ? 'scale(1.08)' : 'scale(1)',
        filter: fuera ? 'blur(14px)' : 'blur(0px)',
        transition:
          'opacity 1400ms cubic-bezier(0.16, 1, 0.3, 1), transform 1400ms cubic-bezier(0.16, 1, 0.3, 1), filter 1100ms ease-out, visibility 0s linear 1400ms',
      }}
      aria-hidden={fuera}
      /* Toda la pantalla vale como botón una vez lista: reduce a cero la
         puntería que hace falta para pasar, el "botón" en sí es solo el
         foco visual de dónde tocar. */
      onClick={continuar}
      role={listo ? 'button' : undefined}
      tabIndex={listo ? 0 : undefined}
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
          className="letra-intro mt-5 max-w-xl font-mono text-base uppercase tracking-[0.26em] md:text-xl lg:text-2xl"
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
          conexión lenta es lo único que dice que la página no se ha colgado.
          Se apaga en cuanto hay botón que pulsar — a partir de ahí ya no
          informa de nada que el propio botón no diga. */}
      {!listo && (
        <p className="absolute bottom-16 right-6 font-mono text-[0.7rem] tracking-[0.2em] text-paper/30 md:bottom-20 md:right-12 lg:right-20">
          {Math.round(progress)}%
        </p>
      )}

      {/*
        El "PRESS START" de la intro.

        En GTA la pantalla de carga no suelta al jugador sola: pide un toque
        antes de entrar al mundo. Aquí cumple el mismo papel y resuelve algo
        real — sin él, nadie llegaba a leer "Quito, Ecuador" ni se enteraba de
        que existe un control por gestos de mano, porque la pantalla se
        cerraba sola en menos de un segundo.

        Centrado y no pegado a una esquina: es lo único de la pantalla que
        pide una acción, así que tiene que ganar el pulso visual al nombre y
        al vídeo, no competir con ellos desde un rincón.
      */}
      {listo && (
        <div className="entra pointer-events-none absolute inset-x-0 bottom-28 z-20 flex flex-col items-center gap-5 px-6 text-center md:bottom-32">
          <button
            type="button"
            onClick={continuar}
            className="boton-continuar pointer-events-auto border-2 bg-ink/70 px-10 py-4 font-display text-xl uppercase tracking-[0.08em] backdrop-blur-sm md:text-2xl"
            style={{ borderColor: 'var(--tinta, #FF9A4D)', color: 'var(--tinta, #FF9A4D)' }}
          >
            Presiona para continuar
          </button>

          <p className="max-w-md font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.14em] text-paper/50 md:text-[0.68rem]">
            Desplázate con el scroll para recorrer la historia.
            <br className="hidden md:block" /> O activa <span className="text-paper/75">«Manejar con las manos»</span>{' '}
            —abajo a la izquierda— y navega moviendo la palma frente a tu cámara.
          </p>
        </div>
      )}
    </div>
  )
}
