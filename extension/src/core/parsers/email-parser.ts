import { EMAIL_REGEX } from '@/core/constants'
import type { EmailResult } from '@/core/types'

/** Regex que filtra falsos positivos de emails que en realidad son extensiones de archivo de imagen. */
const FALSE_EXT = /\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff?)$/i

/**
 * Normaliza una cadena de email eliminando el prefijo `mailto:` y los parámetros de consulta.
 * @param s - Cadena de email sin procesar.
 * @returns El email limpio sin prefijo ni parámetros.
 */
function normalizeEmail(s: string): string {
  return s.trim().replace(/^mailto:/i, '').split('?')[0].split('#')[0]
}

/**
 * Extrae direcciones de correo electrónico de una página web.
 * Busca emails en el texto visible mediante regex y en enlaces `mailto:`, eliminando duplicados.
 * @param doc - El documento HTML del cual extraer los emails.
 * @returns Lista de resultados de email sin duplicados.
 */
export function parseEmails(doc: Document): EmailResult[] {
  const seen = new Set<string>()
  const out: EmailResult[] = []
  const body = doc.body
  if (!body) return out

  const add = (raw: string, source: 'text' | 'mailto') => {
    const email = normalizeEmail(raw)
    if (!email || FALSE_EXT.test(email)) return
    const key = email.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push({ email, source })
  }

  const text = body.innerText || ''
  let m: RegExpExecArray | null
  const re = new RegExp(EMAIL_REGEX.source, EMAIL_REGEX.flags)
  while ((m = re.exec(text)) !== null) {
    add(m[0], 'text')
  }

  doc.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    const href = (a as HTMLAnchorElement).getAttribute('href') || ''
    add(href.replace(/^mailto:/i, ''), 'mailto')
  })

  return out
}

export default parseEmails
