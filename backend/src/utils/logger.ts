// Logger utility for structured logging

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  userId?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  error?: any
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context)

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
    }

    // In production, you would send logs to CloudWatch or other logging service
    if (!this.isDevelopment) {
      this.sendToCloudWatch(level, message, context)
    }
  }

  private sendToCloudWatch(level: LogLevel, message: string, context?: LogContext): void {
    // Send to CloudWatch in production
    try {
      const { cloudwatch } = require('./cloudwatch.js')
      cloudwatch.log(level, message, context)
    } catch (error) {
      // CloudWatch not available, skip
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  // Request logging helper
  logRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration,
      userId,
    })
  }

  // Error logging helper with stack trace
  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    })
  }
}

export const logger = new Logger()
