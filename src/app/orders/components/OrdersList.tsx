"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';
import { Order } from '@/lib/firebase-types';
import { Loader2, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';
import { getProductImageUrlQuick } from '@/lib/product-image-utils';

interface OrdersListState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  reorderingOrderId: string | null;
}

export interface OrdersListRef {
  refreshOrders: () => Promise<void>;
}

const OrdersList = forwardRef<OrdersListRef>((props, ref) => {
  const { user } = useAuth();
  const [state, setState] = useState<OrdersListState>({
    orders: [],
    loading: true,
    error: null,
    reorderingOrderId: null
  });

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`/api/orders?userId=${user.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          orders: data.orders || [],
          loading: false
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load orders'
      }));
    }
  }, [user]);

  const handleReorder = async (order: Order) => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, reorderingOrderId: order.id || order.orderId }));
      
      console.log('🔄 [Reorder] Starting reorder for:', order.orderId);

      // Prepare the new order data with correct field mapping for API
      const newOrderData = {
        clientId: user.uid,
        clientEmail: user.email || order.clientEmail,
        items: order.items.map(item => ({
          id: item.productId,
          sku: item.sku,
          name: item.nameSnap,
          brand: item.brandSnap,
          image: item.imageSnap,
          quantity: item.qty,
          price: item.unitPrice
        })),
        subtotal: order.totals.subtotal,
        tax: order.totals.tax,
        shipping: order.totals.shipping,
        total: order.totals.total,
        currency: order.currency || 'USD',
        shippingAddress: {
          fullName: order.shippingInfo.fullName,
          phone: order.shippingInfo.phone || '',
          addressLine1: order.shippingInfo.address.street,
          addressLine2: '', // Add empty string for addressLine2 if not present
          city: order.shippingInfo.address.city,
          state: order.shippingInfo.address.state,
          postalCode: order.shippingInfo.address.zipCode,
          country: order.shippingInfo.address.country || 'USA'
        },
        notes: `Reorder of ${order.orderId}`,
        userId: user.uid,
        userEmail: user.email || order.clientEmail
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrderData)
      });

      const data = await response.json();
      console.log('📥 [Reorder] API Response:', data);

      if (data.success) {
        console.log('✅ [Reorder] New order created:', data.orderId);
        
        // Show success message
        alert(`Order successfully reordered! New order ID: ${data.orderId}`);
        
        // Refresh the orders list to show the new order
        await fetchOrders();
      } else {
        console.error('❌ [Reorder] API Error Response:', data);
        throw new Error(data.error || data.details || 'Failed to create reorder');
      }
    } catch (error) {
      console.error('❌ [Reorder] Error:', error);
      alert(`Failed to reorder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setState(prev => ({ ...prev, reorderingOrderId: null }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Expose fetchOrders function to parent component via ref
  useImperativeHandle(ref, () => ({
    refreshOrders: fetchOrders
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-purple-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-900';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading your orders...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-800 font-semibold mb-2">Error Loading Orders</div>
        <div className="text-red-600 mb-4">{state.error}</div>
        <button
          onClick={fetchOrders}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No orders state
  if (state.orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
        <p className="text-gray-600 mb-6">
          You haven&apos;t placed any orders yet. Start shopping to see your orders here!
        </p>
        <Link
          href="/products"
          className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 inline-block"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state.orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Order Header */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(order.status)}
                <div className='flex'>
                  <div>
                  <h3 className="font-semibold text-lg">Order {order.orderId}</h3>
                  <p className="text-sm text-gray-600">
                    Placed on {formatDateTime(order.createdAt)}
                  </p>
                  </div>
                  <button 
                    className={`admin-button ml-8 flex items-center gap-2 ${
                      state.reorderingOrderId === (order.id || order.orderId) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                    onClick={() => handleReorder(order)}
                    disabled={state.reorderingOrderId === (order.id || order.orderId)}
                  >
                    {state.reorderingOrderId === (order.id || order.orderId) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reordering...
                      </>
                    ) : (
                      'Re Order'
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {order.currency === 'USD' ? '$' : '₹'}{order.totals.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.totals.itemCount} {order.totals.itemCount === 1 ? 'item' : 'items'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6">
            <div className="space-y-4">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    {item.imageSnap ? (
                      <Image
                        src={getProductImageUrlQuick(item.sku)}
                        alt={item.nameSnap}
                        fill
                        className="object-contain p-1"
                        onError={(e) => {
                          // Show 'image not available' on error
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center p-1">
                                <svg class="w-4 h-4 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span class="text-xs text-gray-400">No image</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.nameSnap}</h4>
                    <p className="text-xs text-gray-600">
                      SKU: {item.sku} • Qty: {item.qty}
                    </p>
                    {item.brandSnap && (
                      <p className="text-xs text-gray-500">{item.brandSnap}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {order.currency === 'USD' ? '$' : '₹'}{item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
              
              {order.items.length > 3 && (
                <div className="text-sm text-gray-600 text-center py-2 border-t">
                  +{order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                </div>
              )}
            </div>

            {/* Shipping Information */}
            {order.shippingInfo && (
              <div className="mt-6 pt-4 border-t">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-sm mb-2">Shipping Address</h5>
                    <div className="text-sm text-gray-600">
                      <div>{order.shippingInfo.fullName}</div>
                      <div>{order.shippingInfo.address.street}</div>
                      <div>
                        {order.shippingInfo.address.city}, {order.shippingInfo.address.state} {order.shippingInfo.address.zipCode}
                      </div>
                      <div>{order.shippingInfo.address.country}</div>
                      {order.shippingInfo.phone && (
                        <div className="mt-1">📞 {order.shippingInfo.phone}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-2">Order Summary</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{order.currency === 'USD' ? '$' : '₹'}{order.totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span>{order.currency === 'USD' ? '$' : '₹'}{order.totals.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span>
                          {order.totals.shipping === 0 ? (
                            <span className="text-green-600 font-medium">FREE</span>
                          ) : (
                            `${order.currency === 'USD' ? '$' : '₹'}${order.totals.shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1 border-t">
                        <span>Total:</span>
                        <span>{order.currency === 'USD' ? '$' : '₹'}{order.totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Information */}
            {order.trackingInfo && order.trackingInfo.trackingNumber && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Tracking Number: {order.trackingInfo.trackingNumber}
                  </span>
                </div>
                {order.trackingInfo.estimatedDelivery && (
                  <div className="text-xs text-green-700 mt-1">
                    Estimated delivery: {formatDateTime(order.trackingInfo.estimatedDelivery)}
                  </div>
                )}
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Notes: </span>
                  <span className="text-gray-600">{order.notes}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Load More Button (if needed) */}
      {state.orders.length >= 10 && (
        <div className="text-center">
          <button
            onClick={fetchOrders}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200"
          >
            Load More Orders
          </button>
        </div>
      )}
    </div>
  );
});

OrdersList.displayName = 'OrdersList';

export default OrdersList;
