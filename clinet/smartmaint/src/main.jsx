import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Debug overrides (temporary) to help unblock clickability issues during local testing
import './styles/debug-overrides.css'
import App from './App.jsx'
import loadingManager from './utils/loadingManager.js'
import axiosInstance from './utils/axiosInstance.js'

// attach axios interceptors to the loading manager
loadingManager.attachAxios(axiosInstance);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
