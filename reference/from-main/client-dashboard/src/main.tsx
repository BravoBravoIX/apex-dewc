import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import StructuredApp from './StructuredApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StructuredApp />
  </StrictMode>,
)
