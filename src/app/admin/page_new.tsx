'use client';
import React, { useState, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface TopProduct {
  name: string;
  orders: number;
  sku: string;
}

interface RecentOrder {
  status: string;
  customer: string;
  amount: string;
  orderId: string;
  createdAt: Date;
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        // Fetch dashboard stats and recent data
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/products?limit=20', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orders = ordersData.orders || [];
          
          // Calculate stats
          const today = new Date().toDateString();
          const todayOrders = orders.filter((order: any) => 
            new Date(order.createdAt).toDateString() === today
          );

          setStats({
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
            pendingOrders: orders.filter((order: any) => order.status === 'pending').length
          });

          // Set recent orders
          setRecentOrders(orders.slice(0, 3).map((order: any) => ({
            status: order.status,
            customer: order.customerName,
            amount: `₹${order.totalAmount?.toLocaleString() || '0'}`,
            orderId: order.orderNumber,
            createdAt: new Date(order.createdAt)
          })));
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          // Mock top products based on actual product names
          const products = productsData.products || [];
          setTopProducts(products.slice(0, 3).map((product: any, index: number) => ({
            name: product.name,
            orders: Math.floor(Math.random() * 300) + 50, // Mock order count
            sku: product.sku
          })));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-[1550px] p-8 mx-auto">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <div className="text-sm font-medium text-gray-600 mb-2">TODAY'S ORDERS</div>
          <div className="text-3xl font-bold text-black">{stats.todayOrders}</div>
          <div className="text-sm text-green-600 mt-2">Today</div>
        </div>
      </div>

      {/* Charts and Top Products */}
      <div className="flex gap-6 mb-8">
        {/* Monthly Chart */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex-1">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">Monthly Overview</div>
            <div className="text-sm text-gray-800">Total Revenue: ₹{stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="flex items-end justify-between h-40 px-2">
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">Top Requested <br /> Products</div>
            <div className="text-sm text-gray-800">Last 30 Days</div>
          </div>
          <div className="space-y-6">
            {topProducts.map((prod, idx) => (
              <div key={prod.sku} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{prod.name}</div>
                  <div className="text-xs text-gray-500">SKU: {prod.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{prod.orders}</div>
                  <div className="text-xs text-gray-500">orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">Recent Orders</div>
          <button className="text-sm text-gray-600 hover:text-black">View All</button>
        </div>
        <div className="space-y-4">
          {recentOrders.map((order, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  order.status.toLowerCase() === 'completed' ? 'bg-green-500' : 
                  order.status.toLowerCase() === 'pending' ? 'bg-yellow-500' : 
                  'bg-gray-400'
                }`}></div>
                <div>
                  <div className="font-medium text-sm">{order.customer}</div>
                  <div className="text-xs text-gray-500">Order #{order.orderId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{order.amount}</div>
                <div className="text-xs text-gray-500 capitalize">{order.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
