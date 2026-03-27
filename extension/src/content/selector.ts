import type { Message, ScrapedData } from '@/core/types'
import { EMAIL_REGEX, PHONE_REGEX } from '@/core/constants'

/** Elemento <style> inyectado para los estilos del selector visual. */
let styleEl: HTMLStyleElement | null = null
/** Elemento del DOM actualmente resaltado por el selector. */
let highlighted: Element | null = null
/** Handler del evento mouseover registrado durante el modo selector. */
let onMouseOver: ((e: MouseEvent) => void) | null = null
/** Handler del evento mouseout registrado durante el modo selector. */
let onMouseOut: ((e: MouseEvent) => void) | null = null
/** Handler del evento click registrado durante el modo selector. */
let onClick: ((e: MouseEvent) => void) | null = null

/**
 * Convierte un EventTarget en un Element.
 * Si el target es un nodo de texto, devuelve su elemento padre.
 * @param t - El EventTarget a convertir.
 * @returns El elemento correspondiente, o `null` si no se puede convertir.
 */
function elementFromTarget(t: EventTarget | null): Element | null {
  if (t instanceof Element) return t
  if (t instanceof Text) return t.parentElement
  return null
}

/**
 * Elimina la clase de resaltado (`mega-scraper-highlight`) de todos los
 * elementos del documento y reinicia la referencia al elemento resaltado.
 */
function stripHighlights(): void {
  document.querySelectorAll('.mega-scraper-highlight').forEach((el) => {
    el.classList.remove('mega-scraper-highlight')
  })
  highlighted = null
}

/**
 * Extrae datos estructurados (texto, emails, teléfonos, enlaces, imágenes)
 * de un elemento DOM real y su subárbol.
 */
function scrapeElement(el: Element): ScrapedData {
  const data: ScrapedData = {
    emails: [], phones: [], links: [], images: [],
    text: [], tables: [], reviews: [], business: [], social: [],
  }

  const text = (el.textContent ?? '').trim()
  const tag = el.tagName.toLowerCase()
  const selector = generateSelector(el)

  if (text) {
    data.text.push({ content: text.slice(0, 500), tag, selector })
  }

  const emailRe = new RegExp(EMAIL_REGEX.source, EMAIL_REGEX.flags)
  const seenEmails = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = emailRe.exec(text)) !== null) {
    const e = m[0].toLowerCase()
    if (!seenEmails.has(e)) { seenEmails.add(e); data.emails.push({ email: m[0], source: 'selector' }) }
  }

  const phoneRe = new RegExp(PHONE_REGEX.source, PHONE_REGEX.flags)
  while ((m = phoneRe.exec(text)) !== null) {
    const digits = m[0].replace(/\D/g, '')
    if (digits.length >= 7) {
      data.phones.push({ phone: m[0].trim(), formatted: m[0].trim().startsWith('+') ? `+${digits}` : digits, source: 'selector' })
    }
  }

  const anchors = tag === 'a' ? [el as HTMLAnchorElement] : Array.from(el.querySelectorAll('a[href]')) as HTMLAnchorElement[]
  for (const a of anchors) {
    const href = a.href
    if (!href || href.startsWith('javascript:') || href === '#') continue
    data.links.push({ url: href, text: (a.textContent ?? '').trim(), title: a.title ?? '', isExternal: a.hostname !== location.hostname })
  }

  const imgs = tag === 'img' ? [el as HTMLImageElement] : Array.from(el.querySelectorAll('img')) as HTMLImageElement[]
  for (const img of imgs) {
    if (!img.src) continue
    data.images.push({ src: img.src, alt: img.alt ?? '', width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
  }

  return data
}

/**
 * Genera un selector CSS único para un elemento recorriendo el árbol DOM
 * hacia arriba. Prioriza IDs, atributos de datos y roles antes de recurrir
 * a combinaciones de etiqueta + clases + nth-of-type.
 * @param el - El elemento para el cual generar el selector.
 * @returns Una cadena con el selector CSS único del elemento.
 */
export function generateSelector(el: Element): string {
  const segments: string[] = []
  let current: Element | null = el

  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
    const tag = current.tagName.toLowerCase()

    if (current.id) {
      const idSel = `#${CSS.escape(current.id)}`
      if (document.querySelectorAll(idSel).length === 1) {
        segments.unshift(idSel)
        break
      }
    }

    const dataAttrs = ['data-testid', 'data-id', 'data-name', 'name', 'role']
    let attrSeg: string | null = null
    for (const attr of dataAttrs) {
      const v = current.getAttribute(attr)
      if (v) {
        const sel = `${tag}[${attr}="${CSS.escape(v)}"]`
        try {
          if (document.querySelectorAll(sel).length === 1) {
            attrSeg = sel
            break
          }
        } catch {}
      }
    }
    if (attrSeg) {
      segments.unshift(attrSeg)
      current = current.parentElement
      continue
    }

    const classes = Array.from(current.classList).filter((c) => !c.startsWith('mega-scraper-'))
    const classPart = classes.length ? `.${classes.map((c) => CSS.escape(c)).join('.')}` : ''
    const parent = current.parentElement
    if (parent) {
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === current!.tagName)
      const idx = sameTag.indexOf(current) + 1
      segments.unshift(`${tag}${classPart}:nth-of-type(${idx})`)
    } else {
      segments.unshift(`${tag}${classPart}`)
    }

    current = current.parentElement
  }

  return segments.join(' > ') || el.tagName.toLowerCase()
}

