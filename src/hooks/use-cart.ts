// src/hooks/use-cart.ts
import { useContext } from 'react';
import { CartContext } from '@/context/CartContext';

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}

export function useCartSummary() {
  const cart = useCart();
  
  return {
    itemCount: cart.getItemCount(),
    subtotal: cart.getSubtotal(),
    total: cart.getTotal(),
    isEmpty: cart.cart?.items.length === 0,
    hasItems: (cart.cart?.items.length || 0) > 0,
    tax: cart.cart?.tax || 0,
    shipping: cart.cart?.shipping || 0,
    currency: cart.cart?.currency || 'AUD'
  };
}

export function useCartActions() {
  const cart = useCart();
  
  return {
    addToCart: cart.addToCart,
    removeFromCart: cart.removeFromCart,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    refreshCart: cart.refreshCart,
    syncCart: cart.syncCart
  };
}

export function useCartState() {
  const cart = useCart();
  
  return {
    cart: cart.cart,
    loading: cart.loading,
    error: cart.error,
    items: cart.cart?.items || []
  };
}
