// src/lib/firebase-storage.ts
import { storage } from './firebase-config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Storage bucket reference
const STORAGE_BUCKET = 'gs://rts-imaging-e-commerce.firebasestorage.app';

/**
 * Upload product image to Firebase Storage with SKU as filename
 */
export const uploadProductImage = async (file: File, sku: string): Promise<string> => {
  try {
    // Use SKU directly as filename (matching your existing structure: 47409.jpg)
    const cleanSku = sku.trim();
    
    // Debug: Check if storage is properly initialized
    console.log(`📁 [Storage] Storage instance:`, storage);
    console.log(`📁 [Storage] Storage app:`, storage.app.name);
    
    // Always use .jpg extension to match your existing structure
    const storageRef = ref(storage, `products/${cleanSku}.jpg`);
    
    console.log(`📁 [Storage] Storage reference path:`, storageRef.fullPath);
    console.log(`📁 [Storage] Uploading image for SKU: ${sku} as ${cleanSku}.jpg`);
    console.log(`📁 [Storage] File details:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ [Storage] Image uploaded successfully for SKU: ${sku}`);
    console.log(`🔗 [Storage] Download URL: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error(`❌ [Storage] Error uploading image for SKU ${sku}:`, error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      const firebaseError = error as { code?: string; message: string };
      console.error(`❌ [Storage] Error code:`, firebaseError.code);
      console.error(`❌ [Storage] Error message:`, error.message);
      console.error(`❌ [Storage] Full error:`, error);
    }
    
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get product image URL from Firebase Storage based on SKU
 */
export const getProductImageUrl = async (sku: string): Promise<string> => {
  try {
    // Use SKU directly (matching your structure: 47409.jpg)
    const cleanSku = sku.trim();
    
    // Try .jpg first (your primary format), then other extensions as fallback
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
      try {
        const storageRef = ref(storage, `products/${cleanSku}.${ext}`);
        const downloadURL = await getDownloadURL(storageRef);
        
        console.log(`✅ [Storage] Found image for SKU: ${sku} with extension: ${ext}`);
        return downloadURL;
      } catch {
        // Continue to next extension if this one fails
        continue;
      }
    }
    
    // If no image found, return default
    console.log(`⚠️ [Storage] No image found for SKU: ${sku}, using default`);
    return '/product.png';
  } catch (error) {
    console.error(`❌ [Storage] Error getting image for SKU ${sku}:`, error);
    return '/product.png';
  }
};

/**
 * Get product image URL synchronously (for immediate use) with fallback
 */
export const getProductImageUrlSync = (sku: string): string => {
  // Clean SKU for filename
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  // Construct Firebase Storage public URL
  // Note: This assumes the file exists as .jpg - you might need to adjust
  const storageUrl = `https://firebasestorage.googleapis.com/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/products%2F${cleanSku}.jpg?alt=media`;
  
  return storageUrl;
};

/**
 * Delete product image from Firebase Storage
 */
export const deleteProductImage = async (sku: string): Promise<void> => {
  try {
    const cleanSku = sku.trim();
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
      try {
        const storageRef = ref(storage, `products/${cleanSku}.${ext}`);
        await deleteObject(storageRef);
        console.log(`✅ [Storage] Deleted image for SKU: ${sku} with extension: ${ext}`);
        return;
      } catch {
        // Continue to next extension if this one fails
        continue;
      }
    }
    
    console.log(`⚠️ [Storage] No image found to delete for SKU: ${sku}`);
  } catch (error) {
    console.error(`❌ [Storage] Error deleting image for SKU ${sku}:`, error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload multiple product images (for future use)
 */
export const uploadMultipleProductImages = async (files: File[], sku: string): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) => {
      const cleanSku = sku.trim();
      // Use .jpg extension and simple numbering for multiple images
      const filename = index === 0 ? `${cleanSku}.jpg` : `${cleanSku}_${index + 1}.jpg`;
      
      const storageRef = ref(storage, `products/${filename}`);
      return uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
    });
    
    const downloadURLs = await Promise.all(uploadPromises);
    
    console.log(`✅ [Storage] Uploaded ${files.length} images for SKU: ${sku}`);
    return downloadURLs;
  } catch (error) {
    console.error(`❌ [Storage] Error uploading multiple images for SKU ${sku}:`, error);
    throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a valid image file (JPEG, PNG, or WebP)' };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }
  
  return { valid: true };
};