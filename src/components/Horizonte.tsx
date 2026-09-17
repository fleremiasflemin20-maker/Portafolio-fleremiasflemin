import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { scroll } from '../lib/scroll-state'

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const CIUDADES = [`${BASE}/textures/ciudad-1.webp`, `${BASE}/textures/ciudad-2.webp`, `${BASE}/textures/ciudad-3.webp`]

/** Radio del cilindro. La cámara no pasa de ~5, así que siempre queda dentro. */
const RADIO = 9
const ALTURA = 14
/*
 * Circunferencia 56.5 × alto 14 = 4:1 desplegado. Con 2 vueltas cada copia cae
 * en 2:1, casi la proporción nativa de las imágenes.
 *
 * La repetición es normal, no en espejo. En espejo desaparecería la costura,
 * pero el texto de las vallas de la imagen sale invertido en una de cada dos
 * copias — y una palabra al revés se lee como un fallo, mientras que una
 * costura en una foto aérea apenas se nota y casi siempre queda fuera de cuadro.
 */
const REPITE = 2
const GIRO = 0.026

/**
 * Transición entre imágenes, al estilo de una viñeta.
 *
 * Un fundido cruzado normal es lenguaje de cine; aquí la página habla en
 * cómic y videojuego, así que el cambio se hace con un **barrido diagonal de
 * borde duro**, como cuando una viñeta empuja a la siguiente. La diagonal se
 * calcula sobre las coordenadas de textura, y el borde lleva un dentado fino
 * para que no parezca una máscara de software.
 */
const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT = `
  uniform sampler2D uActual;
  uniform sampler2D uSiguiente;
  uniform float uMezcla;      // 0 = actual, 1 = siguiente
  uniform float uRepite;
  uniform vec2  uDesplaza;
  uniform vec3  uTinte;
  varying vec2 vUv;

  void main() {
    vec2 uv = vec2(vUv.x * uRepite + uDesplaza.x, vUv.y);

    vec4 a = texture2D(uActual, uv);
    vec4 b = texture2D(uSiguiente, uv);

    // Frente diagonal. El 1.8 hace que la diagonal cruce toda la altura y algo
    // más, o si no el barrido termina en las esquinas antes que en el centro.
    float frente = vUv.x + vUv.y * 0.55;

    // Dentado: un seno fino sobre el frente. Sin él el borde es una línea
    // recta perfecta y se lee como una máscara, no como tinta.
    frente += sin(vUv.y * 90.0) * 0.012;

    float ancho = 0.06;
    float corte = smoothstep(uMezcla * 1.8 - ancho, uMezcla * 1.8 + ancho, frente);

    vec4 color = mix(b, a, corte);

    // Línea de tinta en el propio frente, como el filo de una viñeta.
    float filo = 1.0 - smoothstep(0.0, ancho * 0.55, abs(frente - uMezcla * 1.8));
    color.rgb = mix(color.rgb, vec3(1.0, 0.86, 0.35), filo * 0.55 * step(0.001, uMezcla) * step(uMezcla, 0.999));

    gl_FragColor = vec4(color.rgb * uTinte, 1.0);
  }
`

const TENUE = new THREE.Color('#E4DCF0')
const VIVO = new THREE.Color('#FFFFFF')

/**
 * La ciudad envolviendo la escena, vista desde dentro de un cilindro.
 *
 * Un plano detrás de la figura se vería de canto en cuanto la cámara pasara de
 * los 90°, y aquí da la vuelta entera. El cilindro está detrás mires donde
 * mires, y gira despacio para que la escena no se congele con la página quieta.
 *
 * Las tres vistas se turnan según el progreso del scroll: cada dos capítulos
 * cambia de sitio, con el barrido diagonal haciendo el corte.
 */
export function Horizonte() {
  const malla = useRef<THREE.Mesh>(null)
  const texturas = useTexture(CIUDADES)
  const tinte = useMemo(() => new THREE.Color(), [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        side: THREE.BackSide,
        fog: false,
        uniforms: {
          uActual: { value: null },
          uSiguiente: { value: null },
          uMezcla: { value: 0 },
          uRepite: { value: REPITE },
          uDesplaza: { value: new THREE.Vector2() },
          uTinte: { value: new THREE.Color(1, 1, 1) },
        },
      }),
    [],
  )

  useLayoutEffect(() => {
    for (const t of texturas) {
      t.wrapS = THREE.RepeatWrapping
      t.wrapT = THREE.ClampToEdgeWrapping
      t.colorSpace = THREE.SRGBColorSpace
      t.needsUpdate = true
    }
    material.uniforms.uActual.value = texturas[0]
    material.uniforms.uSiguiente.value = texturas[1]
  }, [texturas, material])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    if (malla.current) malla.current.rotation.y += GIRO * dt

    // Girar la malla y desplazar la textura al revés da dos velocidades sobre
    // la misma superficie: el fondo no repite fotograma aunque el cilindro sí
    // complete vueltas.
    material.uniforms.uDesplaza.value.x -= GIRO * 0.3 * dt

    /*
     * Qué imagen toca. El recorrido se parte en tantos tramos como imágenes,
     * y dentro de cada tramo el último 22% es la transición hacia la siguiente.
     * Fuera de esa franja la mezcla está en 0 y no hay barrido: si estuviera
     * siempre a medias, el frente diagonal se quedaría cruzado en pantalla.
     */
    const n = texturas.length
    const p = THREE.MathUtils.clamp(scroll.progreso, 0, 0.9999) * n
    const i = Math.floor(p)
    const dentro = p - i
    const UMBRAL = 0.78

    material.uniforms.uActual.value = texturas[i]
    material.uniforms.uSiguiente.value = texturas[(i + 1) % n]
    material.uniforms.uMezcla.value =
      dentro < UMBRAL ? 0 : (dentro - UMBRAL) / (1 - UMBRAL)

    tinte.lerpColors(TENUE, VIVO, THREE.MathUtils.smoothstep(scroll.progreso, 0.1, 0.85))
    material.uniforms.uTinte.value.copy(tinte)
  })

  return (
    <mesh ref={malla} material={material} position={[0, ALTURA / 2 - 3.2, 0]}>
      <cylinderGeometry args={[RADIO, RADIO, ALTURA, 64, 1, true]} />
    </mesh>
  )
}
