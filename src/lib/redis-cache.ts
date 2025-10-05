// src/lib/redis-cache.ts
import { getRedisClient } from './redis-config';
import { adminLogger, LogCategory } from './admin-logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class RedisCache {
  private static redis = getRedisClient();
  private static defaultTTL = 3600; // 1 hour default
  private static isEnabled = true;

  /**
   * Check if Redis is available and enabled
   */
  private static async checkHealth(): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      // Quick health check
      await this.redis.ping();
      return true;
    } catch (error) {
      console.warn('⚠️ [REDIS] Health check failed, disabling cache:', 
        error instanceof Error ? error.message : 'Unknown error');
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  static async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    try {
      if (!await this.checkHealth()) return null;
      
      const fullKey = prefix ? `${prefix}:${key}` : key;
      adminLogger.debug(LogCategory.CACHE, `🔍 [REDIS] Attempting to fetch from cache: ${fullKey}`);
      
      const rawValue = await this.redis.get(fullKey);
      
      if (rawValue === null || rawValue === undefined) {
        adminLogger.debug(LogCategory.CACHE, `❌ [REDIS] Cache MISS - Key not found: ${fullKey}`);
        return null;
      }

      adminLogger.debug(LogCategory.CACHE, `✅ [REDIS] Cache HIT - Data found in Redis: ${fullKey}`);
      
      // Handle different types of responses from Upstash Redis
      if (typeof rawValue === 'string') {
        try {
          const parsed = JSON.parse(rawValue);
          adminLogger.debug(LogCategory.CACHE, 'Parsed JSON data from cache', {
            key: fullKey,
            dataSize: `${rawValue.length} chars`
          });
          return parsed;
        } catch (parseError) {
          adminLogger.warn(LogCategory.CACHE, 'Failed to parse JSON from cache', {
            key: fullKey,
            error: parseError instanceof Error ? parseError.message : 'Unknown error'
          });
          // Return raw value if JSON parsing fails
          return rawValue as T;
        }
      } else {
        // Return as-is (likely a string or primitive)
        adminLogger.debug(LogCategory.CACHE, 'Direct object return from cache', {
          key: fullKey,
          dataType: typeof rawValue
        });
        return rawValue as T;
      }
    } catch (error) {
      console.error('❌ [REDIS] GET error:', 
        error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  static async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      if (!await this.checkHealth()) return false;
      
      const { ttl = this.defaultTTL, prefix } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const serializedValue = JSON.stringify(value);

      adminLogger.debug(LogCategory.CACHE, 'Caching data to Redis', {
        key: fullKey,
        dataSize: `${serializedValue.length} characters`,
        ttl: ttl > 0 ? `${ttl}s` : 'no expiration'
      });
      
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
        adminLogger.debug(LogCategory.CACHE, 'Successfully cached with TTL', {
          key: fullKey,
          ttl: `${ttl}s`
        });
      } else {
        await this.redis.set(fullKey, serializedValue);
        adminLogger.debug(LogCategory.CACHE, 'Successfully cached (no expiration)', {
          key: fullKey
        });
      }      return true;
    } catch (error) {
      console.error('❌ [REDIS] SET error:', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  static async delete(key: string, prefix?: string): Promise<void> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      await this.redis.del(fullKey);
    } catch (error) {
      console.error('Redis DELETE error:', error);
    }
  }

  /**
   * Delete multiple keys with pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      // Note: Upstash Redis REST API doesn't support KEYS command
      // This is a limitation we'll need to work around by tracking keys manually
      console.warn('⚠️ [REDIS] DELETE PATTERN not supported by Upstash REST API');
      console.warn('⚠️ [REDIS] Consider using key tracking or prefixed deletions instead');
    } catch (error) {
      console.error('❌ [REDIS] DELETE PATTERN error:', error);
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - cache-aside pattern
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options.prefix);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch and cache the result
      const fresh = await fetcher();
      if (fresh !== null) {
        await this.set(key, fresh, options);
      }

      return fresh;
    } catch (error) {
      console.error('Redis GET_OR_SET error:', error);
      // Fallback to direct fetch if cache fails
      try {
        return await fetcher();
      } catch (fetchError) {
        console.error('Fetcher error:', fetchError);
        return null;
      }
    }
  }

  /**
   * Increment a counter
   */
  static async increment(key: string, by: number = 1, prefix?: string): Promise<number> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      return await this.redis.incrby(fullKey, by);
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return 0;
    }
  }

  /**
   * Set expiration on existing key
   */
  static async expire(key: string, ttl: number, prefix?: string): Promise<void> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      await this.redis.expire(fullKey, ttl);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
    }
  }

  /**
   * Get multiple keys at once
   */
  static async mget<T = any>(keys: string[], prefix?: string): Promise<(T | null)[]> {
    try {
      const fullKeys = prefix ? keys.map(key => `${prefix}:${key}`) : keys;
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          if (typeof value === 'string') {
            return JSON.parse(value);
          } else {
            return value as T;
          }
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('❌ [REDIS] MGET error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  static async mset(
    keyValuePairs: { key: string; value: any }[],
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { prefix, ttl = this.defaultTTL } = options;
      
      // Upstash Redis doesn't support pipeline the same way
      // Execute operations in parallel instead
      const promises = keyValuePairs.map(async ({ key, value }) => {
        const fullKey = prefix ? `${prefix}:${key}` : key;
        const serializedValue = JSON.stringify(value);
        
        if (ttl > 0) {
          return this.redis.setex(fullKey, ttl, serializedValue);
        } else {
          return this.redis.set(fullKey, serializedValue);
        }
      });

      await Promise.all(promises);
            adminLogger.debug(LogCategory.CACHE, 'Successfully set multiple keys', {
        keyCount: keyValuePairs.length
      });
      return true;
    } catch (error) {
      console.error('❌ [REDIS] MSET error:', error);
    }
  }
}

