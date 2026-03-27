import { PHONE_REGEX } from '@/core/constants'
import type { PhoneResult } from '@/core/types'

/**
 * Cuenta la cantidad de dígitos numéricos en una cadena.
 * @param s - Cadena en la cual contar los dígitos.
 * @returns Número de dígitos encontrados.
 */
function digitCount(s: string): number {
  return (s.match(/\d/g) || []).length
}

/**
 * Formatea un número de teléfono conservando el prefijo `+` si existe y eliminando caracteres no numéricos.
 * @param raw - Número de teléfono sin procesar.
 * @returns El número formateado solo con dígitos (y prefijo `+` si aplica).
 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+')) return `+${digits}`
  return digits
}

/**
 * Extrae números de teléfono de una página web.
 * Busca en el texto visible mediante regex y en enlaces `tel:`, descartando aquellos con menos de 7 dígitos.
 * @param doc - El documento HTML del cual extraer los teléfonos.
 * @returns Lista de resultados de teléfono sin duplicados.
 */
export function parsePhones(doc: Document): PhoneResult[] {
  const seen = new Set<string>()
  const out: PhoneResult[] = []
  const body = doc.body
  if (!body) return out

  const consider = (raw: string, source: 'text' | 'tel') => {
    const trimmed = raw.trim()
    if (digitCount(trimmed) < 7) return
    const formatted = formatPhone(trimmed)
    const key = formatted.replace(/^\+/, '') || formatted
    if (seen.has(key)) return
    seen.add(key)
    out.push({ phone: trimmed, formatted, source })
  }

  const text = body.innerText || ''
  let m: RegExpExecArray | null
  const re = new RegExp(PHONE_REGEX.source, PHONE_REGEX.flags)
  while ((m = re.exec(text)) !== null) {
    consider(m[0], 'text')
  }

  doc.querySelectorAll('a[href^="tel:"]').forEach((a) => {
    const href = (a as HTMLAnchorElement).getAttribute('href') || ''
    const num = href.replace(/^tel:/i, '').trim()
    consider(decodeURIComponent(num), 'tel')
  })

  return out
}

export default parsePhones
