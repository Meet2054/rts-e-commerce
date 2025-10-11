"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { useAuth } from '@/components/auth/auth-provider';
import { Cart, CartItem, CartContextType, CartResponse } from '@/lib/cart-types';
import { CartStorage, CartCalculations } from '@/lib/cart-utils';

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(1000);
  
  const { user, token, userData } = useAuth();

  // Fetch user's free shipping threshold
  const fetchFreeShippingThreshold = useCallback(async () => {
    if (userData?.freeShippingThreshold) {
      setFreeShippingThreshold(userData.freeShippingThreshold);
      return;
    }

    if (!user?.uid || !token) {
      setFreeShippingThreshold(1000); // Default value
      return;
    }

    try {
      const response = await fetch(`/api/admin/users-firebase?userId=${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userThreshold = data.user?.freeShippingThreshold || 1000;
        setFreeShippingThreshold(userThreshold);
        console.log(`🚚 [CART] Updated free shipping threshold to ₹${userThreshold}`);
      }
    } catch (error) {
      console.error('Failed to fetch free shipping threshold:', error);
      setFreeShippingThreshold(1000); // Fallback to default
    }
  }, [userData, user?.uid, token]);

  // Update cart totals with user-specific free shipping threshold
  const updateCartWithUserThreshold = useCallback((cartData: Cart): Cart => {
    const subtotal = CartCalculations.calculateSubtotal(cartData.items);
    const tax = CartCalculations.calculateTax(subtotal);
    const shipping = CartCalculations.calculateShipping(subtotal, freeShippingThreshold);
    const total = CartCalculations.calculateTotal(subtotal, tax, shipping);

    return {
      ...cartData,
      subtotal,
      tax,
      shipping,
      total,
      updatedAt: new Date().toISOString()
    };
  }, [freeShippingThreshold]);

  // Helper function to build headers with authentication
  const buildHeaders = useCallback((additionalHeaders: Record<string, string> = {}): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }, [token]);

  // Get user ID or session ID for API calls
  const getUserIdentifier = useCallback(() => {
    return {
      userId: user?.uid,
      sessionId: !user?.uid ? CartStorage.getSessionId() : undefined
    };
  }, [user?.uid]);

  // Load cart from API
  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { userId, sessionId } = getUserIdentifier();
      
      console.log(`🔄 [CART CONTEXT] Refreshing cart - User: ${userId || 'none'}, Token: ${token ? 'present' : 'missing'}`);
      
      if (!userId && !sessionId) {
        console.log('🛒 [Context] No user/session ID, creating empty cart');
        setCart(CartStorage.createEmptyCart());
        return;
      }

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (sessionId) params.set('sessionId', sessionId);

      console.log(`🛒 [Context] Fetching cart for ${userId ? `user ${userId}` : `session ${sessionId}`}`);

      const response = await fetch(`/api/cart?${params}`, {
        headers: buildHeaders()
      });
      const data: CartResponse = await response.json();

      if (data.success && data.cart) {
        const cartWithUserThreshold = updateCartWithUserThreshold(data.cart);
        setCart(cartWithUserThreshold);
        CartStorage.saveCart(cartWithUserThreshold);
        console.log(`✅ [Context] Cart loaded with ${cartWithUserThreshold.items.length} items (Shipping threshold: ₹${freeShippingThreshold})`);
      } else {
        throw new Error(data.error || 'Failed to load cart');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart';
      console.error('❌ [Context] Error loading cart:', errorMessage);
      setError(errorMessage);
      
      // Fallback to localStorage
      const localCart = CartStorage.loadCart();
      setCart(localCart || CartStorage.createEmptyCart());
    } finally {
      setLoading(false);
    }
  }, [getUserIdentifier, buildHeaders, freeShippingThreshold, updateCartWithUserThreshold, token]);

  // Add item to cart
  const addToCart = useCallback(async (
    product: Omit<CartItem, 'quantity' | 'addedAt'>, 
    quantity: number = 1
  ): Promise<void> => {
    try {
      setError(null);
      const { userId, sessionId } = getUserIdentifier();

      console.log(`🛒 [Context] Adding to cart: ${product.name} x${quantity}`);

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          productId: product.id,
          quantity,
          userId,
          sessionId
        })
      });

      const data: CartResponse = await response.json();

      if (data.success && data.cart) {
        setCart(data.cart);
        CartStorage.saveCart(data.cart);
        console.log(`✅ [Context] Added to cart: ${data.message}`);
      } else {
        throw new Error(data.error || 'Failed to add item to cart');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      console.error('❌ [Context] Error adding to cart:', errorMessage);
      setError(errorMessage);
      
      // Fallback to local state
      if (cart) {
        const updatedCart = { ...cart };
        const existingItemIndex = updatedCart.items.findIndex(item => item.id === product.id);
        
        if (existingItemIndex >= 0) {
          updatedCart.items[existingItemIndex].quantity += quantity;
        } else {
          updatedCart.items.push({
            ...product,
            quantity,
            addedAt: new Date().toISOString()
          });
        }
        
        const recalculatedCart = updateCartWithUserThreshold(updatedCart);
        setCart(recalculatedCart);
        CartStorage.saveCart(recalculatedCart);
      }
    }
  }, [cart, getUserIdentifier, buildHeaders, updateCartWithUserThreshold]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string): Promise<void> => {
    try {
      setError(null);
      const { userId, sessionId } = getUserIdentifier();

      console.log(`🛒 [Context] Removing from cart: ${itemId}`);

      const params = new URLSearchParams();
      params.set('itemId', itemId);
      if (userId) params.set('userId', userId);
      if (sessionId) params.set('sessionId', sessionId);

      const response = await fetch(`/api/cart/items?${params}`, {
        method: 'DELETE',
        headers: buildHeaders()
      });

      const data: CartResponse = await response.json();

      if (data.success && data.cart) {
        setCart(data.cart);
        CartStorage.saveCart(data.cart);
        console.log(`✅ [Context] Removed from cart: ${data.message}`);
      } else {
        throw new Error(data.error || 'Failed to remove item from cart');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      console.error('❌ [Context] Error removing from cart:', errorMessage);
      setError(errorMessage);
      
      // Fallback to local state
      if (cart) {
        const updatedCart = { ...cart };
        updatedCart.items = updatedCart.items.filter(item => item.id !== itemId);
        const recalculatedCart = updateCartWithUserThreshold(updatedCart);
        setCart(recalculatedCart);
        CartStorage.saveCart(recalculatedCart);
      }
    }
  }, [cart, getUserIdentifier, buildHeaders, updateCartWithUserThreshold]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<void> => {
    try {
      setError(null);
      const { userId, sessionId } = getUserIdentifier();

      console.log(`🛒 [Context] Updating quantity: ${itemId} -> ${quantity}`);

      const response = await fetch('/api/cart/items', {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({
          itemId,
          quantity,
          userId,
          sessionId
        })
      });

      const data: CartResponse = await response.json();

      if (data.success && data.cart) {
        setCart(data.cart);
        CartStorage.saveCart(data.cart);
        console.log(`✅ [Context] Updated quantity: ${data.message}`);
      } else {
        throw new Error(data.error || 'Failed to update item quantity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item quantity';
      console.error('❌ [Context] Error updating quantity:', errorMessage);
      setError(errorMessage);
      
      // Fallback to local state
      if (cart) {
        const updatedCart = { ...cart };
        const itemIndex = updatedCart.items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          updatedCart.items[itemIndex].quantity = quantity;
        }
        const recalculatedCart = updateCartWithUserThreshold(updatedCart);
        setCart(recalculatedCart);
        CartStorage.saveCart(recalculatedCart);
      }
    }
  }, [cart, getUserIdentifier, buildHeaders, updateCartWithUserThreshold]);

  // Clear cart
  const clearCart = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { userId, sessionId } = getUserIdentifier();

      console.log(`🛒 [Context] Clearing cart`);

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (sessionId) params.set('sessionId', sessionId);

      const response = await fetch(`/api/cart?${params}`, {
        method: 'DELETE',
        headers: buildHeaders()
      });

      const data: CartResponse = await response.json();

      if (data.success) {
        const emptyCart = CartStorage.createEmptyCart(userId);
        setCart(emptyCart);
        CartStorage.saveCart(emptyCart);
        console.log(`✅ [Context] Cart cleared`);
      } else {
        throw new Error(data.error || 'Failed to clear cart');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      console.error('❌ [Context] Error clearing cart:', errorMessage);
      setError(errorMessage);
      
      // Fallback to local state
      const emptyCart = CartStorage.createEmptyCart(user?.uid);
      setCart(emptyCart);
      CartStorage.saveCart(emptyCart);
    }
  }, [user?.uid, getUserIdentifier, buildHeaders]);

  // Sync cart when user changes
  const syncCart = useCallback(async (): Promise<void> => {
    await refreshCart();
  }, [refreshCart]);

  // Helper functions
  const getItemCount = useCallback((): number => {
    return cart ? CartCalculations.getTotalItemCount(cart.items) : 0;
  }, [cart]);

  const getSubtotal = useCallback((): number => {
    return cart?.subtotal || 0;
  }, [cart]);

  const getTotal = useCallback((): number => {
    return cart?.total || 0;
  }, [cart]);

  // Fetch free shipping threshold when user data changes
  useEffect(() => {
    fetchFreeShippingThreshold();
  }, [fetchFreeShippingThreshold]);

  // Update cart totals when free shipping threshold changes
  useEffect(() => {
    if (cart && cart.items.length > 0) {
      const updatedCart = updateCartWithUserThreshold(cart);
      if (updatedCart.shipping !== cart.shipping || updatedCart.total !== cart.total) {
        setCart(updatedCart);
        CartStorage.saveCart(updatedCart);
        console.log(`🚚 [CART] Updated shipping costs with threshold ₹${freeShippingThreshold}`);
      }
    }
  }, [cart, freeShippingThreshold, updateCartWithUserThreshold]);

  // Load cart on mount and when user changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const contextValue: CartContextType = {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getTotal,
    refreshCart,
    syncCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
