import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import './i18n'
import App from './App.tsx'
import './index.css'
import { reportWebVitals } from './utils/performance'

// Use VITE_API_URL when set (e.g. production or direct backend URL); otherwise
// use same origin so Vite dev proxy works (requests to /api go to backend).
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Report web vitals for performance monitoring
reportWebVitals((metric) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(metric);
  }
  
  // In production, send to analytics service
  // Example: sendToAnalytics(metric);
})
