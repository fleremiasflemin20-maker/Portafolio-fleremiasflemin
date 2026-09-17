/**
 * Un solo booleano compartido: si el carrusel de figuras 3D está a la vista.
 *
 * La rueda de faceta (arriba, en `App.tsx`) y este carrusel (dentro del
 * expediente de 3D) quieren las dos flechas del teclado, y solo una puede
 * ganar. En vez de que el carrusel dependa del foco del ratón —frágil, se
 * pierde en cuanto se hace scroll—, un `IntersectionObserver` en el propio
 * componente escribe aquí si está en pantalla, y `App.tsx` lo consulta antes
 * de girar la rueda. Un objeto mutable y no un estado de React porque a
 * ambos lados solo hace falta leer el valor en el instante de la tecla, no
 * volver a renderizar cuando cambia.
 */
export const carrusel3D = { enVista: false }
