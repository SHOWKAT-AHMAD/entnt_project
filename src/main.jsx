import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

async function startApp() {
  if (import.meta.env.DEV) {
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
