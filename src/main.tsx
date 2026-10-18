import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/antonio/300.css'
import '@fontsource/antonio/400.css'
import '@fontsource/antonio/600.css'
import '@fontsource/antonio/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
