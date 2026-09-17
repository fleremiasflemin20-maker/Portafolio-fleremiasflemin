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

/*
 * Dos grupos, y la distinción importa: Copilot y Cursor son editores; Claude y
 * Gemini son modelos. Mezclarlos en una sola fila daba a entender que todo es
 * lo mismo, y a quien entiende del tema le resta credibilidad.
 *
 * Dentro de cada grupo, de lo más conocido a lo de código abierto.
 */
const HERRAMIENTAS = [
  ['siAnthropic', 'Claude Code'],
  ['siGithubcopilot', 'GitHub Copilot'],
  ['siCursor', 'Cursor'],
  ['siHuggingface', 'Hugging Face'],
  ['siOllama', 'Ollama'],
  ['siLangchain', 'LangChain'],
  ['siVllm', 'vLLM'],
  ['siReplicate', 'Replicate'],
  ['siOnnx', 'ONNX'],
  ['siPytorch', 'PyTorch'],
]

const MODELOS_IA = [
  ['siClaude', 'Claude'],
  ['siGooglegemini', 'Gemini'],
  ['siMetaai', 'Llama'],
  ['siMistralai', 'Mistral'],
  ['siDeepseek', 'DeepSeek'],
  ['siQwen', 'Qwen'],
  ['siPerplexity', 'Perplexity'],
]

const mapear = (lista) =>
  lista.map(([clave, nombre]) => {
    const i = si[clave]
    if (!i) throw new Error(`No existe ${clave} en simple-icons`)
    return { nombre, color: `#${i.hex}`, d: i.path }
  })

const herramientas = mapear(HERRAMIENTAS)
const modelos = mapear(MODELOS_IA)

writeFileSync(
  'src/lib/modelos.ts',
  `/**
 * Logos de herramientas y modelos de IA.
 *
 * GENERADO por scripts/iconos.mjs — no editar a mano.
 *
 * Los trazados vienen de simple-icons (CC0). Las marcas son de sus dueños y
 * aquí aparecen para decir con qué se trabaja, no para sugerir ninguna
 * relación con ellas.
 *
 * Faltan OpenAI, xAI y Stable Diffusion: simple-icons no publica sus marcas.
 */
export type Marca = { nombre: string; color: string; d: string }

/** Editores y librerías: con esto se programa y se ejecutan los modelos. */
export const HERRAMIENTAS: Marca[] = ${JSON.stringify(herramientas, null, 2)}

/** Los modelos en sí: lo que responde al otro lado. */
export const MODELOS: Marca[] = ${JSON.stringify(modelos, null, 2)}
`,
)
console.log(`src/lib/modelos.ts — ${herramientas.length} herramientas, ${modelos.length} modelos`)
