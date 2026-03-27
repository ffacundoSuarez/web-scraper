import type { ListExtractionData, Message, ScrapedData, ScrapeResultPayload, StartScrapePayload } from '@/core/types'
import { sendTabMessage } from '@/core/messaging'
import { getState, setListData, setState } from '@/core/storage'

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})

/**
 * Obtiene el ID de la pestaña activa en la ventana actual.
 * @returns El ID de la pestaña activa, o `undefined` si no hay ninguna.
 */
async function activeTabId(): Promise<number | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]?.id
}

function mergeScrapedData(a: ScrapedData, b: ScrapedData): ScrapedData {
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
 * Enrutador principal de mensajes de la extensión (service worker).
 * Escucha mensajes del runtime y despacha acciones según el tipo.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, payload } = message as Message

  switch (type) {
    case 'GET_STATE': {
      void getState().then((state) => sendResponse(state))
      return true
    }
    case 'START_SCRAPE': {
      void (async () => {
        try {
          const p = payload as StartScrapePayload
          await setState({
            status: 'scanning',
            url: p.url,
            timestamp: Date.now(),
          })
          const tabId = await activeTabId()
          if (tabId == null) {
            await setState({
              status: 'error',
              error: 'No active tab',
              timestamp: Date.now(),
            })
            sendResponse(null)
            return
          }
          await chrome.tabs.sendMessage(tabId, message as Message)
          sendResponse(null)
        } catch (e) {
          await setState({
            status: 'error',
            error: e instanceof Error ? e.message : String(e),
            timestamp: Date.now(),
          })
          sendResponse(null)
        }
      })()
      return true
    }
    case 'SCRAPE_RESULT': {
      void (async () => {
        const { data } = payload as ScrapeResultPayload
        await setState({
          data,
          status: 'completed',
          timestamp: Date.now(),
        })
        sendResponse(null)
      })()
      return true
    }
    case 'SCRAPE_ERROR': {
      void (async () => {
        const err =
          typeof payload === 'object' && payload !== null && 'error' in payload
            ? String((payload as { error: unknown }).error)
            : typeof payload === 'string'
              ? payload
              : 'Unknown error'
        await setState({
          status: 'error',
          error: err,
          timestamp: Date.now(),
        })
        sendResponse(null)
      })()
      return true
    }
    case 'START_SELECTOR': {
      void (async () => {
        const tabId = await activeTabId()
        if (tabId != null) await sendTabMessage(tabId, 'START_SELECTOR')
        sendResponse(null)
      })()
      return true
    }
    case 'STOP_SELECTOR': {
      void (async () => {
        const tabId = await activeTabId()
        if (tabId != null) await sendTabMessage(tabId, 'STOP_SELECTOR')
        sendResponse(null)
      })()
      return true
    }
    case 'START_PAGINATION': {
      void (async () => {
        const tabId = await activeTabId()
        if (tabId != null) await sendTabMessage(tabId, 'START_PAGINATION')
        sendResponse(null)
      })()
      return true
    }
    case 'STOP_PAGINATION': {
      void (async () => {
        const tabId = await activeTabId()
        if (tabId != null) await sendTabMessage(tabId, 'STOP_PAGINATION')
        sendResponse(null)
      })()
      return true
    }
    case 'ELEMENT_SELECTED': {
      void (async () => {
        const { data } = payload as ScrapeResultPayload
        const current = await getState()
        const merged = mergeScrapedData(current.data, data)
        await setState({
          data: merged,
          status: 'completed',
          timestamp: Date.now(),
        })
        sendResponse(null)
      })()
      return true
    }
    case 'START_LIST_DETECTOR': {
      void (async () => {
        const tabId = await activeTabId()
        if (tabId != null) await sendTabMessage(tabId, 'START_LIST_DETECTOR')
        sendResponse(null)
      })()
      return true
    }
    case 'STOP_LIST_DETECTOR': {
      void (async () => {
        const tabId = await activeTabId()
        if (tabId != null) await sendTabMessage(tabId, 'STOP_LIST_DETECTOR')
        sendResponse(null)
      })()
      return true
    }
    case 'LIST_EXTRACTED': {
      void (async () => {
        const { data } = payload as { data: ListExtractionData }
        await setListData(data)
        sendResponse(null)
      })()
      return true
    }
    default:
      break
  }
  return undefined
})
