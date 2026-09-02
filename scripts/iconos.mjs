/**
 * Extrae solo los iconos que usa la página a un archivo propio.
 *
 *   node scripts/iconos.mjs
 *
 * `simple-icons` completo son más de 3.000 marcas y varios megas. Importarlo en
 * el bundle por quince logos sería absurdo, y el sacudido de árbol no siempre lo
 * limpia bien porque el paquete expone todo desde un índice.
 *
 * Los trazados son CC0; las marcas son de sus dueños y aquí se usan para decir
 * con qué se trabaja, que es exactamente el uso para el que existe este paquete.
 */
import * as si from 'simple-icons'
import { writeFileSync } from 'node:fs'

// De los más conocidos a los de código abierto, que es el orden pedido.
const ORDEN = [
  ['siClaude', 'Claude'],
  ['siAnthropic', 'Anthropic'],
  ['siGooglegemini', 'Gemini'],
  ['siMetaai', 'Meta AI'],
  ['siMistralai', 'Mistral'],
  ['siDeepseek', 'DeepSeek'],
  ['siQwen', 'Qwen'],
  ['siPerplexity', 'Perplexity'],
  ['siGithubcopilot', 'Copilot'],
  ['siCursor', 'Cursor'],
  ['siHuggingface', 'Hugging Face'],
  ['siOllama', 'Ollama'],
  ['siLangchain', 'LangChain'],
  ['siVllm', 'vLLM'],
  ['siReplicate', 'Replicate'],
  ['siOnnx', 'ONNX'],
  ['siPytorch', 'PyTorch'],
]

const salida = ORDEN.map(([clave, nombre]) => {
  const i = si[clave]
  if (!i) throw new Error(`No existe ${clave} en simple-icons`)
  return { nombre, color: `#${i.hex}`, d: i.path }
})

writeFileSync(
  'src/lib/modelos.ts',
  `/**
 * Logos de modelos y herramientas de IA.
 *
 * GENERADO por scripts/iconos.mjs — no editar a mano.
 *
 * Los trazados vienen de simple-icons (CC0). Las marcas son de sus dueños y
 * aquí aparecen para decir con qué se trabaja, no para sugerir ninguna
 * relación con ellas.
 *
 * Faltan OpenAI, xAI y Stable Diffusion: simple-icons no los publica.
 */
export type Modelo = { nombre: string; color: string; d: string }

export const MODELOS: Modelo[] = ${JSON.stringify(salida, null, 2)}
`,
)
console.log(`src/lib/modelos.ts — ${salida.length} logos`)
