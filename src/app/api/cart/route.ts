// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RedisCache } from '@/lib/redis-cache';
import { Cart, CartItem, AddToCartRequest } from '@/lib/cart-types';
import { CartCalculations, CartValidation, CartStorage } from '@/lib/cart-utils';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    console.log(`🛒 [API] Cart request - User: ${userId || 'guest'}, Session: ${sessionId}`);

    if (!userId && !sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID or Session ID required' 
      }, { status: 400 });
    }

    const cartKey = `cart:${userId || sessionId}`;
    
    // Try Redis cache first
    const cachedCart = await RedisCache.get(cartKey, 'api');
    
    if (cachedCart) {
      console.log(`✅ [REDIS] Cart served from cache for ${userId || sessionId}`);
      return NextResponse.json({
        success: true,
        cart: cachedCart,
        source: 'redis_cache'
      });
    }

    // Try Firebase
    console.log(`❌ [REDIS] Cart not in cache, checking Firebase...`);
    
    const cartsQuery = adminDb.collection('carts');
    const query = userId 
      ? cartsQuery.where('userId', '==', userId) 
      : cartsQuery.where('sessionId', '==', sessionId);
    
    const snapshot = await query.limit(1).get();
    
    let cart: Cart;
    
    if (snapshot.empty) {
      // Create new cart
      console.log(`📝 [FIREBASE] Creating new cart for ${userId || sessionId}`);
      cart = CartStorage.createEmptyCart(userId || undefined);
      
      // Save to Firebase
      await adminDb.collection('carts').doc(cart.id).set(cart);
    } else {
      // Load existing cart
      const doc = snapshot.docs[0];
      cart = { id: doc.id, ...doc.data() } as Cart;
      cart = CartCalculations.updateCartTotals(cart); // Recalculate totals
      console.log(`✅ [FIREBASE] Loaded cart with ${cart.items.length} items`);
    }

    // Cache the cart
    await RedisCache.set(cartKey, cart, { ttl: 1800, prefix: 'api' }); // 30 minutes
    console.log(`💾 [CACHE UPDATE] Cart cached from Firebase to Redis`);

    return NextResponse.json({
      success: true,
      cart,
      source: 'firebase_database'
    });

  } catch (error) {
    console.error('❌ [API] Error in cart GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body: AddToCartRequest & { userId?: string; sessionId?: string } = await request.json();
    const { productId, quantity, userId, sessionId } = body;

    console.log(`🛒 [API] Add to cart - Product: ${productId}, Qty: ${quantity}, User: ${userId || 'guest'}`);

    if (!userId && !sessionId) {
      console.log('❌ [API] Missing user/session ID');
      return NextResponse.json({ 
        success: false, 
        error: 'User ID or Session ID required' 
      }, { status: 400 });
    }

    // Validate input
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      console.log('❌ [API] Invalid input:', { productId, quantity, quantityType: typeof quantity });
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid product ID or quantity' 
      }, { status: 400 });
    }

    console.log(`🔍 [API] Looking up product by SKU: ${productId}`);
    
    // Get product details from Firebase by SKU
    const productsQuery = adminDb.collection('products').where('sku', '==', productId);
    const productSnapshot = await productsQuery.limit(1).get();
    
    if (productSnapshot.empty) {
      console.log(`❌ [API] Product not found with SKU: ${productId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    const productDoc = productSnapshot.docs[0];
    const productData = productDoc.data()!;
    console.log(`✅ [API] Product found: ${productData.name} - $${productData.price}`);
    
    // Create cart item
    const cartItem: CartItem = {
      id: productData.sku, // Use SKU as the cart item ID
      sku: productData.sku,
      name: productData.name,
      image: productData.image || productData.imageUrl || '/product-placeholder.png',
      price: productData.price,
      quantity,
      brand: productData.brand || 'Unknown Brand',
      category: productData.category || 'General',
      addedAt: new Date().toISOString()
    };

    // Validate cart item
    const validation = CartValidation.validateCartItem(cartItem);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid cart item: ${validation.errors.join(', ')}` 
      }, { status: 400 });
    }

    const cartKey = `cart:${userId || sessionId}`;
    
    // Get current cart
    let cart = await RedisCache.get(cartKey, 'api') as Cart | null;
    
    if (!cart) {
      // Try Firebase
      const cartsQuery = adminDb.collection('carts');
      const query = userId 
        ? cartsQuery.where('userId', '==', userId) 
        : cartsQuery.where('sessionId', '==', sessionId);
      
      const snapshot = await query.limit(1).get();
      
      if (snapshot.empty) {
        cart = CartStorage.createEmptyCart(userId || undefined);
      } else {
        const doc = snapshot.docs[0];
        cart = { id: doc.id, ...doc.data() } as Cart;
      }
    }

    // Add/update item in cart
    const existingItemIndex = cart.items.findIndex(item => item.sku === productData.sku);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].addedAt = new Date().toISOString();
      console.log(`🔄 [CART] Updated quantity for ${productData.name}: ${cart.items[existingItemIndex].quantity}`);
    } else {
      // Add new item
      cart.items.push(cartItem);
      console.log(`➕ [CART] Added new item: ${productData.name}`);
    }

    // Recalculate totals
    cart = CartCalculations.updateCartTotals(cart);

    // Save to Firebase
    await adminDb.collection('carts').doc(cart.id).set(cart);
    console.log(`💾 [FIREBASE] Cart saved with ${cart.items.length} items, Total: $${cart.total.toFixed(2)}`);

    // Update Redis cache
    await RedisCache.set(cartKey, cart, { ttl: 1800, prefix: 'api' });
    console.log(`💾 [CACHE UPDATE] Cart updated in Redis`);

    return NextResponse.json({
      success: true,
      cart,
      message: `${productData.name} added to cart`
    });

  } catch (error) {
    console.error('❌ [API] Error in cart POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    console.log(`🛒 [API] Clear cart - User: ${userId || 'guest'}`);

    if (!userId && !sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID or Session ID required' 
      }, { status: 400 });
    }

    const cartKey = `cart:${userId || sessionId}`;
    
    // Get current cart to get the cart ID
    let cart = await RedisCache.get(cartKey, 'api') as Cart | null;
    
    if (!cart) {
      // Try Firebase
      const cartsQuery = adminDb.collection('carts');
      const query = userId 
        ? cartsQuery.where('userId', '==', userId) 
        : cartsQuery.where('sessionId', '==', sessionId);
      
      const snapshot = await query.limit(1).get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        cart = { id: doc.id, ...doc.data() } as Cart;
      }
    }

    if (cart) {
      // Clear items and recalculate
      cart.items = [];
      cart = CartCalculations.updateCartTotals(cart);

      // Update Firebase
      await adminDb.collection('carts').doc(cart.id).set(cart);
      console.log(`🧹 [FIREBASE] Cart cleared`);

      // Update Redis
      await RedisCache.set(cartKey, cart, { ttl: 1800, prefix: 'api' });
      console.log(`🧹 [CACHE UPDATE] Cart cleared in Redis`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error in cart DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
