import '@/app/styles/globals.css'
import 'boulder-ui/styles'
import 'maplibre-gl/dist/maplibre-gl.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/bootstrap/app'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container was not found.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
