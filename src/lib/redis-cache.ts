// src/lib/redis-cache.ts
import { getRedisClient } from './redis-config';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class RedisCache {
  private static redis = getRedisClient();
  private static defaultTTL = 3600; // 1 hour default

  /**
   * Get a value from cache
   */
  static async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const value = await this.redis.get(fullKey);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error('Redis GET error:', error);
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
  ): Promise<void> {
    try {
      const { ttl = this.defaultTTL, prefix } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const serializedValue = JSON.stringify(value);

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
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
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
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
          return JSON.parse(value);
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Redis MGET error:', error);
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
      const pipeline = this.redis.pipeline();

      keyValuePairs.forEach(({ key, value }) => {
        const fullKey = prefix ? `${prefix}:${key}` : key;
        const serializedValue = JSON.stringify(value);
        
        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.error('Redis MSET error:', error);
    }
  }
}

// Cache key generators
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (filters: string) => `products:${filters}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  userOrders: (userId: string) => `orders:user:${userId}`,
  order: (id: string) => `order:${id}`,
  customerPricing: (email: string, productId: string) => `pricing:${email}:${productId}`,
  productSearch: (query: string) => `search:products:${query}`,
  cartSession: (sessionId: string) => `cart:${sessionId}`,
  userSession: (userId: string) => `session:${userId}`,
  supportTicket: (id: string) => `ticket:${id}`,
  chatSession: (sessionId: string) => `chat:${sessionId}`,
};

export default RedisCache;
