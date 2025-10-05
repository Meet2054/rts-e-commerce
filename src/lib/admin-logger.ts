// lib/admin-logger.ts - Centralized logging system for admin analytics
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Log levels
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
  DEBUG = 'debug'
}

// Log categories for better organization
export enum LogCategory {
  AUTH = 'auth',
  USER_MANAGEMENT = 'user_management',
  ORDERS = 'orders',
  PRODUCTS = 'products',
  CART = 'cart',
  CACHE = 'cache',
  API = 'api',
  PRICING = 'pricing',
  SYSTEM = 'system',
  FIREBASE = 'firebase',
  REDIS = 'redis'
}

// Log entry interface
export interface LogEntry {
  id?: string;
  timestamp?: any; // Firebase Timestamp - optional since it's added in addToBatch
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number; // For API calls
  metadata?: Record<string, any>;
}

// Performance tracking interface
export interface PerformanceLog {
  operation: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
}

class AdminLogger {
  private static instance: AdminLogger;
  private isEnabled: boolean = true;
  private batchSize: number = 50;
  private logBatch: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Auto-flush logs every 30 seconds or when batch reaches batchSize
    this.startAutoFlush();
  }

  public static getInstance(): AdminLogger {
    if (!AdminLogger.instance) {
      AdminLogger.instance = new AdminLogger();
    }
    return AdminLogger.instance;
  }

  // Start auto-flush timer
  private startAutoFlush() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    
    this.flushTimer = setInterval(() => {
      if (this.logBatch.length > 0) {
        this.flush();
      }
    }, 30000); // Flush every 30 seconds
  }

  // Add log entry to batch
  private addToBatch(entry: LogEntry) {
    if (!this.isEnabled) return;
    
    this.logBatch.push({
      ...entry,
      timestamp: new Date(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Auto-flush if batch is full
    if (this.logBatch.length >= this.batchSize) {
      this.flush();
    }
  }

  // Helper function to remove undefined values from objects
  private sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirestore(item));
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeForFirestore(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  // Flush batch to Firebase
  private async flush() {
    if (this.logBatch.length === 0) return;

    const logsToFlush = [...this.logBatch];
    this.logBatch = []; // Clear batch immediately

    try {
      const batch = adminDb.batch();

      // Add each log to the batch write (sanitize for Firestore)
      logsToFlush.forEach(log => {
        const docRef = adminDb.collection('admin_logs').doc();
        const sanitizedLog = this.sanitizeForFirestore(log);
        batch.set(docRef, sanitizedLog);
      });

      await batch.commit();
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 [ADMIN-LOGGER] Flushed ${logsToFlush.length} log entries to Firebase`);
      }
    } catch (error) {
      console.error('❌ [ADMIN-LOGGER] Failed to flush logs to Firebase:', error);
      
      // Don't retry to avoid infinite loops - just log the error
      // In production, you might want to implement a more sophisticated retry mechanism
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [ADMIN-LOGGER] Failed logs will be discarded to prevent infinite retry loops');
        if (logsToFlush.length > 0) {
          console.log('🔍 [ADMIN-LOGGER] Sample of failed log structure:', JSON.stringify(logsToFlush[0], null, 2));
        }
      }
    }
  }

  // Public logging methods
  public info(category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) {
    this.addToBatch({
      level: LogLevel.INFO,
      category,
      message,
      details,
      metadata
    });
    
    // Also log to console
    console.log(`ℹ️ [${category.toUpperCase()}] ${message}`, details ? details : '');
  }

  public warn(category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) {
    this.addToBatch({
      level: LogLevel.WARN,
      category,
      message,
      details,
      metadata
    });
    
    console.warn(`⚠️ [${category.toUpperCase()}] ${message}`, details ? details : '');
  }

  public error(category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) {
    this.addToBatch({
      level: LogLevel.ERROR,
      category,
      message,
      details,
      metadata
    });
    
    console.error(`❌ [${category.toUpperCase()}] ${message}`, details ? details : '');
  }

  public success(category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) {
    this.addToBatch({
      level: LogLevel.SUCCESS,
      category,
      message,
      details,
      metadata
    });
    
    console.log(`✅ [${category.toUpperCase()}] ${message}`, details ? details : '');
  }

  public debug(category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.addToBatch({
        level: LogLevel.DEBUG,
        category,
        message,
        details,
        metadata
      });
      
      console.log(`🔍 [${category.toUpperCase()}] ${message}`, details ? details : '');
    }
  }

  // Enhanced logging with user context
  public logWithUser(
    level: LogLevel,
    category: LogCategory,
    message: string,
    userId?: string,
    userEmail?: string,
    details?: any,
    metadata?: Record<string, any>
  ) {
    this.addToBatch({
      level,
      category,
      message,
      details,
      userId,
      userEmail,
      metadata
    });
  }

  // API call logging with performance tracking
  public logApiCall(
    category: LogCategory,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string,
    userEmail?: string,
    requestBody?: any,
    responseData?: any
  ) {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;
    
    this.addToBatch({
      level,
      category,
      message,
      userId,
      userEmail,
      duration,
      details: {
        endpoint,
        method,
        statusCode,
        requestBody: requestBody ? JSON.stringify(requestBody).substring(0, 1000) : null,
        responseData: responseData ? JSON.stringify(responseData).substring(0, 1000) : null
      }
    });
  }

  // Database operation logging
  public logDbOperation(
    operation: string,
    collection: string,
    documentId?: string,
    success: boolean = true,
    duration?: number,
    error?: any
  ) {
    const level = success ? LogLevel.SUCCESS : LogLevel.ERROR;
    const message = `${operation} ${collection}${documentId ? `/${documentId}` : ''} - ${success ? 'SUCCESS' : 'FAILED'}${duration ? ` (${duration}ms)` : ''}`;
    
    this.addToBatch({
      level,
      category: LogCategory.FIREBASE,
      message,
      duration,
      details: error ? { error: error.message } : null
    });
  }

  // Cache operation logging
  public logCacheOperation(
    operation: 'GET' | 'SET' | 'DELETE' | 'FLUSH',
    key: string,
    hit: boolean = false,
    duration?: number,
    size?: number
  ) {
    const message = `${operation} ${key} - ${hit ? 'HIT' : 'MISS'}${duration ? ` (${duration}ms)` : ''}${size ? ` [${size} bytes]` : ''}`;
    
    this.addToBatch({
      level: LogLevel.INFO,
      category: LogCategory.CACHE,
      message,
      duration,
      details: { operation, key, hit, size }
    });
  }

  // User action logging
  public logUserAction(
    action: string,
    targetUserId: string,
    performedBy: string,
    performedByEmail: string,
    details?: any
  ) {
    this.addToBatch({
      level: LogLevel.INFO,
      category: LogCategory.USER_MANAGEMENT,
      message: `User action: ${action} on user ${targetUserId}`,
      userId: performedBy,
      userEmail: performedByEmail,
      details: {
        action,
        targetUserId,
        ...details
      }
    });
  }

  // Order logging
  public logOrderEvent(
    event: string,
    orderId: string,
    userId?: string,
    userEmail?: string,
    orderValue?: number,
    details?: any
  ) {
    this.addToBatch({
      level: LogLevel.INFO,
      category: LogCategory.ORDERS,
      message: `Order ${event}: ${orderId}${orderValue ? ` (₹${orderValue})` : ''}`,
      userId,
      userEmail,
      details: {
        event,
        orderId,
        orderValue,
        ...details
      }
    });
  }

  // Force flush all pending logs
  public async forceFlush(): Promise<void> {
    return this.flush();
  }

  // Enable/disable logging
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Cleanup
  public cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
  }
}

// Export singleton instance
export const adminLogger = AdminLogger.getInstance();

// Helper functions for common logging patterns
export const logApiRequest = (
  method: string, 
  endpoint: string, 
  statusCode: number, 
  duration: number,
  userId?: string,
  details?: any
) => {
  adminLogger.logApiCall(LogCategory.API, endpoint, method, statusCode, duration, userId, undefined, details);
};

export const logUserActivity = (
  action: string,
  userId: string,
  userEmail: string,
  details?: any
) => {
  adminLogger.logWithUser(LogLevel.INFO, LogCategory.USER_MANAGEMENT, action, userId, userEmail, details);
};

export const logError = (
  category: LogCategory,
  message: string,
  error: any,
  userId?: string
) => {
  adminLogger.error(category, message, {
    error: error?.message || error,
    stack: error?.stack
  }, { userId });
};

export const logSuccess = (
  category: LogCategory,
  message: string,
  details?: any
) => {
  adminLogger.success(category, message, details);
};

// Performance tracking wrapper
export const withPerformanceLogging = async <T>(
  category: LogCategory,
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    adminLogger.info(category, `${operation} completed successfully`, { duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    adminLogger.error(category, `${operation} failed`, { 
      error: error instanceof Error ? error.message : String(error), 
      duration 
    });
    throw error;
  }
};