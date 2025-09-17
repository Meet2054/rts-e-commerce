// src/app/api/cart/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RedisCache } from '@/lib/redis-cache';
import { Cart, UpdateCartItemRequest } from '@/lib/cart-types';
import { CartCalculations, CartValidation } from '@/lib/cart-utils';
import { adminDb } from '@/lib/firebase-admin';

// PUT /api/cart/items - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateCartItemRequest & { userId?: string; sessionId?: string } = await request.json();
    const { itemId, quantity, userId, sessionId } = body;

    console.log(`🛒 [API] Update cart item - Item: ${itemId}, Qty: ${quantity}, User: ${userId || 'guest'}`);

    if (!userId && !sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID or Session ID required' 
      }, { status: 400 });
    }

    // Validate input
    const validation = CartValidation.validateQuantityUpdate(quantity);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
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
        return NextResponse.json({ 
          success: false, 
          error: 'Cart not found' 
        }, { status: 404 });
      }
      
      const doc = snapshot.docs[0];
      cart = { id: doc.id, ...doc.data() } as Cart;
    }

    // Find and update item
    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Item not found in cart' 
      }, { status: 404 });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].addedAt = new Date().toISOString();
    
    console.log(`🔄 [CART] Updated quantity for ${cart.items[itemIndex].name}: ${quantity}`);

    // Recalculate totals
    cart = CartCalculations.updateCartTotals(cart);

    // Save to Firebase
    await adminDb.collection('carts').doc(cart.id).set(cart);
    console.log(`💾 [FIREBASE] Cart updated with ${cart.items.length} items, Total: $${cart.total.toFixed(2)}`);

    // Update Redis cache
    await RedisCache.set(cartKey, cart, { ttl: 1800, prefix: 'api' });
    console.log(`💾 [CACHE UPDATE] Cart updated in Redis`);

    return NextResponse.json({
      success: true,
      cart,
      message: 'Cart item updated successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error in cart items PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    console.log(`🛒 [API] Remove cart item - Item: ${itemId}, User: ${userId || 'guest'}`);

    if (!userId && !sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID or Session ID required' 
      }, { status: 400 });
    }

    if (!itemId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Item ID required' 
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
        return NextResponse.json({ 
          success: false, 
          error: 'Cart not found' 
        }, { status: 404 });
      }
      
      const doc = snapshot.docs[0];
      cart = { id: doc.id, ...doc.data() } as Cart;
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Item not found in cart' 
      }, { status: 404 });
    }

    const removedItem = cart.items[itemIndex];
    cart.items.splice(itemIndex, 1);
    
    console.log(`🗑️ [CART] Removed item: ${removedItem.name}`);

    // Recalculate totals
    cart = CartCalculations.updateCartTotals(cart);

    // Save to Firebase
    await adminDb.collection('carts').doc(cart.id).set(cart);
    console.log(`💾 [FIREBASE] Cart updated with ${cart.items.length} items, Total: $${cart.total.toFixed(2)}`);

    // Update Redis cache
    await RedisCache.set(cartKey, cart, { ttl: 1800, prefix: 'api' });
    console.log(`💾 [CACHE UPDATE] Cart updated in Redis`);

    return NextResponse.json({
      success: true,
      cart,
      message: `${removedItem.name} removed from cart`
    });

  } catch (error) {
    console.error('❌ [API] Error in cart items DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
