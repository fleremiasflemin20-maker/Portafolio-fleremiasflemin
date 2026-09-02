/**
 * Los proyectos reales, etiquetados por faceta.
 *
 * Filtrarlos con la rueda es lo que convierte el selector en algo más que un
 * juguete del hero: eliges personaje y ves lo que ese personaje ha hecho. Si la
 * rueda no cambiara nada más abajo, sería decoración cara.
 *
 * Todo lo de aquí está publicado y **se comprobó uno por uno** que responde 200.
 * Un portfolio con enlaces muertos hace más daño que uno corto. Por eso quedaron
 * fuera un par de despliegues viejos en Vercel que ya devuelven 404.
 */
export type Proyecto = {
  nombre: string
  faceta: 'software' | 'seguridad' | 'hoteleria'
  resumen: string
  /** Lo que hace especial a esta pieza. Una línea, técnica, sin adjetivos. */
  nota: string
  sitio?: string
  codigo: string
}

const GH = 'https://github.com/fleremiasflemin20-maker'
const PAGES = 'https://fleremiasflemin20-maker.github.io'
const GH2 = 'https://github.com/fleremahiasflemin'

export const PROYECTOS: Proyecto[] = [
  {
    nombre: 'Gogeta SSJ4',
    faceta: 'software',
    resumen: 'Scrollytelling 3D sobre un escaneo fotogramétrico.',
    nota: '150.000 triángulos servidos en 692 KB. Una sola toma de cámara.',
    sitio: `${PAGES}/gogeta-ssj4-scrollytelling/`,
    codigo: `${GH}/gogeta-ssj4-scrollytelling`,
  },
  {
    nombre: 'Portfolio',
    faceta: 'software',
    resumen: 'Interfaz de centro de mando en Next.js.',
    nota: 'Salida estática con hero 3D. Cuatro vistas, cero servidor.',
    sitio: `${PAGES}/fleremias-portafolio/`,
    codigo: `${GH}/fleremias-portafolio`,
  },
  {
    nombre: '¡DRACONIAN!',
    faceta: 'software',
    resumen: 'Expediente de terror con modelo 3D interactivo.',
    nota: 'Three.js y control experimental por gestos de mano.',
    sitio: `${PAGES}/reptilian-interface/`,
    codigo: `${GH}/reptilian-interface`,
  },
  {
    nombre: 'Apple Watch Ultra',
    faceta: 'software',
    resumen: 'Landing de producto con scrollytelling.',
    nota: 'GSAP + Lenis, secuencia de fotogramas ligada al scroll.',
    sitio: `${PAGES}/apple-watch-ultra-scrollytelling/`,
    codigo: `${GH}/apple-watch-ultra-scrollytelling`,
  },
  {
    nombre: 'AURELIA',
    faceta: 'software',
    resumen: 'Estudio de arquitectura, scroll cinematográfico.',
    nota: 'Secuencia de frames conducida por el scroll.',
    sitio: `${PAGES}/web-cinematic-scroll/`,
    codigo: `${GH}/web-cinematic-scroll`,
  },
  {
    nombre: 'Aerial',
    faceta: 'software',
    resumen: 'Vídeo de dron convertido en scroll interactivo.',
    nota: 'El metraje se recorre con la rueda, no se reproduce.',
    sitio: `${PAGES}/aerial-estudio/`,
    codigo: `${GH}/aerial-estudio`,
  },
  {
    nombre: 'Scroll·Cars',
    faceta: 'software',
    resumen: 'Compraventa de vehículos con vídeo scroll.',
    nota: 'Sitio comercial en producción, no una demo.',
    sitio: `${PAGES}/fidel-bonilla-autos/`,
    codigo: `${GH}/fidel-bonilla-autos`,
  },
  {
    nombre: 'VulnScanner Pro',
    faceta: 'seguridad',
    resumen: 'Escáner de vulnerabilidades.',
    nota: 'Python. Reconocimiento y reporte automatizados.',
    codigo: `${GH2}/vulnscanner-pro`,
  },
  {
    nombre: 'ShadowHunter',
    faceta: 'seguridad',
    resumen: 'Herramienta de OSINT.',
    nota: 'Recolección de inteligencia de fuentes abiertas.',
    codigo: `${GH2}/C-Users-flere-Downloads-shadowhunter_osint.zip-ShadowHunter_OSINT`,
  },
  {
    nombre: 'SocialHawk',
    faceta: 'seguridad',
    resumen: 'Reconocimiento en redes sociales.',
    nota: 'Superficie de exposición pública de una persona u organización.',
    codigo: `${GH2}/C-Users-flere-Downloads-SocialHawk_Deployable.zip`,
  },
  {
    nombre: 'Fleremahias PMS',
    faceta: 'hoteleria',
    resumen: 'Sistema de gestión hotelera para Ecuador.',
    nota: 'Facturación SRI y modo offline: en un hotel el internet se cae.',
    sitio: `${PAGES}/fleremiasPMS/`,
    codigo: `${GH}/fleremiasPMS`,
  },
  {
    nombre: 'Andy Detalles',
    faceta: 'hoteleria',
    resumen: 'Repostería con pedidos por WhatsApp.',
    nota: 'El pedido sale montado al chat: sin backend que mantener.',
    sitio: `${PAGES}/Andy-detalles/`,
    codigo: `${GH}/Andy-detalles`,
  },
]
