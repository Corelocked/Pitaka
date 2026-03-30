import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './MobileApp.css'
import ModernApp from './ModernApp.jsx'
import { FirebaseProvider } from './contexts/FirebaseContext.jsx'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

// Prevent mouse wheel from changing focused number inputs by blurring them.
if (typeof window !== 'undefined') {
  window.addEventListener('wheel', () => {
    const el = document.activeElement
    if (el && el.tagName === 'INPUT' && el.type === 'number') {
      // remove focus so wheel scrolls the page instead of changing the input value
      try { el.blur() } catch { /* ignore */ }
    }
  }, { passive: true })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FirebaseProvider>
      <ConfirmProvider>
        <ModernApp />
        <Analytics />
        <SpeedInsights />
      </ConfirmProvider>
    </FirebaseProvider>
  </StrictMode>,
)

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {
        // Ignore cleanup failures so the app still boots normally.
      })
  })
}
