import { Database } from 'lucide-react'
import type { ScrapeStatus } from '@/core/types'
import { cn } from '@/lib/utils'

/** Propiedades del componente {@link StatusBar}. */
interface StatusBarProps {
  /** Estado actual del proceso de scraping. */
  status: ScrapeStatus
  /** Cantidad total de elementos extraídos. */
  totalCount: number
}

/** Mapa de estados de scraping a su texto descriptivo en español. */
const statusText: Record<ScrapeStatus, string> = {
  idle: 'Listo',
  scanning: 'Escaneando...',
  completed: 'Completado',
  error: 'Error',
}

/**
 * Barra de estado inferior que muestra el estado actual del scraping
 * (con indicador de color) y la cantidad total de elementos extraídos.
 *
 * @param props - {@link StatusBarProps}
 * @returns Barra con indicador de estado y contador de elementos.
 */
export function StatusBar({ status, totalCount }: StatusBarProps) {
  return (
    <div className="flex h-7 items-center justify-between border-t border-border bg-card px-4 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-block h-2 w-2 shrink-0 rounded-full',
            status === 'completed' && 'bg-emerald-500',
            status === 'idle' && 'bg-muted-foreground/50',
            status === 'error' && 'bg-destructive',
            status === 'scanning' && 'bg-blue-500 animate-pulse'
          )}
          aria-hidden
        />
        <span>{statusText[status]}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>{totalCount} elementos</span>
        <Database className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </div>
    </div>
  )
}
