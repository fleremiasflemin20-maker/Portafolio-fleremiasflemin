/**
 * Las tres facetas de Lenin, que aquí no son secciones: son **personajes**.
 *
 * La idea que sostiene la página: en GTA V cambias de personaje y cambia todo —
 * la paleta, la música, el barrio. Aquí pasa lo mismo. Que alguien haga
 * ingeniería de software, ciberseguridad y administración hotelera es raro, y
 * esconderlo en tres pestañas iguales lo vuelve ruido. Convertirlo en el
 * mecanismo central lo vuelve el argumento.
 *
 * Cada faceta trae su degradado propio. No son tres colores de acento sueltos:
 * los tres son la misma puesta de sol de Miami mirada a distinta hora — el
 * naranja del atardecer, el púrpura de después, el dorado de antes.
 */
export type Faceta = {
  id: string
  /** Lo que se lee en el centro de la rueda, corto y en mayúsculas. */
  clave: string
  nombre: string
  papel: string
  descripcion: string
  /** Arranque del degradado, el color que manda. */
  desde: string
  /** Final del degradado. */
  hasta: string
  /** Para el texto de acento y el HUD sobre fondo oscuro. */
  tinta: string
  /** Cifras del HUD. Tres, que es lo que cabe sin que se lea como un informe. */
  stats: { etiqueta: string; valor: string }[]
}

export const FACETAS: Faceta[] = [
  {
    id: 'software',
    clave: 'SW',
    nombre: 'Software',
    papel: 'Ingeniero de software',
    descripcion:
      'Interfaces que no parecen plantillas. 3D en el navegador, scroll que conduce una narrativa y sitios que cargan rápido en un teléfono con datos.',
    desde: '#FF2D8A',
    hasta: '#FF7A2F',
    tinta: '#FF9A4D',
    stats: [
      { etiqueta: 'Stack', valor: 'React · Three.js' },
      { etiqueta: 'Sitios en vivo', valor: '8' },
      { etiqueta: 'Enfoque', valor: 'Producto' },
    ],
  },
  {
    id: 'seguridad',
    clave: 'SEC',
    nombre: 'Seguridad',
    papel: 'Ethical hacking y pentesting',
    descripcion:
      'La otra mitad del oficio: entender cómo se rompe lo que uno construye. Auditoría, reconocimiento y remediación.',
    desde: '#7B2CFF',
    hasta: '#FF2D8A',
    tinta: '#C77DFF',
    stats: [
      { etiqueta: 'Área', valor: 'Ofensiva' },
      { etiqueta: 'Herramientas', valor: 'Propias' },
      { etiqueta: 'Enfoque', valor: 'Defensa' },
    ],
  },
  {
    id: 'hoteleria',
    clave: 'OPS',
    nombre: 'Hotelería',
    papel: 'Adm. de empresas hoteleras y turísticas',
    descripcion:
      'Un título que no suele ir con los otros dos, y por eso vale: sé cómo funciona el negocio para el que escribo el software, no solo el software.',
    desde: '#FFB020',
    hasta: '#FF5E5B',
    tinta: '#FFC65C',
    stats: [
      { etiqueta: 'Sector', valor: 'Hospitalidad' },
      { etiqueta: 'Sistema', valor: 'PMS propio' },
      { etiqueta: 'Mercado', valor: 'Ecuador' },
    ],
  },
]
