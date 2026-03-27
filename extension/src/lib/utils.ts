import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina y fusiona clases de Tailwind CSS utilizando `clsx` y `tailwind-merge`.
 *
 * @param inputs - Lista de valores de clase (cadenas, objetos condicionales, arrays, etc.).
 * @returns Cadena con las clases fusionadas sin duplicados ni conflictos de Tailwind.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
