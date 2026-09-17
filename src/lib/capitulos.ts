/**
 * El relato, sacado de la línea temporal del CV.
 *
 * Esto es lo que la página no contaba y es lo que más dice de él: subir de
 * Houseman a Housekeeping Manager en dos años y medio, y convertir esa
 * experiencia en un producto. Puesto como escalones —con año, sitio y una idea
 * por escalón— se lee como una lista de misiones, que es justo el idioma que
 * esta página habla.
 *
 * Siete capítulos: es lo que dura una película de scroll sin cansar, y lo que
 * cuadra con los siete fotogramas del recorrido de cámara.
 */
export type Capitulo = {
  anio: string
  rotulo: string
  lugar: string
  titulo: string[]
  texto: string
  /** A qué lado va el texto. La cámara desvía la figura al lado contrario. */
  lado: 'izq' | 'der'
  /** Entrada del titular. Distinta en cada capítulo, a propósito. */
  entrada: 'caida' | 'barrido' | 'impacto' | 'giro'
}

export const CAPITULOS: Capitulo[] = [
  {
    anio: '',
    rotulo: 'Hospitality Tech Architect',
    lugar: 'Quito, EC · Los Angeles, CA',
    titulo: ['Lenin', 'Bonilla'],
    texto:
      'Ingeniero en Administración de Empresas Hoteleras por la UDLA e ingeniero de software por X Academy, en Santa Monica, CA, una academia fundada por un ecuatoriano en Estados Unidos. Construyo la tecnología que los hoteles necesitan de verdad, diseñada por alguien que vivió la operación desde dentro.',
    lado: 'izq',
    entrada: 'caida',
  },
  {
    anio: '2019',
    rotulo: 'Misión 01',
    lugar: 'Le Merigot · Santa Monica',
    titulo: ['Empecé', 'por abajo'],
    texto:
      'Houseman en un hotel de lujo de Santa Monica. Limpieza, mantenimiento y servicio al huésped. Nada de esto sale en un currículum de programador, y es exactamente lo que hoy me diferencia.',
    lado: 'der',
    entrada: 'barrido',
  },
  {
    anio: '2021',
    rotulo: 'Misión 02',
    lugar: 'Crescent Hotels & Resorts',
    titulo: ['Vi el hotel', 'entero'],
    texto:
      'Polifuncional: recepción, room service, mantenimiento y housekeeping. Esa visión transversal fue la que después me dejó diseñar software que conecta departamentos en vez de aislarlos.',
    lado: 'izq',
    entrada: 'impacto',
  },
  {
    anio: '2022',
    rotulo: 'Misión 03',
    lugar: 'Sandbourne Santa Monica',
    titulo: ['Housekeeping', 'Manager'],
    texto:
      'De Houseman a Manager en dos años y medio. Equipos bajo estándar premium, 30% mejor turnover de habitaciones y menos errores entre housekeeping y recepción. Cada fricción que anoté ahí acabó siendo una función.',
    lado: 'der',
    entrada: 'giro',
  },
  {
    anio: '2024',
    rotulo: 'Misión 04',
    lugar: 'Fleremahias Hotels SaaS',
    titulo: ['Construí', 'el sistema'],
    texto:
      'Fleremahias PMS: ocho módulos, facturación electrónica al SRI con XML firmado, modo sin internet y un agente de IA que resuelve el 80% de las consultas de recepción en menos de dos segundos.',
    lado: 'izq',
    entrada: 'barrido',
  },
  {
    anio: 'Hoy',
    rotulo: 'Misión 05',
    lugar: 'Ecuador · California',
    titulo: ['El puente'],
    texto:
      'Soy el puente entre el equipo operativo y el de tecnología. Habiendo vivido el hotel desde la base hasta la gerencia, construyo herramientas que el personal realmente adopta — que es donde fracasa casi todo el software hotelero.',
    lado: 'der',
    entrada: 'impacto',
  },
]
