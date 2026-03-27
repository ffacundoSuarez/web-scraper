import type { ReviewResult } from '@/core/types'

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
 * Busca un elemento con el atributo `itemprop` especificado dentro de un contenedor y devuelve su texto.
 * @param root - El elemento raíz donde buscar.
 * @param name - El valor del atributo `itemprop` a buscar.
 * @returns El texto del elemento encontrado, o cadena vacía si no existe.
 */
function findItemProp(root: Element, name: string): string {
  const el = root.querySelector(`[itemprop="${name}"]`)
  return textOf(el)
}

/**
 * Extrae una calificación desde atributos `aria-label` que contengan "star" o "rating".
 * @param root - El elemento raíz donde buscar la calificación.
 * @returns El valor del aria-label con la calificación, o cadena vacía si no se encuentra.
 */
function ratingFromAria(root: Element): string {
  const star = root.querySelector('[aria-label*="star" i], [aria-label*="rating" i]')
  if (!star) return ''
  return (star.getAttribute('aria-label') || '').trim()
}

/**
 * Construye un objeto `ReviewResult` a partir de un elemento con microdata de tipo Review.
 * Extrae autor, calificación, texto y fecha de las propiedades `itemprop`.
 * @param scope - El elemento con `itemscope` de tipo Review.
 * @returns Objeto con los datos de la reseña extraídos.
 */
function fromReviewScope(scope: Element): ReviewResult {
  const timeEl = scope.querySelector('time')
  const date =
    findItemProp(scope, 'datePublished') ||
    timeEl?.getAttribute('datetime') ||
    textOf(timeEl)
  return {
    author:
      findItemProp(scope, 'author') ||
      textOf(scope.querySelector('[class*="author" i], [class*="name" i]')),
    rating:
      findItemProp(scope, 'ratingValue') ||
      findItemProp(scope, 'bestRating') ||
      ratingFromAria(scope),
    text:
      findItemProp(scope, 'reviewBody') ||
      findItemProp(scope, 'description') ||
      textOf(scope.querySelector('[class*="review-text" i], [class*="comment-body" i]')),
    date,
  }
}

/**
 * Construye un objeto `ReviewResult` buscando heurísticamente por clases CSS.
 * Busca elementos con clases que contengan "author", "rating", "comment", etc.
 * @param el - El bloque de contenido del cual extraer la reseña.
 * @returns Objeto con los datos de la reseña extraídos heurísticamente.
 */
function fromHeuristicBlock(el: Element): ReviewResult {
  const author =
    textOf(el.querySelector('[class*="author" i], [class*="user" i], [class*="name" i]')) ||
    textOf(el.querySelector('[itemprop="author"]'))
  const rating =
    findItemProp(el, 'ratingValue') ||
    ratingFromAria(el) ||
    textOf(el.querySelector('[class*="rating" i], [class*="stars" i]'))
  const text =
    findItemProp(el, 'reviewBody') ||
    textOf(el.querySelector('[class*="comment" i], [class*="review-body" i], [class*="review_text" i]')) ||
    textOf(el)
  const timeEl = el.querySelector('time')
  const date =
    findItemProp(el, 'datePublished') ||
    timeEl?.getAttribute('datetime') ||
    textOf(timeEl)
  return { author, rating, text, date }
}

/**
 * Extrae reseñas de una página web usando múltiples estrategias.
 * Busca en microdata (`itemscope` Review), elementos `itemprop="review"`,
 * coincidencias heurísticas por clases CSS, y atributos `aria-label` de calificación.
 * @param doc - El documento HTML del cual extraer las reseñas.
 * @returns Lista de reseñas sin duplicados.
 */
export function parseReviews(doc: Document): ReviewResult[] {
  const seen = new Set<string>()
  const out: ReviewResult[] = []

  const add = (r: ReviewResult) => {
    if (!r.text.trim() && !r.author.trim() && !r.rating.trim()) return
    const key = `${r.author.toLowerCase()}|${r.text.slice(0, 240)}|${r.rating}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(r)
  }

  doc.querySelectorAll('[itemscope][itemtype*="Review" i]').forEach((scope) => add(fromReviewScope(scope)))

  doc.querySelectorAll('[itemprop="review"]').forEach((el) => {
    const scope = el.closest('[itemscope]') || el
    add(fromReviewScope(scope))
  })

  const heuristicSel =
    '[class*="review" i], [class*="rating" i], [class*="stars" i], [class*="comment" i]'
  doc.querySelectorAll(heuristicSel).forEach((el) => {
    if (el.closest('[itemscope][itemtype*="Review" i]')) return
    const block = el.closest('article, li, div, section') || el
    if (textOf(block).length < 8) return
    add(fromHeuristicBlock(block))
  })

  doc.querySelectorAll('[aria-label*="star" i], [aria-label*="rating" i]').forEach((el) => {
    if (el.closest('[itemscope][itemtype*="Review" i]')) return
    const block = el.closest('article, li, div, section') || el.parentElement
    if (!block) return
    add(fromHeuristicBlock(block))
  })

  return out
}

export default parseReviews
