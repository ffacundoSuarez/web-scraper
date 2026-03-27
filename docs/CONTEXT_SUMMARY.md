# CONTEXT_SUMMARY — Mega Web Scraper

## Qué es este proyecto

**Mega Web Scraper** es una extensión de navegador para Chrome (Manifest V3) que permite extraer datos estructurados de cualquier página web. El usuario abre el popup de la extensión, presiona "Escanear", y la extensión parsea el DOM de la página activa para extraer: emails, teléfonos, enlaces, imágenes, texto, tablas HTML, reseñas, datos de negocios y perfiles de redes sociales.

Los datos se muestran en una interfaz con tabs (una por tipo de dato) y se pueden exportar en CSV, Excel (.xlsx) o JSON. También ofrece un selector visual de elementos y auto-paginación.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Chrome Extension (Manifest V3) |
| Build | Vite 5 + `@crxjs/vite-plugin` |
| UI | React 18 + TypeScript |
| Estilos | Tailwind CSS 3 + componentes shadcn/ui (Radix primitives) |
| Iconos | lucide-react |
| Export Excel | xlsx |
| Export archivos | file-saver (legacy), también `URL.createObjectURL` + anchor click (nuevo) |
| Linting | ESLint + typescript-eslint |

---

## Arquitectura general

```
┌──────────────┐    chrome.runtime.sendMessage    ┌──────────────────┐
│   Popup UI   │ ◄──────────────────────────────► │  Background SW   │
│  (React app) │                                  │  (Service Worker)│
└──────────────┘                                  └────────┬─────────┘
       │                                                   │
       │  lee chrome.storage.local                         │ chrome.tabs.sendMessage
       │  para obtener estado                              │
       ▼                                                   ▼
┌────────────────────┐                           ┌──────────────────┐
│  chrome.storage    │                           │  Content Script  │
│  (estado global)   │                           │  (scraper.ts)    │
└────────────────────┘                           │  Inyectado en    │
                                                 │  cada pestaña    │
                                                 └──────────────────┘
```

### Flujo principal de scraping

1. El usuario hace clic en "Escanear Página Completa" en el popup.
2. `useScraper` envía un mensaje `START_SCRAPE` al background (service worker).
3. El background actualiza el estado a `scanning` en `chrome.storage.local` y reenvía el mensaje al content script de la pestaña activa.
4. El content script (`scraper.ts`) ejecuta todos los parsers sobre el `document` actual.
5. El content script envía un mensaje `SCRAPE_RESULT` con los datos al background.
6. El background guarda los datos en `chrome.storage.local` con estado `completed`.
7. El popup escucha cambios en storage (vía `onStateChange`) y renderiza los resultados.

### Flujo de auto-paginación

1. El usuario hace clic en "Auto-Paginado".
2. Se envía `START_PAGINATION` al content script.
3. El content script scrapea la página actual, luego busca el botón/enlace de "siguiente página" (`pagination.ts`).
4. Hace clic en él, espera 2 segundos, scrapea de nuevo, y merge los resultados acumulados.
5. Repite hasta un máximo de 10 páginas o hasta que no encuentre un enlace de siguiente.
6. Cada iteración envía `SCRAPE_RESULT` con los datos acumulados.

### Flujo de selector visual

1. El usuario hace clic en "Selector Visual".
2. Se envía `START_SELECTOR` al content script.
3. `selector.ts` inyecta estilos de highlight y agrega listeners de mouseover/mouseout/click.
4. Al hacer hover, los elementos se resaltan con un borde azul.
5. Al hacer clic, se genera un selector CSS único del elemento y se envía un mensaje `ELEMENT_SELECTED` con metadata (outerHTML, selector, tagName, classList, textPreview).

---

## Estructura de directorios

