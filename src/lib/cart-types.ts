// src/lib/cart-types.ts
export interface CartItem {
  id: string;
  sku: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  brand?: string;
  category?: string;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  
  // Cart Actions
  addToCart: (product: Omit<CartItem, 'quantity' | 'addedAt'>, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Cart Calculations
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  
  // Cart Persistence
  refreshCart: () => Promise<void>;
  syncCart: () => Promise<void>;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart?: Cart;
  message?: string;
  error?: string;
}

// Order related types
export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  userId?: string;
  sessionId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
