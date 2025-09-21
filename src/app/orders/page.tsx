// src/app/orders/page.tsx
'use client';
import React, { useState, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';
import OrdersList from "./components/OrdersList";

export default function OrdersPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const ordersListRef = useRef<any>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (ordersListRef.current) {
        await ordersListRef.current.refreshOrders();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-3 bg-[#F1F2F4]">
      
      <div className="min-h-screen">
        <div className="max-w-[1550px] px-4 md:px-12 lg:px-16 mx-auto py-10">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                <p className="text-gray-600 mt-2">Track and manage your order history</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          <OrdersList ref={ordersListRef} />
        </div>
      </div>
     
    </div>
  );
}
