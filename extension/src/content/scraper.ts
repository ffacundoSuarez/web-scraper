import type { Message, ScrapedData } from '@/core/types'
import {
  parseBusiness,
  parseEmails,
  parseImages,
  parseLinks,
  parsePhones,
  parseReviews,
  parseSocial,
  parseTables,
  parseText,
} from '@/core/parsers'
import { disableSelector, enableSelector } from './selector'
import { autoPageinate, stopPagination } from './pagination'
import { disableListDetector, enableListDetector } from './list-detector'

/** Acumula los datos extraídos a lo largo de múltiples páginas durante la paginación automática. */
let paginationMerged: ScrapedData | null = null

/**
 * Ejecuta todos los parsers sobre el documento actual y devuelve los datos extraídos.
 * @returns Un objeto {@link ScrapedData} con los resultados de cada parser.
 */
function scrapeDocument(): ScrapedData {
  return {
    emails: parseEmails(document),
    phones: parsePhones(document),
    links: parseLinks(document),
    images: parseImages(document),
    text: parseText(document),
    tables: parseTables(document),
    reviews: parseReviews(document),
    business: parseBusiness(document),
    social: parseSocial(document),
  }
}

/**
 * Combina dos objetos {@link ScrapedData} concatenando todos sus arrays.
 * @param a - Primer conjunto de datos extraídos.
 * @param b - Segundo conjunto de datos extraídos.
 * @returns Un nuevo objeto {@link ScrapedData} con los arrays fusionados.
 */
function mergeScraped(a: ScrapedData, b: ScrapedData): ScrapedData {
  return {
    emails: [...a.emails, ...b.emails],
    phones: [...a.phones, ...b.phones],
    links: [...a.links, ...b.links],
    images: [...a.images, ...b.images],
    text: [...a.text, ...b.text],
    tables: [...a.tables, ...b.tables],
    reviews: [...a.reviews, ...b.reviews],
    business: [...a.business, ...b.business],
    social: [...a.social, ...b.social],
  }
}

/**
 * Envía un mensaje de tipo SCRAPE_ERROR al background script con el detalle del error.
 * @param err - El error capturado (puede ser un Error u otro valor).
 */
function sendScrapeError(err: unknown): void {
  const error = err instanceof Error ? err.message : String(err)
  void chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', payload: { error } } satisfies Message)
}

/**
 * Listener de mensajes del content script.
 * Maneja los tipos: START_SCRAPE, START_SELECTOR, STOP_SELECTOR,
 * START_PAGINATION y STOP_PAGINATION.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type } = message as Message

  switch (type) {
    case 'START_SCRAPE': {
      try {
        const data = scrapeDocument()
        void chrome.runtime.sendMessage({
          type: 'SCRAPE_RESULT',
          payload: { data },
        } satisfies Message)
      } catch (e) {
        sendScrapeError(e)
      }
      sendResponse(null)
      break
    }
    case 'START_SELECTOR': {
      enableSelector()
      sendResponse(null)
      break
    }
    case 'STOP_SELECTOR': {
      disableSelector()
      sendResponse(null)
      break
    }
    case 'START_PAGINATION': {
      try {
        paginationMerged = scrapeDocument()
        void chrome.runtime.sendMessage({
          type: 'SCRAPE_RESULT',
          payload: { data: paginationMerged },
        } satisfies Message)
        void autoPageinate(async () => {
          const next = scrapeDocument()
          paginationMerged = mergeScraped(paginationMerged!, next)
          void chrome.runtime.sendMessage({
            type: 'SCRAPE_RESULT',
            payload: { data: paginationMerged },
          } satisfies Message)
        })
      } catch (e) {
        sendScrapeError(e)
      }
      sendResponse(null)
      break
    }
    case 'STOP_PAGINATION': {
      stopPagination()
      sendResponse(null)
      break
    }
    case 'START_LIST_DETECTOR': {
      enableListDetector()
      sendResponse(null)
      break
    }
    case 'STOP_LIST_DETECTOR': {
      disableListDetector()
      sendResponse(null)
      break
    }
    default:
      break
  }
  return undefined
})
