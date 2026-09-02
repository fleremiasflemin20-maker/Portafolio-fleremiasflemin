/**
 * Genera la tira de horizonte que envuelve la escena en un cilindro.
 *
 *   node scripts/horizonte.mjs
 *
 * Dibujada, no fotografiada, y por dos razones. La primera es legal: el arte de
 * GTA es de Rockstar y esta pieza no lo usa — toma el idioma visual, no la
 * marca. La segunda es técnica: una silueta plana pesa unos kilobytes y se ve
 * nítida a cualquier tamaño, mientras que una foto de ciudad a esta anchura
 * serían varios megas para algo que se ve desenfocado y teñido de fondo.
 *
 * El azar va con semilla fija: así el horizonte es el mismo en cada compilación
 * y no cambia solo entre despliegues.
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const ANCHO = 4096
const ALTO = 1024

/** Congruencial lineal: reproducible y suficiente para colocar edificios. */
let s = 20260902
const azar = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const entre = (a, b) => a + azar() * (b - a)

const capas = []

// ── Cerros al fondo (el guiño a San Andreas) ────────────────────────────────
{
  let d = `M0,${ALTO} L0,${ALTO * 0.62}`
  for (let x = 0; x <= ANCHO; x += 140) {
    d += ` Q${x + 70},${ALTO * entre(0.5, 0.6)} ${x + 140},${ALTO * entre(0.56, 0.64)}`
  }
  capas.push(`<path d="${d} L${ANCHO},${ALTO} Z" fill="#241A2E"/>`)
}

// ── Rascacielos lejanos ─────────────────────────────────────────────────────
for (const [capa, color, base, altoMax] of [
  [1, '#2E1F3C', 0.70, 0.30],
  [2, '#3A2748', 0.78, 0.24],
]) {
  let x = 0
  while (x < ANCHO) {
    const an = entre(38, 120)
    const al = ALTO * entre(0.08, altoMax)
    const y = ALTO * base - al
    capas.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${an.toFixed(0)}" height="${(ALTO - y).toFixed(0)}" fill="${color}"/>`)
    // Ventanas encendidas: puntitos, no rejillas. Una rejilla regular delata
    // que está generada; con huecos parece una ciudad.
    for (let vy = y + 14; vy < ALTO * base - 10; vy += 22) {
      for (let vx = x + 8; vx < x + an - 8; vx += 16) {
        if (azar() > 0.62) {
          const c = azar() > 0.5 ? '#FF9A4D' : '#FF4FA3'
          capas.push(`<rect x="${vx.toFixed(0)}" y="${vy.toFixed(0)}" width="4" height="6" fill="${c}" opacity="${entre(0.35, 0.9).toFixed(2)}"/>`)
        }
      }
    }
    x += an + entre(6, 34)
  }
}

// ── Palmeras en primer término ──────────────────────────────────────────────
for (let i = 0; i < 26; i++) {
  const x = entre(0, ANCHO)
  const alt = entre(150, 330)
  const base = ALTO * 0.92
  let g = `<g transform="translate(${x.toFixed(0)} ${base.toFixed(0)})">`
  g += `<path d="M0,0 C-3,${(-alt * 0.35).toFixed(0)} 5,${(-alt * 0.7).toFixed(0)} 2,${(-alt).toFixed(0)} L9,${(-alt).toFixed(0)} C12,${(-alt * 0.7).toFixed(0)} 4,${(-alt * 0.35).toFixed(0)} 8,0 Z" fill="#140D1C"/>`
  const hojas = 7
  for (let h = 0; h < hojas; h++) {
    const a = -90 + (h - (hojas - 1) / 2) * (155 / hojas)
    g += `<path d="M4,${(-alt).toFixed(0)} C${(alt * 0.16).toFixed(0)},${(-alt - alt * 0.11).toFixed(0)} ${(alt * 0.33).toFixed(0)},${(-alt - alt * 0.09).toFixed(0)} ${(alt * 0.42).toFixed(0)},${(-alt).toFixed(0)} C${(alt * 0.3).toFixed(0)},${(-alt - alt * 0.04).toFixed(0)} ${(alt * 0.14).toFixed(0)},${(-alt + alt * 0.03).toFixed(0)} 4,${(-alt + alt * 0.03).toFixed(0)} Z" fill="#140D1C" transform="rotate(${a.toFixed(0)} 4 ${(-alt).toFixed(0)})"/>`
  }
  capas.push(g + '</g>')
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A0A12"/>
      <stop offset="42%" stop-color="#3B1B4E"/>
      <stop offset="70%" stop-color="#B0246B"/>
      <stop offset="88%" stop-color="#FF6B2C"/>
      <stop offset="100%" stop-color="#FFB020"/>
    </linearGradient>
  </defs>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#cielo)"/>
  ${capas.join('\n  ')}
</svg>`

writeFileSync('/tmp/horizonte.svg', svg)
const buf = await sharp(Buffer.from(svg)).webp({ quality: 84 }).toBuffer()
writeFileSync('public/textures/horizonte.webp', buf)
console.log(`horizonte.webp — ${ANCHO}×${ALTO}, ${(buf.length / 1024).toFixed(0)} KB`)
