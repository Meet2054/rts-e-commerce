// src/lib/firebase-types.ts
import { Timestamp } from 'firebase/firestore';

// Base interfaces
export interface BaseDocument {
  id?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// User types
export interface User extends BaseDocument {
  email: string;
  role: 'admin' | 'client' | 'support';
  displayName: string;
  phoneNumber?: string;
  
  // Company Information
  companyName?: string;
  businessType?: 'manufacturer' | 'distributor' | 'retailer';
  industry?: 'office' | 'it' | 'other';
  website?: string;
  gst?: string;
  address?: string;
  
  // Business Preferences
  roleInCompany?: 'owner' | 'manager' | 'employee';
  currency?: 'INR' | 'USD' | 'EUR';
  language?: 'en' | 'hi';
  
  // Agreements
  agreedToTerms?: boolean;
  agreementDate?: Timestamp;
}

// Client/Customer types
export interface Client extends BaseDocument {
  email: string;
  name: string;
  phone?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  tags?: string[];
  active: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Product types
export interface Category extends BaseDocument {
  name: string;
  path: string[];
  attributes: string[];
}

export interface Product extends BaseDocument {
  sku: string;
  name: string;
  brand: string;
  description?: string;
  categoryId: string;
  basePrice: number; // in cents/paise
  attributes: Record<string, string[]>;
  relatedProductIds?: string[];
  active: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export interface ProductVariant extends BaseDocument {
  sku: string;
  company: string;
  color?: string;
  size?: string;
  barcode?: string;
  basePrice?: number; // optional override
  active: boolean;
}

export interface Inventory {
  onHand: number;
  reserved: number;
  reorderLevel: number;
}

// Pricing types
export interface ClientPriceOverride extends BaseDocument {
  clientId: string;
  productId: string;
  variantId?: string;
  price: number;
  currency: string;
  source: string; // e.g., "excel:uploadId"
  effectiveFrom?: Timestamp;
  effectiveTo?: Timestamp;
}

export interface PriceOverrideMeta extends BaseDocument {
  uploadedBy: string;
  filePath: string; // Storage path
  countUpdated: number;
}

// Cart types
export interface Cart {
  updatedAt: Timestamp;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  qty: number;
  priceSnap: {
    base: number;
    override?: number;
    final: number;
  };
  nameSnap: string;
  brandSnap: string;
  imageSnap?: string;
}

// Order types
export interface Order extends BaseDocument {
  orderId: string; // Unique order number
  clientId: string;
  clientEmail: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totals: {
    itemCount: number;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  currency: 'USD' | 'INR';
  shippingInfo: {
    fullName: string;
    phone: string;
    address: Address;
  };
  notes?: string;
  paymentInfo?: {
    method: 'cash_on_delivery' | 'bank_transfer' | 'card';
    status: 'pending' | 'paid' | 'failed';
    transactionId?: string;
  };
  trackingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Timestamp;
  };
}

export interface OrderItem {
  productId: string; // Firebase document ID
  sku: string; // Product SKU for identification
  variantId?: string;
  nameSnap: string;
  brandSnap: string;
  imageSnap?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

// Support ticket types
export interface SupportTicket extends BaseDocument {
  clientId: string;
  clientEmail: string;
  channel: 'chatbot' | 'email' | 'phone';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'normal' | 'high' | 'urgent';
  assigneeUserId?: string;
}

export interface TicketEvent {
  id: string;
  type: 'created' | 'note' | 'status_changed';
  byUserId?: string;
  message: string;
  at: Timestamp;
}

// Recommendations
export interface Recommendations {
  lastPurchasedProductIds: string[];
  frequentlyBoughtTogether: Record<string, string[]>;
  updatedAt: Timestamp;
}