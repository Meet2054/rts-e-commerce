// src/app/api/test-cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Starting cart API test...');
    
    // Test 1: Check if Firebase admin is working
    console.log('🧪 [TEST] Testing Firebase admin connection...');
    const testCollection = adminDb.collection('products');
    console.log('✅ [TEST] Firebase admin collection created');
    
    // Test 2: Check if product exists
    const productId = '0np8KgXvTIysNnwzSOaX';
    console.log(`🧪 [TEST] Checking product: ${productId}`);
    
    const productDoc = await testCollection.doc(productId).get();
    console.log(`🧪 [TEST] Product document exists: ${productDoc.exists}`);
    
    if (productDoc.exists) {
      const data = productDoc.data();
      console.log(`🧪 [TEST] Product data keys: ${Object.keys(data || {}).join(', ')}`);
      console.log(`🧪 [TEST] Product name: ${data?.name}`);
      console.log(`🧪 [TEST] Product price: ${data?.price}`);
    }
    
    // Test 3: Try to create a cart document
    console.log('🧪 [TEST] Testing cart document creation...');
    const testCart = {
      id: 'test-cart-123',
      userId: 'test-user',
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await adminDb.collection('carts').doc('test-cart-123').set(testCart);
    console.log('✅ [TEST] Cart document created successfully');
    
    // Test 4: Read it back
    const cartDoc = await adminDb.collection('carts').doc('test-cart-123').get();
    console.log(`✅ [TEST] Cart document retrieved: ${cartDoc.exists}`);
    
    // Clean up
    await adminDb.collection('carts').doc('test-cart-123').delete();
    console.log('🧹 [TEST] Test cart cleaned up');
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      results: {
        firebaseAdmin: 'working',
        productExists: productDoc.exists,
        productData: productDoc.exists ? productDoc.data() : null,
        cartOperations: 'working'
      }
    });
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
