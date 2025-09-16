// src/lib/firebase-orders.ts
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Order, OrderItem, CartItem } from './firebase-types';
import CachedFirebaseService from './firebase-cache';
import { RedisCache, CacheKeys } from './redis-cache';

export class OrderService {
  static async createOrder(orderData: {
    clientId: string;
    clientEmail: string;
    cartItems: CartItem[];
    shippingInfo: Order['shippingInfo'];
  }): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Calculate totals
      const totalItems = orderData.cartItems.reduce((sum, item) => sum + item.qty, 0);
      const subtotal = orderData.cartItems.reduce((sum, item) => sum + item.priceSnap.final * item.qty, 0);

      // Create order document
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        clientId: orderData.clientId,
        clientEmail: orderData.clientEmail,
        status: 'placed',
        totals: {
          items: totalItems,
          subtotal: subtotal
        },
        shippingInfo: orderData.shippingInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create order items
      orderData.cartItems.forEach((cartItem) => {
        const itemRef = doc(collection(db, 'orders', orderRef.id, 'items'));
        batch.set(itemRef, {
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          nameSnap: cartItem.nameSnap,
          brandSnap: cartItem.brandSnap,
          imageSnap: cartItem.imageSnap,
          qty: cartItem.qty,
          unitPrice: cartItem.priceSnap.final,
          lineTotal: cartItem.priceSnap.final * cartItem.qty,
        });
      });

      await batch.commit();
      
      // Invalidate user orders cache
      await CachedFirebaseService.invalidateUserOrders(orderData.clientEmail);
      
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  static async getClientOrders(clientId: string): Promise<Order[]> {
    try {
      // Use cached service for better performance
      return await CachedFirebaseService.getUserOrders(clientId);
    } catch (error) {
      console.error('Error fetching client orders:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp(),
      });
      
      // Invalidate order cache
      await CachedFirebaseService.invalidateOrder(orderId);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const snapshot = await getDocs(collection(db, 'orders', orderId, 'items'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productId: data.productId,
          nameSnap: data.nameSnap,
          brandSnap: data.brandSnap,
          qty: data.qty,
          unitPrice: data.unitPrice,
          lineTotal: data.lineTotal,
          imageSnap: data.imageSnap,
          variantId: data.variantId,
        } as OrderItem;
      });
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  }
}