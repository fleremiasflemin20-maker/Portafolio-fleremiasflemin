/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ni negro ni blanco puros: ver references/direccion-arte.md
        ink: '#0A0A0B',
        paper: '#F5F4F1',
        // El acento real lo pone cada faceta por variable CSS (ver facetas.ts).
        // Este es solo el de reserva, por si algo se pinta antes de que monte.
        accent: '#FF2D8A',
      },
      fontFamily: {
        display: ['Archivo Black', 'Impact', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display:  ['clamp(3rem, 9vw, 11rem)',    { lineHeight: '0.9',  letterSpacing: '-0.03em' }],
        headline: ['clamp(2rem, 4.5vw, 4rem)',   { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        title:    ['clamp(1.5rem, 2.2vw, 2rem)', { lineHeight: '1.2' }],
        body:     ['1.0625rem',                  { lineHeight: '1.65' }],
        caption:  ['0.75rem',                    { lineHeight: '1.4', letterSpacing: '0.14em' }],
      },
    },
  },
  plugins: [],
}
