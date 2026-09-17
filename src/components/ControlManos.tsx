import { useCallback, useEffect, useRef, useState } from 'react'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import {
  manos,
  centro,
  esMarco,
  esPuno,
  palanca,
  pinza,
  puntaIndice,
  referenciaValida,
  unDedo,
  zoomDesdePinza,
  RUTA_MODELO_MANO,
  RUTA_WASM,
  type Punto,
} from '../lib/manos'
import { IconoDeslizar, IconoLateral, IconoMarco, IconoPellizco, IconoPuno, IconoDedo } from './SenalesManos'

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
/** Milisegundos mínimos de marco sostenido para que, al soltarlo, cuente como
    un corte a la siguiente sección y no como cruzar la forma sin querer. */
const SOSTEN_MARCO = 250

const HUESOS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

/*
 * El puntero por gestos, hecho de eventos de verdad.
 *
 * Mover un `<div>` encima de la página no basta: el navegador no sabe que hay
 * un cursor ahí, así que ningún botón se ilumina y ningún enlace responde. Lo
 * que sí entiende cualquier página —esta o cualquier otra, y también la
 * escena 3D, que recoge sus propios eventos de puntero sobre el lienzo— son
 * los eventos de puntero y ratón nativos: `pointermove`, `pointerover` /
 * `pointerout`, `pointerdown` / `pointerup` y `click`. Se despachan con
 * coordenadas reales sobre el elemento que hay debajo del dedo, así que para
 * el navegador es indistinguible de un ratón físico moviéndose por ahí.
 */
function despacharRaton(tipo: string, el: Element, x: number, y: number, extra: MouseEventInit = {}) {
  el.dispatchEvent(
    new MouseEvent(tipo, { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, button: 0, ...extra }),
  )
}

