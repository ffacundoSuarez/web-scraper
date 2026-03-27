import type { ScrapedData, ScraperType } from '@/core/types'

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
 * Exporta un arreglo genérico de objetos como un archivo JSON y dispara su descarga.
 * @param data - Arreglo de objetos a exportar.
 * @param filename - Nombre del archivo JSON resultante.
 */
export function exportToJSON(data: unknown[], filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  triggerDownload(blob, filename)
}

/**
 * Exporta los datos scrapeados de un tipo específico como archivo JSON.
 * @param data - Objeto con todos los datos scrapeados.
 * @param type - Tipo de scraper cuyos datos se exportarán.
 */
export function scrapedDataToJSON(data: ScrapedData, type: ScraperType): void {
  const rows = data[type] as unknown[]
  exportToJSON(rows, `${type}.json`)
}
