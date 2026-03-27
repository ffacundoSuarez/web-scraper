/** Expresión regular que identifica texto de botones de "página siguiente" en inglés y español. */
const NEXT_TEXT = /next|siguiente|próxima|›|»|→/i

/** Bandera que indica si se debe detener la paginación automática. */
let shouldStop = false

/**
 * Obtiene el texto visible de un elemento HTML.
 * @param el - El elemento del cual extraer el texto.
 * @returns El texto visible del elemento, recortado de espacios.
 */
function visibleText(el: HTMLElement): string {
  return (el.innerText ?? el.textContent ?? '').trim()
}

/**
 * Determina si un elemento probablemente representa un botón o enlace
 * de "página siguiente", evaluando atributos rel, clases, aria-label y texto visible.
 * @param el - El elemento HTML a evaluar.
 * @returns `true` si el elemento parece ser un control de "página siguiente".
 */
function isNextLike(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase()
  if (tag === 'a' && el.getAttribute('rel') === 'next') return true
  const cls = (el.className?.toString?.() ?? '').toLowerCase()
  if (cls.includes('next')) return true
  const aria = (el.getAttribute('aria-label') ?? '').toLowerCase()
  if (aria.includes('next')) return true
  const t = visibleText(el)
  if (t && NEXT_TEXT.test(t)) return true
  return false
}

/**
 * Obtiene todos los elementos anchor con href y botones del documento
 * como candidatos para enlaces de página siguiente.
 * @param doc - El documento del cual extraer los candidatos.
 * @returns Un array de elementos HTML candidatos.
 */
function candidates(doc: Document): HTMLElement[] {
  const list: HTMLElement[] = []
  doc.querySelectorAll('a[href], button').forEach((n) => {
    if (n instanceof HTMLElement) list.push(n)
  })
  return list
}

/**
 * Busca el enlace de la siguiente página numerada dentro de contenedores
 * de paginación. Identifica la página activa y busca un enlace con el
 * número consecutivo siguiente.
 * @param doc - El documento donde buscar.
 * @returns El elemento del enlace a la siguiente página, o `null` si no se encuentra.
 */
function findNumberedNext(doc: Document): HTMLElement | null {
  const containers = doc.querySelectorAll(
    '[class*="pagination"], [class*="pager"], [class*="pages"], nav[aria-label*="pagination" i], nav[aria-label*="page" i]'
  )
  let activeNum: number | null = null
  for (const root of containers) {
    const active =
      root.querySelector('.active, .current, [aria-current="page"], .selected') ??
      root.querySelector('[class*="active"]')
    if (active?.textContent) {
      const m = active.textContent.trim().match(/^\d+$/)
      if (m) {
        activeNum = parseInt(m[0], 10)
        break
      }
    }
  }
  if (activeNum == null) return null
  const want = String(activeNum + 1)
  for (const root of containers) {
    const links = root.querySelectorAll('a[href]')
    for (const a of links) {
      if (!(a instanceof HTMLElement)) continue
      if (visibleText(a) === want) return a
    }
  }
  return null
}

/**
 * Encuentra el elemento de "página siguiente" en el documento.
 * Primero busca por texto/atributos (ej. "Next"), y si no lo encuentra,
 * recurre a la búsqueda por paginación numerada.
 * @param doc - El documento donde buscar.
 * @returns El elemento de la siguiente página, o `null` si no existe.
 */
export function findNextPageElement(doc: Document): HTMLElement | null {
  for (const el of candidates(doc)) {
    if (isNextLike(el)) return el
  }
  return findNumberedNext(doc)
}

/**
 * Encuentra todos los enlaces de páginas numeradas dentro de contenedores
 * de paginación del documento.
 * @param doc - El documento donde buscar.
 * @returns Un array de elementos HTML que representan enlaces a páginas numeradas.
 */
export function findPageNumbers(doc: Document): HTMLElement[] {
  const out: HTMLElement[] = []
  const roots = doc.querySelectorAll(
    '[class*="pagination"], [class*="pager"], [class*="pages"], nav[aria-label*="pagination" i]'
  )
  roots.forEach((root) => {
    root.querySelectorAll('a[href]').forEach((a) => {
      if (!(a instanceof HTMLElement)) return
      const t = visibleText(a)
      if (/^\d+$/.test(t)) out.push(a)
    })
  })
  return out
}

/**
 * Detiene la paginación automática activando la bandera de parada.
 */
export function stopPagination(): void {
  shouldStop = true
}

/**
 * Navega automáticamente por las páginas haciendo clic en el enlace de
 * "siguiente" y ejecutando la función de scraping en cada página.
 * Se detiene al alcanzar el máximo de páginas, al no encontrar más
 * enlaces, o al activarse la bandera de parada.
 * @param scrapeFn - Función de scraping a ejecutar en cada página.
 * @param maxPages - Número máximo de páginas a recorrer (por defecto 10).
 */
export async function autoPageinate(
  scrapeFn: () => void | Promise<void>,
  maxPages = 10
): Promise<void> {
  shouldStop = false
  let n = 0
  while (n < maxPages && !shouldStop) {
    const next = findNextPageElement(document)
    if (!next) break
    next.click()
    await new Promise<void>((resolve) => setTimeout(resolve, 2000))
    await Promise.resolve(scrapeFn())
    n += 1
  }
}
