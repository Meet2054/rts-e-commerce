// src/app/api/products/related/[brand]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { RedisCache } from '@/lib/redis-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { oem: string } }
) {
  try {
    const { oem } = await params;
    const { searchParams } = new URL(request.url);
    const excludeSku = searchParams.get('exclude');
    const limit = parseInt(searchParams.get('limit') || '4');
    
    // Get user information from auth token
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        if (token !== 'dummy-token') { // Skip validation for dummy tokens
          const decodedToken = await adminAuth.verifyIdToken(token);
          userId = decodedToken.uid;
        }
      } catch (error) {
        console.log('Token verification failed, continuing without user context:', error);
      }
    }
    
    console.log(`🔍 [API] Related products request - OEM: "${oem}", Exclude: "${excludeSku}", Limit: ${limit}, User: ${userId || 'anonymous'}`);
    
    // Include user ID in cache key for personalized pricing
    const cacheKey = userId 
      ? `related-products:${oem}:${excludeSku || 'none'}:${limit}_user_${userId}`
      : `related-products:${oem}:${excludeSku || 'none'}:${limit}`;
    
    // Try to get from Redis cache first
    const cachedProducts = await RedisCache.get(cacheKey, 'api');
    
    if (cachedProducts) {
      console.log(`✅ [REDIS] Related products for "${oem}" served from cache (${cachedProducts.length} products)`);
      return NextResponse.json({
        success: true,
        products: cachedProducts,
        source: 'redis_cache',
        cached: true
      });
    }
    
    console.log(`❌ [REDIS] Related products for "${oem}" not in cache, fetching from Firebase...`);
    console.log('📊 [FIREBASE] Querying Firestore database...');
    
    // Query Firebase for related products by oem
    const query = adminDb.collection('products')
      .where('oem', '==', oem)
      .where('isActive', '==', true)
      .limit(limit + (excludeSku ? 1 : 0)); // Get one extra if we need to exclude one

    const snapshot = await query.get();
    console.log(`✅ [FIREBASE] Found ${snapshot.docs.length} related products for "${oem}"`);

    // Fetch user-specific custom pricing if user is authenticated
    const customPricing: Record<string, number> = {};
    if (userId) {
      console.log(`Fetching custom pricing for user: ${userId}`);
      
      try {
        const customPricingQuery = await adminDb.collection('users')
          .doc(userId)
          .collection('customPricing')
          .get();
        
        customPricingQuery.forEach(doc => {
          const data = doc.data();
          customPricing[doc.id] = data.customPrice;
        });
        
        console.log(`Found ${Object.keys(customPricing).length} custom prices for user ${userId}`);
      } catch (error) {
        console.error('Error fetching custom pricing:', error);
      }
    }

    let products = snapshot.docs.map(doc => {
      const data = doc.data();
      const productId = doc.id;
      
      // Use custom price if available, otherwise use base price
      const effectivePrice = customPricing[productId] || data.price || 0;
      
      return {
        id: productId,
        sku: data.sku,
        name: data.name,
        brand: data.brand || '',
        price: effectivePrice, // This will be the user-specific price or base price
        basePrice: data.price || 0, // Always include base price for reference
        hasCustomPrice: !!customPricing[productId], // Flag to indicate if custom pricing is applied
        image: data.image || data.imageUrl || '/product-placeholder.png',
        rating: data.rating || 4.5,
        reviews: data.reviews || 0,
        category: data.category || 'Printer Supplies',
        katunPN: data.katunPN || ''
      };
    });

    // Filter out the current product if excludeSku is provided
    if (excludeSku) {
      products = products.filter(product => product.sku !== excludeSku);
    }

    // Limit the results
    products = products.slice(0, limit);

    console.log(`📊 [FIREBASE] Returning ${products.length} related products for "${oem}"`);
    
    // Cache the results
    await RedisCache.set(cacheKey, products, { 
      ttl: 300, // 5 minutes for related products
      prefix: 'api' 
    });
    
    console.log(`💾 [CACHE UPDATE] Related products for "${oem}" cached from Firebase to Redis: ${products.length} products`);

    return NextResponse.json({
      success: true,
      products: products,
      source: 'firebase_database',
      cached: false
    });

  } catch (error) {
    console.error(`Error fetching related products for oem "${(await params).oem}":`, error);
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
