import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Pro from './Pro.tsx'
import Template from './Template.tsx'
import { applyThemePref, getThemePref } from './lib/theme'

// Set the chosen theme on <html> before render so there's no light/dark flash.
applyThemePref(getThemePref())

// Tiny pathname router — no library needed for a few static pages. Direct loads
// of /pro and /template work via the 404.html SPA fallback emitted at build time.
const path = window.location.pathname.replace(/\/$/, '')
const page = path === '/pro' ? <Pro /> : path === '/template' ? <Template /> : <App />

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>)
