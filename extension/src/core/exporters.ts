import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import type { ScrapedData } from './types'

/**
 * Convierte los datos extraídos en un arreglo plano de filas clave-valor para exportación.
 * Cada resultado se transforma en un objeto con un campo `type` que indica su categoría.
 * @param data - Datos extraídos agrupados por tipo de scraper
 * @returns Arreglo de filas con valores convertidos a string
 */
function flattenForExport(data: ScrapedData): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  for (const r of data.emails) {
    rows.push({ type: 'emails', email: r.email, source: r.source })
  }
  for (const r of data.phones) {
    rows.push({ type: 'phones', phone: r.phone, formatted: r.formatted, source: r.source })
  }
  for (const r of data.links) {
    rows.push({
      type: 'links',
      url: r.url,
      text: r.text,
      title: r.title,
      isExternal: String(r.isExternal),
    })
  }
  for (const r of data.images) {
    rows.push({
      type: 'images',
      src: r.src,
      alt: r.alt,
      width: String(r.width),
      height: String(r.height),
    })
  }
  for (const r of data.text) {
    rows.push({ type: 'text', content: r.content, tag: r.tag, selector: r.selector })
  }
  for (const r of data.tables) {
    rows.push({
      type: 'tables',
      headers: JSON.stringify(r.headers),
      rows: JSON.stringify(r.rows),
      selector: r.selector,
    })
  }
  for (const r of data.reviews) {
    rows.push({
      type: 'reviews',
      author: r.author,
      rating: r.rating,
      text: r.text,
      date: r.date,
    })
  }
  for (const r of data.business) {
    rows.push({
      type: 'business',
      name: r.name,
      address: r.address,
      phone: r.phone,
      email: r.email,
      website: r.website,
      description: r.description,
    })
  }
  for (const r of data.social) {
    rows.push({ type: 'social', platform: r.platform, url: r.url, username: r.username })
  }
  return rows
}

/**
 * Escapa un valor para uso seguro en celdas CSV.
 * Envuelve en comillas dobles si contiene caracteres especiales.
 * @param v - Valor de texto a escapar
 * @returns Valor escapado listo para CSV
 */
function escapeCsvCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

/**
 * Exporta los datos extraídos a un archivo CSV con codificación UTF-8 BOM.
 * @param data - Datos extraídos a exportar
 */
export function exportToCSV(data: ScrapedData): void {
  const rows = flattenForExport(data)
  if (rows.length === 0) {
    const blob = new Blob(['type\n'], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, 'mega-scraper.csv')
    return
  }
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const header = keys.map(escapeCsvCell).join(',')
  const lines = rows.map((row) => keys.map((k) => escapeCsvCell(row[k] ?? '')).join(','))
  const csv = [header, ...lines].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, 'mega-scraper.csv')
}

/**
 * Exporta los datos extraídos a un archivo Excel (.xlsx) utilizando la librería xlsx.
 * @param data - Datos extraídos a exportar
 */
export function exportToExcel(data: ScrapedData): void {
  const rows = flattenForExport(data)
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ type: '' }])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'mega-scraper.xlsx')
}

/**
 * Exporta los datos extraídos a un archivo JSON con formato legible (indentado).
 * @param data - Datos extraídos a exportar
 */
export function exportToJSON(data: ScrapedData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, 'mega-scraper.json')
}
