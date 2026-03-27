/**
 * @fileoverview Punto de entrada del popup de la extensión.
 * Monta el componente {@link Popup} dentro de `React.StrictMode` en el elemento raíz del DOM.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Popup } from './Popup.tsx'
import '../globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)
