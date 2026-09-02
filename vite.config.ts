import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
/*
 * `base` sale de una variable de entorno: en GitHub Pages el sitio cuelga de
 * /<repo>/ y no de la raíz del dominio. Sin esto el HTML pediría los assets a la
 * raíz de github.io, que es otro sitio, y la página saldría en blanco.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // Puerto propio: el 5173 lo ocupa el proyecto de Gogeta.
  server: { port: 5174, strictPort: true },
})
