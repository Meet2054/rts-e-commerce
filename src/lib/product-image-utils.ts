// src/lib/product-image-utils.ts
import { getProductImageUrl } from './firebase-storage';

/**
 * Cache for product image URLs to avoid repeated Firebase calls
 */
const imageUrlCache = new Map<string, string>();

/**
 * Get product image URL with caching
 */
export const getCachedProductImageUrl = async (sku: string): Promise<string> => {
  if (imageUrlCache.has(sku)) {
    return imageUrlCache.get(sku)!;
  }
  
  const imageUrl = await getProductImageUrl(sku);
  imageUrlCache.set(sku, imageUrl);
  
  return imageUrl;
};

/**
 * Get product image URL synchronously with Firebase Storage URL construction
 */
export const getProductImageUrlQuick = (sku: string | undefined | null): string => {
  // Handle undefined, null, or empty SKU
  if (!sku || typeof sku !== 'string') {
    console.warn('⚠️ [Product Image] Invalid SKU provided:', sku);
    return '/product.png';
  }
  
  // Check cache first
  if (imageUrlCache.has(sku)) {
    return imageUrlCache.get(sku)!;
  }
  
  // Return constructed Firebase Storage URL matching your structure
  // Your example: gs://rts-imaging-e-commerce.firebasestorage.app/products/47409.jpg
  const cleanSku = sku.trim();
  
  // Handle empty SKU after trimming
  if (!cleanSku) {
    console.warn('⚠️ [Product Image] Empty SKU after trimming:', sku);
    return '/product.png';
  }
  
  const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/products%2F${cleanSku}.jpg?alt=media`;
  
  // Cache the URL
  imageUrlCache.set(sku, firebaseUrl);
  
  return firebaseUrl;
};

/**
 * Handle image error by trying different extensions and fallback to default
 */
export const handleImageError = (sku: string | undefined | null, setImageUrl: (url: string) => void): void => {
  // Handle undefined, null, or empty SKU
  if (!sku || typeof sku !== 'string') {
    console.warn('⚠️ [Product Image Error Handler] Invalid SKU provided:', sku);
    setImageUrl('/product.png');
    return;
  }
  
  const cleanSku = sku.trim(); // Use SKU directly
  
  // Handle empty SKU after trimming
  if (!cleanSku) {
    console.warn('⚠️ [Product Image Error Handler] Empty SKU after trimming:', sku);
    setImageUrl('/product.png');
    return;
  }
  
  const extensions = ['png', 'jpeg', 'webp'];
  
  // Try other extensions
  let extensionIndex = 0;
  
  const tryNextExtension = () => {
    if (extensionIndex < extensions.length) {
      const ext = extensions[extensionIndex];
      const url = `https://firebasestorage.googleapis.com/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/products%2F${cleanSku}.${ext}?alt=media`;
      
      // Test if image exists
      const img = new Image();
      img.onload = () => {
        setImageUrl(url);
        imageUrlCache.set(sku, url);
      };
      img.onerror = () => {
        extensionIndex++;
        tryNextExtension();
      };
      img.src = url;
    } else {
      // All extensions failed, use default
      setImageUrl('/product.png');
      imageUrlCache.set(sku, '/product.png');
    }
  };
  
  tryNextExtension();
};

/**
 * Preload product images for better UX
 */
export const preloadProductImages = (skus: string[]): void => {
  skus.forEach(sku => {
    const imageUrl = getProductImageUrlQuick(sku);
    
    // Preload image
    const img = new Image();
    img.src = imageUrl;
  });
};

/**
 * Clear image cache (useful for testing or after updates)
 */
export const clearImageCache = (): void => {
  imageUrlCache.clear();
};