import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Propiedades del componente {@link Header}. */
interface HeaderProps {
  /** Callback ejecutado al pulsar el botón de limpiar datos. */
  onClear: () => void
}

/**
 * Encabezado de la extensión con logo y botón de limpieza.
 */
export function Header({ onClear }: HeaderProps) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <img
          src={chrome.runtime.getURL('mega.svg')}
          alt=""
          className="h-6 w-6"
          aria-hidden
        />
        <span className="text-sm font-bold tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Mega
          </span>{' '}
          <span className="text-foreground">Web Scraper</span>
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Limpiar datos</p>
        </TooltipContent>
      </Tooltip>
    </header>
  )
}
