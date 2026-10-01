import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'
import { ThemeProvider } from './context/ThemeContext'
import { initAnalytics, trackPageView } from './utils/analytics'

initAnalytics()
let ultimaRuta = window.location.pathname
trackPageView(ultimaRuta)
// El router notifica también cambios de estado internos: medir solo cuando cambia la ruta
router.subscribe(({ location }) => {
  if (location.pathname === ultimaRuta) return
  ultimaRuta = location.pathname
  trackPageView(ultimaRuta)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  </StrictMode>,
)
