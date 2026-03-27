import type { TextResult } from '@/core/types'

/**
 * Genera un selector CSS `nth-of-type` para un elemento dado, relativo a su padre.
 * @param el - El elemento para el cual generar el selector.
 * @returns Selector CSS en formato `tag:nth-of-type(n)`.
 */
function nthOfTypeSelector(el: Element): string {
  const parent = el.parentElement
  if (!parent) return el.tagName.toLowerCase()
  const tag = el.tagName.toLowerCase()
  const same = Array.from(parent.children).filter((c) => c.tagName === el.tagName)
  const idx = same.indexOf(el) + 1
  return `${tag}:nth-of-type(${idx})`
}

/**
 * Construye un selector CSS completo desde `body` hasta el elemento dado.
 * @param el - El elemento para el cual construir el selector.
 * @param doc - El documento que contiene el elemento.
 * @returns Selector CSS con la ruta completa hasta el elemento.
 */
function buildSelector(el: Element, doc: Document): string {
  const parts: string[] = []
  let node: Element | null = el
  while (node && node !== doc.body && node !== doc.documentElement) {
    parts.unshift(nthOfTypeSelector(node))
    node = node.parentElement
  }
  return parts.length ? parts.join(' > ') : el.tagName.toLowerCase()
}

/** Cantidad mínima de caracteres que debe tener un `<span>` para ser incluido en los resultados. */
const SUBSTANTIAL_SPAN = 12

/**
 * Extrae texto de encabezados, párrafos, elementos de lista y spans sustanciales de una página web.
 * Limita los resultados a un máximo de 200 elementos y descarta contenido con menos de 3 caracteres.
 * @param doc - El documento HTML del cual extraer el texto.
 * @returns Lista de resultados de texto con contenido, etiqueta y selector CSS.
 */
export function parseText(doc: Document): TextResult[] {
  const out: TextResult[] = []
  const seen = new Set<Element>()

  const pushEl = (el: Element) => {
    if (out.length >= 200) return
    if (seen.has(el)) return
    seen.add(el)
    const content = (el as HTMLElement).innerText?.trim() || ''
    if (content.length < 3) return
    const tag = el.tagName.toLowerCase()
    out.push({
      content,
      tag,
      selector: buildSelector(el, doc),
    })
  }

  doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach((el) => pushEl(el))

  doc.querySelectorAll('span').forEach((el) => {
    const content = (el as HTMLElement).innerText?.trim() || ''
    if (content.length >= SUBSTANTIAL_SPAN) pushEl(el)
  })

  return out
}

export default parseText
