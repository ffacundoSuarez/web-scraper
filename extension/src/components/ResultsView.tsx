import {
  Building2,
  Clipboard,
  Copy,
  Download,
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Search,
  Share2,
  Star,
  Twitter,
  Youtube,
} from 'lucide-react'
import type {
  BusinessResult,
  EmailResult,
  ImageResult,
  LinkResult,
  PhoneResult,
  ReviewResult,
  ScraperType,
  SocialResult,
  TableResult,
  TextResult,
} from '@/core/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Propiedades del componente {@link ResultsView}. */
interface ResultsViewProps {
  /** Tipo de dato que se muestra (emails, phones, links, etc.). */
  type: ScraperType
  /** Array de elementos extraídos para el tipo indicado. */
  data: unknown[]
}

/** Etiquetas en español para los mensajes de estado vacío por tipo de dato. */
const emptyLabels: Record<ScraperType, string> = {
  emails: 'correos electrónicos',
  phones: 'teléfonos',
  links: 'enlaces',
  images: 'imágenes',
  text: 'fragmentos de texto',
  tables: 'tablas',
  reviews: 'reseñas',
  business: 'negocios',
  social: 'perfiles sociales',
}

/**
 * Devuelve las clases de Tailwind CSS para los elementos de lista de resultados.
 *
 * @returns Cadena con las clases CSS del elemento.
 */
function itemClass() {
  return 'rounded-md bg-secondary/30 p-2.5 transition-colors hover:bg-secondary/50'
}

/**
 * Copia el texto proporcionado al portapapeles del usuario.
 *
 * @param text - Texto a copiar.
 */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    void 0
  }
}

/**
 * Descarga una imagen usando la API de descargas de Chrome.
 * Extrae el nombre del archivo de la URL.
 */
function downloadImage(url: string) {
  const filename = url.split('/').pop()?.split('?')[0] || 'image.png'
  chrome.downloads.download({ url, filename })
}

/**
 * Descarga múltiples imágenes secuencialmente con un pequeño delay
 * para evitar saturar el navegador.
 */
function downloadAllImages(items: ImageResult[]) {
  items.forEach((item, i) => {
    setTimeout(() => downloadImage(item.src), i * 200)
  })
}

/**
 * Trunca una cadena a la longitud máxima indicada, añadiendo puntos suspensivos si excede.
 *
 * @param s - Cadena original.
 * @param max - Longitud máxima permitida.
 * @returns Cadena truncada con «…» al final si fue recortada, o la cadena original.
 */
function truncate(s: string, max: number) {
  if (s.length <= max) return s
  return s.slice(0, max) + '…'
}

/**
 * Renderiza el ícono correspondiente a una plataforma de redes sociales.
 *
 * @param props - Objeto con la propiedad `platform` (nombre de la plataforma).
 * @returns Componente de ícono de Lucide adecuado a la plataforma.
 */
function SocialPlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase()
  const className = 'h-4 w-4 shrink-0 text-muted-foreground'
  if (p.includes('facebook')) return <Facebook className={className} aria-hidden />
  if (p.includes('twitter') || p.includes('x.com')) return <Twitter className={className} aria-hidden />
  if (p.includes('instagram')) return <Instagram className={className} aria-hidden />
  if (p.includes('linkedin')) return <Linkedin className={className} aria-hidden />
  if (p.includes('youtube')) return <Youtube className={className} aria-hidden />
  return <Share2 className={className} aria-hidden />
}

/**
 * Convierte una cadena de calificación en un número entero entre 0 y 5.
 *
 * @param rating - Cadena que representa la calificación (ej. "4.5", "3,8/5").
 * @returns Número entero redondeado entre 0 y 5, o 0 si no es válido.
 */
