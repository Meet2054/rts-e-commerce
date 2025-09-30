// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RedisCache, CacheKeys, CacheTTL } from '@/lib/redis-cache';
import { Cart, CartItem, AddToCartRequest } from '@/lib/cart-types';
import { CartCalculations, CartValidation, CartStorage } from '@/lib/cart-utils';
import { adminDb } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';

// Helper function to get user-specific price for a product
async function getUserSpecificPrice(productSku: string, basePrice: number, authHeader: string | null): Promise<number> {
  if (!authHeader) {
    return basePrice;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken?.uid) {
      return basePrice;
    }

    console.log(`🔍 [CART API] Checking custom price for user ${decodedToken.uid}, product SKU ${productSku}`);

    // First, get the product document ID from the SKU
    const productQuery = adminDb.collection('products').where('sku', '==', productSku).limit(1);
    const productSnapshot = await productQuery.get();
    
    if (productSnapshot.empty) {
      console.log(`❌ [CART API] Product not found for SKU ${productSku}`);
      return basePrice;
    }
    
    const productId = productSnapshot.docs[0].id;
    console.log(`📋 [CART API] Product ID for SKU ${productSku}: ${productId}`);

    // Now get custom pricing using the product document ID
    const customPricingDoc = await adminDb
      .collection('users')
      .doc(decodedToken.uid)
      .collection('customPricing')
      .doc(productId)
      .get();

    if (customPricingDoc.exists) {
      const pricingData = customPricingDoc.data();
      const customPriceInCents = pricingData?.customPrice;
      
      if (typeof customPriceInCents === 'number') {
        // Convert from cents back to decimal (divide by 100)
        const customPrice = customPriceInCents;
        console.log(`💰 [CART API] Found custom price for ${productSku}: ${basePrice} → ${customPrice} (from ${customPriceInCents} cents)`);
        return customPrice;
      }
    }

    console.log(`💰 [CART API] No custom price found for ${productSku}, using base price: ${basePrice}`);
    return basePrice;
  } catch (error) {
    // Enhanced error logging with specific token expiration handling
    if (error instanceof Error && error.message.includes('expired')) {
      console.warn('🔒 [CART API] Firebase token expired - falling back to base pricing:', error.message);
    } else {
      console.warn('❌ [CART API] Error getting user-specific price:', error);
    }
    return basePrice;
  }
}

// Helper function to apply user-specific pricing to cart items
async function applyUserSpecificPricing(cart: Cart, authHeader: string | null, userId?: string, sessionId?: string): Promise<Cart> {
  console.log(`🔐 [CART API] Auth header present: ${!!authHeader}, Cart items: ${cart.items?.length || 0}`);
  
  if (!authHeader || !cart.items?.length) {
    return cart;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    console.log(`👤 [CART API] Authenticated user: ${decodedToken.uid}`);
    
    if (!decodedToken?.uid) {
      return cart;
    }

    // Get custom pricing for this user
    const customPricingSnapshot = await adminDb
      .collection('users')
      .doc(decodedToken.uid)
      .collection('customPricing')
      .get();

    const customPricing: { [sku: string]: number } = {};
    customPricingSnapshot.forEach(doc => {
      const data = doc.data();
      // Convert from cents back to decimal
      const customPriceInCents = data.customPrice;
      if (typeof customPriceInCents === 'number') {
        customPricing[data.sku] = customPriceInCents;
      }
    });

    console.log(`💰 [CART API] Found custom pricing for ${Object.keys(customPricing).length} SKUs:`, Object.keys(customPricing));
    console.log(`📦 [CART API] Cart item SKUs:`, cart.items.map(item => item.sku));
    
    // Log specific pricing for cart items
    cart.items.forEach(item => {
      if (customPricing[item.sku]) {
        console.log(`💲 [CART API] Custom price for ${item.sku}: ${customPricing[item.sku]}`);
      }
    });

    // Apply custom pricing to cart items
    let priceUpdated = false;
    const updatedItems = cart.items.map(item => {
      console.log(`🔍 [CART API] Checking item SKU: ${item.sku}, Custom price available: ${!!customPricing[item.sku]}`);
      if (customPricing[item.sku]) {
        priceUpdated = true;
        console.log(`🏷️ [CART API] Applying user-specific price for ${item.sku}: ${item.price} → ${customPricing[item.sku]}`);
        return {
          ...item,
          price: customPricing[item.sku]
        };
      }
      return item;
    });

    if (priceUpdated) {
      console.log(`✅ [CART API] Applied user-specific pricing to ${updatedItems.filter((_, i) => cart.items[i].price !== updatedItems[i].price).length} items`);
      // Recalculate cart totals with updated prices
      const updatedCart = {
        ...cart,
        items: updatedItems
      };
      const finalCart = CartCalculations.updateCartTotals(updatedCart);
      
      // Update the cache with the new pricing
      const cartKey = userId ? CacheKeys.cartUser(userId) : CacheKeys.cartSession(sessionId!);
      await RedisCache.set(cartKey, finalCart, { ttl: CacheTTL.CART, prefix: 'api' });
      console.log(`💾 [CART API] Updated cache with user-specific pricing`);
      
      return finalCart;
    } else {
      console.log(`ℹ️ [CART API] No price updates needed - no custom pricing found for cart items`);
    }

    return cart;
  } catch (error) {
    console.warn('Error applying user-specific pricing to cart:', error);
    return cart;
  }
}

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

    const cartKey = userId ? CacheKeys.cartUser(userId) : CacheKeys.cartSession(sessionId!);
    
    // Try Redis cache first
    let cachedCart = await RedisCache.get(cartKey, 'api');
    
    // If we have auth headers and cached cart, clear cache to force fresh pricing lookup
    if (cachedCart && request.headers.get('authorization')) {
      console.log(`🗑️ [CART API] Clearing cache for authenticated user to apply fresh pricing`);
      await RedisCache.delete(cartKey, 'api');
      cachedCart = null;
    }
    
    if (cachedCart) {
      // Apply user-specific pricing to cached cart
      const authHeader = request.headers.get('authorization');
      cachedCart = await applyUserSpecificPricing(cachedCart, authHeader, userId || undefined, sessionId || undefined);
      
      console.log(`✅ [REDIS] Cart served from cache for ${userId || sessionId} with updated pricing`);
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

    // Apply user-specific pricing to the cart
    const authHeader = request.headers.get('authorization');
    cart = await applyUserSpecificPricing(cart, authHeader, userId || undefined, sessionId || undefined);

    // Cache the cart
    await RedisCache.set(cartKey, cart, { ttl: CacheTTL.CART, prefix: 'api' }); // Optimized TTL
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
    
    // Get user-specific price if authenticated
    const authHeader = request.headers.get('authorization');
    const finalPrice = await getUserSpecificPrice(productData.sku, productData.price, authHeader);
    
    // Create cart item
    const cartItem: CartItem = {
      id: productData.sku, // Use SKU as the cart item ID
      sku: productData.sku,
      name: productData.name,
      image: productData.image || productData.imageUrl || '/product-placeholder.png',
      price: finalPrice,
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
