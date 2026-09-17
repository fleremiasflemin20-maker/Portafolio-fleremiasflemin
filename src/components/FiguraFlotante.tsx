import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  centro,
  contarDedos,
  pinza,
  referenciaValida,
  zoomDesdePinza,
  RUTA_MODELO_MANO,
  RUTA_WASM,
  type Punto,
} from '../lib/manos'
import { PERSONAJES_3D, type Personaje3D } from '../lib/personajes3d'
import { Modelo, precargarPersonaje } from './ModeloPersonaje'

const TINTA = '#3BE0D0'

/** Radio, en unidades de mundo, al que se normaliza cada figura: una pieza
    escaneada a metros reales y otra generada por IA a cualquier otra escala
    acaban ocupando el mismo hueco sobre la palma. */
const TAMANO_OBJETIVO = 1.1
/** Lado del cubo del tesseract, holgado sobre `TAMANO_OBJETIVO` para que la
    figura quede dentro sin rozar las aristas. */
const TAMANO_TESSERACT = TAMANO_OBJETIVO * 1.55
/** Cuánto sube el centro de la figura sobre el punto de la mano — apenas lo
    justo para que no quede tapada por los propios dedos. El resto del
    movimiento es 1:1 con la mano, sin más desvío que este. */
const ALTURA_SOBRE_PALMA = 0.15
/** Detección a 24 fps, igual que `ControlManos`: no le quita fotogramas a la
    escena 3D, que sí necesita ir a la frecuencia de la pantalla. */
const PERIODO = 1000 / 24
/** Proporción con la que se pide la cámara — ver `getUserMedia` más abajo.
    Hace falta para deshacer el recorte que aplica `object-cover` cuando la
    proporción del hueco en pantalla no es la misma que la de la imagen. */
const ASPECTO_CAMARA = 640 / 480
/** Distancia de cámara con la pinza en su valor de referencia (zoom = 1).
    `zoomDesdePinza` devuelve entre 0.55 y 1.6 — con esta base, la cámara
    recorre de 2.75 a 8: bastante más cerca que el encuadre fijo de antes. */
const DISTANCIA_CAMARA_BASE = 5
/** Cuánto tarda la posición en alcanzar a la mano. Más alto que el resto de
    amortiguaciones del sitio (`CamaraRig` usa 4.2) a propósito: aquí la mano
    hace de cursor, y un cursor perezoso se siente roto, no elegante. */
const LAMBDA_POSICION = 14
const LAMBDA_ZOOM = 4
/** Milisegundos que hay que sostener el mismo número de dedos antes de que
    cuente como elección. Sin esto, el paso de dos dedos a tres —que pasa por
    "dos y medio" un par de fotogramas— dispararía un salto de más. */
const ESPERA_DEDOS = 220

type Estado = 'arrancando' | 'activo' | 'error'

/**
 * Lo que escribe el bucle de detección — fuera de React, un `requestAnimationFrame`
 * suelto — y lee `useFrame` dentro del lienzo, mismo patrón que `manos.zoom` en
 * `CamaraRig.tsx`: si esto fuera estado de React, cada fotograma de cámara
 * repintaría el árbol entero en vez de solo mover un objeto en la GPU.
 */
type Objetivo = { x: number; y: number; visible: boolean }
type ZoomRef = { valor: number; activo: boolean }

/**
 * Deshace el recorte de `object-cover` cuando la proporción del hueco en
 * pantalla no es la 4:3 de la cámara.
 *
 * La usan dos capas distintas — el retículo 2D del HUD y la figura 3D — y
 * las dos tienen que coincidir siempre en el mismo punto de la mano, así que
 * viven de la misma cuenta en vez de cada una con la suya.
 */
function corregirRecorte(x: number, y: number, aspectoHueco: number): { x: number; y: number } {
  if (aspectoHueco > ASPECTO_CAMARA) {
    const fraccion = ASPECTO_CAMARA / aspectoHueco
    return { x, y: (y - (1 - fraccion) / 2) / fraccion }
  }
  const fraccion = aspectoHueco / ASPECTO_CAMARA
  return { x: (x - (1 - fraccion) / 2) / fraccion, y }
}

