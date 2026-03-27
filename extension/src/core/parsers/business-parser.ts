import type { BusinessResult } from '@/core/types'

/**
 * Obtiene el texto interior recortado de un elemento.
 * @param el - El elemento del cual extraer el texto.
 * @returns El texto recortado, o cadena vacía si el elemento es nulo.
 */
function textOf(el: Element | null | undefined): string {
  if (!el) return ''
  return (el as HTMLElement).innerText?.trim() || ''
}

/**
 * Busca un elemento con el atributo `itemprop` especificado y devuelve su valor.
 * Maneja casos especiales para enlaces `mailto:` y propiedades de URL.
 * @param scope - El elemento contenedor donde buscar.
 * @param name - El valor del atributo `itemprop` a buscar.
 * @returns El valor extraído del elemento, o cadena vacía si no existe.
 */
function findItemProp(scope: Element, name: string): string {
  const el = scope.querySelector(`[itemprop="${name}"]`)
  if (!el) return ''
  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute('href') || ''
    if (href.startsWith('mailto:')) {
      return el.href.replace(/^mailto:/i, '').split('?')[0]
    }
    if (name === 'url' || name === 'sameAs') return el.href
  }
  return textOf(el)
}

/**
 * Ensambla una dirección a partir de sub-propiedades de microdata de dirección.
 * Combina calle, localidad, región y código postal separados por comas.
 * @param scope - El elemento contenedor con microdata de dirección.
 * @returns La dirección formateada como cadena, o cadena vacía si no hay datos.
 */
function addressFromMicrodata(scope: Element): string {
  const addr = scope.querySelector('[itemprop="address"][itemscope]')
  if (!addr) return findItemProp(scope, 'address')
  return [
    findItemProp(addr, 'streetAddress'),
    findItemProp(addr, 'addressLocality'),
    findItemProp(addr, 'addressRegion'),
    findItemProp(addr, 'postalCode'),
  ]
    .filter(Boolean)
    .join(', ')
}

/**
 * Construye un objeto `BusinessResult` a partir de un elemento con microdata `itemscope`.
 * Extrae nombre, dirección, teléfono, email, sitio web y descripción.
 * @param scope - El elemento con `itemscope` de tipo negocio/organización.
 * @returns Objeto con los datos del negocio extraídos.
 */
function fromItemScope(scope: Element): BusinessResult {
  return {
    name: findItemProp(scope, 'name'),
    address: addressFromMicrodata(scope),
    phone: findItemProp(scope, 'telephone'),
    email: findItemProp(scope, 'email'),
    website: findItemProp(scope, 'url'),
    description: findItemProp(scope, 'description'),
  }
}

/**
 * Formatea un objeto de dirección JSON-LD a una cadena legible.
 * Combina calle, localidad, región y código postal separados por comas.
 * @param addr - El objeto de dirección JSON-LD, o una cadena directa.
 * @returns La dirección formateada como cadena.
 */
function formatAddressLd(addr: unknown): string {
  if (typeof addr === 'string') return addr
  if (!addr || typeof addr !== 'object') return ''
  const a = addr as Record<string, unknown>
  return [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode]
    .map((x) => (typeof x === 'string' ? x : ''))
    .filter(Boolean)
    .join(', ')
}

/**
 * Extrae la URL de un objeto JSON-LD, buscando en los campos `url` o `sameAs`.
 * @param o - El objeto JSON-LD del cual extraer la URL.
 * @returns La URL encontrada, o cadena vacía si no existe.
 */
function ldUrl(o: Record<string, unknown>): string {
  const u = o.url
  if (typeof u === 'string') return u
  const s = o.sameAs
  if (typeof s === 'string') return s
  if (Array.isArray(s) && typeof s[0] === 'string') return s[0]
  return ''
}

/**
 * Recorre recursivamente datos JSON-LD buscando entidades de tipo LocalBusiness, Organization, etc.
 * Agrega los resultados encontrados al array de salida.
 * @param obj - El objeto JSON-LD a recorrer.
 * @param out - Array donde se acumulan los resultados de negocios encontrados.
 * @param seen - Conjunto para evitar ciclos en la recursión.
 */
