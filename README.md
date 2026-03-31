# Mega Web Scraper

Extensión de Chrome (Manifest V3) que extrae datos estructurados de cualquier página web: emails, teléfonos, enlaces, imágenes, texto, tablas, reseñas, datos de negocios y redes sociales.

## Requisitos

- Node.js (v18+)
- Google Chrome
- npm

## Instalación inicial

```bash
cd extension
npm install
npm run build
```

Luego cargar la extensión en Chrome:

1. Ir a `chrome://extensions/`
2. Activar **Modo de desarrollador** (esquina superior derecha)
3. Click en **Cargar descomprimida**
4. Seleccionar la carpeta `extension/dist/`

## Flujo de trabajo diario

### 1. Editar código

Editar los archivos en `extension/src/`.

### 2. Compilar

```bash
cd extension
npm run build
```

Alternativa: usar `npm run dev` para compilación automática en cada guardado.

### 3. Recargar en Chrome

- Ir a `chrome://extensions/`
- Click en el botón de **recarga** (ícono circular) de la extensión
- **Refrescar (F5)** la pestaña donde se quiere usar el scraper

### Importante

- **No borrar `dist/`** — Chrome carga la extensión desde esta carpeta.
- **No borrar `node_modules/`** — Sin ella, `npm run build` falla.
- **La extensión no necesita un proceso corriendo** — Chrome la ejecuta internamente. No hace falta tener Cursor ni una terminal abierta.
- **`npm install`** solo es necesario si falta `node_modules/` o si se agregan nuevas dependencias en `package.json`.

## Estructura del proyecto

```
extension/
├── src/           → Código fuente (lo que se edita)
├── dist/          → Build compilado (lo que Chrome carga)
├── node_modules/  → Dependencias (generado por npm install)
├── package.json   → Dependencias y scripts
├── vite.config.ts → Configuración del bundler
└── manifest.json  → Manifiesto de la extensión
```

## Documentación técnica

Ver `docs/CONTEXT_SUMMARY.md` para la arquitectura completa, tipos, flujos de mensajería y detalles de implementación.
