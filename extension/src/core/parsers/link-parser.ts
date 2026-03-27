import type { LinkResult } from '@/core/types'

/**
 * Resuelve una URL relativa contra una URL base.
 * @param href - La URL (posiblemente relativa) a resolver.
 * @param base - La URL base contra la cual resolver.
 * @returns La URL absoluta resuelta, o `null` si no es válida.
 */
function resolveUrl(href: string, base: string): string | null {
  try {
    const u = new URL(href, base)
    return u.href
  } catch {
    return null
  }
}

/**
 * Determina si un href es solo un fragmento (ancla) de la misma página (ej. `#seccion`).
 * @param href - El valor del atributo href a verificar.
 * @returns `true` si el href es vacío o solo un fragmento.
 */
function isFragmentOnlyHref(href: string): boolean {
  const t = href.trim()
  if (!t) return true
  if (/^[a-z][a-z+.-]*:/i.test(t)) return false
  return t.startsWith('#')
}

/**
 * Extrae todos los enlaces de una página web, resolviéndolos a URLs absolutas.
 * Marca cada enlace como externo o interno según el hostname.
 * @param doc - El documento HTML del cual extraer los enlaces.
 * @returns Lista de resultados de enlaces sin duplicados, con indicador externo/interno.
 */
export function parseLinks(doc: Document): LinkResult[] {
  const seen = new Set<string>()
  const out: LinkResult[] = []
  const base = doc.location?.href || 'https://example.invalid/'
  const host = doc.location?.hostname || ''

  doc.querySelectorAll('a[href]').forEach((node) => {
    const a = node as HTMLAnchorElement
    const raw = (a.getAttribute('href') || '').trim()
    if (!raw || raw.toLowerCase().startsWith('javascript:')) return
    if (isFragmentOnlyHref(raw)) return

    const abs = resolveUrl(raw, base)
    if (!abs || abs.toLowerCase().startsWith('javascript:')) return
    if (seen.has(abs)) return
    seen.add(abs)

    let isExternal = false
    try {
      const u = new URL(abs)
      isExternal = u.hostname !== host && u.hostname !== ''
    } catch {
      isExternal = false
    }

    out.push({
      url: abs,
      text: (a.innerText || '').trim(),
      title: (a.getAttribute('title') || '').trim(),
      isExternal,
    })
  })

  return out
}

export default parseLinks
