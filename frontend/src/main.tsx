import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reportWebVitals } from './utils/performance'

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
