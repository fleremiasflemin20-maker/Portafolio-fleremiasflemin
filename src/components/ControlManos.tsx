import { useCallback, useEffect, useRef, useState } from 'react'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import { manos, centro, esPuno, palanca, pinza, puntaIndice, referenciaValida, unDedo, zoomDesdePinza, type Punto } from '../lib/manos'

/*
 * El WASM y el modelo se piden a una CDN y no van en el repositorio.
 *
 * Son 11 MB de WASM y 7.5 MB de modelo. Meterlos en el repo multiplicaría por
 * seis lo que pesa clonarlo, y todo eso solo lo necesita quien pulse el botón.
 * Versión clavada a propósito: `@latest` en una CDN es una dependencia que
 * cambia sola.
 */
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODELO =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** Píxeles por segundo de scroll con la mano en el tope del recorrido. */
const VELOCIDAD = 1500
/** Fracción de la imagen que se ignora alrededor del centro. */
const MUERTA = 0.1
/** Dónde está el tope de la palanca, medido desde el centro. */
const TOPE = 0.3
/** Milisegundos entre dos cambios de faceta seguidos. */
const ESPERA_FACETA = 1100
/** Pinza por debajo de este valor cuenta como clic. `pinza()` da ~0.25 con los
    dedos juntos del todo: el margen es para que no haga falta cerrarla al máximo. */
const UMBRAL_CLIC = 0.42
/** Detección a 24 fps: a 60 le roba demasiado tiempo de GPU a la escena 3D. */
const PERIODO = 1000 / 24

const HUESOS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

type Estado = 'apagado' | 'arrancando' | 'activo' | 'error'

