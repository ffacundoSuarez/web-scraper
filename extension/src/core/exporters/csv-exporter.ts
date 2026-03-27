import type { ScrapedData, ScraperType } from '@/core/types'

/**
 * Escapa un valor para formato CSV, envolviéndolo en comillas si contiene caracteres especiales.
 * @param v - Valor a escapar.
 * @returns La cadena escapada lista para insertarse en una celda CSV.
 */
function escapeCsvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Crea un elemento ancla temporal para disparar la descarga de un archivo en el navegador.
 * @param blob - El objeto Blob que contiene los datos del archivo.
 * @param filename - Nombre del archivo a descargar.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exporta un arreglo genérico de objetos como un archivo CSV y dispara su descarga.
 * @param data - Arreglo de objetos a exportar.
 * @param filename - Nombre del archivo CSV resultante.
 */
export function exportToCSV(data: unknown[], filename: string): void {
  const bom = '\uFEFF'
  if (!data.length) {
    const blob = new Blob([bom], { type: 'text/csv;charset=utf-8' })
    triggerDownload(blob, filename)
    return
  }
  const row0 = data[0] as Record<string, unknown>
  const keys = Object.keys(row0)
  const header = keys.map(escapeCsvCell).join(',')
  const lines = data.map((row) =>
    keys.map((k) => escapeCsvCell((row as Record<string, unknown>)[k])).join(','),
  )
  const csv = bom + [header, ...lines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, filename)
}

/**
 * Exporta los datos scrapeados de un tipo específico como archivo CSV.
 * @param data - Objeto con todos los datos scrapeados.
 * @param type - Tipo de scraper cuyos datos se exportarán.
 */
export function scrapedDataToCSV(data: ScrapedData, type: ScraperType): void {
  const rows = data[type] as unknown[]
  exportToCSV(rows, `${type}.csv`)
}
