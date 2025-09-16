// src/lib/firebase-cache.ts
import {
  collection,
  getDocs,
  doc,
  getDoc,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  query as firestoreQuery,
  where as firestoreWhere,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase-config';
import { RedisCache, CacheKeys } from './redis-cache';
import { Product, Category, Order } from './firebase-types';

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  PRODUCTS: 1800, // 30 minutes
  CATEGORIES: 3600, // 1 hour
  ORDERS: 900, // 15 minutes
  USER_DATA: 600, // 10 minutes
  SEARCH_RESULTS: 1800, // 30 minutes
  PRICING: 1800, // 30 minutes
};

export class CachedFirebaseService {
  
  /**
   * Get product by ID with caching
   */
  static async getProduct(productId: string): Promise<Product | null> {
    return await RedisCache.getOrSet(
      CacheKeys.product(productId),
      async () => {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Product;
        }
        return null;
      },
      { ttl: CACHE_TTL.PRODUCTS }
    );
  }

  /**
   * Get multiple products with caching
   */
  static async getProducts(
    filters: {
      categoryId?: string;
      brandId?: string;
      searchTerm?: string;
      isActive?: boolean;
      limitCount?: number;
    } = {}
  ): Promise<Product[]> {
    const cacheKey = CacheKeys.products(JSON.stringify(filters));
    
    const result = await RedisCache.getOrSet(
      cacheKey,
      async () => {
        const productQuery = collection(db, 'products');
        const queryConstraints: any[] = [];

        if (filters.categoryId) {
          queryConstraints.push(firestoreWhere('categoryId', '==', filters.categoryId));
        }
        
        if (filters.brandId) {
          queryConstraints.push(firestoreWhere('brandId', '==', filters.brandId));
        }

        if (filters.isActive !== undefined) {
          queryConstraints.push(firestoreWhere('active', '==', filters.isActive));
        }

        queryConstraints.push(firestoreOrderBy('createdAt', 'desc'));

        if (filters.limitCount) {
          queryConstraints.push(firestoreLimit(filters.limitCount));
        }

        const q = firestoreQuery(productQuery, ...queryConstraints);
        const querySnapshot = await getDocs(q);

        let products: Product[] = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          products.push({ id: doc.id, ...docData } as Product);
        });

        // Filter by search term if provided
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          products = products.filter(product => 
            product.name?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm)
          );
        }

        return products;
      },
      { ttl: CACHE_TTL.PRODUCTS }
    );

    return result || [];
  }

  /**
   * Get category by ID with caching
   */
  static async getCategory(categoryId: string): Promise<Category | null> {
    return await RedisCache.getOrSet(
      CacheKeys.category(categoryId),
      async () => {
        const docRef = doc(db, 'categories', categoryId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Category;
        }
        return null;
      },
      { ttl: CACHE_TTL.CATEGORIES }
    );
  }

  /**
   * Get all categories with caching
   */
  static async getCategories(): Promise<Category[]> {
    const result = await RedisCache.getOrSet(
      CacheKeys.categories(),
      async () => {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categories: Category[] = [];
        
        querySnapshot.forEach((doc) => {
          categories.push({ id: doc.id, ...doc.data() } as Category);
        });

        return categories;
      },
      { ttl: CACHE_TTL.CATEGORIES }
    );

    return result || [];
  }

  /**
   * Get user orders with caching
   */
  static async getUserOrders(
    userEmail: string, 
    limitCount: number = 10
  ): Promise<Order[]> {
    const result = await RedisCache.getOrSet(
      CacheKeys.userOrders(userEmail),
      async () => {
        const q = firestoreQuery(
          collection(db, 'orders'),
          firestoreWhere('clientEmail', '==', userEmail),
          firestoreOrderBy('createdAt', 'desc'),
          firestoreLimit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          orders.push({ id: doc.id, ...docData } as Order);
        });

        return orders;
      },
      { ttl: CACHE_TTL.ORDERS }
    );

    return result || [];
  }

  /**
   * Get single order with caching
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    return await RedisCache.getOrSet(
      CacheKeys.order(orderId),
      async () => {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Order;
        }
        return null;
      },
      { ttl: CACHE_TTL.ORDERS }
    );
  }

  /**
   * Search products with caching
   */
  static async searchProducts(
    searchTerm: string,
    filters: {
      categoryId?: string;
      brandId?: string;
      minPrice?: number;
      maxPrice?: number;
      limitCount?: number;
    } = {}
  ): Promise<Product[]> {
    const cacheKey = CacheKeys.productSearch(`${searchTerm}:${JSON.stringify(filters)}`);
    
    const result = await RedisCache.getOrSet(
      cacheKey,
      async () => {
        // Get all products and filter them
        // Note: Firebase doesn't support full-text search natively
        const products = await this.getProducts({
          categoryId: filters.categoryId,
          brandId: filters.brandId,
          isActive: true,
          limitCount: filters.limitCount || 50
        });

        const searchTermLower = searchTerm.toLowerCase();
        let filteredProducts = products.filter(product => 
          product.name?.toLowerCase().includes(searchTermLower) ||
          product.description?.toLowerCase().includes(searchTermLower) ||
          product.sku?.toLowerCase().includes(searchTermLower) ||
          product.brand?.toLowerCase().includes(searchTermLower)
        );

        // Apply price filters - using basePrice or price property
        if (filters.minPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => 
            (p as any).price >= filters.minPrice! || (p as any).basePrice >= filters.minPrice!
          );
        }
        
        if (filters.maxPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => 
            (p as any).price <= filters.maxPrice! || (p as any).basePrice <= filters.maxPrice!
          );
        }

        return filteredProducts.slice(0, filters.limitCount || 20);
      },
      { ttl: CACHE_TTL.SEARCH_RESULTS }
    );

    return result || [];
  }

  /**
   * Cache invalidation methods
   */
  static async invalidateProduct(productId: string): Promise<void> {
    await RedisCache.delete(CacheKeys.product(productId));
    // Also clear related product lists
    await RedisCache.deletePattern('products:*');
    await RedisCache.deletePattern('search:products:*');
  }

  static async invalidateCategory(categoryId: string): Promise<void> {
    await RedisCache.delete(CacheKeys.category(categoryId));
    await RedisCache.delete(CacheKeys.categories());
    // Also clear product lists that might be affected
    await RedisCache.deletePattern('products:*');
  }

  static async invalidateUserOrders(userEmail: string): Promise<void> {
    await RedisCache.delete(CacheKeys.userOrders(userEmail));
  }

  static async invalidateOrder(orderId: string): Promise<void> {
    await RedisCache.delete(CacheKeys.order(orderId));
  }

  /**
   * Batch cache operations
   */
  static async preloadProducts(productIds: string[]): Promise<void> {
    const uncachedIds: string[] = [];
    
    // Check which products are not in cache
    for (const id of productIds) {
      const exists = await RedisCache.exists(CacheKeys.product(id));
      if (!exists) {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length === 0) return;

    // Fetch uncached products
    const products: { key: string; value: any }[] = [];
    
    for (const id of uncachedIds) {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          products.push({
            key: CacheKeys.product(id),
            value: { id: docSnap.id, ...docSnap.data() }
          });
        }
      } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
      }
    }

    // Batch cache the products
    if (products.length > 0) {
      await RedisCache.mset(products, { ttl: CACHE_TTL.PRODUCTS });
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalKeys: number;
    productKeys: number;
    categoryKeys: number;
    orderKeys: number;
  }> {
    try {
      const redis = RedisCache['redis'];
      const allKeys = await redis.keys('*');
      
      return {
        totalKeys: allKeys.length,
        productKeys: allKeys.filter(key => key.startsWith('product:')).length,
        categoryKeys: allKeys.filter(key => key.startsWith('category') || key === 'categories:all').length,
        orderKeys: allKeys.filter(key => key.startsWith('order')).length,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalKeys: 0, productKeys: 0, categoryKeys: 0, orderKeys: 0 };
    }
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    try {
      const redis = RedisCache['redis'];
      await redis.flushdb();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default CachedFirebaseService;
