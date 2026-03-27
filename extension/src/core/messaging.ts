import type { Message, MessageType } from './types'

/**
 * Envía un mensaje al runtime de la extensión (background script).
 * @param type - Tipo de mensaje a enviar
 * @param payload - Datos opcionales asociados al mensaje
 * @returns Promesa con la respuesta del receptor
 */
export function sendMessage<T = unknown>(type: MessageType, payload?: T): Promise<unknown> {
  return chrome.runtime.sendMessage({ type, payload })
}

/**
 * Envía un mensaje a un content script en una pestaña específica.
 * @param tabId - ID de la pestaña destino
 * @param type - Tipo de mensaje a enviar
 * @param payload - Datos opcionales asociados al mensaje
 * @returns Promesa con la respuesta del receptor
 */
export function sendTabMessage<T = unknown>(tabId: number, type: MessageType, payload?: T): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, { type, payload })
}

/**
 * Registra un listener para mensajes entrantes del runtime de la extensión.
 * @param callback - Función que se ejecuta al recibir un mensaje
 */
export function onMessage(
  callback: (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => void | boolean
): void {
  chrome.runtime.onMessage.addListener(callback)
}
