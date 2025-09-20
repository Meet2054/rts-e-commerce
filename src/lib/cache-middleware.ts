// src/lib/cache-middleware.ts
import { NextRequest } from 'next/server';
import { RedisCache, CacheKeys } from './redis-cache';
import CachedFirebaseService from './firebase-cache';

export class CacheMiddleware {
  /**
   * Middleware for product endpoints to handle cache warming
   */
  static async productEndpointMiddleware(
    request: NextRequest,
    productId?: string
  ): Promise<void> {
    try {
      // Pre-warm related product data if accessing a specific product
      if (productId && request.method === 'GET') {
        // Check if product is in cache, if not, it will be fetched and cached
        await CachedFirebaseService.getProduct(productId);
        
        // Also pre-warm the category data
        const product = await CachedFirebaseService.getProduct(productId);
        if (product?.categoryId) {
          await CachedFirebaseService.getCategory(product.categoryId);
        }
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Don't throw - cache is not critical
    }
  }

  /**
   * Middleware for search endpoints to handle search result caching
   */
  static async searchEndpointMiddleware(
    request: NextRequest,
    searchTerm: string,
    filters: any = {}
  ): Promise<void> {
    try {
      if (request.method === 'GET') {
        // Pre-warm search results
        await CachedFirebaseService.searchProducts(searchTerm, filters);
      }
    } catch (error) {
      console.error('Search cache middleware error:', error);
    }
  }

  /**
   * Middleware for order endpoints
   */
  static async orderEndpointMiddleware(
    request: NextRequest,
    userEmail?: string
  ): Promise<void> {
    try {
      if (userEmail && request.method === 'GET') {
        // Pre-warm user orders
        await CachedFirebaseService.getUserOrders(userEmail);
      }
    } catch (error) {
      console.error('Order cache middleware error:', error);
    }
  }

  /**
   * General cache health check and cleanup
   */
  static async performCacheHealthCheck(): Promise<{
    healthy: boolean;
    stats: any;
    recommendations: string[];
  }> {
    try {
      const stats = await CachedFirebaseService.getCacheStats();
      const recommendations: string[] = [];
      
      // Check if cache is getting too large
      if (stats.totalKeys > 10000) {
        recommendations.push('Consider clearing old cache entries - high key count detected');
      }

      // Check for balanced cache usage
      const productRatio = stats.productKeys / stats.totalKeys;
      if (productRatio > 0.8) {
        recommendations.push('Product cache dominance detected - consider shorter TTL for products');
      }

      return {
        healthy: stats.totalKeys > 0, // At least some cache should exist
        stats,
        recommendations
      };
    } catch (error) {
      console.error('Cache health check error:', error);
      return {
        healthy: false,
        stats: null,
        recommendations: ['Cache service appears to be unavailable']
      };
    }
  }

  /**
   * Auto cache warming for frequently accessed data
   */
  static async warmUpFrequentlyAccessedData(): Promise<void> {
    try {
      // Warm up categories (frequently used for navigation)
      await CachedFirebaseService.getCategories();

      // Warm up popular products (first 20 active products)
      await CachedFirebaseService.getProducts({
        isActive: true,
        limitCount: 20
      });

      console.log('Cache warm-up completed successfully');
    } catch (error) {
      console.error('Cache warm-up error:', error);
    }
  }

  /**
   * Intelligent cache cleanup based on usage patterns
   */
  static async performIntelligentCleanup(): Promise<void> {
    try {
      const redis = RedisCache['redis'];
      
      // Get all keys and their TTL
      const allKeys = await redis.keys('*');
      const expiredKeys: string[] = [];
      
      for (const key of allKeys) {
        const ttl = await redis.ttl(key);
        // Keys with TTL -1 never expire, TTL -2 means expired
        if (ttl === -2) {
          expiredKeys.push(key);
        }
      }

      // Remove expired keys
      if (expiredKeys.length > 0) {
        await redis.del(...expiredKeys);
        console.log(`Cleaned up ${expiredKeys.length} expired cache keys`);
      }

      // If total keys exceed threshold, remove oldest search results
      if (allKeys.length > 5000) {
        const searchKeys = allKeys.filter(key => key.startsWith('search:'));
        if (searchKeys.length > 100) {
          // Remove oldest search cache entries
          const keysToRemove = searchKeys.slice(0, Math.floor(searchKeys.length / 2));
          await redis.del(...keysToRemove);
          console.log(`Cleaned up ${keysToRemove.length} old search cache entries`);
        }
      }
    } catch (error) {
      console.error('Intelligent cleanup error:', error);
    }
  }

  /**
   * Cache invalidation strategies for different data types
   */
  static async smartInvalidation(dataType: 'product' | 'category' | 'order', identifier: string): Promise<void> {
    try {
      switch (dataType) {
        case 'product':
          // Invalidate product and related search results
          await CachedFirebaseService.invalidateProduct(identifier);
          await RedisCache.deletePattern('search:products:*');
          break;

        case 'category':
          // Invalidate category and all products in that category
          await CachedFirebaseService.invalidateCategory(identifier);
          await RedisCache.deletePattern('products:*');
          await RedisCache.deletePattern('search:products:*');
          break;

        case 'order':
          // Invalidate specific order and user order cache
          await CachedFirebaseService.invalidateOrder(identifier);
          // Note: We don't know user email here, so we might need to clear all user order caches
          // In production, you might want to store order-to-user mapping for more efficient invalidation
          await RedisCache.deletePattern('orders:user:*');
          break;
      }
    } catch (error) {
      console.error(`Smart invalidation error for ${dataType}:${identifier}`, error);
    }
  }

  /**
   * Session-based caching for user-specific data
   */
  static async handleUserSessionCache(userId: string, sessionId: string): Promise<void> {
    try {
      // Store user session mapping for cache invalidation
      await RedisCache.set(
        CacheKeys.userSession(userId),
        { sessionId, lastActivity: new Date() },
        { ttl: 3600 } // 1 hour
      );

      // Pre-warm user-specific data
      await CachedFirebaseService.getUserOrders(userId);
    } catch (error) {
      console.error('User session cache error:', error);
    }
  }
}

export default CacheMiddleware;
