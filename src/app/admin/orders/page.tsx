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

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 15) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportOrders = async () => {
    if (!token || isExporting) return;
    
    setIsExporting(true);
    try {
      // Build query parameters for fetching ALL orders with current filters
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10000' // Large limit to get all orders
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

      console.log('Exporting orders with filters:', queryParams.toString());

      const response = await fetch(`/api/admin/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders for export');
      }

      const data = await response.json();
      const allFilteredOrders = data.orders || [];

      console.log(`Exporting ${allFilteredOrders.length} orders`);

      // Helper function to safely format date
      const formatDateForCSV = (dateField: any) => {
        try {
          if (!dateField) return '';
          
          // Handle Firebase Timestamp format
          if (dateField && typeof dateField === 'object' && dateField._seconds) {
            return new Date(dateField._seconds * 1000).toLocaleDateString();
          }
          
          // Handle regular date
          if (dateField.toDate && typeof dateField.toDate === 'function') {
            return dateField.toDate().toLocaleDateString();
          }
          
          return new Date(dateField).toLocaleDateString();
        } catch (error) {
          console.error('Date formatting error:', error);
          return '';
        }
      };

      // Helper function to escape CSV values
      const escapeCSV = (value: any) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Create structured CSV content with section-based format for each order
      const csvRows: string[] = [];
      
      allFilteredOrders.forEach((order: Order, orderIndex: number) => {
        // Add separator between orders (except for first order)
        if (orderIndex > 0) {
          csvRows.push(''); // Empty row for separation
          csvRows.push(''); // Extra empty row for better separation
        }
        
        // ORDER INFORMATION Section
        csvRows.push('*** ORDER INFORMATION ***');
        csvRows.push(`Order ID,${escapeCSV(order.orderId || order.id)}`);
        csvRows.push(`Status,${escapeCSV(order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '')}`);
        csvRows.push(`Created Date,${escapeCSV(formatDateForCSV(order.createdAt))}`);
        csvRows.push(`Currency,${escapeCSV(order.currency || 'USD')}`);
        
        // Empty row
        csvRows.push('');
        
        // CUSTOMER INFORMATION Section
        csvRows.push('CUSTOMER INFORMATION');
        csvRows.push(`Name,${escapeCSV(order.user?.displayName || order.shippingInfo?.fullName || 'Unknown')}`);
        csvRows.push(`Email,${escapeCSV(order.user?.email || order.clientEmail || '')}`);
        csvRows.push(`Phone,${escapeCSV(order.user?.phoneNumber || order.shippingInfo?.phone || '')}`);
        csvRows.push(`Company,${escapeCSV(order.user?.companyName || '')}`);
        
        // Empty row
        csvRows.push('');
        
        // SHIPPING ADDRESS Section
        csvRows.push('SHIPPING ADDRESS');
        csvRows.push(`Street,${escapeCSV(order.shippingInfo?.address?.street || '')}`);
        csvRows.push(`City,${escapeCSV(order.shippingInfo?.address?.city || '')},${escapeCSV(order.shippingInfo?.address?.state || '')}`);
        csvRows.push(`State,${escapeCSV(order.shippingInfo?.address?.state || '')}`);
        csvRows.push(`ZIP Code,${escapeCSV(order.shippingInfo?.address?.zipCode || '')}`);
        csvRows.push(`Country,${escapeCSV(order.shippingInfo?.address?.country || '')}`);
        
        // Empty row
        csvRows.push('');
        
        // ORDER ITEMS Section
        csvRows.push('ORDER ITEMS');
        csvRows.push('SKU,Product Name,Brand,Quantity,Unit Price,Line Total');
        
        if (order.items && order.items.length > 0) {
          order.items.forEach((item) => {
            csvRows.push(`${escapeCSV(item.sku || '')},${escapeCSV(item.nameSnap || 'Unknown Product')},${escapeCSV(item.brandSnap || '')},${escapeCSV(item.qty || 0)},${escapeCSV(item.unitPrice || 0)},${escapeCSV(item.lineTotal || 0)}`);
          });
        } else {
          csvRows.push('No items in this order');
        }
        
        // Empty row
        csvRows.push('');
        
        // ORDER TOTALS Section
        csvRows.push('ORDER TOTALS');
        csvRows.push(`Item Count,${escapeCSV(order.items?.length || 0)}`);
        csvRows.push(`Subtotal,${escapeCSV(order.totals?.subtotal || 0)}`);
        csvRows.push(`Tax,${escapeCSV(order.totals?.tax || 0)}`);
        csvRows.push(`Shipping,${escapeCSV(order.totals?.shipping || 0)}`);
        csvRows.push(`Total,${escapeCSV(order.totals?.total || 0)}`);
        
        // Add payment information if available
        if (order.paymentInfo?.method || order.paymentInfo?.status) {
          csvRows.push('');
          csvRows.push('PAYMENT INFORMATION');
          csvRows.push(`Payment Method,${escapeCSV(order.paymentInfo?.method || '')}`);
          csvRows.push(`Payment Status,${escapeCSV(order.paymentInfo?.status || '')}`);
        }
        
        // Add notes if available
        if (order.notes) {
          csvRows.push('');
          csvRows.push('ORDER NOTES');
          csvRows.push(`Notes,${escapeCSV(order.notes)}`);
        }
      });

      const csvContent = csvRows.join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create filename with filter info
      let filename = 'orders';
      if (activeTab !== 'All') {
        filename += `-${activeTab.toLowerCase()}`;
      }
      if (dateRange.startDate || dateRange.endDate) {
        filename += '-filtered';
      }
      filename += `-${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('Orders export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export orders. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xl font-bold text-black">Orders Page -</div>
          <div className="text-gray-500 text-base">
            {loading ? (
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            ) : (
              'Manage and track all submitted orders'
            )}
          </div>
        </div>
        <button 
          onClick={exportOrders}
          disabled={isExporting}
          className={`flex items-center gap-2 admin-button hover:bg-[#2E318E] ${
            isExporting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload size={16} />
          {isExporting ? 'Exporting...' : 'Export Orders List'}
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
            className={`px-4 py-2.5 border-2 border-gray-300 rounded-md text-base cursor-pointer font-medium transition-colors ${
              activeTab === tab.label
                ? 'bg-black text-white'
                : 'bg-white hover:bg-black hover:text-white text-black'
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
            <tr className="text-center text-gray-500 font-semibold border-b">
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
              // Skeleton loading rows
              [...Array(10)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-14"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order: Order) => (
                <tr key={order.id} className="text-center">
                  <td className="py-2.5 px-4 font-medium">{order.orderId || order.id}</td>
                  <td className="py-2.5 px-4">
                    {order.user?.displayName || order.shippingInfo?.fullName || 'Unknown'}
                  </td>
                  <td className="py-2.5 px-4" title={order.user?.email || order.clientEmail || ''}>
                    {truncateText(order.user?.email || order.clientEmail || '', 15)}
                  </td>
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
                  <td className="py-2.5 px-4">${(order.totals?.total || 0).toLocaleString()}</td>
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
            {loading ? (
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            ) : (
              `Showing ${((currentPage - 1) * ordersPerPage) + 1}-${Math.min(currentPage * ordersPerPage, totalOrders)} of ${totalOrders} orders`
            )}
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
            {loading ? (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={`skeleton-page-${i}`} className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : totalPages > 1 ? (
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
            ) : null}
            
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
