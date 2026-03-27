import type { ListColumn, ListExtractionData, Message } from '@/core/types'

let styleEl: HTMLStyleElement | null = null
let tooltipEl: HTMLDivElement | null = null
let onMouseOver: ((e: MouseEvent) => void) | null = null
let onMouseOut: ((e: MouseEvent) => void) | null = null
let onClick: ((e: MouseEvent) => void) | null = null

let currentList: Element[] = []
let currentListParent: Element | null = null

function elementFromTarget(t: EventTarget | null): Element | null {
  if (t instanceof Element) return t
  if (t instanceof Text) return t.parentElement
  return null
}

function classOverlap(a: DOMTokenList, b: DOMTokenList): number {
  if (a.length === 0 && b.length === 0) return 1
  const setA = new Set(Array.from(a).filter((c) => !c.startsWith('mega-scraper-')))
  const setB = new Set(Array.from(b).filter((c) => !c.startsWith('mega-scraper-')))
  if (setA.size === 0 && setB.size === 0) return 1
  const union = new Set([...setA, ...setB])
  let intersection = 0
  for (const c of setA) {
    if (setB.has(c)) intersection++
  }
  return union.size === 0 ? 1 : intersection / union.size
}

/**
 * Walk up 1-3 levels from the hovered element to find a parent whose children
 * form a repeated list (same tag, >= 80% class overlap).
 */
function findSiblingList(el: Element): { items: Element[]; parent: Element } | null {
  let current: Element | null = el
  for (let depth = 0; depth < 3 && current; depth++) {
    const parent = current.parentElement
    if (!parent || parent === document.documentElement || parent === document.body) {
      current = parent
      continue
    }
    const tag = current.tagName
    const siblings = Array.from(parent.children).filter((child) => {
      if (child.tagName !== tag) return false
      return classOverlap(child.classList, current!.classList) >= 0.8
    })
    if (siblings.length >= 3) {
      return { items: siblings, parent }
    }
    current = parent
  }
  return null
}

function clearHighlights(): void {
  document.querySelectorAll('.mega-scraper-list-highlight').forEach((el) => {
    el.classList.remove('mega-scraper-list-highlight')
  })
  currentList = []
  currentListParent = null
}

function showTooltip(count: number, anchor: Element): void {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.id = 'mega-scraper-list-tooltip'
    document.body.appendChild(tooltipEl)
  }
  tooltipEl.textContent = `Lista con ${count} elementos detectada — Click para seleccionar`
  tooltipEl.style.display = 'block'

  const rect = anchor.getBoundingClientRect()
  tooltipEl.style.top = `${window.scrollY + rect.top - 40}px`
  tooltipEl.style.left = `${window.scrollX + rect.left + rect.width / 2}px`
}

function hideTooltip(): void {
  if (tooltipEl) tooltipEl.style.display = 'none'
}

/**
 * Detect columns by analyzing the internal structure of the first list item.
 * Each distinct child "pattern" (tag + classes) becomes a column.
 */
function detectColumns(referenceItem: Element): ListColumn[] {
  const columns: ListColumn[] = []
  const seen = new Set<string>()

  function walk(el: Element, depth: number, pathParts: string[]): void {
    const tag = el.tagName.toLowerCase()
    const classes = Array.from(el.classList)
      .filter((c) => !c.startsWith('mega-scraper-'))
      .sort()
    const pattern = `${tag}:${classes.join('.')}`

    if (tag === 'img') {
      const key = `img-${depth}-${pattern}`
      if (!seen.has(key)) {
        seen.add(key)
        const selector = buildRelativeSelector(el, referenceItem)
        const name = classes.find((c) => !c.includes('__')) || 'Preview'
        columns.push({
          id: `col_${columns.length}`,
          name: prettifyName(name),
          selector,
          type: 'image',
        })
      }
      return
    }

    if (tag === 'a' && el.hasAttribute('href')) {
      const key = `link-${depth}-${pattern}`
      if (!seen.has(key)) {
        seen.add(key)
        const selector = buildRelativeSelector(el, referenceItem)
        const name = classes.find((c) => !c.includes('__')) || 'URL'
        columns.push({
          id: `col_${columns.length}`,
          name: prettifyName(name),
          selector,
          type: 'link',
        })
      }
    }

    const text = directTextContent(el).trim()
    if (text && el.children.length === 0) {
      const key = `text-${depth}-${pattern}`
      if (!seen.has(key)) {
        seen.add(key)
        const selector = buildRelativeSelector(el, referenceItem)
        const name = classes.find((c) => !c.includes('__')) || tag.toUpperCase()
        columns.push({
          id: `col_${columns.length}`,
          name: prettifyName(name),
          selector,
          type: 'text',
        })
      }
      return
    }

    for (const child of Array.from(el.children)) {
      walk(child, depth + 1, [...pathParts, tag])
    }
  }

  for (const child of Array.from(referenceItem.children)) {
    walk(child, 0, [])
  }

  if (columns.length === 0) {
    const text = (referenceItem.textContent ?? '').trim()
    if (text) {
      columns.push({
        id: 'col_0',
        name: 'Contenido',
        selector: '',
        type: 'text',
      })
    }
  }

  return columns
}