/**
 * Activa el modo de selector visual. Inyecta estilos de resaltado en el
 * documento y registra listeners de mouseover, mouseout y click para
 * permitir al usuario seleccionar elementos de la página.
 */
export function enableSelector(): void {
  disableSelector()

  styleEl = document.createElement('style')
  styleEl.id = 'mega-scraper-selector-style'
  styleEl.textContent = `
.mega-scraper-highlight {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  background: rgba(59, 130, 246, 0.1);
  cursor: crosshair;
}
`
  document.head.appendChild(styleEl)

  onMouseOver = (e: MouseEvent) => {
    const el = elementFromTarget(e.target)
    if (!el || el === document.documentElement || el === document.body) return
    if (highlighted && highlighted !== el) {
      highlighted.classList.remove('mega-scraper-highlight')
    }
    highlighted = el
    el.classList.add('mega-scraper-highlight')
  }

  onMouseOut = (e: MouseEvent) => {
    const el = elementFromTarget(e.target)
    const rel = elementFromTarget(e.relatedTarget)
    if (!el || el !== highlighted) return
    if (rel && el.contains(rel)) return
    el.classList.remove('mega-scraper-highlight')
    highlighted = null
  }

  onClick = (e: MouseEvent) => {
    const el = elementFromTarget(e.target)
    if (!el || el === document.documentElement || el === document.body) return
    e.preventDefault()
    e.stopPropagation()

    const data = scrapeElement(el)
    const msg: Message = {
      type: 'ELEMENT_SELECTED',
      payload: { data },
    }
    void chrome.runtime.sendMessage(msg)
  }

  document.addEventListener('mouseover', onMouseOver, true)
  document.addEventListener('mouseout', onMouseOut, true)
  document.addEventListener('click', onClick, true)
}

/**
 * Desactiva el modo de selector visual. Elimina los listeners de eventos,
 * remueve los estilos inyectados y limpia todos los resaltados del documento.
 */
export function disableSelector(): void {
  if (onMouseOver) document.removeEventListener('mouseover', onMouseOver, true)
  if (onMouseOut) document.removeEventListener('mouseout', onMouseOut, true)
  if (onClick) document.removeEventListener('click', onClick, true)
  onMouseOver = null
  onMouseOut = null
  onClick = null

  if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl)
  styleEl = null

  stripHighlights()
}
