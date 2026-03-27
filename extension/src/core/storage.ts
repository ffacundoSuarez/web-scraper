import type { ListExtractionData, ScrapeState, ScrapedData } from './types'

/** Clave utilizada en chrome.storage.local para persistir el estado */
const STORAGE_KEY = 'mega_scraper_state'

/** Clave para persistir los datos de extracción de listas */
const LIST_STORAGE_KEY = 'mega_scraper_list_data'

/** Estructura de datos vacía, usada como valor inicial para todos los tipos de scraper */
export const emptyData: ScrapedData = {
  emails: [],
  phones: [],
  links: [],
  images: [],
  text: [],
  tables: [],
  reviews: [],
  business: [],
  social: [],
}

/** Estado por defecto de la extensión al inicializarse o reiniciarse */
export const defaultState: ScrapeState = {
  status: 'idle',
  data: emptyData,
  url: '',
  timestamp: 0,
}

/**
 * Obtiene el estado actual del scraper desde chrome.storage.local.
 * @returns Estado actual o el estado por defecto si no existe
 */
export async function getState(): Promise<ScrapeState> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] ?? defaultState
}

/**
 * Actualiza parcialmente el estado del scraper en chrome.storage.local.
 * Fusiona los campos proporcionados con el estado existente.
 * @param state - Campos del estado a actualizar
 */
export async function setState(state: Partial<ScrapeState>): Promise<void> {
  const current = await getState()
  await chrome.storage.local.set({
    [STORAGE_KEY]: { ...current, ...state },
  })
}

/**
 * Restablece el estado del scraper a sus valores por defecto.
 */
export async function clearState(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: defaultState })
}

/**
 * Registra un listener que se ejecuta cuando el estado cambia en chrome.storage.
 * @param callback - Función invocada con el nuevo estado cuando ocurre un cambio
 * @returns Función para cancelar la suscripción al listener
 */
export function onStateChange(callback: (state: ScrapeState) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[STORAGE_KEY]) {
      callback(changes[STORAGE_KEY].newValue as ScrapeState)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

/** Valor por defecto para la extracción de listas */
export const defaultListData: ListExtractionData = {
  columns: [],
  rows: [],
  sourceUrl: '',
  timestamp: 0,
  listSelector: '',
  itemCount: 0,
}

export async function getListData(): Promise<ListExtractionData> {
  const result = await chrome.storage.local.get(LIST_STORAGE_KEY)
  return result[LIST_STORAGE_KEY] ?? defaultListData
}

export async function setListData(data: ListExtractionData): Promise<void> {
  await chrome.storage.local.set({ [LIST_STORAGE_KEY]: data })
}

export async function clearListData(): Promise<void> {
  await chrome.storage.local.set({ [LIST_STORAGE_KEY]: defaultListData })
}

export function onListDataChange(callback: (data: ListExtractionData) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[LIST_STORAGE_KEY]) {
      callback(changes[LIST_STORAGE_KEY].newValue as ListExtractionData)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