```
extension/
├── manifest.json                 # Manifiesto Chrome Extension v3
├── package.json                  # Dependencias y scripts npm
├── vite.config.ts                # Configuración de Vite con plugin CRXJS
├── tailwind.config.ts            # Configuración de Tailwind CSS
├── src/
│   ├── background/
│   │   └── index.ts              # Service worker: enruta mensajes entre popup y content script
│   ├── content/
│   │   ├── scraper.ts            # Content script: ejecuta parsers y maneja mensajes
│   │   ├── selector.ts           # Selector visual de elementos DOM
│   │   ├── pagination.ts         # Detección y navegación automática de paginación
│   │   └── styles.css            # Estilos inyectados en la página
│   ├── core/
│   │   ├── types.ts              # Todos los tipos e interfaces TypeScript
│   │   ├── constants.ts          # Constantes globales (regex, etiquetas, plataformas)
│   │   ├── messaging.ts          # Wrappers de chrome.runtime.sendMessage
│   │   ├── storage.ts            # CRUD sobre chrome.storage.local
│   │   ├── exporters.ts          # Exportadores legacy (CSV, Excel, JSON) con file-saver
│   │   ├── exporters/            # Exportadores nuevos (modulares)
│   │   │   ├── index.ts          # Barrel file
│   │   │   ├── csv-exporter.ts   # Exportación CSV con BOM y trigger de descarga
│   │   │   ├── excel-exporter.ts # Exportación Excel con múltiples hojas
│   │   │   └── json-exporter.ts  # Exportación JSON
│   │   └── parsers/              # Módulos de extracción de datos
│   │       ├── index.ts          # Barrel file
│   │       ├── email-parser.ts   # Extrae emails del texto y links mailto:
│   │       ├── phone-parser.ts   # Extrae teléfonos del texto y links tel:
│   │       ├── link-parser.ts    # Extrae todos los enlaces <a href>
│   │       ├── image-parser.ts   # Extrae imágenes <img> con dimensiones
│   │       ├── text-parser.ts    # Extrae texto de h1-h6, p, li, spans largos
│   │       ├── table-parser.ts   # Extrae tablas HTML con headers y filas
│   │       ├── review-parser.ts  # Extrae reseñas vía microdata, itemprop y heurísticas CSS
│   │       ├── social-parser.ts  # Detecta links a redes sociales conocidas
│   │       └── business-parser.ts# Extrae datos de negocios vía JSON-LD, microdata y CSS
│   ├── hooks/
│   │   ├── useScraper.ts         # Hook principal: estado, acciones de scraping
│   │   └── useStorage.ts         # Hook genérico para sincronizar con chrome.storage
│   ├── lib/
│   │   └── utils.ts              # Utilidad cn() para merge de clases Tailwind
│   ├── popup/
│   │   ├── index.html            # HTML del popup
│   │   ├── main.tsx              # Entry point React
│   │   └── Popup.tsx             # Componente principal del popup
│   ├── components/
│   │   ├── Header.tsx            # Barra superior con título y botón limpiar
│   │   ├── ExportMenu.tsx        # Barra de exportación (CSV, Excel, JSON, copiar)
│   │   ├── ResultsView.tsx       # Renderizado de resultados por tipo de dato
│   │   ├── StatusBar.tsx         # Barra inferior con estado y conteo
│   │   └── ui/                   # Componentes shadcn/ui (Radix wrappers)
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       └── tooltip.tsx
│   ├── globals.css               # Estilos globales + variables CSS de tema
│   └── vite-env.d.ts             # Referencia de tipos Vite
```

---

## Tipos principales (core/types.ts)

| Tipo | Descripción |
|---|---|
| `ScraperType` | Union literal: `'emails' \| 'phones' \| 'links' \| 'images' \| 'text' \| 'tables' \| 'reviews' \| 'business' \| 'social'` |
| `ScrapedData` | Objeto con un array por cada `ScraperType` |
| `ScrapeState` | Estado global: `status`, `data` (ScrapedData), `url`, `timestamp`, `error?` |
| `ScrapeStatus` | `'idle' \| 'scanning' \| 'completed' \| 'error'` |
| `MessageType` | Tipos de mensaje entre componentes de la extensión |
| `Message<T>` | Envelope de mensaje: `{ type: MessageType, payload?: T }` |
| `ExportFormat` | `'csv' \| 'json' \| 'excel'` |

### Interfaces de resultado por tipo

