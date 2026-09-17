import { useLayoutEffect, useMemo } from 'react'
import { Html, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Personaje3D } from '../lib/personajes3d'

/**
 * Carga de las figuras del cajón de "3D & IA": compartida entre el carrusel
 * (`CarruselMeshy`) y la vista flotante (`FiguraFlotante`) para que cargar un
 * modelo — simple o con mapas PBR sueltos — se resuelva en un solo sitio.
 */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
export const DRACO = `${BASE}/draco/`
export const rutaModelo = (p: Personaje3D) => `${BASE}/models/${p.carpeta ?? 'meshy'}/${p.archivo}.glb`
export const rutaTextura = (p: Personaje3D, archivo: string) => `${BASE}/textures/${p.carpeta ?? 'meshy'}/${archivo}`

/** Las piezas de Meshy traen el material horneado en el propio `.glb`. */
function ModeloSimple({ personaje }: { personaje: Personaje3D }) {
  const { scene } = useGLTF(rutaModelo(personaje))
  return <primitive object={scene} />
}

/**
 * Un escaneo fotogramétrico, en cambio, llega con un material de relleno: el
 * color real vive en mapas PBR sueltos que hay que montar a mano — mismo
 * criterio que `GogetaModel.tsx` en el proyecto original, sin el sombreado
 * cel ni las etapas: aquí solo hace falta la figura terminada.
 */
function ModeloPBR({ personaje }: { personaje: Personaje3D }) {
  const { scene } = useGLTF(rutaModelo(personaje), DRACO)
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

export function Modelo({ personaje }: { personaje: Personaje3D }) {
  return personaje.texturas ? <ModeloPBR personaje={personaje} /> : <ModeloSimple personaje={personaje} />
}

export function Cargando() {
  return (
    <Html center>
      <p className="whitespace-nowrap font-mono text-[0.68rem] uppercase tracking-[0.2em] text-paper/50">
        Cargando modelo…
      </p>
    </Html>
  )
}

/** Precarga el `.glb` y, si trae mapas PBR sueltos, sus cuatro texturas. */
export function precargarPersonaje(p: Personaje3D) {
  useGLTF.preload(rutaModelo(p), p.draco ? DRACO : undefined)
  if (p.texturas) {
    useTexture.preload(rutaTextura(p, p.texturas.map))
    useTexture.preload(rutaTextura(p, p.texturas.normalMap))
    useTexture.preload(rutaTextura(p, p.texturas.roughnessMap))
    useTexture.preload(rutaTextura(p, p.texturas.metalnessMap))
  }
}
