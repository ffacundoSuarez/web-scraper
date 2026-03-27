import { useState, useEffect } from 'react'

/**
 * Hook genérico de React para sincronizar un valor con `chrome.storage.local`.
 *
 * Lee el valor inicial del almacenamiento y se suscribe a los cambios en
 * tiempo real mediante un listener de `chrome.storage.onChanged`.
 *
 * @template T - Tipo del valor almacenado.
 * @param key - Clave bajo la que se almacena el valor en `chrome.storage.local`.
 * @param defaultValue - Valor por defecto mientras no exista uno almacenado.
 * @returns Tupla `[value, set]` con el valor actual y una función para actualizarlo.
 */
export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    void chrome.storage.local.get(key).then((result) => {
      if (result[key] !== undefined) setValue(result[key] as T)
    })

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[key]) setValue(changes[key].newValue as T)
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [key])

  const set = async (newValue: T) => {
    setValue(newValue)
    await chrome.storage.local.set({ [key]: newValue })
  }

  return [value, set] as const
}
