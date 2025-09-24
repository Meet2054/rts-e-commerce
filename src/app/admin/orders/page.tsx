'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Upload, Loader2 } from 'lucide-react';
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
  createdAt: Date | string | { seconds: number; nanoseconds: number } | { toDate(): Date };
  updatedAt?: Date | string | { seconds: number; nanoseconds: number } | { toDate(): Date };
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
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  // Pagination state - server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCounts, setTabCounts] = useState({
    All: 0,
    Complete: 0,
    Pending: 0,
    Cancelled: 0
  });

  const { token } = useAuth();

  // Fetch tab counts on initial load
  useEffect(() => {
    const fetchCounts = async () => {
      if (!token) return;
      
      try {
        const promises = [
          fetch(`/api/admin/orders?page=1&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/admin/orders?page=1&limit=1&status=delivered`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/admin/orders?page=1&limit=1&status=pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/admin/orders?page=1&limit=1&status=cancelled`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ];

        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(r => r.json()));

        setTabCounts({
          All: data[0]?.total || 0,
          Complete: data[1]?.total || 0,
          Pending: data[2]?.total || 0,
          Cancelled: data[3]?.total || 0
        });
      } catch (err) {
        console.error('Error fetching tab counts:', err);
      }
    };

    fetchCounts();
  }, [token]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Build query parameters for server-side filtering and pagination
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: ordersPerPage.toString()
        });

        // Add status filter if not 'All'
        if (activeTab !== 'All') {
          let statusValue = '';
          if (activeTab === 'Complete') statusValue = 'delivered';
          else if (activeTab === 'Pending') statusValue = 'pending';
          else if (activeTab === 'Cancelled') statusValue = 'cancelled';
          
          if (statusValue) {
            queryParams.append('status', statusValue);
          }
        }

        // Add date range filters if present
        if (dateRange.startDate) {
          queryParams.append('startDate', dateRange.startDate);
        }
        if (dateRange.endDate) {
          queryParams.append('endDate', dateRange.endDate);
        }

        const response = await fetch(`/api/admin/orders?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const fetchedOrders = data.orders || [];
          
          setOrders(fetchedOrders);
          setTotalOrders(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setError('');
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
  }, [token, currentPage, ordersPerPage, activeTab, dateRange]); // Fetch when any of these change

  const refreshOrders = async () => {
    if (!token) return;
    try {
      // Build query parameters for server-side filtering and pagination
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ordersPerPage.toString()
      });

      // Add status filter if not 'All'
      if (activeTab !== 'All') {
        let statusValue = '';
        if (activeTab === 'Complete') statusValue = 'delivered';
        else if (activeTab === 'Pending') statusValue = 'pending';
        else if (activeTab === 'Cancelled') statusValue = 'cancelled';
        
        if (statusValue) {
          queryParams.append('status', statusValue);
        }
      }

      // Add date range filters if present
      if (dateRange.startDate) {
        queryParams.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        queryParams.append('endDate', dateRange.endDate);
      }

      const response = await fetch(`/api/admin/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedOrders = data.orders || [];
        setOrders(fetchedOrders);
        setTotalOrders(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  // Orders are now filtered server-side, no client-side filtering needed

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setLoading(true); // Show loading when changing page
    setCurrentPage(page);
    // The useEffect will automatically fetch new data when currentPage changes
  };

  const handleTabChange = (tabLabel: string) => {
    setLoading(true); // Show loading when changing tab
    setActiveTab(tabLabel);
    setCurrentPage(1); // Reset to first page when changing tabs
    // The useEffect will automatically fetch new data when activeTab changes
  };

  const handleDateRangeChange = (newDateRange: { startDate: string; endDate: string }) => {
    setDateRange(newDateRange);
    setCurrentPage(1); // Reset to first page when changing date range
    // The useEffect will automatically fetch new data when dateRange changes
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Close date filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.date-filter-dropdown')) {
        setShowDateFilter(false);
      }
    };

    if (showDateFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateFilter]);

  // Helper function to set date range presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    const startDate = new Date();

    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'clear':
        setDateRange({ startDate: '', endDate: '' });
        break;
    }
    setShowDateFilter(false);
  };

  const exportOrders = () => {
    // Create CSV content
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Company', 'Status', 'Amount', 'Items', 'Date'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
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
          <div className="text-gray-500 text-base">
            {loading ? 'Loading orders...' : 'Manage and track all submitted orders'}
          </div>
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
            onClick={() => handleTabChange(tab.label)}
            disabled={loading}
            className={`admin-button ${
              activeTab === tab.label
                ? 'bg-black text-white'
                : 'bg-[#F1F2F4] text-black'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tab.label} ({tabCounts[tab.label as keyof typeof tabCounts]})
          </button>
        ))}
      </div>
      {/* Filter */}
      <div className="flex justify-end mb-4 items-center gap-2">
        {/* Date Range Inputs */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Start Date"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="End Date"
          />
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative date-filter-dropdown">
          <button 
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg"
          >
            Quick Filter
            <ChevronDown size={16} />
          </button>
          
          {showDateFilter && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => setDatePreset('today')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Today
                </button>
                <button
                  onClick={() => setDatePreset('week')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDatePreset('month')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDatePreset('clear')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {(dateRange.startDate || dateRange.endDate) && (
          <button 
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 rounded-lg"
          >
            Clear Dates
          </button>
        )}
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
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-gray-500">Loading orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order: Order) => (
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
            {loading ? 'Loading...' : `Showing ${((currentPage - 1) * ordersPerPage) + 1}-${Math.min(currentPage * ordersPerPage, totalOrders)} of ${totalOrders} orders`}
          </span>
          <div className="flex gap-2 items-center">
            <button 
              onClick={prevPage}
              disabled={currentPage === 1 || loading}
              className={`admin-button ${
                currentPage === 1 || loading
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {totalPages > 1 && (
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  if (pageNumber < 1 || pageNumber > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                      className={`px-3 py-2.5 rounded border-2 text-sm font-medium transition-colors ${
                        currentPage === pageNumber
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-[#F1F2F4] hover:bg-gray-50 cursor-pointer'
                      } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            )}
            
            <button 
              onClick={nextPage}
              disabled={currentPage === totalPages || orders.length === 0 || loading}
              className={`admin-button ${
                currentPage === totalPages || orders.length === 0 || loading
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* Order Details Modal */}
      <OrderDetailsModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrder}
        onOrderUpdate={refreshOrders}
      />
    </div>
  );
}
