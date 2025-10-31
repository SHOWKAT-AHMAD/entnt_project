import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

async function startApp() {
  // Enable MSW in development, and optionally in production when VITE_ENABLE_MSW=true
  const enableMocks = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true'
  if (enableMocks) {
    const { initMocks } = await import('./mocks/browser.js')
    await initMocks()
  }
  
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

startApp().catch(console.error)
