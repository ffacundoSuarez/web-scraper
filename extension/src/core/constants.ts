/** Nombre de la extensión mostrado en la interfaz */
export const EXTENSION_NAME = 'Mega Web Scraper'

/** Versión actual de la extensión */
export const EXTENSION_VERSION = '1.0.0'

/** Lista de plataformas de redes sociales con sus patrones de URL para detección automática */
export const SOCIAL_PLATFORMS = [
  { name: 'Facebook', pattern: /facebook\.com/i },
  { name: 'Twitter/X', pattern: /(?:twitter|x)\.com/i },
  { name: 'LinkedIn', pattern: /linkedin\.com/i },
  { name: 'Instagram', pattern: /instagram\.com/i },
  { name: 'YouTube', pattern: /youtube\.com/i },
  { name: 'TikTok', pattern: /tiktok\.com/i },
  { name: 'GitHub', pattern: /github\.com/i },
  { name: 'Reddit', pattern: /reddit\.com/i },
  { name: 'Pinterest', pattern: /pinterest\.com/i },
  { name: 'WhatsApp', pattern: /wa\.me|whatsapp\.com/i },
  { name: 'Telegram', pattern: /t\.me|telegram\.org/i },
] as const

/** Expresión regular para detectar direcciones de correo electrónico */
export const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

/** Expresión regular para detectar números de teléfono en diversos formatos */
export const PHONE_REGEX = /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}/g

/** Etiquetas localizadas para cada tipo de scraper, utilizadas en la interfaz de usuario */
export const SCRAPER_LABELS: Record<string, string> = {
  emails: 'Emails',
  phones: 'Teléfonos',
  links: 'Enlaces',
  images: 'Imágenes',
  text: 'Texto',
  tables: 'Tablas',
  reviews: 'Reseñas',
  business: 'Empresas',
  social: 'Social',
}
