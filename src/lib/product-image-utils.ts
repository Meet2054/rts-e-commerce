// src/lib/product-image-utils.ts
import { getProductImageWithFallback } from './firebase-storage';

/**
 * Cache for product image URLs to avoid repeated Firebase calls
 */
const imageUrlCache = new Map<string, string>();

/**
 * Get product image URL with caching and Katun PN fallback
 */
export const getCachedProductImageUrl = async (sku: string, katunPn?: string): Promise<string> => {
  const cacheKey = katunPn ? `${sku}|${katunPn}` : sku;
  
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }
  
  const imageUrl = await getProductImageWithFallback(sku, katunPn);
  imageUrlCache.set(cacheKey, imageUrl);
  
  return imageUrl;
};

/**
 * Get product image URL synchronously with Firebase Storage URL construction and Katun PN fallback
 */
export const getProductImageUrlQuick = (sku: string | undefined | null, katunPn?: string | number | null): string => {
  // Handle undefined, null, or empty SKU
  if (!sku || typeof sku !== 'string') {
    console.warn('⚠️ [Product Image] Invalid SKU provided:', sku);
    return '';
  }
  
  const cacheKey = katunPn ? `${sku}|${katunPn}` : sku;
  
  // Check cache first
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }
  
  const cleanSku = sku.trim();
  
  // Handle empty SKU after trimming
  if (!cleanSku) {
    console.warn('⚠️ [Product Image] Empty SKU after trimming:', sku);
    return '';
  }
  
  // Try SKU first, then Katun PN if available
  let firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/products%2F${cleanSku}.jpg?alt=media`;
  
  // If we have Katun PN, prioritize it since your images might be stored by Katun PN
  if (katunPn) {
    const cleanKatunPn = katunPn.toString().trim();
    firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/products%2F${cleanKatunPn}.jpg?alt=media`;
    console.log(`🔍 [Product Image] Using Katun PN for image URL: ${cleanKatunPn}`);
  } else {
    console.log(`🔍 [Product Image] Using SKU for image URL: ${cleanSku}`);
  }
  
  // Cache the URL (Note: This is optimistic caching)
  imageUrlCache.set(cacheKey, firebaseUrl);
  
  return firebaseUrl;
};

/**
 * Handle image error by trying different extensions and fallback to Katun PN then default
 */
export const handleImageError = (
  sku: string | undefined | null, 
  setImageUrl: (url: string) => void, 
  katunPn?: string | number | null
): void => {
  // Handle undefined, null, or empty SKU
  if (!sku || typeof sku !== 'string') {
    console.warn('⚠️ [Product Image Error Handler] Invalid OEM PN provided:', sku);
    setImageUrl('');
    return;
  }
  
  const cleanSku = sku.trim(); // Use SKU directly
  const cleanKatunPn = katunPn ? katunPn.toString().trim() : null;
  const cacheKey = katunPn ? `${sku}|${katunPn}` : sku;
  
  // Handle empty SKU after trimming
  if (!cleanSku) {
    console.warn('⚠️ [Product Image Error Handler] Empty OEM PN after trimming:', sku);
    setImageUrl('');
    return;
  }
  
  const extensions = ['png', 'jpeg', 'webp'];
  let extensionIndex = 0;
  let tryingKatunPn = false;
  
  const tryNextExtension = () => {
    if (extensionIndex < extensions.length) {
      const ext = extensions[extensionIndex];
      const currentIdentifier = tryingKatunPn ? cleanKatunPn : cleanSku;
      const url = `https://firebasestorage.googleapis.com/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/products%2F${currentIdentifier}.${ext}?alt=media`;
      
      // Test if image exists
      const img = new Image();
      img.onload = () => {
        setImageUrl(url);
        imageUrlCache.set(cacheKey, url);
        console.log(`✅ [Product Image Error Handler] Found image using ${tryingKatunPn ? 'Katun PN' : 'SKU'}: ${currentIdentifier} with extension: ${ext}`);
      };
      img.onerror = () => {
        extensionIndex++;
        tryNextExtension();
      };
      img.src = url;
    } else if (!tryingKatunPn && cleanKatunPn) {
      // If SKU failed and we have Katun PN, try with Katun PN
      console.log(`🔍 [Product Image Error Handler] SKU extensions failed, trying Katun PN: ${cleanKatunPn}`);
      tryingKatunPn = true;
      extensionIndex = 0;
      tryNextExtension();
    } else {
      // All extensions and both identifiers failed, mark as not available
      console.log(`⚠️ [Product Image Error Handler] All attempts failed for SKU: ${sku}${cleanKatunPn ? ` and Katun PN: ${cleanKatunPn}` : ''}`);
      setImageUrl('');
      imageUrlCache.set(cacheKey, '');
    }
  };
  
  tryNextExtension();
};

/**
 * Preload product images for better UX with optional Katun PN support
 */
export const preloadProductImages = (products: Array<{ sku: string; katunPn?: string | number }>): void => {
  products.forEach(product => {
    const imageUrl = getProductImageUrlQuick(product.sku, product.katunPn);
    
    // Preload image
    const img = new Image();
    img.src = imageUrl;
  });
};

/**
 * Product interface for image utilities
 */
interface ProductForImage {
  sku?: string;
  katunPn?: string | number;
  [key: string]: unknown;
}

/**
 * Get product image URL from product object with intelligent fallback
 * This is a convenience function that extracts SKU and Katun PN from product objects
 */
export const getProductImageFromObject = async (product: ProductForImage): Promise<string> => {
  const sku = product.sku || '';
  const katunPn = product.katunPn;
  
  if (!sku) {
    console.warn('⚠️ [Product Image] Product object missing SKU:', product);
    return '';
  }
  
  return getCachedProductImageUrl(sku, katunPn?.toString());
};

/**
 * Get product image URL synchronously from product object
 * This is a convenience function that extracts SKU and Katun PN from product objects
 */
export const getProductImageFromObjectQuick = (product: ProductForImage): string => {
  const sku = product.sku || '';
  const katunPn = product.katunPn;
  
  if (!sku) {
    console.warn('⚠️ [Product Image] Product object missing SKU:', product);
    return '';
  }
  
  return getProductImageUrlQuick(sku, katunPn);
};

/**
 * Clear image cache (useful for testing or after updates)
 */
export const clearImageCache = (): void => {
  imageUrlCache.clear();
};