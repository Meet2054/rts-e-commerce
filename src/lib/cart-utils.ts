// src/lib/cart-utils.ts
import { Cart, CartItem } from './cart-types';
import { clientLogger } from './client-logger';

export class CartCalculations {
  static calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  static calculateTax(subtotal: number, taxRate: number = 0.10): number {
    return subtotal * taxRate;
  }

  static calculateShipping(subtotal: number, freeShippingThreshold: number = 1000): number {
    return subtotal >= freeShippingThreshold ? 0 : 10.00;
  }

  static calculateTotal(subtotal: number, tax: number, shipping: number): number {
    return subtotal + tax + shipping;
  }

  static getTotalItemCount(items: CartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0);
  }

  static updateCartTotals(cart: Cart): Cart {
    const subtotal = this.calculateSubtotal(cart.items);
    const tax = this.calculateTax(subtotal);
    const shipping = this.calculateShipping(subtotal);
    const total = this.calculateTotal(subtotal, tax, shipping);

    return {
      ...cart,
      subtotal,
      tax,
      shipping,
      total,
      updatedAt: new Date().toISOString()
    };
  }
}

export class CartValidation {
  static validateCartItem(item: Omit<CartItem, 'addedAt'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.id || item.id.trim() === '') {
      errors.push('Product ID is required');
    }

    if (!item.sku || item.sku.trim() === '') {
      errors.push('Product SKU is required');
    }

    if (!item.name || item.name.trim() === '') {
      errors.push('Product name is required');
    }

    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push('Product price must be a positive number');
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      errors.push('Quantity must be a positive integer');
    }

    if (item.quantity > 100) {
      errors.push('Quantity cannot exceed 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateQuantityUpdate(quantity: number): { isValid: boolean; error?: string } {
    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return { isValid: false, error: 'Quantity must be a positive integer' };
    }

    if (quantity > 100) {
      return { isValid: false, error: 'Quantity cannot exceed 100' };
    }

    return { isValid: true };
  }
}

export class CartStorage {
  private static CART_KEY = 'rts_cart';
  private static SESSION_KEY = 'rts_session_id';

  static getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  static saveCart(cart: Cart): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    } catch (error) {
      clientLogger.error('Failed to save cart to localStorage:', error);
    }
  }

  static loadCart(): Cart | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.CART_KEY);
      if (!stored) return null;
      
      const cart = JSON.parse(stored) as Cart;
      // Validate cart structure
      if (!cart.id || !Array.isArray(cart.items)) {
        this.clearCart();
        return null;
      }
      
      return cart;
    } catch (error) {
      clientLogger.error('Failed to load cart from localStorage:', error);
      this.clearCart();
      return null;
    }
  }

  static clearCart(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.CART_KEY);
  }

  static createEmptyCart(userId?: string): Cart {
    const sessionId = this.getSessionId();
    return {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: userId || null, // Use null instead of undefined for Firestore
      sessionId: !userId ? sessionId : null, // Only use sessionId if no userId
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