function despacharPuntero(tipo: string, el: Element, x: number, y: number, extra: PointerEventInit = {}) {
  el.dispatchEvent(
    new PointerEvent(tipo, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      ...extra,
    }),
  )
}

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
  /** La ventana del marco de foto: sigue a las manos en directo, ver más abajo. */
  const marcoVentana = useRef<HTMLDivElement>(null)
  /** Si el marco estaba activo el fotograma anterior, para saber el instante
      exacto en que se suelta. */
  const marcoActivoAntes = useRef(false)
  /** Cuándo empezó el marco actual, para medir cuánto se sostuvo al soltarlo. */
  const marcoActivoDesde = useRef(0)
  const [enBN, setEnBN] = useState(() => document.body.classList.contains('bn-activo'))
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
  /** Qué hay bajo el cursor ahora mismo, para saber cuándo disparar
      entrada/salida — y sobre qué elemento se cerró la pinza, para que el
      clic solo salga si se suelta en el mismo sitio donde se apretó. */
  const hoverEl = useRef<Element | null>(null)
  const pressEl = useRef<Element | null>(null)

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
    if (hoverEl.current) {
      despacharPuntero('pointerout', hoverEl.current, -1, -1)
      despacharRaton('mouseout', hoverEl.current, -1, -1)
      hoverEl.current = null
    }
    pressEl.current = null
    if (marcoVentana.current) marcoVentana.current.style.opacity = '0'
    marcoActivoAntes.current = false
    setVisto({ control: false, camara: false })
    setEstado('apagado')
  }, [])

  /** Alterna el blanco y negro de todo el sitio. Ver `.bn-activo` en index.css. */
  const alternarBN = useCallback(() => {
    const activo = document.body.classList.toggle('bn-activo')
    setEnBN(activo)
  }, [])

  /*
   * El corte a la siguiente sección: soltar el marco después de sostenerlo
   * avanza un tramo de pantalla completa, como quien cierra el diafragma de
   * una cámara para cortar a la siguiente escena.
   *
   * Un `scrollBy` de una pantalla y no saltar a la siguiente `.capitulo` por
   * selector: los capítulos miden `100svh` cada uno (ver App.tsx), así que
   * una pantalla de recorrido ya es, en la práctica, "la siguiente sección" —
   * y esto funciona igual en cualquier tramo de la página, no solo dentro del
   * relato por capítulos.
   */
  const avanzarSeccion = useCallback(() => {
    const destino = window.scrollY + window.innerHeight
    const lenis = (window as unknown as { __lenis?: { scrollTo: (v: number, o?: object) => void } }).__lenis
    if (lenis) lenis.scrollTo(destino, { duration: 1.1 })
    else window.scrollTo({ top: destino, behavior: 'smooth' })
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
      const vision = await FilesetResolver.forVisionTasks(RUTA_WASM)
      detector.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: RUTA_MODELO_MANO, delegate: 'GPU' },
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
    // Recortado al viewport: fuera de rango `elementFromPoint` devuelve null
    // y el cursor se queda "flotando" sin poder tocar nada.
    const x = Math.min(window.innerWidth - 1, Math.max(0, (1 - punta.x) * window.innerWidth))
    const y = Math.min(window.innerHeight - 1, Math.max(0, punta.y * window.innerHeight))
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

    // El propio cursor tapa lo que hay debajo: sin `pointer-events-none`
    // `elementFromPoint` se encontraría a sí mismo en vez del botón real.
    const objetivo = document.elementFromPoint(x, y)

    /*
     * Entrar y salir de un elemento.
     *
     * Algunos componentes de este sitio pintan su propio hover por JS
     * (`Boton.tsx`, por ejemplo) en vez de CSS `:hover` puro — y esos sí
     * reaccionan a estos eventos igual que a los de un ratón real. Lo único
     * que ni esto consigue es el `:hover` de CSS en sí: el navegador lo lee
     * del estado real del dispositivo apuntador, no de eventos despachados
     * por JavaScript, así que ningún sitio web puede fingirlo del todo con
     * gestos. Lo que sí queda igual de real es todo lo demás: mover el
     * puntero, entrar y salir de elementos, presionar y soltar.
     */
    if (objetivo !== hoverEl.current) {
      if (hoverEl.current) {
        despacharPuntero('pointerout', hoverEl.current, x, y)
        despacharPuntero('pointerleave', hoverEl.current, x, y, { bubbles: false })
        despacharRaton('mouseout', hoverEl.current, x, y, { relatedTarget: objetivo })
        despacharRaton('mouseleave', hoverEl.current, x, y, { relatedTarget: objetivo, bubbles: false })
      }
      if (objetivo) {
        despacharPuntero('pointerover', objetivo, x, y)
        despacharPuntero('pointerenter', objetivo, x, y, { bubbles: false })
        despacharRaton('mouseover', objetivo, x, y, { relatedTarget: hoverEl.current })
        despacharRaton('mouseenter', objetivo, x, y, { relatedTarget: hoverEl.current, bubbles: false })
      }
      hoverEl.current = objetivo
    }
    if (objetivo) {
      despacharPuntero('pointermove', objetivo, x, y)
      despacharRaton('mousemove', objetivo, x, y)
    }

    // Cierra la pinza: presiona. La abre: suelta, y el clic solo sale si
    // sigue sobre el mismo elemento donde se cerró — igual que un ratón, que
    // no dispara un clic si sueltas el botón fuera de donde lo apretaste.
    if (cerrado && !previo.current && objetivo) {
      despacharPuntero('pointerdown', objetivo, x, y, { buttons: 1 })
      despacharRaton('mousedown', objetivo, x, y, { buttons: 1 })
      pressEl.current = objetivo
      el?.classList.add('cursor-mano-clic')
    } else if (!cerrado && previo.current) {
      if (objetivo) {
        despacharPuntero('pointerup', objetivo, x, y)
        despacharRaton('mouseup', objetivo, x, y)
        /*
         * El clic de verdad.
         *
         * Un evento construido por JavaScript nunca es de confianza
         * (`isTrusted` sale `false`), y los navegadores solo siguen un
         * enlace, envían un formulario o marcan una casilla con eventos de
         * confianza. `.click()` es la excepción a propósito: el estándar lo
         * define para disparar la acción por defecto aunque venga de un
         * script.
         *
         * Pero con enlaces a `target="_blank"` no basta ni con eso. Abrir
         * pestaña es un pop-up a ojos del navegador, y los pop-ups solo se
         * permiten dentro del gesto de un usuario real — comprobado: incluso
         * `.click()` en un enlace `_blank` se queda callado, sin abrir nada,
         * si no viene de un evento de verdad como un clic físico. La cámara
         * entrega los gestos por un bucle de `requestAnimationFrame`, no por
         * un evento de entrada, así que para el navegador nunca cuenta como
         * gesto de usuario. No hay forma de sortear esto desde el código: es
         * la misma barrera que frena a los pop-ups de publicidad.
         *
         * La salida es navegar en la misma pestaña en vez de abrir una
         * nueva — eso sí lo permite siempre, con gesto de mano o sin él.
         */
        if (objetivo === pressEl.current && objetivo instanceof HTMLElement) {
          const enlace = objetivo.closest('a[href]')
          if (enlace instanceof HTMLAnchorElement && enlace.target === '_blank') {
            window.location.href = enlace.href
          } else {
            objetivo.click()
          }
        }
      }
      pressEl.current = null
      el?.classList.remove('cursor-mano-clic')
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

        const detectadas = r.landmarks.map((l, i) => {
          const etiqueta = r.handedness[i]?.[0]?.categoryName ?? 'Right'
          return { p: l as Punto[], esDerecha: invRef.current ? etiqueta === 'Left' : etiqueta === 'Right' }
        })

        /*
         * Marco de foto: las dos manos en escuadra, para abrir una ventana en
         * blanco y negro entre ellas (ver `esMarco` en manos.ts).
         *
         * Se comprueba antes de repartir por mano y, si está en curso, sustituye
         * el resto de gestos de las dos — igual que el dedo que apunta pausa la
         * suya —, porque una escuadra sostenida también cumple a medias el
         * criterio del puño o de la palanca de scroll, y no tiene sentido que la
         * página se mueva sola mientras alguien intenta encuadrar.
         */
        const izquierda = detectadas.find((m) => !m.esDerecha)
        const derecha = detectadas.find((m) => m.esDerecha)
        const marcoActivo =
          detectadas.length === 2 && !!izquierda && !!derecha && esMarco(izquierda.p, derecha.p)

        if (marcoActivo && izquierda && derecha) {
          hayControl = true
          hayCamara = true
          velocidad = 0
          clicDerecha.current = false
          clicIzquierda.current = false

          /*
           * La ventana en directo: un rectángulo con esquinas opuestas en el
           * centro de cada mano, en píxeles de pantalla.
           *
           * `clip-path` y no mover/redimensionar el elemento por `top`/`left`/
           * `width`/`height`: un solo estilo que se puede escribir entero cada
           * fotograma sin leer el anterior, y sin el reflow que sí dispara
           * cambiar el tamaño de un elemento normal. Espejo en X, igual que el
           * resto de la mano.
           */
          const c1 = centro(izquierda.p)
          const c2 = centro(derecha.p)
          const x1 = (1 - c1.x) * window.innerWidth
          const x2 = (1 - c2.x) * window.innerWidth
          const y1 = c1.y * window.innerHeight
          const y2 = c2.y * window.innerHeight
          const iz = Math.min(x1, x2)
          const de = Math.max(x1, x2)
          const arr = Math.min(y1, y2)
          const ab = Math.max(y1, y2)
          const el = marcoVentana.current
          if (el) {
            el.style.clipPath = `polygon(${iz}px ${arr}px, ${de}px ${arr}px, ${de}px ${ab}px, ${iz}px ${ab}px)`
            el.style.opacity = '1'
          }
          if (!marcoActivoAntes.current) marcoActivoDesde.current = ahora
        } else {
          if (marcoVentana.current) marcoVentana.current.style.opacity = '0'
          // Se acaba de soltar un marco que estuvo abierto un rato: el corte
          // a la siguiente sección. Menos que `SOSTEN_MARCO` es cruzar la
          // forma de camino a otra cosa, no una intención de verdad.
          if (marcoActivoAntes.current && ahora - marcoActivoDesde.current > SOSTEN_MARCO) {
            avanzarSeccion()
          }
        }
        marcoActivoAntes.current = marcoActivo

        for (const { p, esDerecha } of marcoActivo ? [] : detectadas) {
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
          if (el) {
            el.style.display = 'none'
            el.classList.remove('cursor-mano-clic')
          }
          clicDerecha.current = false
          clicIzquierda.current = false
          // Ninguna mano señala: se suelta lo que estuviera bajo el cursor,
          // para no dejar un botón "iluminado" o a medio presionar cuando la
          // mano se baja de golpe.
          if (hoverEl.current) {
            despacharPuntero('pointerout', hoverEl.current, -1, -1)
            despacharPuntero('pointerleave', hoverEl.current, -1, -1, { bubbles: false })
            despacharRaton('mouseout', hoverEl.current, -1, -1)
            despacharRaton('mouseleave', hoverEl.current, -1, -1, { bubbles: false })
            hoverEl.current = null
          }
          pressEl.current = null
        }

        // Mano fuera de cuadro: se suelta la referencia, no el zoom. Así se
        // puede dejar un encuadre puesto y bajar el brazo.
        if (!hayCamara) refPinza.current = null

        if (!hayControl) velocidad = 0
        setVisto((s) =>
          s.control === hayControl && s.camara === hayCamara ? s : { control: hayControl, camara: hayCamara },
        )
        dibujar(r.landmarks as Punto[][], marcoActivo)
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

  function dibujar(listas: Punto[][], marco: boolean) {
    const cv = lienzo.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    ctx.clearRect(0, 0, cv.width, cv.height)
    for (const p of listas) {
      // Espejo, para que la mano de la pantalla se mueva como la de verdad.
      const X = (i: number) => (1 - p[i].x) * cv.width
      const Y = (i: number) => p[i].y * cv.height
      // El esqueleto entero cambia a blanco mientras se sostiene el marco de
      // foto: es la única señal de que la cámara ya reconoció el gesto antes
      // de que se cumpla la espera y dispare de verdad.
      ctx.strokeStyle = marco ? 'rgba(245,244,241,0.9)' : 'rgba(59,224,208,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (const [a, b] of HUESOS) {
        ctx.moveTo(X(a), Y(a))
        ctx.lineTo(X(b), Y(b))
      }
      ctx.stroke()
      ctx.fillStyle = marco ? '#F5F4F1' : '#FF3DA6'
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

      {/*
        La ventana del marco de foto: blanco y negro, pero solo dentro del
        rectángulo que dibujan las dos manos.

        `backdrop-filter` y no `filter`: `filter` sobre un elemento pinta *su
        propio* contenido, y este `div` no tiene ninguno — lo que hay que
        desaturar es lo que ya está pintado detrás (la escena 3D, el HUD, el
        relato), y eso es justo lo que `backdrop-filter` toma de fondo. El
        `clip-path` es lo único que cambia cada fotograma —ver el bucle de
        detección—; la opacidad sí lleva transición, para que la ventana no
        aparezca ni desaparezca de un tirón al cerrar o abrir la escuadra.
      */}
      <div
        ref={marcoVentana}
        className="pointer-events-none fixed inset-0 z-40 opacity-0 transition-opacity duration-150"
        style={{ backdropFilter: 'grayscale(1)', WebkitBackdropFilter: 'grayscale(1)' }}
        aria-hidden="true"
      />

      <div className="pointer-events-none fixed bottom-5 left-5 z-40 md:bottom-8 md:left-8">
        {/* El vídeo nunca se muestra: solo alimenta al detector. El usuario ve el
            esqueleto dibujado, que es lo único que la página llega a usar. */}
        <video ref={video} playsInline muted className="hidden" />

      {!activo && (
        <div className="relative">
          {/*
            La flecha de cómic.

            Un botón discreto en una esquina no gana el pulso visual a una
            escena 3D detrás — comprobado, es justo lo que pasaba antes de
            esto: nadie llegaba a probar el control por gestos porque nadie
            llegaba a mirar ahí. La flecha, torcida y de rotulador grueso como
            un bocadillo de viñeta, señala el botón desde arriba, y no se
            apaga sola: pedido así a propósito, no todo el mundo llega a esta
            sección en los primeros segundos de la visita. `filter:
            drop-shadow` en vez de `box-shadow` —ver `.boton-manos-pulso` en
            index.css— es lo que permite dejarla corriendo sin que compita
            con el scroll.
          */}
          <div
            /* -top-24: la flecha (70 px) más su rótulo (~20 px) miden más
               que un simple -top-16 — comprobado, con menos se metía por
               debajo del propio botón. Sin z-index: los dos vecinos ya
               están uno encima del otro sin pisarse, no hace falta forzar
               el orden de pintado. */
            className="pointer-events-none absolute -top-24 left-1 md:-top-28"
            aria-hidden="true"
          >
            <svg width="72" height="70" viewBox="0 0 72 70" fill="none" className="flecha-comic">
              <path
                d="M62 6C48 4 22 10 15 28c-4 10 1 20 11 24"
                stroke="#0A0A12"
                strokeWidth="7.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M62 6C48 4 22 10 15 28c-4 10 1 20 11 24"
                stroke="#FFE45C"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M17 44 26 52 29 39" fill="#FFE45C" stroke="#0A0A12" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <span className="golpe -mt-2 block -rotate-6 text-center text-[0.85rem]">¡PRUEBA!</span>
          </div>

          <button
            onClick={estado === 'arrancando' ? undefined : encender}
            disabled={estado === 'arrancando'}
            className="boton-manos-pulso pointer-events-auto flex items-center gap-2.5 border-2 bg-ink/75 px-3.5 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur-sm transition-colors hover:bg-ink/90 disabled:opacity-60"
            style={{ borderColor: '#3BE0D0', color: '#3BE0D0' }}
          >
            <span aria-hidden>✋</span>
            {estado === 'arrancando' ? 'Cargando…' : 'Manejar con las manos'}
          </button>
        </div>
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
            {/* Un icono por gesto, junto a la frase que ya lo explicaba: la
                señal se lee en un vistazo y el texto la confirma para quien
                quiera el detalle. */}
            <div className="flex items-start gap-2">
              <div className="flex shrink-0 -space-x-1 pt-0.5">
                <IconoDeslizar className="h-6 w-6" />
                <IconoLateral className="h-6 w-6" />
                <IconoPuno className="h-6 w-6" />
              </div>
              <p className="normal-case tracking-normal text-paper/50">
                Sube o baja la mano para avanzar y retroceder. En el centro, muévela a un lado para
                cambiar de personaje. Cierra el puño para frenar.
              </p>
            </div>
            <p className="pt-1.5" style={{ color: visto.camara ? '#FF3DA6' : 'rgba(245,244,241,0.3)' }}>
              ● Izquierda · {visto.camara ? 'cámara' : 'sin mano'}
            </p>
            <div className="flex items-start gap-2">
              <div className="flex shrink-0 -space-x-1 pt-0.5">
                <IconoPellizco className="h-6 w-6" />
                <IconoPuno className="h-6 w-6" color="#FF3DA6" />
              </div>
              <p className="normal-case tracking-normal text-paper/50">
                Separa el pulgar del índice para acercar la cámara y júntalos para alejarla. Puño
                para volver al encuadre.
              </p>
            </div>
            <p className="pt-1.5" style={{ color: '#3BE0D0' }}>
              ● Un dedo · cursor
            </p>
            <div className="flex items-start gap-2">
              <IconoDedo className="h-6 w-6 shrink-0 pt-0.5" />
              <p className="normal-case tracking-normal text-paper/50">
                Con cualquier mano, estira solo el índice: aparece un cursor que sigue a la punta
                del dedo. Junta el pulgar al índice para hacer clic, como en un ratón normal.
              </p>
            </div>
            <p className="pt-1.5" style={{ color: '#F5F4F1' }}>
              ● Las dos manos · marco
            </p>
            <div className="flex items-start gap-2">
              <IconoMarco className="h-6 w-6 shrink-0 pt-0.5" />
              <p className="normal-case tracking-normal text-paper/50">
                Haz una escuadra con el pulgar y el índice en cada mano y sepáralas, como al
                encuadrar una foto: se abre una ventana en blanco y negro entre ellas que sigue el
                movimiento. Suéltala tras un momento y la página corta a la siguiente sección.
              </p>
            </div>
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
            <button
              onClick={alternarBN}
              className="flex-1 border-r border-paper/10 px-2 py-2.5 text-paper/55 transition-colors hover:text-paper"
              title="Blanco y negro fijo para todo el sitio, sin necesidad de sostener el gesto"
            >
              {enBN ? '◐ Color' : '◑ B/N'}
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
