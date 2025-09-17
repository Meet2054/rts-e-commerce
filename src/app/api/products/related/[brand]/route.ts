// src/app/api/products/related/[brand]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { RedisCache } from '@/lib/redis-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { brand: string } }
) {
  try {
    const { brand } = await params;
    const { searchParams } = new URL(request.url);
    const excludeSku = searchParams.get('exclude');
    const limit = parseInt(searchParams.get('limit') || '4');
    
    console.log(`🔍 [API] Related products request - Brand: "${brand}", Exclude: "${excludeSku}", Limit: ${limit}`);
    
    // Create cache key for related products
    const cacheKey = `related-products:${brand}:${excludeSku || 'none'}:${limit}`;
    
    // Try to get from Redis cache first
    const cachedProducts = await RedisCache.get(cacheKey, 'api');
    
    if (cachedProducts) {
      console.log(`✅ [REDIS] Related products for "${brand}" served from cache (${cachedProducts.length} products)`);
      return NextResponse.json({
        success: true,
        products: cachedProducts,
        source: 'redis_cache',
        cached: true
      });
    }
    
    console.log(`❌ [REDIS] Related products for "${brand}" not in cache, fetching from Firebase...`);
    console.log('📊 [FIREBASE] Querying Firestore database...');
    
    // Query Firebase for related products by brand
    let query = adminDb.collection('products')
      .where('brand', '==', brand)
      .where('isActive', '==', true)
      .limit(limit + (excludeSku ? 1 : 0)); // Get one extra if we need to exclude one

    const snapshot = await query.get();
    console.log(`✅ [FIREBASE] Found ${snapshot.docs.length} related products for "${brand}"`);

    let products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sku: data.sku,
        name: data.name,
        brand: data.brand || '',
        price: data.price || 0,
        image: data.image || data.imageUrl || '/product-placeholder.png',
        rating: data.rating || 4.5,
        reviews: data.reviews || 0,
        category: data.category || 'Printer Supplies'
      };
    });

    // Filter out the current product if excludeSku is provided
    if (excludeSku) {
      products = products.filter(product => product.sku !== excludeSku);
    }

    // Limit the results
    products = products.slice(0, limit);

    console.log(`📊 [FIREBASE] Returning ${products.length} related products for "${brand}"`);
    
    // Cache the results
    await RedisCache.set(cacheKey, products, { 
      ttl: 300, // 5 minutes for related products
      prefix: 'api' 
    });
    
    console.log(`💾 [CACHE UPDATE] Related products for "${brand}" cached from Firebase to Redis: ${products.length} products`);

    return NextResponse.json({
      success: true,
      products: products,
      source: 'firebase_database',
      cached: false
    });

  } catch (error) {
    console.error(`Error fetching related products for brand "${(await params).brand}":`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch related products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
