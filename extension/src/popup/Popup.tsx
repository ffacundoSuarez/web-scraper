import type { ElementType } from 'react'
import {
  Building2,
  ChevronsRight,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutList,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  MousePointer2,
  Phone,
  Search,
  Share2,
  Table2,
  TableProperties,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { ResultsView } from '@/components/ResultsView'
import { ExportMenu } from '@/components/ExportMenu'
import { StatusBar } from '@/components/StatusBar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ScraperType } from '@/core/types'
import { useScraper } from '@/hooks/useScraper'

/**
 * Configuración de pestañas que asocia cada {@link ScraperType} con su ícono
 * y etiqueta en español para la barra de pestañas del popup.
 */
const tabConfig: { id: ScraperType; icon: ElementType; label: string }[] = [
  { id: 'emails', icon: Mail, label: 'Correos electrónicos' },
  { id: 'phones', icon: Phone, label: 'Teléfonos' },
  { id: 'links', icon: Link2, label: 'Enlaces' },
  { id: 'images', icon: ImageIcon, label: 'Imágenes' },
  { id: 'text', icon: FileText, label: 'Texto' },
  { id: 'tables', icon: Table2, label: 'Tablas' },
  { id: 'reviews', icon: MessageSquare, label: 'Reseñas' },
  { id: 'business', icon: Building2, label: 'Negocios' },
  { id: 'social', icon: Share2, label: 'Redes sociales' },
]

/**
 * Obtiene la cantidad de elementos extraídos para un tipo de scraper dado.
 *
 * @param data - Objeto con los datos extraídos organizados por tipo.
 * @param type - Tipo de scraper cuyo conteo se desea obtener.
 * @returns Número de elementos encontrados para el tipo indicado.
 */
function getCount(data: ReturnType<typeof useScraper>['state']['data'], type: ScraperType): number {
  return data[type].length
}

/**
 * Calcula el total de elementos extraídos sumando todos los tipos de datos.
 *
 * @param data - Objeto con los datos extraídos organizados por tipo.
 * @returns Suma total de elementos en todas las categorías.
 */
function totalElements(data: ReturnType<typeof useScraper>['state']['data']): number {
  return (
    data.emails.length +
    data.phones.length +
    data.links.length +
    data.images.length +
    data.text.length +
    data.tables.length +
    data.reviews.length +
    data.business.length +
    data.social.length
  )
}

/**
 * Componente principal del popup de la extensión.
 *
 * Renderiza la interfaz completa incluyendo encabezado, URL activa,
 * botones de escaneo (completo, selector visual, auto-paginado),
 * pestañas por tipo de dato, vista de resultados, menú de exportación
 * y barra de estado.
 */
export function Popup() {
  const {
    state,
    listData,
    currentUrl,
    selectorActive,
    listDetectorActive,
    startScrape,
    toggleSelector,
    toggleListDetector,
    startPagination,
    openDataTable,
    clearData,
  } = useScraper()
  const scanning = state.status === 'scanning'
  const d = state.data
  const total = totalElements(d)

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TooltipProvider delayDuration={400}>
        <Header onClear={() => void clearData()} />
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate" title={currentUrl}>
              {currentUrl || 'Sin URL'}
            </span>
          </div>
        </div>
        <div className="space-y-2 px-4 py-2">
          <Button
            type="button"
            className="h-10 w-full bg-gradient-to-r from-blue-600 to-violet-600 font-medium text-primary-foreground shadow-sm hover:from-blue-600/90 hover:to-violet-600/90"
            disabled={scanning}
            onClick={() => void startScrape()}
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Escaneando página...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" aria-hidden />
                Escanear Página Completa
              </>
            )}
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={selectorActive ? 'default' : 'outline'}
              className={`h-9 ${selectorActive ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-background hover:bg-blue-700' : ''}`}
              onClick={() => void toggleSelector()}
            >
              <MousePointer2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {selectorActive ? 'Activo' : 'Selector'}
            </Button>
            <Button
              type="button"
              variant={listDetectorActive ? 'default' : 'outline'}
              className={`h-9 ${listDetectorActive ? 'bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-1 ring-offset-background hover:bg-amber-700' : ''}`}
              onClick={() => void toggleListDetector()}
            >
              <LayoutList className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {listDetectorActive ? 'Activo' : 'Listas'}
            </Button>
            <Button type="button" variant="outline" className="h-9" onClick={() => void startPagination()}>
              <ChevronsRight className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Paginado
            </Button>
          </div>
          {listData.itemCount > 0 && (
            <Button
              type="button"
              className="h-9 w-full bg-gradient-to-r from-amber-600 to-orange-600 font-medium text-white shadow-sm hover:from-amber-600/90 hover:to-orange-600/90"
              onClick={openDataTable}
            >
              <TableProperties className="mr-1.5 h-4 w-4" aria-hidden />
              Ver Tabla ({listData.itemCount} items)
            </Button>
          )}
        </div>
        {scanning ? (
          <div className="px-4">
            <Progress className="h-1 animate-pulse rounded-none" value={100} />
          </div>
        ) : null}
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-1 pt-2">
          <Tabs defaultValue="emails" className="flex min-h-0 flex-1 flex-col gap-2">
            <TabsList className="grid h-9 w-full shrink-0 grid-cols-9 gap-0.5 bg-secondary/30 p-0.5">
              {tabConfig.map(({ id, icon: Icon, label }) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={id}
                      className="relative flex h-full w-full items-center justify-center rounded-sm px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {getCount(d, id) > 0 ? (
                        <span className="absolute -right-0.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                          {getCount(d, id) > 99 ? '99+' : getCount(d, id)}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TabsList>
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-0 pr-3 pb-2">
                <TabsContent value="emails" className="mt-0 outline-none">
                  <ResultsView type="emails" data={d.emails} />
                </TabsContent>
                <TabsContent value="phones" className="mt-0 outline-none">
                  <ResultsView type="phones" data={d.phones} />
                </TabsContent>
                <TabsContent value="links" className="mt-0 outline-none">
                  <ResultsView type="links" data={d.links} />
                </TabsContent>
                <TabsContent value="images" className="mt-0 outline-none">
                  <ResultsView type="images" data={d.images} />
                </TabsContent>
                <TabsContent value="text" className="mt-0 outline-none">
                  <ResultsView type="text" data={d.text} />
                </TabsContent>
                <TabsContent value="tables" className="mt-0 outline-none">
                  <ResultsView type="tables" data={d.tables} />
                </TabsContent>
                <TabsContent value="reviews" className="mt-0 outline-none">
                  <ResultsView type="reviews" data={d.reviews} />
                </TabsContent>
                <TabsContent value="business" className="mt-0 outline-none">
                  <ResultsView type="business" data={d.business} />
                </TabsContent>
                <TabsContent value="social" className="mt-0 outline-none">
                  <ResultsView type="social" data={d.social} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
        <ExportMenu data={d} disabled={total === 0} />
        <StatusBar status={state.status} totalCount={total} />
      </TooltipProvider>
    </div>
  )
}
