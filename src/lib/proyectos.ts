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
 *
 * `imagen`: captura real del sitio o de la app en marcha, no un mockup. Los
 * proyectos sin pantalla (una API) o sin captura tomada todavía se quedan sin
 * este campo — la Galería los omite antes que mostrar un placeholder.
 *
 * Las capturas viven en `public/galeria/` y no en un enlace a GitHub: los
 * adjuntos de `user-attachments` solo cargan con el propio github.com como
 * referrer —comprobado, `naturalWidth` se quedaba en 0 fuera de github.com—,
 * así que servirlas como asset propio es la única forma de que se vean en
 * este sitio.
 */
export type Proyecto = {
  nombre: string
  faceta: 'software' | 'producto' | '3d'
  resumen: string
  /** Lo que hace especial a esta pieza. Una línea, técnica, sin adjetivos. */
  nota: string
  sitio?: string
  codigo: string
  imagen?: string
}

const GH = 'https://github.com/fleremiasflemin20-maker'
const PAGES = 'https://fleremiasflemin20-maker.github.io'
const GH2 = 'https://github.com/fleremahiasflemin'

/* Mismo patrón que `VIDEO` en Cinematica.tsx: hace falta el prefijo de
   `BASE_URL` porque en GitHub Pages el sitio cuelga de /<repo>/, no de la
   raíz del dominio. */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
const galeria = (archivo: string) => `${BASE}/galeria/${archivo}`

export const PROYECTOS: Proyecto[] = [
  {
    nombre: 'Fleremahias PMS',
    faceta: 'producto',
    resumen: 'Gestión hotelera SaaS para Ecuador y LATAM.',
    nota: 'Ocho módulos, facturación SRI con XML firmado y modo sin internet.',
    sitio: 'https://fleremias-landing.vercel.app',
    codigo: `${GH}/fleremiasPMS`,
    imagen: galeria('fleremiaspms.jpg'),
  },
  {
    nombre: 'Gogeta SSJ4',
    faceta: 'software',
    resumen: 'Scrollytelling 3D sobre un escaneo fotogramétrico.',
    nota: '150.000 triángulos servidos en 692 KB. Una sola toma de cámara.',
    sitio: `${PAGES}/gogeta-ssj4-scrollytelling/`,
    codigo: `${GH}/gogeta-ssj4-scrollytelling`,
    imagen: 'https://raw.githubusercontent.com/fleremiasflemin20-maker/gogeta-ssj4-scrollytelling/main/docs/preview.png',
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
    imagen: galeria('draconian.jpg'),
  },
  {
    nombre: 'Apple Watch Ultra',
    faceta: 'software',
    resumen: 'Landing de producto con scrollytelling.',
    nota: 'GSAP + Lenis, secuencia de fotogramas ligada al scroll.',
    sitio: `${PAGES}/apple-watch-ultra-scrollytelling/`,
    codigo: `${GH}/apple-watch-ultra-scrollytelling`,
    imagen: galeria('apple-watch.jpg'),
  },
  {
    nombre: 'AURELIA',
    faceta: 'software',
    resumen: 'Estudio de arquitectura, scroll cinematográfico.',
    nota: 'Secuencia de frames conducida por el scroll.',
    sitio: `${PAGES}/web-cinematic-scroll/`,
    codigo: `${GH}/web-cinematic-scroll`,
    imagen: galeria('aurelia.jpg'),
  },
  {
    nombre: 'Aerial',
    faceta: 'software',
    resumen: 'Vídeo de dron convertido en scroll interactivo.',
    nota: 'El metraje se recorre con la rueda, no se reproduce.',
    sitio: `${PAGES}/aerial-estudio/`,
    codigo: `${GH}/aerial-estudio`,
    imagen: galeria('aerial.jpg'),
  },
  {
    nombre: 'Scroll·Cars',
    faceta: 'software',
    resumen: 'Compraventa de vehículos con vídeo scroll.',
    nota: 'Sitio comercial en producción, no una demo.',
    sitio: `${PAGES}/fidel-bonilla-autos/`,
    codigo: `${GH}/fidel-bonilla-autos`,
    imagen: galeria('scrollcars.jpg'),
  },
  {
    nombre: 'VulnScanner Pro',
    faceta: 'software',
    resumen: 'Escáner de vulnerabilidades.',
    nota: 'Python. Reconocimiento y reporte automatizados.',
    codigo: `${GH2}/vulnscanner-pro`,
  },
  {
    nombre: 'ShadowHunter',
    faceta: 'software',
    resumen: 'Herramienta de OSINT.',
    nota: 'Recolección de inteligencia de fuentes abiertas.',
    codigo: `${GH2}/C-Users-flere-Downloads-shadowhunter_osint.zip-ShadowHunter_OSINT`,
  },
  {
    nombre: 'SocialHawk',
    faceta: 'software',
    resumen: 'Reconocimiento en redes sociales.',
    nota: 'Superficie de exposición pública de una persona u organización.',
    codigo: `${GH2}/C-Users-flere-Downloads-SocialHawk_Deployable.zip`,
  },
  {
    nombre: 'Andy Detalles',
    faceta: 'software',
    resumen: 'Repostería con pedidos por WhatsApp.',
    nota: 'El pedido sale montado al chat: sin backend que mantener.',
    sitio: `${PAGES}/Andy-detalles/`,
    codigo: `${GH}/Andy-detalles`,
    imagen: galeria('andy-detalles.jpg'),
  },
  {
    nombre: 'Fleremias PMS — Panel',
    faceta: 'producto',
    resumen: 'Panel operativo del PMS: front desk, reservas, housekeeping.',
    nota: 'React + TypeScript + Socket.io, en tiempo real contra la API.',
    codigo: `${GH}/fleremias-pms`,
    imagen: galeria('panel-frontdesk.jpg'),
  },
  {
    nombre: 'Fleremias API',
    faceta: 'producto',
    resumen: 'Backend del ecosistema PMS.',
    nota: 'Fastify + Prisma + PostgreSQL, con IA (Claude) y pagos (Stripe).',
    codigo: `${GH}/fleremias-api`,
  },
  {
    nombre: 'Fleremias Staff',
    faceta: 'producto',
    resumen: 'App móvil para housekeeping y mantenimiento.',
    nota: 'React Native / Expo, tareas en tiempo real con notificaciones push.',
    codigo: `${GH}/fleremias-staff`,
    imagen: galeria('app-staff.jpg'),
  },
  {
    nombre: 'Fleremias Admin',
    faceta: 'producto',
    resumen: 'App móvil de supervisión para administradores.',
    nota: 'Solicitudes en vivo y dashboard de cumplimiento de SLA.',
    codigo: `${GH}/fleremias-admin-mobile`,
    imagen: galeria('app-admin.jpg'),
  },
  {
    nombre: 'Fleremias Guest',
    faceta: 'producto',
    resumen: 'App móvil para huéspedes del hotel.',
    nota: 'Pide servicios y sigue el estado de tu solicitud desde el celular.',
    codigo: `${GH}/fleremias-guest`,
    imagen: galeria('app-guest.jpg'),
  },
]
