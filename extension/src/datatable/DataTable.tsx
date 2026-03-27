import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ListColumn, ListExtractionData } from '@/core/types'
import { getListData, onListDataChange, setListData, defaultListData } from '@/core/storage'
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Filter,
  Search,
  SlidersHorizontal,
  Table2,
  Trash2,
  X,
} from 'lucide-react'

export function DataTable() {
  const [data, setData] = useState<ListExtractionData>(defaultListData)
  const [search, setSearch] = useState('')
  const [showImages, setShowImages] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void getListData().then(setData)
    const unsub = onListDataChange(setData)
    return unsub
  }, [])

  useEffect(() => {
    if (editingHeader && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingHeader])

  const activeFilterCount = useMemo(
    () => Object.values(columnFilters).filter((v) => v.trim()).length,
    [columnFilters],
  )

  const filteredRows = useMemo(() => {
    let rows = data.rows.map((row, i) => ({ row, originalIndex: i }))

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(({ row }) =>
        data.columns.some((col) => (row[col.id] ?? '').toLowerCase().includes(q)),
      )
    }

    for (const col of data.columns) {
      const filter = columnFilters[col.id]?.trim().toLowerCase()
      if (filter) {
        rows = rows.filter(({ row }) => (row[col.id] ?? '').toLowerCase().includes(filter))
      }
    }

    return rows
  }, [data, search, columnFilters])

  const allSelected =
    filteredRows.length > 0 && filteredRows.every(({ originalIndex }) => selectedRows.has(originalIndex))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredRows.map(({ originalIndex }) => originalIndex)))
    }
  }

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const renameColumn = (colId: string, newName: string) => {
    const updated: ListExtractionData = {
      ...data,
      columns: data.columns.map((c) => (c.id === colId ? { ...c, name: newName } : c)),
    }
    setData(updated)
    void setListData(updated)
    setEditingHeader(null)
  }

  const deleteColumn = (colId: string) => {
    const updated: ListExtractionData = {
      ...data,
      columns: data.columns.filter((c) => c.id !== colId),
      rows: data.rows.map((row) => {
        const next = { ...row }
        delete next[colId]
        return next
      }),
    }
    setData(updated)
    void setListData(updated)
  }

  const deleteRow = (originalIndex: number) => {
    const updated: ListExtractionData = {
      ...data,
      rows: data.rows.filter((_, i) => i !== originalIndex),
      itemCount: data.itemCount - 1,
    }
    setData(updated)
    void setListData(updated)
    setSelectedRows((prev) => {
      const next = new Set(prev)
      next.delete(originalIndex)
      return next
    })
  }

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return
    const updated: ListExtractionData = {
      ...data,
      rows: data.rows.filter((_, i) => !selectedRows.has(i)),
      itemCount: data.itemCount - selectedRows.size,
    }
    setData(updated)
    void setListData(updated)
    setSelectedRows(new Set())
  }

  const copyToClipboard = useCallback(async (text: string, cellKey: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCell(cellKey)
    setTimeout(() => setCopiedCell(null), 1500)
  }, [])

  const downloadImages = useCallback(async () => {
    const imgCols = data.columns.filter((c) => c.type === 'image')
    const rowsToExport = selectedRows.size > 0
      ? data.rows.filter((_, i) => selectedRows.has(i))
      : data.rows

    for (const row of rowsToExport) {
      for (const col of imgCols) {
        const src = row[col.id]
        if (!src) continue
        try {
          const resp = await fetch(src)
          const blob = await resp.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const filename = src.split('/').pop()?.split('?')[0] || 'image.jpg'
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } catch { /* skip failed downloads */ }
      }
    }
  }, [data, selectedRows])

  const exportCSV = useCallback(() => {
    const cols = data.columns
    const rowsToExport = selectedRows.size > 0
      ? data.rows.filter((_, i) => selectedRows.has(i))
      : data.rows

    const header = ['#', ...cols.map((c) => `"${c.name.replace(/"/g, '""')}"`)].join(',')
    const lines = rowsToExport.map((row, i) => {
      const cells = cols.map((c) => {
        const val = (row[c.id] ?? '').replace(/"/g, '""')
        return `"${val}"`
      })
      return [i + 1, ...cells].join(',')
    })

    const csv = '\uFEFF' + [header, ...lines].join('\n')
    triggerDownload(csv, 'text/csv;charset=utf-8', `tabla_${Date.now()}.csv`)
  }, [data, selectedRows])

  const exportJSON = useCallback(() => {
    const cols = data.columns
    const rowsToExport = selectedRows.size > 0
      ? data.rows.filter((_, i) => selectedRows.has(i))
      : data.rows

    const jsonData = rowsToExport.map((row, i) => {
      const obj: Record<string, string | number> = { '#': i + 1 }
      for (const col of cols) {
        obj[col.name] = row[col.id] ?? ''
      }
      return obj
    })

    const json = JSON.stringify(jsonData, null, 2)
    triggerDownload(json, 'application/json', `tabla_${Date.now()}.json`)
  }, [data, selectedRows])

  const exportExcel = useCallback(async () => {
    const { utils, writeFile } = await import('xlsx')
    const cols = data.columns
    const rowsToExport = selectedRows.size > 0
      ? data.rows.filter((_, i) => selectedRows.has(i))
      : data.rows

    const sheetData = rowsToExport.map((row, i) => {
      const obj: Record<string, string | number> = { '#': i + 1 }
      for (const col of cols) {
        obj[col.name] = row[col.id] ?? ''
      }
      return obj
    })

    const ws = utils.json_to_sheet(sheetData)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Lista')
    writeFile(wb, `tabla_${Date.now()}.xlsx`)
  }, [data, selectedRows])

  const date = data.timestamp ? new Date(data.timestamp).toLocaleDateString('es-AR') : ''

  if (data.columns.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-3">
          <Table2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">Sin datos de lista</p>
          <p className="text-sm text-muted-foreground/70">
            Usa el List Extractor en el panel lateral para detectar y seleccionar una lista
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Table2 className="h-4 w-4 text-primary" />
          <span className="font-semibold">{date}</span>
          <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
            {filteredRows.length} filas
          </span>
        </div>

        <div className="relative ml-auto flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-secondary/50 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={downloadImages}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary/80 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar imágenes
        </button>

        <button
          type="button"
          onClick={() => setShowImages(!showImages)}
          className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${showImages ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary/80'}`}
        >
          {showImages ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showImages ? 'Imágenes' : 'Imágenes'}
        </button>

        <button
          type="button"
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${showFilterPanel ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary/80'}`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        {selectedRows.size > 0 && (
          <button
            type="button"
            onClick={deleteSelectedRows}
            className="flex h-8 items-center gap-1.5 rounded-md border border-destructive/50 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar ({selectedRows.size})
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/50 px-4 py-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          {data.columns.map((col) => (
            <div key={col.id} className="relative">
              <input
                type="text"
                placeholder={col.name}
                value={columnFilters[col.id] ?? ''}
                onChange={(e) =>
                  setColumnFilters((prev) => ({ ...prev, [col.id]: e.target.value }))
                }
                className="h-7 w-32 rounded border border-border bg-secondary/50 px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary"
              />
              {columnFilters[col.id] && (
                <button
                  type="button"
                  onClick={() => setColumnFilters((prev) => ({ ...prev, [col.id]: '' }))}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setColumnFilters({})}
              className="ml-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
              </th>
              <th className="w-12 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                #
              </th>
              {data.columns.map((col) => (
                <th
                  key={col.id}
                  className="group relative min-w-[120px] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {editingHeader === col.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        renameColumn(col.id, editValue.trim() || col.name)
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => renameColumn(col.id, editValue.trim() || col.name)}
                        className="h-6 w-full rounded border border-primary bg-secondary px-1.5 text-xs text-foreground outline-none"
                      />
                    </form>
                  ) : (
                    <span
                      className="cursor-pointer hover:text-foreground"
                      onDoubleClick={() => {
                        setEditingHeader(col.id)
                        setEditValue(col.name)
                      }}
                      title="Doble clic para renombrar"
                    >
                      {col.type === 'image' && '📷 '}
                      {col.type === 'link' && '🔗 '}
                      {col.name}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteColumn(col.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    title="Eliminar columna"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ row, originalIndex }, displayIdx) => {
              const isSelected = selectedRows.has(originalIndex)
              return (
                <tr
                  key={originalIndex}
                  className={`border-b border-border/50 transition-colors hover:bg-secondary/30 ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(originalIndex)}
                      className="h-3.5 w-3.5 rounded border-border accent-primary"
                    />
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    {displayIdx + 1}
                  </td>
                  {data.columns.map((col) => {
                    const value = row[col.id] ?? ''
                    const cellKey = `${originalIndex}-${col.id}`
                    return (
                      <td key={col.id} className="px-3 py-2">
                        <CellRenderer
                          column={col}
                          value={value}
                          showImages={showImages}
                          cellKey={cellKey}
                          copied={copiedCell === cellKey}
                          onCopy={copyToClipboard}
                        />
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(originalIndex)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors"
                      title="Eliminar fila"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Export bar */}
      <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-2">
        <span className="text-xs text-muted-foreground mr-auto">
          {selectedRows.size > 0
            ? `${selectedRows.size} de ${data.rows.length} seleccionadas`
            : `${filteredRows.length} filas`}
        </span>
        <ExportButton label="CSV" onClick={exportCSV} />
        <ExportButton label="Excel" onClick={() => void exportExcel()} />
        <ExportButton label="JSON" onClick={exportJSON} />
      </div>
    </div>
  )
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-xs font-medium text-white shadow-sm hover:from-blue-600/90 hover:to-violet-600/90 transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function CellRenderer({
  column,
  value,
  showImages,
  cellKey,
  copied,
  onCopy,
}: {
  column: ListColumn
  value: string
  showImages: boolean
  cellKey: string
  copied: boolean
  onCopy: (text: string, key: string) => Promise<void>
}) {
  if (!value) return <span className="text-muted-foreground/40">—</span>

  if (column.type === 'image') {
    if (showImages) {
      return (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt=""
            className="h-10 w-10 rounded border border-border object-cover"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <CopyBtn value={value} cellKey={cellKey} copied={copied} onCopy={onCopy} />
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="max-w-[200px] truncate text-xs text-primary hover:underline"
        >
          {value}
        </a>
        <CopyBtn value={value} cellKey={cellKey} copied={copied} onCopy={onCopy} />
      </div>
    )
  }

  if (column.type === 'link') {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="max-w-[200px] truncate text-xs text-primary hover:underline"
        >
          {value}
        </a>
        <CopyBtn value={value} cellKey={cellKey} copied={copied} onCopy={onCopy} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="max-w-[300px] truncate text-xs" title={value}>{value}</span>
      <CopyBtn value={value} cellKey={cellKey} copied={copied} onCopy={onCopy} />
    </div>
  )
}

function CopyBtn({
  value,
  cellKey,
  copied,
  onCopy,
}: {
  value: string
  cellKey: string
  copied: boolean
  onCopy: (text: string, key: string) => Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={() => void onCopy(value, cellKey)}
      className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function triggerDownload(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
