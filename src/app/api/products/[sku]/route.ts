// src/app/api/products/[sku]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { RedisCache } from '@/lib/redis-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = await params;
    
    console.log(`🔍 [API] Single product request - SKU: "${sku}"`);
    
    // Create cache key for single product
    const cacheKey = `product:${sku}`;
    
    // Try to get from Redis cache first
    const cachedProduct = await RedisCache.get(cacheKey, 'api');
    
    if (cachedProduct) {
      console.log(`✅ [REDIS] Product "${sku}" served from cache`);
      return NextResponse.json({
        success: true,
        product: cachedProduct,
        source: 'redis_cache',
        cached: true
      });
    }
    
    console.log(`❌ [REDIS] Product "${sku}" not in cache, fetching from Firebase...`);
    console.log('📊 [FIREBASE] Querying Firestore database...');
    
    // Query Firebase for the specific product by SKU
    const query = adminDb.collection('products')
      .where('sku', '==', sku)
      .where('isActive', '==', true)
      .limit(1);

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log(`❌ [FIREBASE] Product with SKU "${sku}" not found`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Product with SKU "${sku}" not found` 
        },
        { status: 404 }
      );
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log(`✅ [FIREBASE] Found product "${sku}" in database`);
    
    const product = {
      id: doc.id,
      sku: data.sku,
      name: data.name,
      description: data.description || '',
      brand: data.brand || '',
      price: data.price || 0,
      image: data.image || data.imageUrl || '/product-placeholder.png',
      imageUrl: data.imageUrl || data.image || '/product-placeholder.png',
      oem: data.oem || '',
      oemPN: data.oemPN || '',
      katunPN: data.katunPN || '',
      comments: data.comments || '',
      forUseIn: data.forUseIn || '',
      sourceSheet: data.sourceSheet || '',
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      category: data.category || 'Printer Supplies'
    };
    
    // Cache the product for future requests
    await RedisCache.set(cacheKey, product, { 
      ttl: 300, // 5 minutes for individual products
      prefix: 'api' 
    });
    
    console.log(`💾 [CACHE UPDATE] Product "${sku}" cached from Firebase to Redis`);

    return NextResponse.json({
      success: true,
      product: product,
      source: 'firebase_database',
      cached: false
    });

  } catch (error) {
    console.error(`Error fetching product with SKU "${(await params).sku}":`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
