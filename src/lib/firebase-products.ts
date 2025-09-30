
// src/lib/firebase-products.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Product, ProductVariant, Category, ClientPriceOverride } from './firebase-types';
import CachedFirebaseService from './firebase-cache';
import { RedisCache} from './redis-cache';

// Product CRUD operations
export class ProductService {
  // Use cached version for reading products
  static async getProducts(options: {
    categoryId?: string;
    searchTerm?: string;
    pageSize?: number;
    lastDoc?: DocumentSnapshot;
  } = {}) {
    try {
      // Use cached service for better performance
      return await CachedFirebaseService.getProducts({
        categoryId: options.categoryId,
        searchTerm: options.searchTerm,
        limitCount: options.pageSize || 20,
        isActive: true
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Use cached version for single product
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      console.log(`🔍 [FIREBASE] Looking for product: ${productId}`);
      
      // First check Redis cache
      const cacheKey = `product:${productId}`;
      const cachedProduct = await RedisCache.get<Product>(cacheKey, 'products');
      
      if (cachedProduct) {
        console.log(`✅ [REDIS] Product found in cache: ${productId}`);
        return cachedProduct;
      }
      
      console.log(`❌ [REDIS] Product not in cache, fetching from Firebase: ${productId}`);
      
      // Fetch from Firebase if not in cache
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        console.log(`❌ [FIREBASE] Product not found in database: ${productId}`);
        return null;
      }
      
      const productData = {
        id: productDoc.id,
        ...productDoc.data()
      } as Product;
      
      console.log(`✅ [FIREBASE] Product fetched from database: ${productId}`);
      console.log(`📊 [FIREBASE] Product data: ${productData.name || 'Unknown Name'}`);
      
      // Cache the product for future requests
      await RedisCache.set(cacheKey, productData, { 
        ttl: 300, // 5 minutes
        prefix: 'products' 
      });
      
      console.log(`💾 [CACHE UPDATE] Product cached from Firebase to Redis: ${productId}`);
      
      return productData;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Invalidate cache after creation
      await RedisCache.deletePattern('products:*');
      await RedisCache.deletePattern('search:products:*');
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(productId: string, updates: Partial<Product>) {
    try {
      await updateDoc(doc(db, 'products', productId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      // Invalidate cache after update
      await CachedFirebaseService.invalidateProduct(productId);
      
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string) {
    try {
      await deleteDoc(doc(db, 'products', productId));
      
      // Invalidate cache after deletion
      await CachedFirebaseService.invalidateProduct(productId);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const variantsSnapshot = await getDocs(
        collection(db, 'products', productId, 'variants')
      );
      return variantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductVariant[];
    } catch (error) {
      console.error('Error fetching product variants:', error);
      throw error;
    }
  }
}

// Category service
export class CategoryService {
  // Use cached version for reading categories
  static async getCategories(): Promise<Category[]> {
    try {
      return await CachedFirebaseService.getCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async getCategory(categoryId: string): Promise<Category | null> {
    try {
      return await CachedFirebaseService.getCategory(categoryId);
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  static async createCategory(categoryData: Omit<Category, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
      });
      
      // Invalidate cache after creation
      await CachedFirebaseService.invalidateCategory(docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
}

// User-specific pricing service using subcollections
export class PricingService {
  static async getCustomPrice(
    userId: string, 
    productId: string
  ): Promise<number | null> {
    try {
      // Get custom price from user's customPricing subcollection
      const customPriceDoc = await getDoc(
        doc(db, 'users', userId, 'customPricing', productId)
      );
      
      if (customPriceDoc.exists()) {
        const data = customPriceDoc.data();
        return data.customPrice || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching custom price:', error);
      return null;
    }
  }

  static async setCustomPrice(
    userId: string,
    productId: string,
    customPrice: number,
    sku?: string,
    source?: string
  ) {
    try {
      const customPriceData = {
        productId,
        sku: sku || '',
        customPrice,
        source: source || 'manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(
        doc(db, 'users', userId, 'customPricing', productId), 
        customPriceData
      );
    } catch (error) {
      console.error('Error setting client price:', error);
      throw error;
    }
  }

  static async getEffectivePrice(
    userId: string,
    productId: string
  ): Promise<number> {
    try {
      // First try to get custom price from user's subcollection
      const customPrice = await this.getCustomPrice(userId, productId);
      if (customPrice !== null) {
        return customPrice;
      }

      // Fall back to base price
      const product = await ProductService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      return product.basePrice || 0;
    } catch (error) {
      console.error('Error getting effective price:', error);
      throw error;
    }
  }
}