function collectJsonLd(obj: unknown, out: BusinessResult[], seen: Set<unknown>) {
  if (obj === null || obj === undefined) return
  if (typeof obj !== 'object') return
  if (seen.has(obj)) return
  seen.add(obj)

  if (Array.isArray(obj)) {
    obj.forEach((x) => collectJsonLd(x, out, seen))
    return
  }

  const o = obj as Record<string, unknown>
  const t = o['@type']
  const types = Array.isArray(t) ? t : t != null ? [t] : []
  const match = types.some(
    (x) =>
      typeof x === 'string' &&
      /LocalBusiness|Organization|Store|Restaurant|FoodEstablishment|Corporation|Place/i.test(x),
  )
  if (match) {
    out.push({
      name: typeof o.name === 'string' ? o.name : '',
      address: formatAddressLd(o.address),
      phone: typeof o.telephone === 'string' ? o.telephone : '',
      email: typeof o.email === 'string' ? o.email : '',
      website: ldUrl(o),
      description: typeof o.description === 'string' ? o.description : '',
    })
  }

  if (o['@graph'] !== undefined) collectJsonLd(o['@graph'], out, seen)
  for (const v of Object.values(o)) {
    if (v && typeof v === 'object') collectJsonLd(v, out, seen)
  }
}

/**
 * Genera una clave de deduplicación para un negocio combinando nombre, dirección, teléfono y email.
 * @param b - El resultado de negocio para el cual generar la clave.
 * @returns Clave en minúsculas para comparación de duplicados.
 */
function bizKey(b: BusinessResult): string {
  return [b.name, b.address, b.phone, b.email].join('|').toLowerCase()
}

/**
 * Fusiona dos objetos `BusinessResult`, conservando los campos no vacíos del primero
 * y rellenando con los del segundo.
 * @param a - El resultado de negocio principal.
 * @param b - El resultado de negocio secundario (respaldo).
 * @returns Un nuevo objeto `BusinessResult` con los campos fusionados.
 */
function mergeBiz(a: BusinessResult, b: BusinessResult): BusinessResult {
  return {
    name: a.name || b.name,
    address: a.address || b.address,
    phone: a.phone || b.phone,
    email: a.email || b.email,
    website: a.website || b.website,
    description: a.description || b.description,
  }
}

/**
 * Extrae información de negocios de una página web usando múltiples estrategias.
 * Busca en JSON-LD, microdata (`itemscope` LocalBusiness/Organization) y
 * coincidencias heurísticas por clases CSS. Fusiona y deduplica los resultados.
 * @param doc - El documento HTML del cual extraer la información de negocios.
 * @returns Lista de negocios sin duplicados con datos fusionados.
 */
export function parseBusiness(doc: Document): BusinessResult[] {
  const raw: BusinessResult[] = []
  const seen = new Set<unknown>()

  doc.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    try {
      collectJsonLd(JSON.parse(script.textContent || '{}'), raw, seen)
    } catch {
      /* ignore */
    }
  })

  doc
    .querySelectorAll('[itemscope][itemtype*="LocalBusiness" i], [itemscope][itemtype*="Organization" i]')
    .forEach((scope) => raw.push(fromItemScope(scope)))

  const classSel =
    '[class*="company" i], [class*="business" i], [class*="contact" i], [class*="address" i]'
  doc.querySelectorAll(classSel).forEach((el) => {
    const block = el.closest('section, article, div, footer, header, main') || el
    if (textOf(block).length < 6) return
    raw.push({
      name: textOf(block.querySelector('[class*="company" i], [class*="business-name" i], h1, h2')) || '',
      address: textOf(block.querySelector('[class*="address" i], [itemprop="address"]')) || '',
      phone: textOf(block.querySelector('[class*="phone" i], [itemprop="telephone"]')) || '',
      email: textOf(block.querySelector('[class*="email" i], [itemprop="email"]')) || '',
      website:
        (block.querySelector('a[href^="http"]') as HTMLAnchorElement | null)?.href ||
        findItemProp(block, 'url'),
      description: textOf(block.querySelector('[class*="about" i], [class*="description" i]')) || '',
    })
  })

  const byKey = new Map<string, BusinessResult>()
  for (const b of raw) {
    const hasAny = [b.name, b.address, b.phone, b.email, b.website, b.description].some((x) => x.trim())
    if (!hasAny) continue
    const k = bizKey(b)
    const prev = byKey.get(k)
    byKey.set(k, prev ? mergeBiz(prev, b) : b)
  }

  return Array.from(byKey.values())
}

export default parseBusiness