| Interfaz | Campos clave |
|---|---|
| `EmailResult` | `email`, `source` (text o mailto) |
| `PhoneResult` | `phone`, `formatted`, `source` (text o tel) |
| `LinkResult` | `url`, `text`, `title`, `isExternal` |
| `ImageResult` | `src`, `alt`, `width`, `height` |
| `TextResult` | `content`, `tag` (h1, p, etc.), `selector` |
| `TableResult` | `headers[]`, `rows[][]`, `selector` |
| `ReviewResult` | `author`, `rating`, `text`, `date` |
| `BusinessResult` | `name`, `address`, `phone`, `email`, `website`, `description` |
| `SocialResult` | `platform`, `url`, `username` |

---

## Mensajería entre componentes

La comunicación usa `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`.

| Mensaje | Origen → Destino | Descripción |
|---|---|---|
| `START_SCRAPE` | Popup → Background → Content | Inicia el scraping de todos los tipos |
| `SCRAPE_RESULT` | Content → Background | Envía datos scrapeados para guardar en storage |
| `SCRAPE_COMPLETE` | (Definido pero no usado actualmente) | — |
| `SCRAPE_ERROR` | Content → Background | Reporta un error de scraping |
| `GET_STATE` | Popup → Background | Solicita el estado actual |
| `START_SELECTOR` | Popup → Background → Content | Activa el selector visual |
| `STOP_SELECTOR` | Popup → Background → Content | Desactiva el selector visual |
| `ELEMENT_SELECTED` | Content → Background | Envía info del elemento seleccionado |
| `START_PAGINATION` | Popup → Background → Content | Inicia auto-paginación |
| `STOP_PAGINATION` | Popup → Background → Content | Detiene auto-paginación |

---

## Estado de la aplicación

El estado se persiste en `chrome.storage.local` bajo la clave `mega_scraper_state`. Estructura:

```typescript
interface ScrapeState {
  status: 'idle' | 'scanning' | 'completed' | 'error'
  data: ScrapedData    // un array por tipo de dato
  url: string          // URL de la página scrapeada
  timestamp: number    // Date.now() del último evento
  error?: string       // mensaje de error si status === 'error'
}
```

Los cambios en storage se propagan en tiempo real al popup vía `chrome.storage.onChanged`.

---

## Parsers — Estrategias de extracción

Cada parser recibe un `Document` y devuelve un array tipado. Todos deduplicaban internamente.

| Parser | Estrategia |
|---|---|
| **email-parser** | Regex sobre `body.innerText` + escaneo de `a[href^="mailto:"]`. Filtra extensiones de imagen falsas. |
| **phone-parser** | Regex sobre `body.innerText` + escaneo de `a[href^="tel:"]`. Requiere ≥7 dígitos. |
| **link-parser** | `querySelectorAll('a[href]')`, resuelve URLs absolutas, detecta enlaces externos comparando hostname. Ignora `javascript:` y fragmentos. |
| **image-parser** | `querySelectorAll('img')`, usa `naturalWidth`/`naturalHeight` o atributos. Filtra tracking pixels (<10x10) y data URIs cortos. |
| **text-parser** | Selecciona `h1-h6, p, li` + `span` con ≥12 caracteres. Máximo 200 resultados. Genera selector CSS completo. |
| **table-parser** | `querySelectorAll('table')`, separa `th` (headers) de `td` (filas). Genera selector CSS del table. |
| **review-parser** | 3 capas: (1) microdata `[itemtype*="Review"]`, (2) `[itemprop="review"]`, (3) heurística CSS (`class*="review"`, `class*="rating"`, `aria-label*="star"`). |
| **social-parser** | Compara todos los `a[href]` contra regex de 11 plataformas sociales conocidas. Extrae username del path de la URL. |
| **business-parser** | 3 capas: (1) JSON-LD `<script type="application/ld+json">` buscando tipos LocalBusiness/Organization, (2) microdata `[itemscope][itemtype*="LocalBusiness"]`, (3) heurística CSS (`class*="company"`, etc.). Merge por clave y deduplicación. |

---

## Exportadores

Existen **dos sistemas de exportación** (probablemente una migración en progreso):

### Legacy (`core/exporters.ts`)
- Usa `file-saver` (`saveAs`) para descargar.
- `flattenForExport()` convierte `ScrapedData` completo en filas planas con columna `type`.
- Exporta todo junto en un único archivo.

