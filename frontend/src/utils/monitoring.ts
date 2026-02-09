// Frontend monitoring and error tracking service integration

interface MonitoringConfig {
  dsn?: string
  environment: string
  enabled: boolean
}

class FrontendMonitoring {
  private config: MonitoringConfig
  private initialized = false

  constructor() {
    this.config = {
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE || 'development',
      enabled: import.meta.env.MODE === 'production' && !!import.meta.env.VITE_SENTRY_DSN,
    }
  }

  // Initialize monitoring service (e.g., Sentry)
  init(): void {
    if (!this.config.enabled) {
      console.log('Frontend monitoring disabled in development')
      return
    }

    // TODO: Initialize Sentry or other monitoring service
    // Example for Sentry:
    // import * as Sentry from '@sentry/react'
    // Sentry.init({
    //   dsn: this.config.dsn,
    //   environment: this.config.environment,
    //   integrations: [
    //     new Sentry.BrowserTracing(),
    //     new Sentry.Replay(),
    //   ],
    //   tracesSampleRate: 1.0,
    //   replaysSessionSampleRate: 0.1,
    //   replaysOnErrorSampleRate: 1.0,
    // })

    this.initialized = true
    console.log('Frontend monitoring initialized')
  }

  // Capture exception
  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      console.error('Monitoring not initialized:', error)
      return
    }

    // TODO: Send to monitoring service
    // Example for Sentry:
    // Sentry.captureException(error, { extra: context })

    console.error('Exception captured:', error, context)
  }

  // Capture message
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.initialized) {
      console.log('Monitoring not initialized:', message)
      return
    }

    // TODO: Send to monitoring service
    // Example for Sentry:
    // Sentry.captureMessage(message, level)

    console.log(`[${level.toUpperCase()}] ${message}`)
  }

  // Set user context
  setUser(_userId: string, _email?: string): void {
    if (!this.initialized) {
      return
    }

    // TODO: Set user context in monitoring service
    // Example for Sentry:
    // Sentry.setUser({ id: userId, email })
  }

  // Clear user context
  clearUser(): void {
    if (!this.initialized) {
      return
    }

    // TODO: Clear user context in monitoring service
    // Example for Sentry:
    // Sentry.setUser(null)
  }

  // Add breadcrumb
  addBreadcrumb(_message: string, _category: string, _data?: Record<string, any>): void {
    if (!this.initialized) {
      return
    }

    // TODO: Add breadcrumb to monitoring service
    // Example for Sentry:
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   level: 'info',
    // })
  }

  // Track page view
  trackPageView(path: string): void {
    if (!this.initialized) {
      return
    }

    this.addBreadcrumb(`Page view: ${path}`, 'navigation', { path })
  }

  // Track user action
  trackAction(action: string, data?: Record<string, any>): void {
    if (!this.initialized) {
      return
    }

    this.addBreadcrumb(action, 'user-action', data)
  }
}

export const frontendMonitoring = new FrontendMonitoring()
