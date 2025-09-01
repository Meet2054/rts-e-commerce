
// src/lib/firebase-products.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Product, ProductVariant, Category, ClientPriceOverride } from './firebase-types';

// Product CRUD operations
export class ProductService {
  static async getProducts(options: {
    categoryId?: string;
    searchTerm?: string;
    pageSize?: number;
    lastDoc?: DocumentSnapshot;
  } = {}) {
    try {
      let q = query(
        collection(db, 'products'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );

      if (options.categoryId) {
        q = query(q, where('categoryId', '==', options.categoryId));
      }

      if (options.pageSize) {
        q = query(q, limit(options.pageSize));
      }

      if (options.lastDoc) {
        q = query(q, startAfter(options.lastDoc));
      }

      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      return {
        products,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === (options.pageSize || 20)
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getProduct(productId: string): Promise<Product | null> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        return { id: productId, ...productDoc.data() } as Product;
      }
      return null;
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
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string) {
    try {
      await deleteDoc(doc(db, 'products', productId));
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
  static async getCategories(): Promise<Category[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'categories'), orderBy('name'))
      );
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async createCategory(categoryData: Omit<Category, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
}

// Price override service
export class PricingService {
  static async getClientPrice(
    clientId: string, 
    productId: string, 
    variantId?: string
  ): Promise<number | null> {
    try {
      const compositeId = variantId 
        ? `${clientId}_${productId}_${variantId}`
        : `${clientId}_${productId}`;

      const priceDoc = await getDoc(doc(db, 'clientPriceOverrides', compositeId));
      
      if (priceDoc.exists()) {
        const data = priceDoc.data() as ClientPriceOverride;
        // Check if price is still valid
        if (!data.effectiveTo || data.effectiveTo.toDate() > new Date()) {
          return data.price;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching client price:', error);
      return null;
    }
  }

  static async setClientPrice(override: Omit<ClientPriceOverride, 'id' | 'createdAt'>) {
    try {
      const compositeId = override.variantId 
        ? `${override.clientId}_${override.productId}_${override.variantId}`
        : `${override.clientId}_${override.productId}`;

      await setDoc(doc(db, 'clientPriceOverrides', compositeId), {
        ...override,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting client price:', error);
      throw error;
    }
  }

  static async getEffectivePrice(
    clientId: string,
    productId: string,
    variantId?: string
  ): Promise<number> {
    try {
      // First try to get custom price
      const customPrice = await this.getClientPrice(clientId, productId, variantId);
      if (customPrice !== null) {
        return customPrice;
      }

      // Fall back to base price
      const product = await ProductService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let basePrice = product.basePrice;

      // Add variant price if applicable
      if (variantId) {
        const variants = await ProductService.getProductVariants(productId);
        const variant = variants.find(v => v.id === variantId);
        if (variant && variant.basePrice) {
          basePrice = variant.basePrice;
        }
      }

      return basePrice;
    } catch (error) {
      console.error('Error getting effective price:', error);
      throw error;
    }
  }
}