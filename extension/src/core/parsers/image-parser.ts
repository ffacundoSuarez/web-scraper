import type { ImageResult } from '@/core/types'

/**
 * Convierte una cadena de dimensión de imagen a número.
 * @param v - Valor de dimensión como cadena (ej. atributo `width` o `height`).
 * @returns El valor numérico de la dimensión, o `0` si no es válido.
 */
function parseDim(v: string | null): number {
  if (!v) return 0
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : 0
}

/**
 * Extrae todas las imágenes de una página web.
 * Obtiene src, alt y dimensiones de cada elemento `<img>`, filtrando píxeles de seguimiento
 * (menores a 10×10) y data URIs cortos.
 * @param doc - El documento HTML del cual extraer las imágenes.
 * @returns Lista de resultados de imágenes sin duplicados.
 */
export function parseImages(doc: Document): ImageResult[] {
  const seen = new Set<string>()
  const out: ImageResult[] = []

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.src || ''
    if (!src) return
    if (seen.has(src)) return

    if (src.startsWith('data:') && src.length < 120) return

    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const w = nw > 0 ? nw : parseDim(img.getAttribute('width')) || img.width || 0
    const h = nh > 0 ? nh : parseDim(img.getAttribute('height')) || img.height || 0
    if (w > 0 && h > 0 && w < 10 && h < 10) return

    seen.add(src)
    out.push({
      src,
      alt: (img.getAttribute('alt') || '').trim(),
      width: w,
      height: h,
    })
  })

  return out
}

export default parseImages