function directTextContent(el: Element): string {
  let text = ''
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? ''
    }
  }
  return text
}

function prettifyName(raw: string): string {
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function buildRelativeSelector(target: Element, root: Element): string {
  const parts: string[] = []
  let current: Element | null = target
  while (current && current !== root) {
    const tag = current.tagName.toLowerCase()
    const parent = current.parentElement
    if (parent) {
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === current!.tagName)
      if (sameTag.length > 1) {
        const idx = sameTag.indexOf(current) + 1
        parts.unshift(`${tag}:nth-of-type(${idx})`)
      } else {
        parts.unshift(tag)
      }
    } else {
      parts.unshift(tag)
    }
    current = parent
  }
  return parts.join(' > ')
}

function extractCellValue(item: Element, column: ListColumn): string {
  const el = column.selector ? item.querySelector(column.selector) : item
  if (!el) return ''

  switch (column.type) {
    case 'image': {
      const img = el.tagName === 'IMG' ? (el as HTMLImageElement) : el.querySelector('img')
      return img?.src ?? ''
    }
    case 'link': {
      const a = el.tagName === 'A' ? (el as HTMLAnchorElement) : el.querySelector('a[href]')
      return a?.href ?? ''
    }
    case 'text':
    default:
      return (el.textContent ?? '').trim().slice(0, 500)
  }
}

function extractListData(items: Element[], parent: Element): ListExtractionData {
  const columns = detectColumns(items[0])
  const rows: Record<string, string>[] = items.map((item) => {
    const row: Record<string, string> = {}
    for (const col of columns) {
      row[col.id] = extractCellValue(item, col)
    }
    return row
  })

  const parentTag = parent.tagName.toLowerCase()
  const parentId = parent.id ? `#${parent.id}` : ''
  const listSelector = `${parentTag}${parentId}`

  return {
    columns,
    rows,
    sourceUrl: location.href,
    timestamp: Date.now(),
    listSelector,
    itemCount: items.length,
  }
}

export function enableListDetector(): void {
  disableListDetector()

  styleEl = document.createElement('style')
  styleEl.id = 'mega-scraper-list-detector-style'
  styleEl.textContent = `
.mega-scraper-list-highlight {
  outline: 2px solid #f59e0b !important;
  outline-offset: -2px;
  background: rgba(245, 158, 11, 0.08) !important;
  cursor: pointer !important;
}
#mega-scraper-list-tooltip {
  position: absolute;
  z-index: 2147483647;
  display: none;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 6px 14px;
  border-radius: 6px;
  background: #1e1b4b;
  color: #f59e0b;
  font: 600 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 1px solid #f59e0b;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
`
  document.head.appendChild(styleEl)

  onMouseOver = (e: MouseEvent) => {
    const el = elementFromTarget(e.target)
    if (!el || el === document.documentElement || el === document.body) return
    if (el.closest('#mega-scraper-list-tooltip')) return

    const result = findSiblingList(el)
    if (!result) return

    if (currentListParent === result.parent && currentList.length === result.items.length) return

    clearHighlights()
    currentList = result.items
    currentListParent = result.parent
    for (const item of result.items) {
      item.classList.add('mega-scraper-list-highlight')
    }
    showTooltip(result.items.length, result.items[0])
  }

  onMouseOut = (e: MouseEvent) => {
    const el = elementFromTarget(e.target)
    const rel = elementFromTarget(e.relatedTarget)
    if (!el) return
    if (rel && (currentListParent?.contains(rel) || rel.closest('#mega-scraper-list-tooltip'))) return
    if (!rel || !currentListParent?.contains(rel)) {
      clearHighlights()
      hideTooltip()
    }
  }

  onClick = (e: MouseEvent) => {
    const el = elementFromTarget(e.target)
    if (!el || el === document.documentElement || el === document.body) return
    if (currentList.length === 0) return

    if (!currentListParent?.contains(el)) return

    e.preventDefault()
    e.stopPropagation()

    const data = extractListData(currentList, currentListParent!)
    const msg: Message = {
      type: 'LIST_EXTRACTED',
      payload: { data },
    }
    void chrome.runtime.sendMessage(msg)

    clearHighlights()
    hideTooltip()
    disableListDetector()
  }

  document.addEventListener('mouseover', onMouseOver, true)
  document.addEventListener('mouseout', onMouseOut, true)
  document.addEventListener('click', onClick, true)
}

export function disableListDetector(): void {
  if (onMouseOver) document.removeEventListener('mouseover', onMouseOver, true)
  if (onMouseOut) document.removeEventListener('mouseout', onMouseOut, true)
  if (onClick) document.removeEventListener('click', onClick, true)
  onMouseOver = null
  onMouseOut = null
  onClick = null

  clearHighlights()
  hideTooltip()

  if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl)
  styleEl = null

  if (tooltipEl?.parentNode) tooltipEl.parentNode.removeChild(tooltipEl)
  tooltipEl = null
}