export function ControlManos({ onFaceta }: { onFaceta: (paso: 1 | -1) => void }) {
  const [estado, setEstado] = useState<Estado>('apagado')
  const [fallo, setFallo] = useState('')
  const [visto, setVisto] = useState({ control: false, camara: false })

  /*
   * MediaPipe decide la lateralidad suponiendo que la imagen viene reflejada,
   * como en un espejo. El navegador entrega el fotograma tal cual lo capta el
   * sensor, sin reflejar, así que la etiqueta puede llegar cambiada — y depende
   * de la cámara y del sistema. No es algo que se pueda dejar resuelto a ciegas:
   * el usuario lo corrige con un botón y la elección se queda guardada.
   */
  const [invertido, setInvertido] = useState(() => {
    try {
      return localStorage.getItem('manos-invertido') === '1'
    } catch {
      return false
    }
  })
  const invRef = useRef(invertido)
  invRef.current = invertido

  const video = useRef<HTMLVideoElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const detector = useRef<HandLandmarker | null>(null)
  const flujo = useRef<MediaStream | null>(null)
  const bucle = useRef(0)
  const ultimaFaceta = useRef(0)
  /** Pinza con la que apareció la mano izquierda: el cero del zoom. */
  const refPinza = useRef<number | null>(null)
  const facetaRef = useRef(onFaceta)
  facetaRef.current = onFaceta

  /* El cursor por gestos: un elemento aparte del canvas del esqueleto, porque
     este tiene que verse por encima de toda la página, no solo del panel de
     control. Se mueve por estilo directo en el bucle de detección — como
     estado de React repintaría el árbol entero 24 veces por segundo. */
  const cursorHand = useRef<HTMLDivElement>(null)
  /** Si la pinza ya estaba cerrada el fotograma anterior, por mano. Sin esto
      un clic mantenido dispara uno nuevo en cada fotograma. */
  const clicDerecha = useRef(false)
  const clicIzquierda = useRef(false)

  /** Corta la cámara de verdad: soltar la referencia deja el piloto encendido. */
  const apagar = useCallback(() => {
    cancelAnimationFrame(bucle.current)
    flujo.current?.getTracks().forEach((t) => t.stop())
    flujo.current = null
    detector.current?.close()
    detector.current = null
    if (video.current) video.current.srcObject = null
    manos.zoom = 1
    if (cursorHand.current) cursorHand.current.style.display = 'none'
    setVisto({ control: false, camara: false })
    setEstado('apagado')
  }, [])

  useEffect(() => apagar, [apagar])

  const encender = useCallback(async () => {
    setEstado('arrancando')
    setFallo('')
    try {
      /* Primero la cámara: si el permiso se deniega, no tiene sentido
         descargar veinte megas de modelo. */
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      flujo.current = stream
      const v = video.current!
      v.srcObject = stream
      await v.play()

      // Carga diferida: el bulto no entra en el paquete de la página.
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM)
      detector.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODELO, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      })

      setEstado('activo')
      arrancarBucle()
    } catch (e) {
      flujo.current?.getTracks().forEach((t) => t.stop())
      flujo.current = null
      const msg = e instanceof Error ? e.message : String(e)
      setFallo(
        /denied|not allowed/i.test(msg)
          ? 'No diste permiso de cámara. El navegador lo recuerda: hay que volver a permitirlo desde el candado de la barra de direcciones.'
          : `No se pudo arrancar: ${msg}`,
      )
      setEstado('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /*
   * Apuntar: mueve el cursor a donde señala el índice y dispara un clic real
   * si la pinza se acaba de cerrar.
   *
   * `elementFromPoint` + `.click()` y no un evento sintético a mano: `.click()`
   * es el mismo camino que usa el navegador con un clic de ratón de verdad, así
   * que activa enlaces, botones y los `onClick` de React sin tener que simular
   * cada paso (`pointerdown`, `mousedown`, `mouseup`...) uno por uno.
   */
  function apuntar(p: Punto[], previo: { current: boolean }) {
    const punta = puntaIndice(p)
    // Espejo, igual que el resto de la mano: la imagen no viene reflejada.
    const x = (1 - punta.x) * window.innerWidth
    const y = punta.y * window.innerHeight
    const cerrado = pinza(p) < UMBRAL_CLIC

    const el = cursorHand.current
    if (el) {
      el.style.display = 'block'
      /* La posición y la escala del clic van en el mismo `transform`: un
         estilo inline pisa por completo cualquier transform de una clase, así
         que repartirlas entre JS y CSS dejaría una de las dos sin efecto. El
         -16 centra el círculo de 32 px sobre la punta del dedo. */
      el.style.transform = `translate(${x - 16}px, ${y - 16}px) scale(${cerrado ? 0.72 : 1})`
      el.classList.toggle('cursor-mano-cerrado', cerrado)
    }

    if (cerrado && !previo.current) {
      const objetivo = document.elementFromPoint(x, y)
      if (objetivo instanceof HTMLElement) objetivo.click()
      el?.classList.add('cursor-mano-clic')
      setTimeout(() => el?.classList.remove('cursor-mano-clic'), 220)
    }
    previo.current = cerrado
  }

  function arrancarBucle() {
    let anterior = performance.now()
    let ultimaDeteccion = 0
    let velocidad = 0
    let hayControl = false
    let hayCamara = false

    const paso = (ahora: number) => {
      bucle.current = requestAnimationFrame(paso)
      const dt = Math.min(0.05, (ahora - anterior) / 1000)
      anterior = ahora

      const v = video.current
      const det = detector.current

      if (det && v && v.readyState >= 2 && ahora - ultimaDeteccion >= PERIODO) {
        ultimaDeteccion = ahora
        const r = det.detectForVideo(v, ahora)
        hayControl = false
        hayCamara = false
        // Si ninguna mano apunta este fotograma, el cursor se esconde al
        // final del bucle — igual que `refPinza` se suelta cuando la mano
        // sale de cuadro.
        let apuntando = false

        for (let i = 0; i < r.landmarks.length; i++) {
          const p = r.landmarks[i] as Punto[]
          const etiqueta = r.handedness[i]?.[0]?.categoryName ?? 'Right'
          const esDerecha = invRef.current ? etiqueta === 'Left' : etiqueta === 'Right'

          /*
           * Un dedo, en cualquiera de las dos manos, apunta el cursor.
           *
           * Va antes del reparto por mano y no dentro de cada rama: el gesto
           * se reconoce por la forma de la mano, no por cuál es — apuntar con
           * la izquierda tiene que funcionar igual que con la derecha. Mientras
           * se apunta, esa mano deja en pausa lo que hiciera normalmente
           * (scroll/faceta a la derecha, zoom a la izquierda): no tiene sentido
           * que el cursor se mueva y la página se desplace a la vez.
           */
          if (unDedo(p)) {
            apuntando = true
            if (esDerecha) {
              hayControl = true
              velocidad = 0
              apuntar(p, clicDerecha)
            } else {
              hayCamara = true
              apuntar(p, clicIzquierda)
            }
            continue
          }

          if (esDerecha) {
            hayControl = true
            const c = centro(p)
            clicDerecha.current = false

            /*
             * El puño frena.
             *
             * Hace falta una forma de parar que no sea bajar la mano: mientras
             * bajas, la mano cruza toda la zona de scroll y la página se va
             * sola justo cuando querías detenerla.
             */
            if (esPuno(p)) {
              velocidad = 0
            } else {
              /* Mano arriba = avanzar. Es el sentido del dedo en una pantalla
                 táctil: empujas hacia arriba y el contenido sube. */
              velocidad = palanca(0.5, c.y, MUERTA, TOPE) * VELOCIDAD

              /*
               * El eje lateral solo cuenta con la mano centrada en vertical.
               *
               * Si se leyeran los dos a la vez, cualquier diagonal al hacer
               * scroll cambiaría de personaje sin querer. Separándolos, cada
               * gesto es deliberado.
               */
              if (velocidad === 0 && ahora - ultimaFaceta.current > ESPERA_FACETA) {
                // La imagen no viene reflejada: se invierte la x para que mover
                // la mano a la derecha signifique ir a la derecha.
                const x = 1 - c.x
                const lat = palanca(x, 0.5, TOPE, TOPE + 0.12)
                if (lat !== 0) {
                  ultimaFaceta.current = ahora
                  facetaRef.current(lat > 0 ? 1 : -1)
                }
              }
            }
          } else {
            hayCamara = true
            clicIzquierda.current = false
            /*
             * Puño izquierdo: vuelve al encuadre del guion y olvida la
             * referencia, para que el siguiente gesto vuelva a calibrarse.
             */
            if (esPuno(p)) {
              manos.zoom = 1
              refPinza.current = null
            } else {
              const v = pinza(p)
              if (refPinza.current === null) refPinza.current = referenciaValida(v)
              manos.zoom = zoomDesdePinza(v, refPinza.current)
            }
          }
        }

        if (!apuntando) {
          const el = cursorHand.current
          if (el) el.style.display = 'none'
          clicDerecha.current = false
          clicIzquierda.current = false
        }

        // Mano fuera de cuadro: se suelta la referencia, no el zoom. Así se
        // puede dejar un encuadre puesto y bajar el brazo.
        if (!hayCamara) refPinza.current = null

        if (!hayControl) velocidad = 0
        setVisto((s) =>
          s.control === hayControl && s.camara === hayCamara ? s : { control: hayControl, camara: hayCamara },
        )
        dibujar(r.landmarks as Punto[][])
      }

      if (velocidad !== 0) {
        const lenis = (window as unknown as { __lenis?: { scroll: number; scrollTo: (v: number, o?: object) => void } })
          .__lenis
        const delta = velocidad * dt
        // Lenis y window.scrollTo se pelean: con Lenis montado hay que pedírselo
        // a él o ScrollTrigger acaba leyendo una posición que no es la real.
        if (lenis) lenis.scrollTo(lenis.scroll + delta, { immediate: true, force: true })
        else window.scrollBy(0, delta)
      }
    }

    bucle.current = requestAnimationFrame(paso)
  }

  function dibujar(listas: Punto[][]) {
    const cv = lienzo.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    ctx.clearRect(0, 0, cv.width, cv.height)
    for (const p of listas) {
      // Espejo, para que la mano de la pantalla se mueva como la de verdad.
      const X = (i: number) => (1 - p[i].x) * cv.width
      const Y = (i: number) => p[i].y * cv.height
      ctx.strokeStyle = 'rgba(59,224,208,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (const [a, b] of HUESOS) {
        ctx.moveTo(X(a), Y(a))
        ctx.lineTo(X(b), Y(b))
      }
      ctx.stroke()
      ctx.fillStyle = '#FF3DA6'
      for (let i = 0; i < p.length; i++) {
        ctx.beginPath()
        ctx.arc(X(i), Y(i), 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const activo = estado === 'activo'

  return (
    <>
      {/*
        El cursor por gestos.

        Fuera del panel de control a propósito: el panel vive en una esquina,
        pero el cursor tiene que poder pasar por encima de cualquier parte de
        la página — el `top`/`left` a 0 y el movimiento por `transform` son lo
        que permiten que "siga" a la mano sin quedarse encerrado en un
        contenedor con posición propia.
      */}
      <div
        ref={cursorHand}
        className="cursor-mano pointer-events-none fixed left-0 top-0 z-50 hidden h-8 w-8 rounded-full border-2"
        style={{ borderColor: '#3BE0D0' }}
        aria-hidden="true"
      >
        <span className="absolute inset-1 rounded-full transition-colors duration-150" />
      </div>

      <div className="pointer-events-none fixed bottom-5 left-5 z-40 md:bottom-8 md:left-8">
        {/* El vídeo nunca se muestra: solo alimenta al detector. El usuario ve el
            esqueleto dibujado, que es lo único que la página llega a usar. */}
        <video ref={video} playsInline muted className="hidden" />

      {!activo && (
        <button
          onClick={estado === 'arrancando' ? undefined : encender}
          disabled={estado === 'arrancando'}
          className="pointer-events-auto flex items-center gap-2.5 border-2 bg-ink/75 px-3.5 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur-sm transition-colors hover:bg-ink/90 disabled:opacity-60"
          style={{ borderColor: '#3BE0D0', color: '#3BE0D0' }}
        >
          <span aria-hidden>✋</span>
          {estado === 'arrancando' ? 'Cargando…' : 'Manejar con las manos'}
        </button>
      )}

      {estado === 'error' && (
        <p className="pointer-events-auto mt-2 max-w-[16rem] border border-paper/15 bg-ink/85 p-3 font-mono text-[0.58rem] leading-relaxed text-paper/70 backdrop-blur-sm">
          {fallo}
        </p>
      )}

      {activo && (
        <div className="pointer-events-auto w-[15rem] border-2 bg-ink/85 backdrop-blur-sm" style={{ borderColor: '#3BE0D0' }}>
          <canvas ref={lienzo} width={236} height={177} className="block w-full bg-black/60" />

          <div className="space-y-1.5 p-3 font-mono text-[0.55rem] uppercase leading-relaxed tracking-[0.1em]">
            <p style={{ color: visto.control ? '#3BE0D0' : 'rgba(245,244,241,0.3)' }}>
              ● Derecha · {visto.control ? 'navegando' : 'sin mano'}
            </p>
            <p className="normal-case tracking-normal text-paper/50">
              Sube o baja la mano para avanzar y retroceder. En el centro, muévela a un lado para
              cambiar de personaje. Cierra el puño para frenar.
            </p>
            <p className="pt-1.5" style={{ color: visto.camara ? '#FF3DA6' : 'rgba(245,244,241,0.3)' }}>
              ● Izquierda · {visto.camara ? 'cámara' : 'sin mano'}
            </p>
            <p className="normal-case tracking-normal text-paper/50">
              Separa el pulgar del índice para acercar la cámara y júntalos para alejarla. Puño para
              volver al encuadre.
            </p>
            <p className="pt-1.5" style={{ color: '#3BE0D0' }}>
              ● Un dedo · cursor
            </p>
            <p className="normal-case tracking-normal text-paper/50">
              Con cualquier mano, estira solo el índice: aparece un cursor que sigue a la punta del
              dedo. Junta el pulgar al índice para hacer clic, como en un ratón normal.
            </p>
          </div>

          <div className="flex border-t border-paper/10 font-mono text-[0.55rem] uppercase tracking-[0.12em]">
            <button
              onClick={() => {
                const n = !invertido
                setInvertido(n)
                try {
                  localStorage.setItem('manos-invertido', n ? '1' : '0')
                } catch {
                  /* Modo privado: se pierde al recargar y no pasa nada. */
                }
              }}
              className="flex-1 border-r border-paper/10 px-2 py-2.5 text-paper/55 transition-colors hover:text-paper"
              title="Si las manos van cambiadas, púlsalo"
            >
              ⇄ Manos
            </button>
            <button onClick={apagar} className="flex-1 px-2 py-2.5 text-paper/55 transition-colors hover:text-paper">
              ✕ Salir
            </button>
          </div>

          <p className="border-t border-paper/10 px-3 py-2 font-mono text-[0.5rem] leading-relaxed text-paper/35">
            El vídeo se procesa en tu equipo y no se envía a ningún sitio.
          </p>
        </div>
        )}
      </div>
    </>
  )
}
