import { useCallback, useRef, useState } from 'react'
import { ClipboardCopy, Download } from 'lucide-react'
import type { ScrapedData } from '@/core/types'
import { exportToCSV, exportToExcel, exportToJSON } from '@/core/exporters'
import { Button } from '@/components/ui/button'

/** Propiedades del componente {@link ExportMenu}. */
interface ExportMenuProps {
  /** Datos extraídos que se exportarán. */
  data: ScrapedData
  /** Indica si los botones de exportación deben estar deshabilitados. */
  disabled: boolean
}

type ExportKind = 'csv' | 'excel' | 'json' | 'copy'

/**
 * Componente con botones de exportación (CSV, Excel, JSON) y copia al portapapeles.
 *
 * Muestra retroalimentación visual (marca de verificación temporal) tras cada
 * acción de exportación.
 *
 * @param props - {@link ExportMenuProps}
 * @returns Barra de exportación con los botones correspondientes.
 */
export function ExportMenu({ data, disabled }: ExportMenuProps) {
  const [flash, setFlash] = useState<ExportKind | null>(null)
  const timers = useRef<Partial<Record<ExportKind, ReturnType<typeof setTimeout>>>>({})

  const flashDone = useCallback((kind: ExportKind) => {
    if (timers.current[kind]) clearTimeout(timers.current[kind])
    setFlash(kind)
    timers.current[kind] = setTimeout(() => {
      setFlash((f) => (f === kind ? null : f))
      delete timers.current[kind]
    }, 1200)
  }, [])

  const handleCsv = () => {
    exportToCSV(data)
    flashDone('csv')
  }

  const handleExcel = () => {
    exportToExcel(data)
    flashDone('excel')
  }

  const handleJson = () => {
    exportToJSON(data)
    flashDone('json')
  }

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      flashDone('copy')
    } catch {
      void 0
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-border/50 bg-card/30 px-4 py-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Download className="h-3 w-3" aria-hidden />
        <span>Exportar</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 min-w-[44px] px-2 text-[11px] text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={handleCsv}
        >
          {flash === 'csv' ? '✓' : 'CSV'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 min-w-[44px] px-2 text-[11px] text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={handleExcel}
        >
          {flash === 'excel' ? '✓' : 'Excel'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 min-w-[44px] px-2 text-[11px] text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={handleJson}
        >
          {flash === 'json' ? '✓' : 'JSON'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={() => void handleCopyAll()}
          aria-label="Copiar todo"
        >
          {flash === 'copy' ? <span className="text-xs">✓</span> : <ClipboardCopy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}
