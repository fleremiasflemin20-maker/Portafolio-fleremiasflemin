import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * La sombra del suelo, falsa.
 *
 * Sin ella la figura flota: no hay plano bajo sus pies, así que el ojo no tiene
 * dónde apoyarla y se lee como un recorte pegado sobre el fondo. Una sombra
 * proyectada de verdad costaría un pase entero de mapa de sombras sobre 120.000
 * triángulos, para un óvalo difuso que nadie mira de cerca.
 *
 * La textura se dibuja una vez en un lienzo de 128 px: un degradado radial con
 * el borde suave. A esta escala no se distingue de una calculada.
 */
export function Sombra({ color = '#0A0A12' }: { color?: string }) {
  const textura = useMemo(() => {
    const l = document.createElement('canvas')
    l.width = l.height = 128
    const g = l.getContext('2d')!
    const rad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    rad.addColorStop(0, 'rgba(0,0,0,0.75)')
    rad.addColorStop(0.45, 'rgba(0,0,0,0.35)')
    rad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rad
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(l)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      {/* Elipse, no círculo: una sombra vista en escorzo es más ancha que
          profunda, y un círculo perfecto se nota plano. */}
      <circleGeometry args={[0.75, 48]} />
      <meshBasicMaterial
        map={textura}
        transparent
        opacity={0.9}
        depthWrite={false}
        color={color}
        toneMapped={false}
      />
    </mesh>
  )
}
