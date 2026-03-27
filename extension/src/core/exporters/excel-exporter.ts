import * as XLSX from 'xlsx'
import type { ScrapedData, ScraperType } from '@/core/types'

/** Orden de las hojas en la exportación a Excel. */
const SHEET_ORDER: (keyof ScrapedData)[] = [
  'emails',
  'phones',
  'links',
  'images',
  'text',
  'tables',
  'reviews',
  'business',
  'social',
]

/**
 * Exporta un arreglo genérico de objetos como un archivo Excel con una sola hoja.
 * @param data - Arreglo de objetos a exportar.
 * @param filename - Nombre del archivo Excel resultante.
 */
export function exportToExcel(data: unknown[], filename: string): void {
  const wb = XLSX.utils.book_new()
  const rows = data.length ? data : [{}]
  const ws = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[])
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename)
}

/**
 * Exporta los datos scrapeados como archivo Excel. Si se indica un tipo, exporta solo ese tipo
 * en una sola hoja; de lo contrario, crea una hoja por cada tipo de dato.
 * @param data - Objeto con todos los datos scrapeados.
 * @param type - Tipo de scraper a exportar (opcional). Si se omite, se exportan todos los tipos.
 */
export function scrapedDataToExcel(data: ScrapedData, type?: ScraperType): void {
  if (type !== undefined) {
    const rows = data[type] as unknown[]
    exportToExcel(rows, `${type}.xlsx`)
    return
  }
  const wb = XLSX.utils.book_new()
  for (const key of SHEET_ORDER) {
    const rows = data[key] as unknown[]
    const sheetRows = rows.length ? rows : [{}]
    const ws = XLSX.utils.json_to_sheet(sheetRows as Record<string, unknown>[])
    const sheetName = key.length <= 31 ? key : key.slice(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }
  XLSX.writeFile(wb, 'scrape-all.xlsx')
}
