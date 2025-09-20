'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Upload } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { formatDate } from '@/lib/date-utils';

interface OrderItem {
  productId: string;
  sku: string;
  nameSnap: string;
  brandSnap: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  id: string;
  orderId: string;
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
  currency: string;
  shippingInfo: {
    fullName: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  notes?: string;
  paymentInfo?: {
    method: string;
    status: string;
  };
  createdAt: any;
  updatedAt?: any;
  user?: {
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: string;
    status: string;
    companyName?: string;
  };
}

const tabs = [
  { label: 'All' },
  { label: 'Complete' },
  { label: 'Pending' },
  { label: 'Cancelled' },
];

const OrderDetailsModal = dynamic(() => import('../components/ui/orderDetailsPage'), { ssr: false });

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { user, token, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/admin/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Error fetching orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Complete') return order.status === 'delivered';
    if (activeTab === 'Pending') return order.status === 'pending';
    if (activeTab === 'Cancelled') return order.status === 'cancelled';
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  const exportOrders = () => {
    // Create CSV content
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Company', 'Status', 'Amount', 'Items', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.orderId || order.id,
        order.user?.displayName || order.shippingInfo?.fullName || 'Unknown',
        order.user?.email || order.clientEmail || '',
        order.user?.phoneNumber || order.shippingInfo?.phone || '',
        order.user?.companyName || '',
        order.status,
        order.totals?.total || 0,
        order.items?.length || 0,
        formatDate(order.createdAt)
      ].join(','))
    ].join('\n');
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${activeTab.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-[1550px] p-8 mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-100 rounded mb-6 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xl font-bold text-black">Orders Page -</div>
          <div className="text-gray-500 text-base">Manage and track all submitted orders</div>
        </div>
        <button 
          onClick={exportOrders}
          className="flex items-center gap-2 admin-button hover:bg-[#2E318E]"
        >
          <Upload size={16} />
          Export Orders List
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`admin-button ${
              activeTab === tab.label
                ? 'bg-black text-white'
                : 'bg-[#F1F2F4] text-black'
            }`}
          >
            {tab.label} ({orders.filter(order => {
              if (tab.label === 'All') return true;
              if (tab.label === 'Complete') return order.status === 'delivered';
              if (tab.label === 'Pending') return order.status === 'pending';
              if (tab.label === 'Cancelled') return order.status === 'cancelled';
              return false;
            }).length})
          </button>
        ))}
      </div>
      {/* Filter */}
      <div className="flex justify-end mb-4">
        <button className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1">
          Filter by <span className="font-bold">Date Range</span>
          <ChevronDown size={20} />
        </button>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 font-semibold border-b">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="">
                  <td className="py-2.5 px-4 font-medium">{order.orderId || order.id}</td>
                  <td className="py-2.5 px-4">
                    {order.user?.displayName || order.shippingInfo?.fullName || 'Unknown'}
                  </td>
                  <td className="py-2.5 px-4">{order.user?.email || order.clientEmail}</td>
                  <td className="py-2.5 px-4">{order.user?.companyName || '-'}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' || order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">₹{(order.totals?.total || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-4">{order.items?.length || 0} items</td>
                  <td className="py-2.5 px-4">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-2.5 px-4">
                    <button
                      className="text-[#2E318E] font-semibold hover:underline"
                      onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-base text-gray-900">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
          <div className="flex gap-2">
            <button className="admin-button">Previous</button>
            <button className="admin-button">Next</button>
          </div>
        </div>
      </div>
      {/* Order Details Modal */}
      <OrderDetailsModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrder}
      />
    </div>
  );
}
