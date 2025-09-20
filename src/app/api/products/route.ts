import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { RedisCache, CacheKeys, CacheTTL } from '@/lib/redis-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    const offset = (page - 1) * pageSize;
    
    console.log(`Products request - Search: "${searchTerm || 'none'}", Page: ${page}, PageSize: ${pageSize}`);
    
    const cacheKey = CacheKeys.productsList(searchTerm || '', pageSize, page);
    const cachedData = await RedisCache.get(cacheKey, 'api');
    
    if (cachedData) {
      console.log(`Products page ${page} served from cache`);
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

    const allProducts = snapshot.docs.map(doc => {
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
