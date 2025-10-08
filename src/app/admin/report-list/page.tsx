'use client';
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Calendar,
  BarChart3,
  PieChart,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface ReportData {
  // Overview Stats
  totalRevenue: number;
  previousMonthRevenue: number;
  totalOrders: number;
  previousMonthOrders: number;
  totalCustomers: number;
  previousMonthCustomers: number;
  totalProducts: number;
  
  // Growth Metrics
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  
  // Order Status Breakdown
  orderStatusBreakdown: {
    unprocessed: number;
    partially_processed: number;
    unprocessed_partially: number;
    archived: number;
    cancelled: number;
    merged: number;
    delivered: number;
  };
  
  // Top Products
  topProducts: Array<{
    name: string;
    sku: string;
    unitsSold: number;
    revenue: number;
  }>;
  
  // Customer Analytics
  topCustomers: Array<{
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
  
  // Monthly Trends
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  
  // Average Metrics
  averageOrderValue: number;
  averageItemsPerOrder: number;
  
  // Time Period
  reportPeriod: string;
}

interface Order {
  id: string;
  orderId: string;
  clientEmail: string;
  status: string;
  items: Array<{
    sku: string;
    nameSnap: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totals: {
    total: number;
    itemCount: number;
  };
  createdAt: any;
  user?: {
    displayName: string;
    email: string;
  };
  shippingInfo?: {
    fullName: string;
  };
}

export default function ReportsListPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const { token } = useAuth();

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Helper function to format date for API
  const formatDateForAPI = (date: Date) => {
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
  };

  // Set default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setDateRange({
      startDate: formatDateForAPI(startDate),
      endDate: formatDateForAPI(endDate)
    });
  }, []);

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (!token || !dateRange.startDate || !dateRange.endDate) return;
      
      setLoading(true);
      try {
        // Fetch orders for the selected period
        const ordersResponse = await fetch(`/api/admin/orders?limit=10000&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Fetch orders for previous period (for comparison)
        const startDateObj = new Date(dateRange.startDate);
        const endDateObj = new Date(dateRange.endDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));
        
        const prevEndDate = new Date(startDateObj);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

        const prevOrdersResponse = await fetch(`/api/admin/orders?limit=10000&startDate=${formatDateForAPI(prevStartDate)}&endDate=${formatDateForAPI(prevEndDate)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Fetch products using admin API
        const productsResponse = await fetch('/api/admin/products?limit=10000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (ordersResponse.ok && prevOrdersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const prevOrdersData = await prevOrdersResponse.json();
          
          let productsData = { products: [], pagination: { totalItems: 0 } };
          if (productsResponse.ok) {
            productsData = await productsResponse.json();
            console.log('Products API Response:', {
              productsCount: productsData.products?.length || 0,
              totalFromPagination: productsData.pagination?.totalItems || 0,
              hasProducts: !!productsData.products,
              fullResponse: productsData
            });
          } else {
            console.warn('Failed to fetch products:', productsResponse.status, productsResponse.statusText);
          }
          
          const orders: Order[] = ordersData.orders || [];
          const prevOrders: Order[] = prevOrdersData.orders || [];
          const products = productsData.products || [];

          // Calculate metrics
          const totalRevenue = orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
          const previousMonthRevenue = prevOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
          const totalOrders = orders.length;
          const previousMonthOrders = prevOrders.length;

          // Get unique customers
          const uniqueCustomers = new Set();
          const prevUniqueCustomers = new Set();
          
          orders.forEach(order => {
            const email = order.user?.email || order.clientEmail;
            if (email) uniqueCustomers.add(email);
          });
          
          prevOrders.forEach(order => {
            const email = order.user?.email || order.clientEmail;
            if (email) prevUniqueCustomers.add(email);
          });

          const totalCustomers = uniqueCustomers.size;
          const previousMonthCustomers = prevUniqueCustomers.size;

          // Calculate growth percentages
          const revenueGrowth = previousMonthRevenue > 0 ? 
            ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
          const orderGrowth = previousMonthOrders > 0 ? 
            ((totalOrders - previousMonthOrders) / previousMonthOrders) * 100 : 0;
          const customerGrowth = previousMonthCustomers > 0 ? 
            ((totalCustomers - previousMonthCustomers) / previousMonthCustomers) * 100 : 0;

          // Order status breakdown
          const orderStatusBreakdown = {
            unprocessed: orders.filter(o => o.status === 'unprocessed').length,
            partially_processed: orders.filter(o => o.status === 'partially_processed').length,
            unprocessed_partially: orders.filter(o => o.status === 'unprocessed_partially').length,
            archived: orders.filter(o => o.status === 'archived').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            merged: orders.filter(o => o.status === 'merged').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
          };

          // Top products analysis
          const productSalesMap = new Map();
          orders.forEach(order => {
            if (order.items) {
              order.items.forEach(item => {
                const key = item.sku || item.nameSnap;
                if (key) {
                  const existing = productSalesMap.get(key);
                  if (existing) {
                    existing.unitsSold += item.qty || 0;
                    existing.revenue += item.lineTotal || 0;
                  } else {
                    productSalesMap.set(key, {
                      name: item.nameSnap || 'Unknown Product',
                      sku: item.sku || key,
                      unitsSold: item.qty || 0,
                      revenue: item.lineTotal || 0
                    });
                  }
                }
              });
            }
          });

          const topProducts = Array.from(productSalesMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

          // Top customers analysis
          const customerMap = new Map();
          orders.forEach(order => {
            const email = order.user?.email || order.clientEmail;
            const name = order.user?.displayName || order.shippingInfo?.fullName || 'Unknown';
            if (email) {
              const existing = customerMap.get(email);
              if (existing) {
                existing.totalOrders += 1;
                existing.totalSpent += order.totals?.total || 0;
              } else {
                customerMap.set(email, {
                  name: name,
                  email: email,
                  totalOrders: 1,
                  totalSpent: order.totals?.total || 0
                });
              }
            }
          });

          const topCustomers = Array.from(customerMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

          // Monthly revenue trends (last 6 months)
          const monthlyRevenue = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const monthOrders = orders.filter(order => {
              let orderDate;
              if (order.createdAt && typeof order.createdAt === 'object' && '_seconds' in order.createdAt) {
                orderDate = new Date(order.createdAt._seconds * 1000);
              } else if (order.createdAt && typeof order.createdAt === 'object' && 'seconds' in order.createdAt) {
                orderDate = new Date(order.createdAt.seconds * 1000);
              } else {
                orderDate = new Date(order.createdAt);
              }
              return orderDate >= monthStart && orderDate <= monthEnd;
            });
            
            monthlyRevenue.push({
              month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              revenue: monthOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0),
              orders: monthOrders.length
            });
          }

          // Calculate averages
          const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
          const totalItems = orders.reduce((sum, order) => sum + (order.totals?.itemCount || 0), 0);
          const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

          setReportData({
            totalRevenue,
            previousMonthRevenue,
            totalOrders,
            previousMonthOrders,
            totalCustomers,
            previousMonthCustomers,
            totalProducts: productsData.pagination?.totalItems || products.length,
            revenueGrowth,
            orderGrowth,
            customerGrowth,
            orderStatusBreakdown,
            topProducts,
            topCustomers,
            monthlyRevenue,
            averageOrderValue,
            averageItemsPerOrder,
            reportPeriod: `${dateRange.startDate} to ${dateRange.endDate}`
          });
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [token, dateRange]);

  // Export all reports data
  const exportReports = async () => {
    if (!reportData || isExporting) return;
    
    setIsExporting(true);
    try {
      const csvRows: string[] = [];
      
      // Report Header
      csvRows.push('*** E-COMMERCE STORE ANALYTICS REPORT ***');
      csvRows.push(`Report Period: ${reportData.reportPeriod}`);
      csvRows.push(`Generated: ${new Date().toLocaleString()}`);
      csvRows.push('');
      
      // Overview Metrics
      csvRows.push('*** OVERVIEW METRICS ***');
      csvRows.push(`Total Revenue,${formatCurrency(reportData.totalRevenue)}`);
      csvRows.push(`Revenue Growth,${formatPercentage(reportData.revenueGrowth)}`);
      csvRows.push(`Total Orders,${reportData.totalOrders.toLocaleString()}`);
      csvRows.push(`Order Growth,${formatPercentage(reportData.orderGrowth)}`);
      csvRows.push(`Total Customers,${reportData.totalCustomers.toLocaleString()}`);
      csvRows.push(`Customer Growth,${formatPercentage(reportData.customerGrowth)}`);
      csvRows.push(`Total Products,${reportData.totalProducts.toLocaleString()}`);
      csvRows.push(`Average Order Value,${formatCurrency(reportData.averageOrderValue)}`);
      csvRows.push(`Average Items Per Order,${reportData.averageItemsPerOrder.toFixed(1)}`);
      csvRows.push('');
      
      // Order Status Breakdown
      csvRows.push('*** ORDER STATUS BREAKDOWN ***');
      csvRows.push('Status,Count,Percentage');
      Object.entries(reportData.orderStatusBreakdown).forEach(([status, count]) => {
        const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders * 100).toFixed(1) : '0';
        csvRows.push(`${status.charAt(0).toUpperCase() + status.slice(1)},${count},${percentage}%`);
      });
      csvRows.push('');
      
      // Top Products
      csvRows.push('*** TOP PRODUCTS BY REVENUE ***');
      csvRows.push('Product Name,SKU,Units Sold,Revenue');
      reportData.topProducts.forEach(product => {
        csvRows.push(`${product.name},${product.sku},${product.unitsSold},${formatCurrency(product.revenue)}`);
      });
      csvRows.push('');
      
      // Top Customers
      csvRows.push('*** TOP CUSTOMERS BY SPENDING ***');
      csvRows.push('Customer Name,Email,Total Orders,Total Spent');
      reportData.topCustomers.forEach(customer => {
        csvRows.push(`${customer.name},${customer.email},${customer.totalOrders},${formatCurrency(customer.totalSpent)}`);
      });
      csvRows.push('');
      
      // Monthly Trends
      csvRows.push('*** MONTHLY REVENUE TRENDS ***');
      csvRows.push('Month,Revenue,Orders');
      reportData.monthlyRevenue.forEach(month => {
        csvRows.push(`${month.month},${formatCurrency(month.revenue)},${month.orders}`);
      });

      // Create and download file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1550px] p-8 mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="max-w-[1550px] p-8 mx-auto">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No report data available</h3>
          <p className="text-gray-500">Please check your date range and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">Analytics & Reports</h1>
          <p className="text-gray-500">Comprehensive insights into your store performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <button
            onClick={exportReports}
            disabled={isExporting}
            className={`flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {formatCurrency(reportData.totalRevenue)}
          </div>
          <div className={`flex items-center text-sm ${
            reportData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {reportData.revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {formatPercentage(reportData.revenueGrowth)} vs previous period
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {reportData.totalOrders.toLocaleString()}
          </div>
          <div className={`flex items-center text-sm ${
            reportData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {reportData.orderGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {formatPercentage(reportData.orderGrowth)} vs previous period
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Customers</h3>
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {reportData.totalCustomers.toLocaleString()}
          </div>
          <div className={`flex items-center text-sm ${
            reportData.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {reportData.customerGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {formatPercentage(reportData.customerGrowth)} vs previous period
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {reportData.totalProducts.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            Active in catalog
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Avg Order Value</h3>
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {formatCurrency(reportData.averageOrderValue)}
          </div>
          <div className="text-sm text-gray-500">
            Per order average
          </div>
        </div>

        {/* Average Items Per Order */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Avg Items/Order</h3>
            <PieChart className="h-5 w-5 text-teal-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {reportData.averageItemsPerOrder.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">
            Items per order
          </div>
        </div>

        {/* Order Status Breakdown Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Delivered Orders</h3>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {reportData.orderStatusBreakdown.delivered}
          </div>
          <div className="text-sm text-gray-500">
            {reportData.totalOrders > 0 ? 
              ((reportData.orderStatusBreakdown.delivered / reportData.totalOrders) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Unprocessed Orders</h3>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {reportData.orderStatusBreakdown.unprocessed}
          </div>
          <div className="text-sm text-gray-500">
            {reportData.totalOrders > 0 ? 
              ((reportData.orderStatusBreakdown.unprocessed / reportData.totalOrders) * 100).toFixed(1) : 0}% of total
          </div>
        </div>
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-black mb-6">Monthly Revenue Trend</h3>
          <div className="space-y-4">
            {reportData.monthlyRevenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-black">
                    {formatCurrency(month.revenue)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {month.orders} orders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-black mb-6">Order Status Distribution</h3>
          <div className="space-y-4">
            {Object.entries(reportData.orderStatusBreakdown).map(([status, count]) => {
              const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders) * 100 : 0;
              const colors = {
                unprocessed: 'bg-yellow-500',
                partially_processed: 'bg-blue-500',
                unprocessed_partially: 'bg-orange-500',
                archived: 'bg-gray-500',
                merged: 'bg-purple-500',
                delivered: 'bg-green-500',
                cancelled: 'bg-red-500'
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors]}`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-black">{count}</div>
                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products and Customers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-black mb-6">Top Products by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 font-medium border-b">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Units Sold</th>
                  <th className="pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topProducts.slice(0, 8).map((product, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-black">{product.name}</div>
                        <div className="text-gray-500 text-xs">SKU: {product.sku}</div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-700">{product.unitsSold}</td>
                    <td className="py-3 font-medium text-black">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-black mb-6">Top Customers by Spending</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 font-medium border-b">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Orders</th>
                  <th className="pb-3">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topCustomers.slice(0, 8).map((customer, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-black">{customer.name}</div>
                        <div className="text-gray-500 text-xs">{customer.email}</div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-700">{customer.totalOrders}</td>
                    <td className="py-3 font-medium text-black">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
