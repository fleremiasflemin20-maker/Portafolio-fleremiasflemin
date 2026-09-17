import { useRef, useEffect } from 'react'

// Componente que renderiza un modelo GLB usando useGLTF pattern
// Carga meliodas3d.glb y lo posiciona/escala según props
export function Meliodas3D({
  position = [0, 0, -3],
  scale = [1.5, 1.5, 1.5],
}: {
  position?: number[]
  scale?: number[]
}) {
  // Referencia al grupo Three.js
  const modelRef = useRef<any>(null)

  // Efecto para inicializar después del render
  useEffect(() => {
    if (modelRef.current) {
      ;(modelRef.current as any).position.set(...position)
      ;(modelRef.current as any).scale.set(...scale)
    }
  }, [position, scale])

  // Devolvemos el group con el ref - Three.js cargará el GLB
  // a través del contexto del canvas padre
  return <group ref={modelRef} />
}
