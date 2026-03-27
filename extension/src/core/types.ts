/** Tipos de scrapers disponibles en la extensión */
export type ScraperType =
  | 'emails'
  | 'phones'
  | 'links'
  | 'images'
  | 'text'
  | 'tables'
  | 'reviews'
  | 'business'
  | 'social'

/** Resultado de extracción de correo electrónico */
export interface EmailResult {
  /** Dirección de correo electrónico encontrada */
  email: string
  /** Fuente o contexto donde se encontró el correo */
  source: string
}

/** Resultado de extracción de número telefónico */
export interface PhoneResult {
  /** Número de teléfono sin formato */
  phone: string
  /** Número de teléfono con formato legible */
  formatted: string
  /** Fuente o contexto donde se encontró el teléfono */
  source: string
}

/** Resultado de extracción de enlace */
export interface LinkResult {
  /** URL del enlace */
  url: string
  /** Texto visible del enlace */
  text: string
  /** Atributo title del enlace */
  title: string
  /** Indica si el enlace apunta a un dominio externo */
  isExternal: boolean
}

/** Resultado de extracción de imagen */
export interface ImageResult {
  /** URL de la imagen */
  src: string
  /** Texto alternativo de la imagen */
  alt: string
  /** Ancho de la imagen en píxeles */
  width: number
  /** Alto de la imagen en píxeles */
  height: number
}

/** Resultado de extracción de contenido textual */
export interface TextResult {
  /** Contenido textual extraído */
  content: string
  /** Etiqueta HTML del elemento (ej. h1, p, span) */
  tag: string
  /** Selector CSS del elemento */
  selector: string
}

/** Resultado de extracción de tabla HTML */
export interface TableResult {
  /** Encabezados de columnas de la tabla */
  headers: string[]
  /** Filas de datos de la tabla */
  rows: string[][]
  /** Selector CSS de la tabla */
  selector: string
}

/** Resultado de extracción de reseña */
export interface ReviewResult {
  /** Nombre del autor de la reseña */
  author: string
  /** Calificación otorgada */
  rating: string
  /** Texto de la reseña */
  text: string
  /** Fecha de la reseña */
  date: string
}

/** Resultado de extracción de datos empresariales */
export interface BusinessResult {
  /** Nombre de la empresa */
  name: string
  /** Dirección física */
  address: string
  /** Teléfono de contacto */
  phone: string
  /** Correo electrónico de contacto */
  email: string
  /** Sitio web de la empresa */
  website: string
  /** Descripción de la empresa */
  description: string
}

/** Resultado de extracción de perfil en redes sociales */
export interface SocialResult {
  /** Nombre de la plataforma (ej. Facebook, Twitter) */
  platform: string
  /** URL del perfil social */
  url: string
  /** Nombre de usuario en la plataforma */
  username: string
}

/** Contenedor principal con todos los datos extraídos, agrupados por tipo de scraper */
export interface ScrapedData {
  /** Correos electrónicos encontrados */
  emails: EmailResult[]
  /** Números telefónicos encontrados */
  phones: PhoneResult[]
  /** Enlaces encontrados */
  links: LinkResult[]
  /** Imágenes encontradas */
  images: ImageResult[]
  /** Contenido textual encontrado */
  text: TextResult[]
  /** Tablas encontradas */
  tables: TableResult[]
  /** Reseñas encontradas */
  reviews: ReviewResult[]
  /** Datos empresariales encontrados */
  business: BusinessResult[]
  /** Perfiles sociales encontrados */
  social: SocialResult[]
}

/** Estado actual del proceso de scraping */
export type ScrapeStatus = 'idle' | 'scanning' | 'completed' | 'error'

/** Estado completo de una sesión de scraping */
export interface ScrapeState {
  /** Estado actual del proceso */
  status: ScrapeStatus
  /** Datos extraídos */
  data: ScrapedData
  /** URL de la página analizada */
  url: string
  /** Marca de tiempo de la última ejecución */
  timestamp: number
  /** Mensaje de error, si ocurrió alguno */
  error?: string
}

/** Columna detectada automáticamente dentro de un item de lista */
export interface ListColumn {
  id: string
  /** Nombre auto-generado desde tag/clase, el usuario puede renombrarlo */
  name: string
  /** Selector CSS relativo a la raíz del item */
  selector: string
  type: 'text' | 'image' | 'link'
}

/** Datos de una extracción de lista estructurada */
export interface ListExtractionData {
  columns: ListColumn[]
  /** Cada fila mapea column.id -> valor de celda */
  rows: Record<string, string>[]
  sourceUrl: string
  timestamp: number
  listSelector: string
  itemCount: number
}

/** Tipos de mensajes intercambiados entre los componentes de la extensión */
export type MessageType =
  | 'START_SCRAPE'
  | 'STOP_SCRAPE'
  | 'SCRAPE_RESULT'
  | 'SCRAPE_COMPLETE'
  | 'SCRAPE_ERROR'
  | 'GET_STATE'
  | 'START_SELECTOR'
  | 'STOP_SELECTOR'
  | 'ELEMENT_SELECTED'
  | 'START_PAGINATION'
  | 'STOP_PAGINATION'
  | 'START_LIST_DETECTOR'
  | 'STOP_LIST_DETECTOR'
  | 'LIST_EXTRACTED'

/** Estructura genérica de mensaje para la comunicación interna de la extensión */
export interface Message<T = unknown> {
  /** Tipo de mensaje */
  type: MessageType
  /** Datos asociados al mensaje */
  payload?: T
}

/** Payload para iniciar un proceso de scraping */
export interface StartScrapePayload {
  /** Tipos de scrapers a ejecutar */
  types: ScraperType[]
  /** URL de la página a analizar */
  url: string
}

/** Payload con los resultados de un scraping */
export interface ScrapeResultPayload {
  /** Datos extraídos del scraping */
  data: ScrapedData
}

/** Formatos de exportación disponibles para los datos extraídos */
export type ExportFormat = 'csv' | 'json' | 'excel'
