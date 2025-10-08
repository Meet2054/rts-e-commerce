import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { RedisCache, CacheKeys, CacheTTL } from '@/lib/redis-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const cacheBust = searchParams.get('t'); // Cache-busting parameter
    const oemFilters = searchParams.getAll('oem'); // Get all OEM filter values
    const oemsParam = searchParams.get('oems'); // Handle comma-separated OEMs from admin
    const getAllOEMs = searchParams.get('getAllOEMs') === 'true'; // Special flag to get all OEMs
    
    // Combine OEM filters from both sources
    const allOemFilters = [
      ...oemFilters,
      ...(oemsParam ? oemsParam.split(',').map(oem => oem.trim()) : [])
    ].filter(Boolean);
    
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
    
    console.log(`Products request - User: ${userId || 'anonymous'}, Search: "${searchTerm || 'none'}", OEMs: [${allOemFilters.join(', ') || 'none'}], Page: ${page}, PageSize: ${pageSize}, GetAllOEMs: ${getAllOEMs}, CacheBust: ${cacheBust || 'none'}`);    
    
    // Include user ID and OEM filters in cache key for personalized pricing
    const oemFilterKey = allOemFilters.length > 0 ? `_oem_${allOemFilters.sort().join('_')}` : '';
    const getAllOEMsKey = getAllOEMs ? '_getAllOEMs' : '';
    const cacheKey = userId 
      ? `${CacheKeys.productsList(searchTerm || '', pageSize, page)}_user_${userId}${oemFilterKey}${getAllOEMsKey}`
      : `${CacheKeys.productsList(searchTerm || '', pageSize, page)}${oemFilterKey}${getAllOEMsKey}`;
    
    // Skip cache if cache-busting parameter is present
    const cachedData = cacheBust ? null : await RedisCache.get(cacheKey, 'api');
    
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
    
    console.log(`Products not in cache${cacheBust ? ' (cache-bust requested)' : ''}, fetching from Firebase...`);
    
    const query = adminDb.collection('products').where('isActive', '==', true);
    const snapshot = await query.get();
    console.log(`Found ${snapshot.docs.length} products in database`);

    // Fetch user-specific custom pricing if user is authenticated
    const customPricing: Record<string, number> = {};
    if (userId) {
      console.log(`Fetching custom pricing for user: ${userId}`);
      
      // Query the user's customPricing subcollection
      const customPricingQuery = await adminDb.collection('users')
        .doc(userId)
        .collection('customPricing')
        .get();
      
      customPricingQuery.forEach(doc => {
        const data = doc.data();
        // Use SKU from the data for matching, not document ID
        if (typeof data.customPrice === 'number' && data.sku) {
          customPricing[data.sku] = data.customPrice;
        }
      });
      
      console.log(`Found ${Object.keys(customPricing).length} custom prices for user ${userId}`);
      console.log(`Custom pricing SKUs: [${Object.keys(customPricing).slice(0, 10).join(', ')}${Object.keys(customPricing).length > 10 ? ', ...' : ''}]`);
    }

    const allProducts = snapshot.docs.map(doc => {
      const data = doc.data();
      const productId = doc.id;
      const productSku = data.sku;
      
      // Use custom price if available (match by SKU), otherwise use base price
      const effectivePrice = customPricing[productSku] || data.price || 0;
      
      return {
        id: productId,
        sku: data.sku,
        name: data.name,
        description: data.description || '',
        brand: data.brand || '',
        category: data.category || '',
        price: effectivePrice, // This will be the user-specific price or base price  
        basePrice: data.price || 0, // Always include base price for reference
        hasCustomPrice: !!customPricing[productSku], // Flag to indicate if custom pricing is applied
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
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.oem.toLowerCase().includes(search)
      );
      console.log(`Found ${filteredProducts.length} products matching "${searchTerm}"`);
    }
    
    // Apply OEM filter
    if (allOemFilters.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        allOemFilters.some(oem => 
          product.oem && product.oem.toLowerCase() === oem.toLowerCase()
        )
      );
      console.log(`Found ${filteredProducts.length} products matching OEM filters: [${allOemFilters.join(', ')}]`);
    }

    const totalCount = filteredProducts.length;
    
    // If getAllOEMs is true, return all products without pagination (for OEM fetching)
    const paginatedProducts = getAllOEMs ? filteredProducts : filteredProducts.slice(offset, offset + pageSize);
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
