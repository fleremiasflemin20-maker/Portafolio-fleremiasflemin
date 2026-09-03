/**
 * Las tres facetas de Lenin, sacadas de su CV — no inventadas.
 *
 * La primera versión de este archivo tenía "Seguridad · Ethical hacking" como
 * uno de los tres pilares. El CV no la menciona ni una vez: era una suposición
 * hecha a partir de un par de repositorios sueltos. Su posicionamiento real es
 * **Hospitality Tech Architect**, y la historia verdadera es mejor que la
 * inventada — subió de Houseman a Housekeeping Manager en dos años y medio y
 * convirtió ese conocimiento en su propio software.
 *
 * Eso es literalmente la estructura de GTA V: tres protagonistas cuyas
 * historias se cruzan. Aquí son tres, y el cruce es la persona.
 *
 * Cada faceta trae su degradado. No son tres acentos sueltos: son la misma
 * puesta de sol de Miami mirada a distinta hora.
 */
export type Faceta = {
  id: string
  /** Lo que se lee en la rueda, corto y en mayúsculas. */
  clave: string
  nombre: string
  papel: string
  descripcion: string
  /** Cuál de los dos personajes 3D representa esta faceta. */
  modelo: 'paseo' | 'marina'
  desde: string
  hasta: string
  /** Para el texto de acento y el HUD sobre fondo oscuro. */
  tinta: string
  /** Tres cifras. Más se lee como informe, menos no dice nada. */
  stats: { etiqueta: string; valor: string }[]
  /**
   * Barras de habilidad, con los porcentajes del apartado STACK TECNOLÓGICO
   * del CV. Ni uno inventado — y por eso una faceta puede tener menos de
   * tres, o ninguna: mejor un aviso honesto que una cifra puesta para
   * rellenar. Ver el fallback en `Habilidades.tsx`.
   */
  habilidades: { nombre: string; nivel: number }[]
}

/*
 * El orden importa: la que va primera es la que se ve al entrar, antes de
 * que nadie toque la rueda. El turquesa de 3D e IA va delante a propósito
 * —es el trabajo más nuevo y el que más conviene enseñar de entrada—, y
 * software y producto quedan detrás en el mismo orden relativo que ya
 * tenían. Nada más cambia: ni contenido, ni colores propios de cada una,
 * solo el turno en que aparecen.
 */
export const FACETAS: Faceta[] = [
  {
    /*
     * El tercer sector deja de ser la trayectoria hotelera y pasa a ser el
     * cajón de proyectos en 3D e IA — figuras generadas con Meshy y
     * herramientas parecidas, automatizaciones y piezas sueltas que no
     * encajan como sitio web ni como producto. El id se queda igual de
     * estable que los otros dos, solo que ahora describe un tipo de trabajo
     * en vez de un puesto.
     */
    id: '3d',
    clave: '3D',
    nombre: '3D & IA',
    papel: 'Modelado 3D · Automatización con IA',
    descripcion:
      'Figuras y objetos generados con Meshy y otras herramientas de IA, más automatizaciones y piezas sueltas que no encajan como sitio web ni como producto. Un cajón de proyectos, no una categoría cerrada — crece según se suman piezas.',
    modelo: 'marina',
    desde: '#00E5D1',
    hasta: '#2AC3FF',
    tinta: '#3BE0D0',
    stats: [
      { etiqueta: 'Modelado', valor: 'Meshy AI' },
      { etiqueta: 'Automatización', valor: 'Agentes · workflows' },
      { etiqueta: 'Estado', valor: 'En construcción' },
    ],
    // Vacío a propósito: nada de porcentajes inventados. Ver el aviso que
    // Habilidades.tsx muestra cuando hay menos de tres.
    habilidades: [],
  },
  {
    id: 'software',
    clave: 'DEV',
    nombre: 'Software',
    papel: 'Ingeniero de software · Full Stack',
    descripcion:
      'React, Node y Python sobre AWS, con agentes de IA integrados donde aportan y no donde suenan bien. Formado en X Academy, Santa Monica, CA, fundada por un ecuatoriano en Estados Unidos.',
    modelo: 'paseo',
    desde: '#FF2D8A',
    hasta: '#FF7A2F',
    tinta: '#FF9A4D',
    stats: [
      { etiqueta: 'Stack', valor: 'React · Node · Python' },
      { etiqueta: 'Nube', valor: 'AWS · microservicios' },
      { etiqueta: 'IA', valor: 'LLM · agentes' },
    ],
    habilidades: [
      { nombre: 'HTML / CSS / DOM', nivel: 90 },
      { nombre: 'Python', nivel: 88 },
      { nombre: 'JavaScript / Node.js', nivel: 85 },
      { nombre: 'React / Angular', nivel: 82 },
      { nombre: 'AWS / Cloud', nivel: 78 },
    ],
  },
  {
    id: 'producto',
    clave: 'PMS',
    nombre: 'Hotel Tech',
    papel: 'Founder · Fleremahias PMS',
    descripcion:
      'Software de gestión hotelera pensado para Ecuador: ocho módulos, facturación electrónica al SRI, modo sin internet y un agente de IA que resuelve el 80% de las consultas de recepción.',
    modelo: 'marina',
    desde: '#7B2CFF',
    hasta: '#FF2D8A',
    tinta: '#C77DFF',
    stats: [
      { etiqueta: 'Módulos', valor: '8 integrados' },
      { etiqueta: 'Front desk', valor: '−70% tiempo' },
      { etiqueta: 'Consultas IA', valor: '80% resueltas' },
    ],
    habilidades: [
      { nombre: 'Hotel Tech Software', nivel: 95 },
      { nombre: 'IA / LLMs / Agentes', nivel: 87 },
      { nombre: 'Arquitectura SaaS', nivel: 85 },
      { nombre: 'SQL / Bases de datos', nivel: 84 },
    ],
  },
]
