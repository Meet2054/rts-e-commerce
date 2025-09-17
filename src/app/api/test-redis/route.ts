import { NextRequest, NextResponse } from 'next/server';
import { RedisCache } from '@/lib/redis-cache';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test') || 'connection';
    const productId = searchParams.get('productId') || '43852';
    
    if (testType === 'cache-flow') {
      return await testCacheFlow(productId);
    } else {
      return await testConnection();
    }
  } catch (error) {
    console.error('Redis test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: error instanceof Error ? error.message : String(error),
      success: false
    }, { status: 500 });
  }
}

async function testConnection() {
  // Test basic Redis connection
  const testKey = 'connection-test';
  const testValue = { 
    message: 'Redis is connected!', 
    timestamp: new Date().toISOString() 
  };

  await RedisCache.set(testKey, testValue, { ttl: 60 });
  const retrievedValue = await RedisCache.get(testKey);
  
  if (retrievedValue) {
    return NextResponse.json({
      status: 'connected',
      message: 'Redis is working properly',
      testData: retrievedValue,
      success: true
    });
  } else {
    return NextResponse.json({
      status: 'error',
      message: 'Could not retrieve test data from Redis',
      success: false
    }, { status: 500 });
  }
}

async function testCacheFlow(productId: string) {
  const cacheKey = `product:${productId}`;
  const steps: any[] = [];
  let startTime: number;
  
  // Step 1: Check if data exists in Redis
  console.log(`🔍 [TEST] Step 1: Checking Redis cache for product ${productId}`);
  console.log(`🔑 [TEST] Cache key: products:${cacheKey}`);
  startTime = Date.now();
  let cachedProduct = await RedisCache.get(cacheKey, 'products');
  const cacheCheckTime = Date.now() - startTime;
  
  steps.push({
    step: 1,
    action: 'Check Redis Cache',
    found: !!cachedProduct,
    timeTaken: `${cacheCheckTime}ms`,
    source: cachedProduct ? 'Redis Cache' : 'Not in cache'
  });
  
  if (cachedProduct) {
    console.log(`✅ [REDIS] DATA FOUND IN CACHE! Retrieved in ${cacheCheckTime}ms`);
    console.log(`📊 [REDIS] Product name: ${cachedProduct.name || 'Unknown'}`);
    return NextResponse.json({
      status: 'cache-hit',
      message: 'Data retrieved from Redis cache',
      productData: cachedProduct,
      steps,
      totalTime: `${cacheCheckTime}ms`,
      dataSource: 'Redis Cache',
      success: true
    });
  }
  
  // Step 2: Data not in Redis, fetch from Firestore
  console.log(`❌ [REDIS] DATA NOT IN CACHE - Fetching from Firebase database...`);
  console.log(`🔍 [FIREBASE] Querying Firestore for product: ${productId}`);
  startTime = Date.now();
  
  const productDoc = await adminDb.collection('products').doc(productId).get();
  const dbFetchTime = Date.now() - startTime;
  
  if (!productDoc.exists) {
    steps.push({
      step: 2,
      action: 'Fetch from Database',
      found: false,
      timeTaken: `${dbFetchTime}ms`,
      source: 'Firestore - Product not found'
    });
    
    return NextResponse.json({
      status: 'not-found',
      message: 'Product not found in database',
      steps,
      success: false
    }, { status: 404 });
  }
  
  const productData = {
    id: productDoc.id,
    ...productDoc.data(),
    fetchedAt: new Date().toISOString(),
    source: 'Database'
  };
  
  steps.push({
    step: 2,
    action: 'Fetch from Database',
    found: true,
    timeTaken: `${dbFetchTime}ms`,
    source: 'Firestore Database'
  });
  
  console.log(`✅ [FIREBASE] DATA FETCHED FROM DATABASE in ${dbFetchTime}ms`);
  console.log(`📊 [FIREBASE] Product name: ${(productData as any).name || 'Unknown'}`);
  console.log(`📊 [FIREBASE] Product SKU: ${(productData as any).sku || 'Unknown'}`);
  
  // Step 3: Store in Redis for future requests
  console.log(`💾 [CACHE UPDATE] Step 3: Caching data from Firebase to Redis`);
  console.log(`🔑 [CACHE UPDATE] Cache key: products:${cacheKey}`);
  startTime = Date.now();
  
  await RedisCache.set(cacheKey, productData, { 
    ttl: 300, // 5 minutes
    prefix: 'products' 
  });
  
  const cacheSetTime = Date.now() - startTime;
  
  steps.push({
    step: 3,
    action: 'Store in Redis Cache',
    found: true,
    timeTaken: `${cacheSetTime}ms`,
    source: 'Cached for future requests',
    ttl: '5 minutes'
  });
  
  console.log(`✅ [CACHE UPDATE] REDIS DATABASE UPDATED! Data cached in ${cacheSetTime}ms`);
  console.log(`🎯 [SUMMARY] Product fetched from Firebase and cached to Redis successfully`);
  
  const totalTime = cacheCheckTime + dbFetchTime + cacheSetTime;
  
  return NextResponse.json({
    status: 'cache-miss',
    message: 'Data retrieved from database and cached in Redis',
    productData,
    steps,
    totalTime: `${totalTime}ms`,
    breakdown: {
      cacheCheck: `${cacheCheckTime}ms`,
      databaseFetch: `${dbFetchTime}ms`,
      cacheStore: `${cacheSetTime}ms`
    },
    dataSource: 'Database (now cached)',
    success: true
  });
}

// DELETE method to clear cache for testing
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || '43852';
    const cacheKey = `product:${productId}`;
    
    // Clear the cache
    await RedisCache.delete(cacheKey, 'products');
    
    return NextResponse.json({
      status: 'cleared',
      message: `Cache cleared for product ${productId}`,
      key: `products:${cacheKey}`,
      success: true
    });
  } catch (error) {
    console.error('Cache clear failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : String(error),
      success: false
    }, { status: 500 });
  }
}
