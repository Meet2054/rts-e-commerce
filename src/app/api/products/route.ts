// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { RedisCache } from '@/lib/redis-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const pageSize = parseInt(searchParams.get('pageSize') || '200');
    
    console.log(`🔍 [API] Products request - Search: "${searchTerm || 'none'}", PageSize: ${pageSize}`);
    
    // Create cache key based on search parameters
    const cacheKey = `products-list:${searchTerm || 'all'}:${pageSize}`;
    
    // Try to get from Redis cache first
    const cachedProducts = await RedisCache.get(cacheKey, 'api');
    
    if (cachedProducts) {
      console.log(`✅ [REDIS] Products list served from cache (${cachedProducts.length} products)`);
      return NextResponse.json({
        products: cachedProducts,
        total: cachedProducts.length,
        source: 'redis_cache',
        cached: true
      });
    }
    
    console.log(`❌ [REDIS] Products not in cache, fetching from Firebase...`);
    console.log('📊 [FIREBASE] Querying Firestore database...');
    
    // Simplified query - just get all active products
    const query = adminDb.collection('products')
      .where('isActive', '==', true)
      .limit(pageSize);

    const snapshot = await query.get();
    console.log(`✅ [FIREBASE] Found ${snapshot.docs.length} products in database`);

    const products = snapshot.docs.map(doc => {
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

    // Apply search filter in memory (since we have limited data)
    let filteredProducts = products;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.oem.toLowerCase().includes(search)
      );
    }

    console.log(`📊 [FIREBASE] Returning ${filteredProducts.length} products after search filter`);
    
    // Cache the filtered results for future requests
    await RedisCache.set(cacheKey, filteredProducts, { 
      ttl: 180, // 3 minutes for product lists
      prefix: 'api' 
    });
    
    console.log(`💾 [CACHE UPDATE] Products list cached from Firebase to Redis: ${filteredProducts.length} products`);

    return NextResponse.json({
      success: true,
      products: filteredProducts,
      hasMore: false,
      totalFound: filteredProducts.length,
      source: 'firebase_database',
      cached: false
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}