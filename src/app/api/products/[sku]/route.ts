// src/app/api/products/[sku]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { RedisCache } from '@/lib/redis-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = await params;
    
    console.log(`🔍 [API] Single product request - SKU: "${sku}"`);
    
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
    
    // Include user ID in cache key for personalized pricing
    const cacheKey = userId 
      ? `product:${sku}_user_${userId}`
      : `product:${sku}`;
    
    // Try to get from Redis cache first
    const cachedProduct = await RedisCache.get(cacheKey, 'api');
    
    if (cachedProduct) {
      console.log(`✅ [REDIS] Product "${sku}" served from cache for user ${userId || 'anonymous'}`);
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
    const productId = doc.id;
    
    console.log(`✅ [FIREBASE] Found product "${sku}" in database`);
    
    // Fetch user-specific custom pricing if user is authenticated
    let customPrice: number | null = null;
    if (userId) {
      console.log(`Fetching custom pricing for user: ${userId}, product: ${productId}`);
      
      try {
        const customPricingDoc = await adminDb.collection('users')
          .doc(userId)
          .collection('customPricing')
          .doc(productId)
          .get();
        
        if (customPricingDoc.exists) {
          const pricingData = customPricingDoc.data();
          const customPriceInCents = pricingData?.customPrice;
          if (typeof customPriceInCents === 'number') {
            // Convert from cents to decimal
            customPrice = customPriceInCents / 100;
            console.log(`Found custom price for user ${userId}: ${customPrice} (from ${customPriceInCents} cents)`);
          }
        }
      } catch (error) {
        console.error('Error fetching custom pricing:', error);
      }
    }
    
    // Use custom price if available, otherwise use base price
    const effectivePrice = customPrice || data.price || 0;
    
    const product = {
      id: doc.id,
      sku: data.sku,
      name: data.name,
      description: data.description || '',
      brand: data.brand || '',
      price: effectivePrice, // This will be the user-specific price or base price
      basePrice: data.price || 0, // Always include base price for reference
      hasCustomPrice: !!customPrice, // Flag to indicate if custom pricing is applied
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
