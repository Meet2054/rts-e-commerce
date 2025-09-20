// src/lib/cache-warming.ts
import { RedisCache } from './redis-cache';
import { adminDb } from './firebase-admin';

export class CacheWarmingService {
  private static isWarming = false;
  private static lastWarmTime = 0;
  private static warmingInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Warm up critical cache data
   */
  static async warmCache(force = false): Promise<void> {
    // Prevent concurrent warming
    if (this.isWarming && !force) {
      console.log('⏳ [CACHE WARM] Already in progress, skipping...');
      return;
    }

    // Check if recently warmed (unless forced)
    const now = Date.now();
    if (!force && (now - this.lastWarmTime) < this.warmingInterval) {
      console.log('⏳ [CACHE WARM] Recently warmed, skipping...');
      return;
    }

    this.isWarming = true;
    console.log('🔥 [CACHE WARM] Starting cache warming process...');

    try {
      await Promise.all([
        this.warmProducts(),
        this.warmCategories(),
        this.warmCommonSearches()
      ]);

      this.lastWarmTime = now;
      console.log('✅ [CACHE WARM] Cache warming completed successfully');
    } catch (error) {
      console.error('❌ [CACHE WARM] Cache warming failed:', 
        error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm products cache
   */
  private static async warmProducts(): Promise<void> {
    try {
      console.log('📦 [CACHE WARM] Warming products cache...');
      
      const cacheKey = 'products-list:all:200';
      
      // Check if already cached
      const existing = await RedisCache.get(cacheKey, 'api');
      if (existing) {
        console.log('✅ [CACHE WARM] Products already cached, refreshing...');
      }

      const productsSnapshot = await adminDb.collection('products')
        .where('isActive', '==', true)
        .limit(200)
        .get();

      const products = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sku: data.sku,
          name: data.name,
          description: data.description || '',
          brand: data.brand || '',
          price: data.price || 0,
          image: data.image || data.imageUrl || '/product-placeholder.png',
          imageUrl: data.imageUrl || data.image || '/product-placeholder.png',
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          oem: data.oem || '',
          oemPN: data.oemPN || '',
          katunPN: data.katunPN || '',
          comments: data.comments || '',
          forUseIn: data.forUseIn || '',
          sourceSheet: data.sourceSheet || '',
          isActive: data.isActive,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });

      // Cache with shorter TTL for frequent refresh
      await RedisCache.set(cacheKey, products, { 
        ttl: 300, // 5 minutes
        prefix: 'api' 
      });

      console.log(`✅ [CACHE WARM] Cached ${products.length} products`);
    } catch (error) {
      console.error('❌ [CACHE WARM] Failed to warm products cache:', 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Warm categories cache
   */
  private static async warmCategories(): Promise<void> {
    try {
      console.log('🗂️ [CACHE WARM] Warming categories cache...');
      
      const categoriesSnapshot = await adminDb.collection('categories')
        .limit(50)
        .get();

      if (categoriesSnapshot.empty) {
        console.log('⚠️ [CACHE WARM] No categories found, creating placeholder cache');
        await RedisCache.set('categories:all', [], { 
          ttl: 600, 
          prefix: 'api' 
        });
        return;
      }

      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      await RedisCache.set('categories:all', categories, { 
        ttl: 600, // 10 minutes
        prefix: 'api' 
      });

      console.log(`✅ [CACHE WARM] Cached ${categories.length} categories`);
    } catch (error) {
      console.warn('⚠️ [CACHE WARM] Categories warming failed (collection might not exist):', 
        error instanceof Error ? error.message : 'Unknown error');
      
      // Set empty cache to prevent repeated Firebase calls
      await RedisCache.set('categories:all', [], { 
        ttl: 300, 
        prefix: 'api' 
      });
    }
  }

  /**
   * Pre-warm common search results
   */
  private static async warmCommonSearches(): Promise<void> {
    try {
      console.log('🔍 [CACHE WARM] Warming common search results...');
      
      const commonTerms = ['printer', 'hp', 'canon', 'epson', 'laser', 'inkjet', 'toner'];
      
      // Get all products first
      const allProductsKey = 'products-list:all:200';
      let allProducts = await RedisCache.get(allProductsKey, 'api');
      
      if (!allProducts) {
        console.log('⚠️ [CACHE WARM] All products not cached, skipping search warming');
        return;
      }

      for (const term of commonTerms) {
        const searchKey = `products-list:${term}:200`;
        
        // Filter products by search term
        const filteredProducts = allProducts.filter((product: any) => 
          product.name?.toLowerCase().includes(term.toLowerCase()) ||
          product.sku?.toLowerCase().includes(term.toLowerCase()) ||
          product.brand?.toLowerCase().includes(term.toLowerCase()) ||
          product.description?.toLowerCase().includes(term.toLowerCase()) ||
          product.oem?.toLowerCase().includes(term.toLowerCase())
        );

        // Cache search results
        await RedisCache.set(searchKey, filteredProducts, { 
          ttl: 180, // 3 minutes
          prefix: 'api' 
        });

        console.log(`🔍 [CACHE WARM] Cached search "${term}": ${filteredProducts.length} results`);
      }

      console.log(`✅ [CACHE WARM] Warmed ${commonTerms.length} common searches`);
    } catch (error) {
      console.error('❌ [CACHE WARM] Failed to warm search cache:', 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Clear all cache (useful for cache invalidation)
   */
  static async clearCache(): Promise<void> {
    console.log('🧹 [CACHE CLEAR] Starting cache clear process...');
    
    try {
      // List of known cache prefixes and patterns
      const cacheKeys = [
        'api:products-list:all:200',
        'api:categories:all',
        'api:products-list:printer:200',
        'api:products-list:hp:200',
        'api:products-list:canon:200',
        'api:products-list:epson:200',
        'api:products-list:laser:200',
        'api:products-list:inkjet:200',
        'api:products-list:toner:200'
      ];

      for (const key of cacheKeys) {
        await RedisCache.delete(key);
      }

      console.log('✅ [CACHE CLEAR] Cache cleared successfully');
    } catch (error) {
      console.error('❌ [CACHE CLEAR] Failed to clear cache:', 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    products: boolean;
    categories: boolean;
    searches: Record<string, boolean>;
  }> {
    const stats = {
      products: false,
      categories: false,
      searches: {} as Record<string, boolean>
    };

    try {
      // Check products cache
      const products = await RedisCache.get('products-list:all:200', 'api');
      stats.products = !!products;

      // Check categories cache
      const categories = await RedisCache.get('categories:all', 'api');
      stats.categories = !!categories;

      // Check common searches
      const commonTerms = ['printer', 'hp', 'canon', 'epson', 'laser'];
      for (const term of commonTerms) {
        const searchResults = await RedisCache.get(`products-list:${term}:200`, 'api');
        stats.searches[term] = !!searchResults;
      }
    } catch (error) {
      console.error('❌ [CACHE STATS] Failed to get cache stats:', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    return stats;
  }
}

export default CacheWarmingService;