/**
 * Un pitido corto de confirmación, sintetizado con osciladores — nada de
 * archivo de audio: dos tonos ascendentes y limpios, el mismo lenguaje que
 * cualquier interfaz de ciencia ficción usa para decir "recibido" sin
 * palabras. Suena cada vez que cambia la figura, venga el cambio de los
 * dedos, de las flechas o del teclado.
 */
function sonidoCambioFigura(ctx: AudioContext) {
  const ahora = ctx.currentTime
  const maestro = ctx.createGain()
  maestro.gain.value = 0.16
  maestro.connect(ctx.destination)

  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(620, ahora)
  osc1.frequency.exponentialRampToValueAtTime(1180, ahora + 0.09)
  const g1 = ctx.createGain()
  g1.gain.setValueAtTime(0.0001, ahora)
  g1.gain.linearRampToValueAtTime(1, ahora + 0.008)
  g1.gain.exponentialRampToValueAtTime(0.001, ahora + 0.22)
  osc1.connect(g1)
  g1.connect(maestro)
  osc1.start(ahora)
  osc1.stop(ahora + 0.24)

  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(1860, ahora + 0.03)
  osc2.frequency.exponentialRampToValueAtTime(2400, ahora + 0.1)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0.0001, ahora + 0.03)
  g2.gain.linearRampToValueAtTime(0.5, ahora + 0.038)
  g2.gain.exponentialRampToValueAtTime(0.001, ahora + 0.18)
  osc2.connect(g2)
  g2.connect(maestro)
  osc2.start(ahora + 0.03)
  osc2.stop(ahora + 0.2)
}

/**
 * Centra la figura en su propio origen y la escala a un tamaño común.
 *
 * Las piezas de este cajón no comparten unidad: el escaneo de Gogeta viene en
 * metros reales y las generadas con Meshy en lo que sea que decidiera el
 * modelo. Sin este ajuste, una aparecería del tamaño de un dedal y la
 * siguiente le taparía la mano entera al pasar de una a otra.
 */
function ModeloEscalado({ personaje }: { personaje: Personaje3D }) {
  const grupo = useRef<THREE.Group>(null)

  useEffect(() => {
    const g = grupo.current
    if (!g) return
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateMatrixWorld(true)
    const caja = new THREE.Box3().setFromObject(g)
    const tam = new THREE.Vector3()
    caja.getSize(tam)
    const c = new THREE.Vector3()
    caja.getCenter(c)
    const radio = Math.max(tam.x, tam.y, tam.z, 1e-3)
    const escala = TAMANO_OBJETIVO / radio
    g.scale.setScalar(escala)
    g.position.set(-c.x * escala, -c.y * escala, -c.z * escala)
  }, [personaje])

  return (
    <group ref={grupo}>
      <Modelo personaje={personaje} />
    </group>
  )
}

/**
 * La jaula: un cubo exterior, uno interior más pequeño y las ocho líneas que
 * conectan cada esquina con su pareja — el mismo dibujo con el que se suele
 * representar un hipercubo, que es justo lo que hace que se lea como
 * "tesseract" y no como una caja cualquiera.
 *
 * Gira entera de una pieza en vez de que el cubo interior lleve su propio
 * giro: con los dos girando por separado, las líneas que los conectan
 * tendrían que recalcularse cada fotograma para seguir tocando las esquinas
 * — aquí, como todo gira junto, un único `group` basta y las líneas nunca se
 * despegan de donde deben.
 */
function Tesseract({ tamano }: { tamano: number }) {
  const grupo = useRef<THREE.Group>(null)

  const { exterior, interior, conectores } = useMemo(() => {
    const mitad = tamano / 2
    const mitadInt = tamano * 0.27
    const exterior = new THREE.EdgesGeometry(new THREE.BoxGeometry(tamano, tamano, tamano))
    const interior = new THREE.EdgesGeometry(new THREE.BoxGeometry(mitadInt * 2, mitadInt * 2, mitadInt * 2))
    const signos = [-1, 1]
    const puntos: number[] = []
    for (const sx of signos) {
      for (const sy of signos) {
        for (const sz of signos) {
          puntos.push(sx * mitad, sy * mitad, sz * mitad, sx * mitadInt, sy * mitadInt, sz * mitadInt)
        }
      }
    }
    const conectores = new THREE.BufferGeometry()
    conectores.setAttribute('position', new THREE.Float32BufferAttribute(puntos, 3))
    return { exterior, interior, conectores }
  }, [tamano])

  useFrame((_, dt) => {
    const g = grupo.current
    if (!g) return
    g.rotation.y += dt * 0.18
    g.rotation.x += dt * 0.07
  })

  return (
    <group ref={grupo}>
      <lineSegments geometry={exterior}>
        <lineBasicMaterial color={TINTA} transparent opacity={0.5} />
      </lineSegments>
      <lineSegments geometry={interior}>
        <lineBasicMaterial color={TINTA} transparent opacity={0.8} />
      </lineSegments>
      <lineSegments geometry={conectores}>
        <lineBasicMaterial color={TINTA} transparent opacity={0.22} />
      </lineSegments>
    </group>
  )
}

