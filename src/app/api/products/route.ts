import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { RedisCache, CacheKeys, CacheTTL } from '@/lib/redis-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    
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
    
    const offset = (page - 1) * pageSize;
    
    console.log(`Products request - User: ${userId || 'anonymous'}, Search: "${searchTerm || 'none'}", Page: ${page}, PageSize: ${pageSize}`);
    
    // Include user ID in cache key for personalized pricing
    const cacheKey = userId 
      ? `${CacheKeys.productsList(searchTerm || '', pageSize, page)}_user_${userId}`
      : CacheKeys.productsList(searchTerm || '', pageSize, page);
    
    const cachedData = await RedisCache.get(cacheKey, 'api');
    
    if (cachedData) {
      console.log(`Products page ${page} served from cache for user ${userId || 'anonymous'}`);
      return NextResponse.json({
        success: true,
        products: cachedData.products,
        pagination: cachedData.pagination,
        source: 'redis_cache',
        cached: true
      });
    }
    
    console.log(`Products not in cache, fetching from Firebase...`);
    
    const query = adminDb.collection('products').where('isActive', '==', true);
    const snapshot = await query.get();
    console.log(`Found ${snapshot.docs.length} products in database`);

    // Fetch user-specific custom pricing if user is authenticated
    let customPricing: Record<string, number> = {};
    if (userId) {
      console.log(`Fetching custom pricing for user: ${userId}`);
      
      // Query the user's customPricing subcollection
      const customPricingQuery = await adminDb.collection('users')
        .doc(userId)
        .collection('customPricing')
        .get();
      
      customPricingQuery.forEach(doc => {
        const data = doc.data();
        // The document ID is the productId, and the data contains customPrice in cents
        // Convert from cents to decimal
        if (typeof data.customPrice === 'number') {
          customPricing[doc.id] = data.customPrice / 100;
        }
      });
      
      console.log(`Found ${Object.keys(customPricing).length} custom prices for user ${userId}`);
    }

    const allProducts = snapshot.docs.map(doc => {
      const data = doc.data();
      const productId = doc.id;
      
      // Use custom price if available, otherwise use base price
      const effectivePrice = customPricing[productId] || data.price || 0;
      
      return {
        id: productId,
        sku: data.sku,
        name: data.name,
        description: data.description || '',
        brand: data.brand || '',
        price: effectivePrice, // This will be the user-specific price or base price
        basePrice: data.price || 0, // Always include base price for reference
        hasCustomPrice: !!customPricing[productId], // Flag to indicate if custom pricing is applied
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
        updatedAt: data.updatedAt
      };
    });

    let filteredProducts = allProducts;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.oem.toLowerCase().includes(search)
      );
      console.log(`Found ${filteredProducts.length} products matching "${searchTerm}"`);
    }

    const totalCount = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const paginationData = {
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalItems: totalCount,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        startIndex: offset + 1,
        endIndex: Math.min(offset + pageSize, totalCount)
      },
      products: paginatedProducts
    };

    console.log(`Returning page ${page}/${totalPages} (${paginatedProducts.length} products, ${totalCount} total)`);
    
    await RedisCache.set(cacheKey, paginationData, { 
      ttl: CacheTTL.PRODUCTS_LIST,
      prefix: 'api' 
    });

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      pagination: paginationData.pagination,
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
