import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import HousePricePrediction from './react_frontend_2.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HousePricePrediction></HousePricePrediction>
  </StrictMode>,
)
