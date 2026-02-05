import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FirebaseProvider } from './contexts/FirebaseContext.jsx'

// Prevent mouse wheel from changing focused number inputs by blurring them.
if (typeof window !== 'undefined') {
  window.addEventListener('wheel', (e) => {
    const el = document.activeElement
    if (el && el.tagName === 'INPUT' && el.type === 'number') {
      // remove focus so wheel scrolls the page instead of changing the input value
      try { el.blur() } catch (err) { /* ignore */ }
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>,
)