### Nuevo (`core/exporters/`)
- Módulos separados por formato: `csv-exporter.ts`, `excel-exporter.ts`, `json-exporter.ts`.
- Usa `URL.createObjectURL` + anchor click para descargar (no depende de file-saver para CSV/JSON).
- Puede exportar un tipo individual (`scrapedDataToCSV(data, 'emails')`) o todo (`scrapedDataToExcel(data)` sin tipo crea múltiples hojas).

> **Nota para agentes:** El popup (`ExportMenu.tsx`) importa del archivo legacy `core/exporters.ts`. Los exportadores nuevos en `core/exporters/` están disponibles pero no se usan desde la UI actualmente. Esto podría ser un punto de migración pendiente.

---

## Componentes React principales

| Componente | Archivo | Rol |
|---|---|---|
| `Popup` | `popup/Popup.tsx` | Componente raíz del popup. Orquesta toda la UI. |
| `Header` | `components/Header.tsx` | Barra superior: logo, botón configuración (deshabilitado), botón limpiar datos. |
| `ResultsView` | `components/ResultsView.tsx` | Renderiza los resultados según el tipo seleccionado. Tiene un layout diferente para cada tipo. |
| `ExportMenu` | `components/ExportMenu.tsx` | Barra inferior de exportación: botones CSV, Excel, JSON, copiar al portapapeles. |
| `StatusBar` | `components/StatusBar.tsx` | Barra de estado: indicador de color, texto de estado, conteo total de elementos. |
| `components/ui/*` | shadcn/ui wrappers | Componentes base: Button, Badge, Card, Tabs, Tooltip, ScrollArea, etc. |

---

## Hooks personalizados

| Hook | Descripción |
|---|---|
| `useScraper()` | Hook principal. Carga el estado de storage, suscribe a cambios, expone `startScrape`, `startSelector`, `startPagination`, `clearData`. |
| `useStorage<T>(key, default)` | Hook genérico para leer/escribir cualquier clave en `chrome.storage.local` con reactividad. |

---

## Puntos de entrada del build

Definidos en `vite.config.ts`:

- **Popup:** `src/popup/index.html` → monta `<Popup />` en `#root`
- **Background:** `src/background/index.ts` (service worker, declarado en `manifest.json`)
- **Content script:** `src/content/scraper.ts` + `src/content/styles.css` (inyectados en todas las URLs)

---

## Posibles áreas de mejora / deuda técnica

1. **Exportadores duplicados:** `core/exporters.ts` (legacy) y `core/exporters/*.ts` (nuevo) coexisten. La UI usa el legacy.
2. **Botón de configuración deshabilitado:** `Header.tsx` tiene un botón "Configuración" con `disabled`, no hay pantalla de settings.
3. **`SCRAPE_COMPLETE` no se usa:** El tipo de mensaje está definido pero ningún componente lo envía ni lo maneja.
4. **`ELEMENT_SELECTED` sin handler en background/popup:** El content script envía este mensaje cuando se selecciona un elemento, pero ni el background ni el popup lo procesan visiblemente.
5. **Paginación sin UI de progreso:** `autoPageinate` corre hasta 10 páginas pero no hay feedback visual del progreso de paginación.
6. **`STOP_SCRAPE` definido pero no implementado:** El tipo de mensaje existe, pero no hay lógica para detener un scrape en curso.
7. **Sin tests:** No hay archivos de test en el proyecto.
8. **Sin manejo de errores robusto en el popup:** Los errores se guardan en el estado pero no se muestran prominentemente en la UI.

---

## Cómo correr el proyecto

```bash
cd extension
npm install
npm run dev     # Inicia Vite en modo desarrollo con hot-reload para la extensión
npm run build   # Build de producción
```

Para cargar en Chrome: `chrome://extensions/` → Modo desarrollador → Cargar descomprimida → Seleccionar la carpeta `extension/dist/`.

---

## Permisos de la extensión

| Permiso | Uso |
|---|---|
| `activeTab` | Acceder a la pestaña activa |
| `scripting` | Inyectar scripts en pestañas |
| `storage` | Persistir estado en `chrome.storage.local` |
| `downloads` | Descargar archivos exportados |
| `tabs` | Consultar la URL de la pestaña activa |
| `clipboardWrite` | Copiar datos al portapapeles |
| `<all_urls>` | El content script se inyecta en todas las URLs |