function parseRating(rating: string): number {
  const n = parseFloat(String(rating).replace(/[^\d.,]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0
}

/**
 * Componente que muestra una fila de 5 estrellas según la calificación proporcionada.
 *
 * @param props - Objeto con la propiedad `rating` (cadena de calificación).
 * @returns Fila con estrellas coloreadas y el valor textual de la calificación.
 */
function StarRow({ rating }: { rating: string }) {
  const n = parseRating(rating)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
          aria-hidden
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  )
}

/**
 * Componente de estado vacío que se muestra cuando no hay resultados para un tipo dado.
 *
 * @param props - Objeto con la propiedad `type` ({@link ScraperType}).
 * @returns Mensaje centrado indicando que no se encontraron elementos.
 */
function EmptyState({ type }: { type: ScraperType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Search className="h-10 w-10 text-muted-foreground/50" aria-hidden />
      <p className="text-sm text-muted-foreground">
        No se encontraron {emptyLabels[type]}
      </p>
    </div>
  )
}

/**
 * Componente principal de visualización de resultados extraídos.
 *
 * Renderiza diferentes diseños de lista según el tipo de dato: correos,
 * teléfonos, enlaces, imágenes, texto, tablas, reseñas, negocios o
 * perfiles de redes sociales.
 *
 * @param props - {@link ResultsViewProps}
 * @returns Lista de resultados con el diseño adecuado al tipo, o un estado vacío.
 */
export function ResultsView({ type, data }: ResultsViewProps) {
  if (!data.length) {
    return <EmptyState type={type} />
  }

  if (type === 'emails') {
    const items = data as EmailResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.email}-${i}`} className={itemClass()}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {truncate(item.source, 48)}
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void copyText(item.email)}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'phones') {
    const items = data as PhoneResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.phone}-${i}`} className={itemClass()}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.phone}</p>
                  <p className="text-xs text-muted-foreground">{item.formatted}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {truncate(item.source, 40)}
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void copyText(item.phone)}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'links') {
    const items = data as LinkResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.url}-${i}`} className={itemClass()}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 text-left text-sm text-primary hover:underline"
            >
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.text || item.title || 'Enlace'}</p>
                <p className="truncate text-xs text-muted-foreground">{item.url}</p>
                {item.isExternal ? (
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    Externo
                  </Badge>
                ) : null}
              </div>
            </a>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'images') {
    const items = data as ImageResult[]
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={() => downloadAllImages(items)}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Descargar todas ({items.length})
        </Button>
        <ul className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <li key={`${item.src}-${i}`} className={itemClass()}>
              <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
                <a href={item.src} target="_blank" rel="noreferrer" className="flex h-full w-full items-center justify-center">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="max-h-24 w-full object-contain"
                    loading="lazy"
                  />
                </a>
                <button
                  type="button"
                  className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); downloadImage(item.src) }}
                  title="Descargar imagen"
                >
                  <Download className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.alt || 'Sin texto alternativo'}</p>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (type === 'text') {
    const items = data as TextResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.selector}-${i}`} className={itemClass()}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="mb-1 text-[10px] uppercase">
                  {item.tag}
                </Badge>
                <p className="text-sm leading-snug">{truncate(item.content, 400)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void copyText(item.content)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'tables') {
    const items = data as TableResult[]
    return (
      <ul className="flex flex-col gap-3">
        {items.map((table, ti) => (
          <li key={`${table.selector}-${ti}`} className={itemClass()}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="outline" className="max-w-[70%] truncate text-[10px]">
                {table.selector}
              </Badge>
              <Badge variant="default" className="text-[10px]">
                {table.rows.length} filas
              </Badge>
            </div>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full min-w-[200px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {table.headers.map((h, hi) => (
                      <th key={hi} className="px-2 py-1 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 3).map((row, ri) => (
                    <tr key={ri} className="border-b border-border/60 last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1 text-muted-foreground">
                          {truncate(String(cell), 80)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'reviews') {
    const items = data as ReviewResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.author}-${i}`}>
            <Card className="border-border/80 bg-card/50">
              <CardHeader className="space-y-1 p-3 pb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" aria-hidden />
                  <CardTitle className="text-sm font-semibold leading-tight">{item.author || 'Anónimo'}</CardTitle>
                </div>
                <StarRow rating={item.rating} />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-sm text-muted-foreground">{truncate(item.text, 220)}</p>
                {item.date ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.date}</p>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'business') {
    const items = data as BusinessResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`}>
            <Card className="border-border/80 bg-card/50">
              <CardHeader className="flex flex-row items-start gap-2 space-y-0 p-3 pb-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <CardTitle className="text-sm font-semibold leading-tight">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-3 pt-0 text-xs">
                {item.address ? <p className="text-muted-foreground">{item.address}</p> : null}
                {item.phone ? <p className="text-muted-foreground">{item.phone}</p> : null}
                {item.email ? <p className="text-muted-foreground">{item.email}</p> : null}
                {item.website ? (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {truncate(item.website, 60)}
                  </a>
                ) : null}
                {item.description ? (
                  <p className="pt-1 text-muted-foreground">{truncate(item.description, 160)}</p>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  if (type === 'social') {
    const items = data as SocialResult[]
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={`${item.url}-${i}`} className={itemClass()}>
            <div className="flex items-start gap-2">
              <SocialPlatformIcon platform={item.platform} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.platform}</p>
                {item.username ? (
                  <p className="text-xs text-muted-foreground">@{item.username}</p>
                ) : null}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-xs text-primary hover:underline"
                >
                  {truncate(item.url, 56)}
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void copyText(item.url)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return <EmptyState type={type} />
}
