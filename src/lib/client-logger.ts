// src/lib/client-logger.ts
// Client-safe logging utility for browser environments

export const clientLogger = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[CLIENT DEBUG]`, message, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[CLIENT INFO]`, message, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[CLIENT WARN]`, message, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[CLIENT ERROR]`, message, ...args);
    }
    
    // In production, you could send errors to a logging service
    // Example: Send to your API endpoint for centralized logging
    if (process.env.NODE_ENV === 'production') {
      // Only log critical errors in production
      fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          category: 'CLIENT',
          message,
          data: args,
          timestamp: new Date().toISOString(),
          source: 'client'
        })
      }).catch(() => {
        // Silently fail if logging endpoint is not available
      });
    }
  }
};