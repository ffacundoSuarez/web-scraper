import type { TableResult } from '@/core/types'

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
 * Construye un selector CSS completo desde `body` hasta el elemento `<table>` dado.
 * @param table - El elemento de tabla para el cual construir el selector.
 * @param doc - El documento que contiene la tabla.
 * @returns Selector CSS con la ruta completa hasta la tabla.
 */
function buildTableSelector(table: HTMLTableElement, doc: Document): string {
  const parts: string[] = []
  let el: Element | null = table
  while (el && el !== doc.body && el !== doc.documentElement) {
    parts.unshift(nthOfTypeSelector(el))
    el = el.parentElement
  }
  return parts.length ? parts.join(' > ') : 'table'
}

/**
 * Obtiene el texto interior recortado de una celda de tabla.
 * @param c - El elemento de celda (`<td>` o `<th>`).
 * @returns El texto de la celda sin espacios al inicio/final.
 */
function cellText(c: Element): string {
  return (c as HTMLElement).innerText?.trim() || ''
}

/**
 * Extrae todas las tablas HTML de una página web.
 * Separa los encabezados de las filas de datos y genera un selector CSS para cada tabla.
 * @param doc - El documento HTML del cual extraer las tablas.
 * @returns Lista de resultados de tablas con encabezados, filas y selectores.
 */
export function parseTables(doc: Document): TableResult[] {
  const out: TableResult[] = []

  doc.querySelectorAll('table').forEach((t) => {
    const table = t as HTMLTableElement
    const selector = buildTableSelector(table, doc)
    const trs = Array.from(table.querySelectorAll('tr'))
    if (!trs.length) return

    let headers: string[] = []
    let firstDataRow = 0

    if (table.querySelector('th')) {
      const hr = trs.find((tr) => tr.querySelector('th')) ?? trs[0]
      firstDataRow = trs.indexOf(hr) + 1
      headers = Array.from(hr.querySelectorAll('th, td')).map(cellText)
    } else {
      headers = Array.from(trs[0].querySelectorAll('td, th')).map(cellText)
      firstDataRow = 1
    }

    const rows: string[][] = []
    for (let i = firstDataRow; i < trs.length; i++) {
      const tds = Array.from(trs[i].querySelectorAll('td'))
      if (!tds.length) continue
      rows.push(tds.map(cellText))
    }

    const hasContent =
      headers.some((h) => h.length > 0) || rows.some((r) => r.some((c) => c.length > 0))
    if (!hasContent) return

    out.push({ headers, rows, selector })
  })

  return out
}

export default parseTables
