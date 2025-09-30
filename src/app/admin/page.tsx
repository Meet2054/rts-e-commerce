'use client';
import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/date-utils';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface Product {
  name: string;
  sku: string;
}

interface TopProduct {
  name: string;
  orders: number;
  sku: string;
  totalSold: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  email: string;
  companyName?: string;
  totalAmount: number;
  itemCount: number;
  createdAt: Date | string | { seconds: number; nanoseconds: number } | { toDate(): Date };
  user?: {
    email: string;
    displayName: string;
    phoneNumber?: string;
    companyName?: string;
  };
  shippingInfo?: {
    fullName: string;
    phone: string;
  };
  totals?: {
    total: number;
  };
  items?: { id: string; name: string; qty: number }[];
}

const chartData = [
  { month: "Jan", value: 35 },
  { month: "Feb", value: 28 },
  { month: "Mar", value: 55 },
  { month: "Apr", value: 62 },
  { month: "May", value: 67 },
  { month: "Jun", value: 22 },
  { month: "Jul", value: 18 },
  { month: "Aug", value: 80 }, // highlight
  { month: "Sep", value: 60 },
  { month: "Oct", value: 65 },
  { month: "Nov", value: 25 },
  { month: "Dec", value: 40 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const router = useRouter();

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        // Get today's date in YYYY-MM-DD format for API filtering
        const today = new Date();
        const todayString = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
        
        // Fetch dashboard stats and recent data
        const [ordersRes, todayOrdersRes, productsRes] = await Promise.all([
          fetch('/api/admin/orders?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/admin/orders?startDate=${todayString}&endDate=${todayString}&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/products?limit=20', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (ordersRes.ok && todayOrdersRes.ok) {
          const ordersData = await ordersRes.json();
          const todayOrdersData = await todayOrdersRes.json();
          const orders = ordersData.orders || [];
          const todayOrders = todayOrdersData.orders || [];
          
          console.log('Dashboard API Results:', {
            totalOrders: orders.length,
            todayOrdersFromAPI: todayOrders.length,
            todayDateFilter: todayString
          });

          setStats({
            totalOrders: orders.length,
            todayOrders: todayOrders.length, // Use API filtered count
            totalRevenue: orders.reduce((sum: number, order: RecentOrder) => 
              sum + (order.totals?.total || order.totalAmount || 0), 0),
            pendingOrders: orders.filter((order: RecentOrder) => order.status === 'pending').length
          });

          // Set recent orders - map to the structure we need for display
          setRecentOrders(orders.slice(0, 3).map((order: RecentOrder) => ({
            id: order.id,
            orderId: order.orderId || order.id,
            status: order.status,
            customerName: order.user?.displayName || order.shippingInfo?.fullName || 'Unknown',
            email: order.user?.email || order.email || '',
            companyName: order.user?.companyName || order.companyName || '',
            totalAmount: order.totals?.total || order.totalAmount || 0,
            itemCount: order.items?.length || 0,
            createdAt: order.createdAt,
            user: order.user,
            shippingInfo: order.shippingInfo,
            totals: order.totals,
            items: order.items
          })));

          // Process top products from order data (similar to BestSelling component)
          const productSalesMap = new Map<string, {
            name: string;
            sku: string;
            totalSold: number;
            orderCount: number;
            revenue: number;
          }>();

          orders.forEach((order: RecentOrder) => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: { 
                sku?: string; 
                productId?: string; 
                id?: string; 
                qty?: number; 
                quantity?: number; 
                unitPrice?: number; 
                price?: number; 
                nameSnap?: string; 
              }) => {
                const productKey = item.sku || item.productId || item.id;
                const quantity = item.qty || item.quantity || 1;
                const unitPrice = item.unitPrice || item.price || 0;
                
                if (productKey && item.nameSnap) {
                  const existing = productSalesMap.get(productKey);
                  if (existing) {
                    existing.totalSold += quantity;
                    existing.orderCount += 1;
                    existing.revenue += (unitPrice * quantity);
                  } else {
                    productSalesMap.set(productKey, {
                      name: item.nameSnap || 'Unknown Product',
                      sku: productKey,
                      totalSold: quantity,
                      orderCount: 1,
                      revenue: unitPrice * quantity
                    });
                  }
                }
              });
            }
          });

          // Convert to array and sort by total units sold
          const sortedProducts = Array.from(productSalesMap.values())
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 3)
            .map(item => ({
              name: item.name,
              orders: item.orderCount,
              sku: item.sku,
              totalSold: item.totalSold,
              revenue: item.revenue
            }));

          setTopProducts(sortedProducts);
        }

        // Fallback to mock products if no order data
        if (productsRes.ok && topProducts.length === 0) {
          const productsData = await productsRes.json();
          const products = productsData.products || [];
          setTopProducts(products.slice(0, 3).map((product: Product) => ({
            name: product.name,
            orders: Math.floor(Math.random() * 50) + 10,
            sku: product.sku,
            totalSold: Math.floor(Math.random() * 200) + 50,
            revenue: Math.floor(Math.random() * 100000) + 10000
          })));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, topProducts.length]);

  if (loading) {
    return (
      <div className="max-w-[1550px] p-8 mx-auto">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className='flex flex-row justify-between items-center mb-6'>
            <div className='flex flex-col'>
              <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-72"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-36"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="flex gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-9 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex-1">
              <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-9 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          </div>

          {/* Charts and Top Products Skeleton */}
          <div className="flex w-full gap-6 mb-8">
            {/* Monthly Chart Skeleton */}
            <div className="bg-white w-[70%] border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="flex items-end justify-between h-52 px-2">
                {[...Array(12)].map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gray-200 rounded-t"
                      style={{ height: `${Math.random() * 80 + 20}px` }}
                    ></div>
                    <div className="h-3 bg-gray-200 rounded w-6 mt-2"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products Skeleton */}
            <div className="bg-white w-[30%] border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="space-y-6">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-10"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders Skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
            
            {/* Table Header Skeleton */}
            <div className="overflow-x-auto">
              <div className="border-b pb-2 mb-4">
                <div className="grid grid-cols-8 gap-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
              
              {/* Table Rows Skeleton */}
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="grid grid-cols-8 gap-4 py-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1550px] mx-auto p-8">
      {/* Greeting */}
      <div className='flex flex-row justify-between items-center mb-6'>
        <div className='flex flex-col'>
          <p className="mb-2 text-lg font-bold text-black">Admin Dashboard -</p>
          <p className="text-gray-500 text-base">Quick overview of your store performance</p>
        </div>
        <button className='flex flex-row items-center bg-black text-white p-3 rounded-lg gap-2'>
          <Upload size={20} /> Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex-1">
          <div className="text-sm font-medium text-gray-600 mb-2">TOTAL ORDERS</div>
          <div className="text-3xl font-bold text-black">{stats.totalOrders.toLocaleString()}</div>
          <div className="text-sm text-green-600 mt-2">+{((stats.todayOrders / Math.max(stats.totalOrders, 1)) * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex-1">
          <div className="text-sm font-medium text-gray-600 mb-2">TODAY&apos;S ORDERS</div>
          <div className="text-3xl font-bold text-black">{stats.todayOrders}</div>
          <div className="text-sm text-green-600 mt-2">Today</div>
        </div>
      </div>

      {/* Charts and Top Products */}
      <div className="flex w-full gap-6 mb-8">
        {/* Monthly Chart */}
        <div className="bg-white w-[70%] border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">Monthly Overview</div>
            <div className="text-sm text-gray-800">Total Revenue: ${stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="flex items-end justify-between h-52 px-2">
            {chartData.map((bar, idx) => (
              <div key={bar.month} className="flex flex-col items-center">
                <div
                  className={`w-8 rounded-t ${idx === 7 ? "bg-black" : "bg-gray-300"}`}
                  style={{ height: `${bar.value * 1.5}px` }}
                ></div>
                <div className={`mt-2 text-xs ${idx === 7 ? "font-bold text-black" : "text-gray-500"}`}>
                  {bar.month}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Requested Products */}
        <div className="bg-white w-[30%] border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center gap-4 mb-4">
            <div className="font-semibold text-md">Top Requested <br /> Products</div>
            <div className="text-xs text-gray-800">Last 30 Days</div>
          </div>
          <div className="space-y-4">
            {topProducts.map((prod) => (
              <div key={prod.sku} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-base mb-1">{prod.name}</div>
                  <div className="text-xs text-gray-500">SKU: {prod.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{prod.totalSold}</div>
                  <div className="text-xs text-gray-500">units sold</div>
                  <div className="text-xs text-blue-600">{prod.orders} orders</div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No sales data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">Recent Orders</div>
          <button 
            onClick={() => router.push('/admin/orders')}
            className="admin-button"
          >
            View All
          </button>
        </div>
        
        {/* Table Format similar to admin orders page */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-center text-gray-500 font-semibold border-b">
                <th className="py-2 px-2">Order ID</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Company</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Amount</th>
                <th className="py-2 px-2">Items</th>
                <th className="py-2 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-center">
                  <td className="py-3 px-2 font-medium text-xs">
                    {truncateText(order.orderId, 8)}
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {truncateText(order.customerName, 15)}
                  </td>
                  <td className="py-3 px-2 text-xs" title={order.email}>
                    {truncateText(order.email, 15)}
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {truncateText(order.companyName || '-', 12)}
                  </td>
                  <td className="py-3 px-2">
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
                  <td className="py-3 px-2 font-medium text-xs">
                    ${order.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {order.itemCount} items
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-gray-500 text-sm">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
