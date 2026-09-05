/**
 * Las figuras generadas con Meshy AI que viven en el cajón de "3D & IA".
 *
 * A diferencia de `facetas.ts`, aquí no hay CV que consultar: son piezas
 * sueltas, generadas una a una. Tres salieron de Meshy con nombre propio y se
 * quedan tal cual; las otras siete no lo traían, y no se les inventa uno —
 * mismo criterio que las barras de habilidad vacías en `Habilidades.tsx`: un
 * número de serie honesto antes que un nombre de relleno.
 *
 * `archivo` es el nombre del `.glb` dentro de `public/models/meshy/`, ya
 * optimizado (glTF-Transform: meshopt + texturas WebP a 1024 px). El original
 * de Meshy pesaba entre 35 y 190 MB por pieza — GitHub rechaza cualquier
 * archivo por encima de 100 MB, y aun por debajo, cargar 900 MB en una página
 * no es viable. Comprimido, el cajón entero pesa unos 70 MB repartidos en diez
 * piezas que se cargan de una en una.
 */
export type Personaje3D = {
  id: string
  nombre: string
  archivo: string
  /** Carpeta dentro de `public/models/`. Por defecto 'meshy'. */
  carpeta?: string
  /** Lleva `KHR_draco_mesh_compression` — las piezas de Meshy no la usan. */
  draco?: boolean
  /** De dónde sale la pieza, cuando no es "Generado con Meshy AI". */
  origen?: string
  /**
   * Mapas PBR sueltos, para una malla que no trae el material horneado en el
   * `.glb` — el escaneo de Gogeta llega con un material de relleno y el color
   * real vive en cuatro texturas aparte (ver `GogetaModel.tsx` del proyecto
   * original). Nombres de archivo dentro de `public/textures/<carpeta>/`.
   */
  texturas?: { map: string; normalMap: string; roughnessMap: string; metalnessMap: string }
}

export const PERSONAJES_3D: Personaje3D[] = [
  /*
   * Va primera a propósito: es la pieza más trabajada del cajón —escaneo
   * fotogramétrico propio, no un prompt de texto— y la que más conviene ver
   * nada más entrar, antes de las generadas con Meshy.
   */
  {
    id: 'gogeta-ssj4',
    nombre: 'Gogeta SSJ4',
    archivo: 'gogeta',
    carpeta: 'gogeta',
    draco: true,
    origen: 'Escaneo fotogramétrico',
    texturas: {
      map: 'diffuse_2k.webp',
      normalMap: 'normal_1k.webp',
      roughnessMap: 'roughness_1k.webp',
      metalnessMap: 'metallic_1k.webp',
    },
  },
  { id: 'cyber-draconian-sentinel', nombre: 'Cyber Draconian Sentinel', archivo: 'cyber-draconian-sentinel' },
  { id: 'emerald-tyrant-throne', nombre: 'Emerald Tyrant Throne', archivo: 'emerald-tyrant-throne' },
  { id: 'starlight-sentinel', nombre: 'Starlight Sentinel', archivo: 'starlight-sentinel' },
  { id: 'figura-01', nombre: 'Figura 3D · 01', archivo: 'figura-01' },
  { id: 'figura-02', nombre: 'Figura 3D · 02', archivo: 'figura-02' },
  { id: 'figura-03', nombre: 'Figura 3D · 03', archivo: 'figura-03' },
  { id: 'figura-04', nombre: 'Figura 3D · 04', archivo: 'figura-04' },
  { id: 'figura-05', nombre: 'Figura 3D · 05', archivo: 'figura-05' },
  { id: 'figura-06', nombre: 'Figura 3D · 06', archivo: 'figura-06' },
  { id: 'figura-07', nombre: 'Figura 3D · 07', archivo: 'figura-07' },
]