/**
 * Acerca o aleja la cámara según la pinza de la mano izquierda.
 *
 * Aparte de `AnclaMano` y no dentro: esa se remonta entera cada vez que
 * cambia la figura —lleva `key={actual.id}` en el `Canvas`—, y con el zoom
 * viviendo ahí dentro, cada cambio de figura resetaba la cámara a la
 * distancia por defecto de golpe, deshaciendo cualquier acercamiento que ya
 * hubiera hecho la mano izquierda. Aquí, fuera de ese remontaje, la cámara
 * sigue exactamente donde estaba al cambiar de pieza.
 */
function ControlCamara({ zoomRef }: { zoomRef: MutableRefObject<ZoomRef> }) {
  const suaveZoom = useRef(1)
  const { camera } = useThree()

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 1 / 20)
    const cam = camera as THREE.PerspectiveCamera
    suaveZoom.current = THREE.MathUtils.damp(suaveZoom.current, zoomRef.current.valor, LAMBDA_ZOOM, dt)
    cam.position.z = DISTANCIA_CAMARA_BASE * suaveZoom.current
    cam.updateProjectionMatrix()
  })

  return null
}

/**
 * Ancla la figura y su jaula al punto de la mano derecha — la otra mano, la
 * que hace de zoom, la gobierna `ControlCamara` aparte.
 *
 * Quieta a propósito: nada de giro ni de vaivén en la figura. La jaula sí
 * gira sola —ver `Tesseract`— porque ahí el movimiento es del decorado, no
 * de la pieza que se está mirando.
 */
function AnclaMano({
  personaje,
  objetivo,
}: {
  personaje: Personaje3D
  objetivo: MutableRefObject<Objetivo>
}) {
  const grupo = useRef<THREE.Group>(null)
  const suave = useRef({ x: 0, y: ALTURA_SOBRE_PALMA, escala: 0 })
  const { camera, size } = useThree()

  useFrame((_, dtBruto) => {
    const g = grupo.current
    if (!g) return
    const dt = Math.min(dtBruto, 1 / 20)
    const cam = camera as THREE.PerspectiveCamera

    const aspectoHueco = size.width / size.height
    const { x, y } = corregirRecorte(objetivo.current.x, objetivo.current.y, aspectoHueco)

    const alturaVisible = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z
    const anchoVisible = alturaVisible * aspectoHueco
    const destX = (x - 0.5) * anchoVisible
    const destY = -(y - 0.5) * alturaVisible + ALTURA_SOBRE_PALMA

    suave.current.x = THREE.MathUtils.damp(suave.current.x, destX, LAMBDA_POSICION, dt)
    suave.current.y = THREE.MathUtils.damp(suave.current.y, destY, LAMBDA_POSICION, dt)
    suave.current.escala = THREE.MathUtils.damp(suave.current.escala, objetivo.current.visible ? 1 : 0, 6, dt)

    g.position.set(suave.current.x, suave.current.y, 0)
    g.scale.setScalar(suave.current.escala)
  })

  return (
    <group ref={grupo} scale={0}>
      <Suspense fallback={null}>
        <ModeloEscalado personaje={personaje} />
      </Suspense>
      <Tesseract tamano={TAMANO_TESSERACT} />
    </group>
  )
}

