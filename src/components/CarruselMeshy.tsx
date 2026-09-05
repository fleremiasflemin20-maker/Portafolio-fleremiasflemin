import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as THREE from 'three'
import { PERSONAJES_3D, type Personaje3D } from '../lib/personajes3d'
import { carrusel3D } from '../lib/carrusel-3d'

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const DRACO = `${BASE}/draco/`
const ruta = (p: Personaje3D) => `${BASE}/models/${p.carpeta ?? 'meshy'}/${p.archivo}.glb`
const rutaTextura = (p: Personaje3D, archivo: string) => `${BASE}/textures/${p.carpeta ?? 'meshy'}/${archivo}`

/** Las piezas de Meshy traen el material horneado en el propio `.glb`. */
function ModeloSimple({ personaje }: { personaje: Personaje3D }) {
  const { scene } = useGLTF(ruta(personaje))
  return <primitive object={scene} />
}

/**
 * Un escaneo fotogramétrico, en cambio, llega con un material de relleno: el
 * color real vive en mapas PBR sueltos que hay que montar a mano — mismo
 * criterio que `GogetaModel.tsx` en el proyecto original, sin el sombreado
 * cel ni las etapas: aquí solo hace falta la figura terminada.
 */
function ModeloPBR({ personaje }: { personaje: Personaje3D }) {
  const { scene } = useGLTF(ruta(personaje), DRACO)
  const t = personaje.texturas!
  const maps = useTexture({
    map: rutaTextura(personaje, t.map),
    normalMap: rutaTextura(personaje, t.normalMap),
    roughnessMap: rutaTextura(personaje, t.roughnessMap),
    metalnessMap: rutaTextura(personaje, t.metalnessMap),
  })

  const geometry = useMemo(() => {
    let hallada: THREE.BufferGeometry | null = null
    scene.traverse((hijo) => {
      if (!hallada && (hijo as THREE.Mesh).isMesh) hallada = (hijo as THREE.Mesh).geometry
    })
    return hallada
  }, [scene])

  useLayoutEffect(() => {
    for (const [slot, textura] of Object.entries(maps) as [keyof typeof maps, THREE.Texture][]) {
      // glTF define el origen de UV arriba a la izquierda; TextureLoader carga
      // con flipY=true y la piel saldría del revés sin esto.
      textura.flipY = false
      textura.colorSpace = slot === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      textura.needsUpdate = true
    }
  }, [maps])

  if (!geometry) return null
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial {...maps} />
    </mesh>
  )
}

function Modelo({ personaje }: { personaje: Personaje3D }) {
  return personaje.texturas ? <ModeloPBR personaje={personaje} /> : <ModeloSimple personaje={personaje} />
}

function Cargando() {
  return (
    <Html center>
      <p className="whitespace-nowrap font-mono text-[0.68rem] uppercase tracking-[0.2em] text-paper/50">
        Cargando modelo…
      </p>
    </Html>
  )
}

/**
 * El cajón de figuras 3D, jugado como una selección de personaje: una malla a
 * pantalla, flechas a los lados y un contador de fichero — el mismo lenguaje
 * que la rueda de faceta, pero para las piezas sueltas en vez de para las tres
 * facetas del CV.
 *
 * Vive dentro de `Expediente.tsx`, solo cuando la faceta activa es "3D & IA":
 * no tiene sentido en Software o Hotel Tech, donde el expediente ya cuenta la
 * historia con proyectos reales.
 *
 * Las flechas del teclado ya las usa `App.tsx` para girar la rueda de faceta.
 * Para que no compitan por la misma tecla, este carrusel solo las escucha
 * cuando está a la vista — lo dice `carrusel3D.enVista`, escrito por el
 * `IntersectionObserver` de aquí abajo y leído por el manejador global. Fuera
 * de vista, ArrowLeft/ArrowRight vuelven a girar la rueda como siempre.
 */
export function CarruselMeshy() {
  const [indice, setIndice] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const actual = PERSONAJES_3D[indice]

  useEffect(() => {
    const el = panel.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { carrusel3D.enVista = e.isIntersecting }, { threshold: 0.5 })
    obs.observe(el)
    return () => {
      obs.disconnect()
      carrusel3D.enVista = false
    }
  }, [])

  const siguiente = useCallback(() => setIndice((i) => (i + 1) % PERSONAJES_3D.length), [])
  const anterior = useCallback(() => setIndice((i) => (i - 1 + PERSONAJES_3D.length) % PERSONAJES_3D.length), [])

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (!carrusel3D.enVista) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        siguiente()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        anterior()
      }
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [siguiente, anterior])

  // Precarga las dos figuras vecinas: cambiar de personaje se siente
  // instantáneo aunque el .glb de al lado pese varios megas.
  useEffect(() => {
    const vecinas = [
      PERSONAJES_3D[(indice + 1) % PERSONAJES_3D.length],
      PERSONAJES_3D[(indice - 1 + PERSONAJES_3D.length) % PERSONAJES_3D.length],
    ]
    for (const p of vecinas) {
      useGLTF.preload(ruta(p), p.draco ? DRACO : undefined)
      if (p.texturas) {
        useTexture.preload(rutaTextura(p, p.texturas.map))
        useTexture.preload(rutaTextura(p, p.texturas.normalMap))
        useTexture.preload(rutaTextura(p, p.texturas.roughnessMap))
        useTexture.preload(rutaTextura(p, p.texturas.metalnessMap))
      }
    }
  }, [indice])

  return (
    <div ref={panel} className="w-full border border-paper/10 bg-ink/60 p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">
          Personajes · 3D
        </p>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em]" style={{ color: 'var(--tinta)' }}>
          {String(indice + 1).padStart(2, '0')} / {String(PERSONAJES_3D.length).padStart(2, '0')}
        </p>
      </div>

      <div className="relative mt-5 h-[380px] w-full overflow-hidden border border-paper/10 bg-ink/40 md:h-[460px]">
        <Canvas dpr={[1, 1.6]} camera={{ fov: 40 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 2]} intensity={1.3} />
          <spotLight position={[-3, 4, -3]} intensity={45} angle={0.9} penumbra={1} color="#3be0d0" />

          <Suspense fallback={<Cargando />}>
            <Bounds key={actual.id} fit clip observe margin={1.35}>
              <Center>
                <Modelo personaje={actual} />
              </Center>
            </Bounds>
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={1.1}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI - Math.PI / 4}
          />
        </Canvas>

        {/* Flechas superpuestas, como un selector de personaje de videojuego.
            El teclado hace lo mismo (ver el listener de arriba); los botones
            son la vía que también funciona en móvil y sin descubrir la tecla. */}
        <button
          type="button"
          aria-label="Figura anterior"
          onClick={anterior}
          className="group absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/15 bg-ink/70 text-paper/70 backdrop-blur-sm transition-colors duration-200 hover:text-ink"
          style={{ borderColor: 'var(--tinta)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tinta)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Figura siguiente"
          onClick={siguiente}
          className="group absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/15 bg-ink/70 text-paper/70 backdrop-blur-sm transition-colors duration-200 hover:text-ink"
          style={{ borderColor: 'var(--tinta)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tinta)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/35">
          Arrastra para girar · flechas para cambiar
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg uppercase leading-none md:text-xl">{actual.nombre}</h3>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-paper/35">
          {actual.origen ?? 'Generado con Meshy AI'}
        </p>
      </div>
    </div>
  )
}