// Cache key generators with optimized patterns
export const CacheKeys = {
  // Products cache - shorter TTL for frequent updates
  product: (id: string) => `product:${id}`,
  products: (filters: string) => `products:${filters}`,
  productsList: (searchTerm: string, limit: number, page?: number) => 
    `products-list:${searchTerm || 'all'}:${limit}${page ? `:page:${page}` : ''}`,
  
  // Categories cache - longer TTL as they change less frequently
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  
  // User-specific caches - medium TTL
  userOrders: (userId: string) => `orders:user:${userId}`,
  userProfile: (userId: string) => `profile:${userId}`,
  userSession: (userId: string) => `session:${userId}`,
  
  // Order caches - medium TTL
  order: (id: string) => `order:${id}`,
  ordersList: (filters?: string) => `orders:list${filters ? `:${filters}` : ''}`,
  
  // Cart caches - shorter TTL as they change frequently
  cartSession: (sessionId: string) => `cart:${sessionId}`,
  cartUser: (userId: string) => `cart:user:${userId}`,
  
  // Pricing caches - medium TTL
  customerPricing: (email: string, productId: string) => `pricing:${email}:${productId}`,
  pricingSheet: (sheetId: string) => `pricing:sheet:${sheetId}`,
  
  // Search caches - shorter TTL
  productSearch: (query: string) => `search:products:${query}`,
  searchSuggestions: (partial: string) => `search:suggestions:${partial}`,
  
  // Support and chat caches - medium TTL
  supportTicket: (id: string) => `ticket:${id}`,
  chatSession: (sessionId: string) => `chat:${sessionId}`,
  chatHistory: (userId: string) => `chat:history:${userId}`,
  
  // Analytics and stats - longer TTL
  analyticsDaily: (date: string) => `analytics:daily:${date}`,
  salesStats: (period: string) => `sales:stats:${period}`,
  popularProducts: (period: string) => `popular:products:${period}`
};

// Optimized TTL settings (in seconds)
export const CacheTTL = {
  // Very short - for frequently changing data
  VERY_SHORT: 60,      // 1 minute
  SHORT: 180,          // 3 minutes
  
  // Medium - for moderate changes
  MEDIUM: 900,         // 15 minutes
  STANDARD: 1800,      // 30 minutes
  
  // Long - for stable data
  LONG: 3600,          // 1 hour
  VERY_LONG: 7200,     // 2 hours
  
  // Specific use cases
  PRODUCTS_LIST: 300,   // 5 minutes - products change occasionally
  CATEGORIES: 1800,     // 30 minutes - categories rarely change
  CART: 1800,          // 30 minutes - cart session timeout
  USER_SESSION: 3600,   // 1 hour - user session
  PRICING: 900,        // 15 minutes - pricing might change
  SEARCH: 300,         // 5 minutes - search results
  ORDERS: 1800,        // 30 minutes - orders don't change often once created
  ANALYTICS: 3600      // 1 hour - analytics can be slightly stale
};

export default RedisCache;