/**
 * Las figuras del cajón de "3D & IA", con control total a dos manos: la
 * derecha hace de cursor —lo mismo que antes— y además elige figura por
 * número de dedos; la izquierda, nueva aquí, solo acerca o aleja la cámara
 * con la pinza. Mismo vocabulario de gestos que ya usa `ControlManos`
 * (`pinza`, `zoomDesdePinza`, la propia idea de repartir el trabajo entre
 * las dos manos), aplicado a sostener una figura en vez de navegar la
 * página.
 *
 * El fondo tipo Jarvis —retículo, esquinas, barrido, la jaula alrededor de
 * la figura— no es solo decoración: es lo que deja claro que la cámara está
 * leyendo la mano de verdad, algo que un vídeo mudo de fondo no transmite
 * por sí solo.
 *
 * Cámara propia y no la de `ControlManos`: esa ya está ocupada gobernando la
 * página entera (scroll, zoom, cursor) y aquí las manos hacen justo lo
 * contrario, sostener algo, así que mezclar los dos gestos en la misma
 * detección los habría hecho estorbarse.
 */
export function FiguraFlotante({ indiceInicial, onCerrar }: { indiceInicial: number; onCerrar: () => void }) {
  const [estado, setEstado] = useState<Estado>('arrancando')
  const [fallo, setFallo] = useState('')
  const [indice, setIndice] = useState(indiceInicial)
  const actual = PERSONAJES_3D[indice]

  /* Mismo ajuste que `ControlManos`, y de la misma llave de `localStorage`:
     si ya se corrigió allí qué mano es cuál, esta vista hereda la elección
     sin que haga falta volver a calibrarla aparte. */
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
  const flujo = useRef<MediaStream | null>(null)
  const detector = useRef<HandLandmarker | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const bucle = useRef(0)
  /** El cero es el centro de la imagen, visible cuando la mano aún no ha
      aparecido: mejor eso que una figura arrancando desde una esquina. */
  const objetivo = useRef<Objetivo>({ x: 0.5, y: 0.5, visible: false })
  const zoomRef = useRef<ZoomRef>({ valor: 1, activo: false })
  /** El retículo del HUD: se mueve por estilo directo en el mismo bucle de
      detección, no por estado de React — igual que el cursor de `ControlManos`. */
  const reticulo = useRef<HTMLDivElement>(null)
  const zoomTexto = useRef<HTMLSpanElement>(null)
  const zoomPunto = useRef<HTMLSpanElement>(null)
  /** Salta el pitido en el primer render: ahí `indice` "cambia" de nada a su
      valor inicial, y eso no es un cambio que el usuario haya pedido. */
  const primerIndice = useRef(true)

  const siguiente = useCallback(() => setIndice((i) => (i + 1) % PERSONAJES_3D.length), [])
  const anterior = useCallback(() => setIndice((i) => (i - 1 + PERSONAJES_3D.length) % PERSONAJES_3D.length), [])

  // Precarga las dos figuras vecinas, igual que en `CarruselMeshy`: cambiar
  // de pieza se siente instantáneo aunque el .glb pese varios megas.
  useEffect(() => {
    precargarPersonaje(PERSONAJES_3D[(indice + 1) % PERSONAJES_3D.length])
    precargarPersonaje(PERSONAJES_3D[(indice - 1 + PERSONAJES_3D.length) % PERSONAJES_3D.length])
  }, [indice])

  // El pitido: uno por cada cambio de figura, venga de los dedos, de las
  // flechas o del teclado — todos pasan por el mismo `setIndice`.
  useEffect(() => {
    if (primerIndice.current) {
      primerIndice.current = false
      return
    }
    if (audioCtx.current) sonidoCambioFigura(audioCtx.current)
  }, [indice])

  useEffect(() => {
    let cancelado = false

    async function arrancar() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        flujo.current = stream
        const v = video.current!
        v.srcObject = stream
        await v.play()

        // El contexto de audio se crea aquí y no al primer pitido: así ya
        // está listo antes de que el primer cambio de figura pueda pedirlo.
        // El clic que abrió esta vista ya cuenta como el gesto de usuario
        // que exige el navegador para permitir sonido.
        try {
          audioCtx.current = new AudioContext()
        } catch {
          /* Sin audio en este navegador: el resto de la vista sigue igual. */
        }

        // Carga diferida, igual que en `ControlManos`: el bulto de MediaPipe
        // no entra en el paquete de la página, solo lo pide quien abre esto.
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(RUTA_WASM)
        detector.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: RUTA_MODELO_MANO, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        })

        if (cancelado) return
        setEstado('activo')

        let ultima = 0
        /** Número de dedos que se lleva viendo seguido, y desde cuándo —
            para exigir `ESPERA_DEDOS` antes de que cuente como elección. */
        let cuentaCandidata = -1
        let cuentaDesde = 0
        /** Última cuenta que sí disparó un cambio, para no repetir el mismo
            salto fotograma a fotograma mientras la mano se mantiene quieta. */
        let cuentaFijada = -1
        /** Pinza con la que apareció la mano izquierda: el cero del zoom,
            igual que `refPinza` en `ControlManos`. */
        let refPinza: number | null = null

        const paso = (ahora: number) => {
          bucle.current = requestAnimationFrame(paso)
          const v2 = video.current
          const det = detector.current
          if (det && v2 && v2.readyState >= 2 && ahora - ultima >= PERIODO) {
            ultima = ahora
            const r = det.detectForVideo(v2, ahora)

            // Reparto por mano, mismo criterio que `ControlManos`: la
            // etiqueta de MediaPipe supone la imagen reflejada, y como aquí
            // no lo está, se lee al revés salvo que el interruptor diga lo
            // contrario.
            let principal: Punto[] | undefined
            let secundaria: Punto[] | undefined
            for (let i = 0; i < r.landmarks.length; i++) {
              const p = r.landmarks[i] as Punto[]
              const etiqueta = r.handedness[i]?.[0]?.categoryName ?? 'Right'
              const esDerecha = invRef.current ? etiqueta === 'Left' : etiqueta === 'Right'
              if (esDerecha) principal = p
              else secundaria = p
            }

            if (principal) {
              const punto = centro(principal)
              objetivo.current.x = punto.x
              objetivo.current.y = punto.y
              objetivo.current.visible = true

              /*
               * Elegir figura por número de dedos.
               *
               * Un dedo es la primera figura, dos la segunda... hasta cinco.
               * Cero —el puño— no elige nada: es la pose de "mano de paso",
               * la que se usa mientras solo se quiere mover la figura sin
               * disparar un cambio.
               */
              const n = contarDedos(principal)
              if (n !== cuentaCandidata) {
                cuentaCandidata = n
                cuentaDesde = ahora
              } else if (n >= 1 && n <= 5 && n !== cuentaFijada && ahora - cuentaDesde > ESPERA_DEDOS) {
                cuentaFijada = n
                setIndice(n - 1)
              }

              // El retículo del HUD, en el mismo punto que la figura —
              // deshecho el recorte, igual que en `AnclaMano`, y vuelto a
              // espejar aquí porque esta capa vive fuera del contenedor
              // volteado (ver el comentario del `return` más abajo).
              const { x, y } = corregirRecorte(punto.x, punto.y, window.innerWidth / window.innerHeight)
              const xPix = Math.min(window.innerWidth, Math.max(0, (1 - x) * window.innerWidth))
              const yPix = Math.min(window.innerHeight, Math.max(0, y * window.innerHeight))
              const ret = reticulo.current
              if (ret) {
                ret.style.transform = `translate(${xPix}px, ${yPix}px)`
                ret.style.opacity = '1'
              }
            } else {
              objetivo.current.visible = false
              cuentaCandidata = -1
              cuentaFijada = -1
              if (reticulo.current) reticulo.current.style.opacity = '0'
            }

            if (secundaria) {
              const v3 = pinza(secundaria)
              if (refPinza === null) refPinza = referenciaValida(v3)
              zoomRef.current.valor = zoomDesdePinza(v3, refPinza)
              zoomRef.current.activo = true
            } else {
              refPinza = null
              zoomRef.current.activo = false
            }

            if (zoomTexto.current) {
              // `zoomRef.current.valor` es el multiplicador de distancia de
              // `zoomDesdePinza`: más bajo es más cerca. El porcentaje que se
              // muestra es su inverso, para que "más zoom" se lea como un
              // número que sube y no como uno que baja.
              zoomTexto.current.textContent = `${Math.round(100 / zoomRef.current.valor)}%`
            }
            if (zoomPunto.current) {
              zoomPunto.current.style.color = zoomRef.current.activo ? TINTA : 'rgba(245,244,241,0.25)'
            }
          }
        }
        bucle.current = requestAnimationFrame(paso)
      } catch (e) {
        if (cancelado) return
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
    }

    arrancar()

    return () => {
      cancelado = true
      cancelAnimationFrame(bucle.current)
      flujo.current?.getTracks().forEach((t) => t.stop())
      flujo.current = null
      detector.current?.close()
      detector.current = null
      audioCtx.current?.close()
      audioCtx.current = null
    }
  }, [])

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'ArrowRight') siguiente()
      if (e.key === 'ArrowLeft') anterior()
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [onCerrar, siguiente, anterior])

  /*
   * A `document.body` con un portal, y no donde React lo monta de forma
   * natural dentro de `CarruselMeshy`.
   *
   * `position: fixed` deja de valer lo que dice su nombre en cuanto un
   * antepasado tiene `transform` — y aquí lo tiene: el envoltorio de scroll
   * suave de `smooth-scroll.ts` mueve la página entera así. Sin el portal,
   * este overlay quedaba encogido y descuadrado dentro de ese envoltorio en
   * vez de cubrir la pantalla — comprobado, `getBoundingClientRect` devolvía
   * un rectángulo más pequeño que la ventana y desplazado. `ControlManos` no
   * sufre esto porque vive fuera del envoltorio, como hermano directo en
   * `App.tsx`; a esto, que cuelga de un componente hundido en el relato, le
   * hace falta el portal para escapar del mismo modo.
   */
  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-hidden bg-ink">
      {/*
        Espejo compartido: el vídeo y el lienzo 3D viven dentro del mismo
        contenedor volteado con CSS. Así el punto normalizado que entrega
        MediaPipe —que llega sin reflejar, tal como lo capta el sensor— sirve
        tal cual para las dos capas, y ninguna se desalinea de la otra al
        voltear solo una.
      */}
      <div className="pointer-events-none absolute inset-0" style={{ transform: 'scaleX(-1)' }}>
        <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" />

        {/* El lavado cian: no es un filtro sobre el vídeo —eso también le
            cambiaría el color a la figura, que vive en el mismo espejo—,
            sino una capa aparte en `mix-blend-mode: color` encima. Mismo
            turquesa que el resto del sitio. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: '#0a2a28', mixBlendMode: 'color', opacity: 0.55 }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,224,208,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(59,224,208,0.12) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
            mixBlendMode: 'screen',
            opacity: 0.4,
          }}
        />

        {estado === 'activo' && (
          <Canvas className="absolute inset-0" camera={{ fov: 45, position: [0, 0, 5] }} gl={{ alpha: true }}>
            <ambientLight intensity={0.85} />
            <directionalLight position={[3, 5, 2]} intensity={1.4} />
            <spotLight position={[-3, 4, -3]} intensity={50} angle={0.9} penumbra={1} color="#3be0d0" />
            <ControlCamara zoomRef={zoomRef} />
            <AnclaMano key={actual.id} personaje={actual} objetivo={objetivo} />
          </Canvas>
        )}
      </div>

      {/* El barrido: una franja que cruza la pantalla de arriba abajo, en
          bucle. Ver `.barrido-jarvis` en index.css. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 barrido-jarvis"
        style={{ background: 'linear-gradient(rgba(59,224,208,0), rgba(59,224,208,0.16), rgba(59,224,208,0))' }}
      />

      {/* El retículo: sigue a la mano derecha por estilo directo — ver el
          bucle de detección más arriba. Fuera del contenedor espejado, para
          que el texto se lea del derecho. */}
      <div
        ref={reticulo}
        className="pointer-events-none absolute left-0 top-0 z-40 opacity-0 transition-opacity duration-200"
      >
        <svg width="132" height="132" viewBox="0 0 132 132" className="absolute -left-[66px] -top-[66px]">
          <circle cx="66" cy="66" r="50" fill="none" stroke={TINTA} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 7">
            <animateTransform attributeName="transform" type="rotate" from="0 66 66" to="360 66 66" dur="7s" repeatCount="indefinite" />
          </circle>
          <circle cx="66" cy="66" r="37" fill="none" stroke={TINTA} strokeOpacity="0.85" strokeWidth="1.3" strokeDasharray="1.5 5">
            <animateTransform attributeName="transform" type="rotate" from="360 66 66" to="0 66 66" dur="4.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="66" cy="66" r="2.5" fill={TINTA} />
          <line x1="66" y1="2" x2="66" y2="14" stroke={TINTA} strokeWidth="1.3" />
          <line x1="66" y1="118" x2="66" y2="130" stroke={TINTA} strokeWidth="1.3" />
          <line x1="2" y1="66" x2="14" y2="66" stroke={TINTA} strokeWidth="1.3" />
          <line x1="118" y1="66" x2="130" y2="66" stroke={TINTA} strokeWidth="1.3" />
        </svg>
        <div
          className="absolute left-[70px] top-[-10px] whitespace-nowrap font-mono text-[0.55rem] uppercase tracking-[0.15em]"
          style={{ color: TINTA }}
        >
          <p>Rastreo · lock</p>
          <p className="text-paper/45">{actual.nombre}</p>
        </div>
      </div>

      {/* Las esquinas: mismo motivo que el HUD fijo de `App.tsx`, para que
          esta vista se sienta parte del mismo sistema y no una pantalla
          aparte. */}
      {[
        'left-5 top-5 border-l border-t md:left-8 md:top-8',
        'right-5 top-5 border-r border-t md:right-8 md:top-8',
        'left-5 bottom-5 border-l border-b md:left-8 md:bottom-8',
        'right-5 bottom-5 border-r border-b md:right-8 md:bottom-8',
      ].map((c) => (
        <span
          key={c}
          className={`pointer-events-none absolute h-8 w-8 ${c}`}
          style={{ borderColor: TINTA, opacity: 0.5 }}
        />
      ))}

      {/* El resto del HUD: botones y texto, también fuera del espejo. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-5 md:p-8">
        <div className="pointer-events-auto flex w-full items-start justify-between">
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: TINTA }}>
            <p>{actual.nombre}</p>
            <p className="mt-0.5 text-paper/40">
              <span ref={zoomPunto} style={{ color: 'rgba(245,244,241,0.25)' }}>
                ●
              </span>{' '}
              Zoom <span ref={zoomTexto}>100%</span>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => {
                const n = !invertido
                setInvertido(n)
                try {
                  localStorage.setItem('manos-invertido', n ? '1' : '0')
                } catch {
                  /* Modo privado: se pierde al recargar y no pasa nada. */
                }
              }}
              title="Si las manos van cambiadas, púlsalo"
              className="border-2 bg-ink/70 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur-sm transition-colors hover:bg-ink/90"
              style={{ borderColor: TINTA, color: TINTA }}
            >
              ⇄
            </button>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="border-2 bg-ink/70 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur-sm transition-colors hover:bg-ink/90"
              style={{ borderColor: TINTA, color: TINTA }}
            >
              ✕ Salir
            </button>
          </div>
        </div>

        {estado === 'arrancando' && (
          <p className="pointer-events-auto max-w-xs border border-paper/15 bg-ink/85 p-4 text-center font-mono text-[0.62rem] uppercase tracking-[0.15em] text-paper/70 backdrop-blur-sm">
            Cargando la cámara y el rastreo de mano…
          </p>
        )}

        {estado === 'error' && (
          <p className="pointer-events-auto max-w-xs border border-paper/15 bg-ink/85 p-4 text-center font-mono text-[0.6rem] leading-relaxed text-paper/70 backdrop-blur-sm">
            {fallo}
          </p>
        )}

        {estado === 'activo' && (
          <div className="pointer-events-auto flex w-full items-center justify-between gap-4">
            <button
              type="button"
              aria-label="Figura anterior"
              onClick={anterior}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 bg-ink/70 backdrop-blur-sm transition-colors hover:bg-ink/90"
              style={{ borderColor: TINTA, color: TINTA }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            <p className="max-w-sm text-center font-mono text-[0.58rem] uppercase leading-relaxed tracking-[0.13em] text-paper/55">
              Mano derecha: la figura te sigue. Saca de 1 a 5 dedos para elegirla directamente.
              Mano izquierda: pinza para acercar o alejar la cámara.
            </p>

            <button
              type="button"
              aria-label="Figura siguiente"
              onClick={siguiente}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 bg-ink/70 backdrop-blur-sm transition-colors hover:bg-ink/90"
              style={{ borderColor: TINTA, color: TINTA }}
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <p className="pointer-events-none font-mono text-[0.5rem] uppercase tracking-[0.15em] text-paper/30">
          El vídeo se procesa en tu equipo y no se envía a ningún sitio.
        </p>
      </div>
    </div>,
    document.body,
  )
}
