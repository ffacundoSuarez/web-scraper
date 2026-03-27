import { Settings2, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Propiedades del componente {@link Header}. */
interface HeaderProps {
  /** Callback ejecutado al pulsar el botón de limpiar datos. */
  onClear: () => void
}

/**
 * Componente de encabezado de la extensión.
 *
 * Muestra el título "Mega Web Scraper" junto con botones de configuración
 * (deshabilitado) y limpieza de datos.
 *
 * @param props - {@link HeaderProps}
 * @returns Elemento `<header>` con el título y los botones de acción.
 */
export function Header({ onClear }: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" aria-hidden />
        <span className="text-base font-bold">
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Mega
          </span>{' '}
          <span className="text-foreground">Web Scraper</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Settings2 className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Configuración</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Limpiar datos</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
