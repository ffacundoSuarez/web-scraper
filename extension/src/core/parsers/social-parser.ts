import { SOCIAL_PLATFORMS } from '@/core/constants'
import type { SocialResult } from '@/core/types'

/** Conjunto de segmentos de ruta URL que se omiten al extraer nombres de usuario de redes sociales. */
const PATH_SKIP = new Set([
  'share',
  'intent',
  'status',
  'u',
  'in',
  'reel',
  'p',
  'explore',
  'watch',
  'channel',
  'c',
  'stories',
])

/**
 * Extrae un nombre de usuario de una URL de red social.
 * Busca el primer segmento significativo de la ruta, omitiendo segmentos genéricos como `share`, `intent`, etc.
 * @param urlStr - La URL completa de la red social.
 * @returns El nombre de usuario extraído, o cadena vacía si no se encuentra.
 */
function usernameFromUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr)
    const parts = u.pathname.split('/').filter(Boolean)
    for (const p of parts) {
      const low = p.toLowerCase()
      if (!PATH_SKIP.has(low) && p.length > 1) return decodeURIComponent(p)
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * Extrae enlaces de redes sociales de una página web.
 * Busca todos los enlaces que coincidan con plataformas sociales conocidas y extrae la plataforma, URL y nombre de usuario.
 * @param doc - El documento HTML del cual extraer los enlaces sociales.
 * @returns Lista de resultados de redes sociales sin duplicados.
 */
export function parseSocial(doc: Document): SocialResult[] {
  const seen = new Set<string>()
  const out: SocialResult[] = []
  const base = doc.location?.href || 'https://example.invalid/'

  doc.querySelectorAll('a[href]').forEach((node) => {
    const href = (node as HTMLAnchorElement).getAttribute('href') || ''
    if (!href.trim()) return
    let abs: string
    try {
      abs = new URL(href, base).href
    } catch {
      return
    }
    if (seen.has(abs)) return

    for (const { name, pattern } of SOCIAL_PLATFORMS) {
      if (pattern.test(abs)) {
        seen.add(abs)
        out.push({
          platform: name,
          url: abs,
          username: usernameFromUrl(abs),
        })
        return
      }
    }
  })

  return out
}

export default parseSocial
