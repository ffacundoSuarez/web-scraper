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
    <div className="flex items-center justify-between border-t border-border bg-card/50 px-4 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Download className="h-3.5 w-3.5" aria-hidden />
        <span>Exportar</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[52px] px-2"
          disabled={disabled}
          onClick={handleCsv}
        >
          {flash === 'csv' ? '✓' : 'CSV'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[52px] px-2"
          disabled={disabled}
          onClick={handleExcel}
        >
          {flash === 'excel' ? '✓' : 'Excel'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[52px] px-2"
          disabled={disabled}
          onClick={handleJson}
        >
          {flash === 'json' ? '✓' : 'JSON'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => void handleCopyAll()}
          aria-label="Copiar todo"
        >
          {flash === 'copy' ? <span className="text-sm">✓</span> : <ClipboardCopy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
