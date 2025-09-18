'use client';
import React from 'react';
import { Download } from 'lucide-react';

const stats = [
  { label: "Total Orders", value: 1520, change: "+36%" },
  { label: "Today's Order", value: 378, change: "+36%" },
];

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

const topProducts = [
  { name: "HP LaserJet Toner Cartridge (Black)", orders: 230 },
  { name: "Canon Ink Cartridge XL", orders: 180 },
  { name: "Office A4 Paper Pack", orders: 310 },
];

const recentOrders = [
  {
    status: "Completed",
    customer: "Name of the customer",
    amount: "$182.94",
    orderId: "00-00-00",
    tag: "any other tag",
  },
  {
    status: "Completed",
    customer: "Name of the customer",
    amount: "$182.94",
    orderId: "00-00-00",
    tag: "any other tag",
  },
  {
    status: "Pending",
    customer: "Name of the employee",
    amount: "$182.94",
    orderId: "00-00-00",
    tag: "any other tag",
  },
];

export default function Dashboard() {
  return (
    <div className="max-w-[1550px] bg-amber-300 mx-auto p-8">
      {/* Greeting */}
      <div className="mb-2 text-lg font-semibold text-black">Hey Akshay -</div>
      <div className="mb-6 text-gray-500 text-base">Quick overview of your store performance</div>

      {/* Stats Cards */}
      <div className="flex gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6 flex flex-col min-w-[220px]">
            <div className="text-xs font-medium text-gray-400 mb-2">{stat.label}</div>
            <div className="text-2xl font-bold text-black">{stat.value}</div>
            <div className="text-green-600 text-sm font-semibold">{stat.change} &uarr;</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Orders Over Time Chart */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">Orders Over Time</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-[#F1F2F4] text-xs font-medium">12 Months</button>
              <button className="px-3 py-1 rounded bg-[#F1F2F4] text-xs font-medium">6 Months</button>
              <button className="px-3 py-1 rounded bg-[#F1F2F4] text-xs font-medium">30 Days</button>
              <button className="px-3 py-1 rounded bg-[#F1F2F4] text-xs font-medium">7 Days</button>
              <button className="px-3 py-1 rounded bg-black text-white text-xs font-medium flex items-center gap-1">
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
          {/* Chart */}
          <div className="flex items-end gap-3 h-48 mb-4">
            {chartData.map((bar, idx) => (
              <div key={bar.month} className="flex flex-col items-center justify-end h-full">
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
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">Top Requested Products</div>
            <div className="text-xs text-gray-400">Last 7 Days &darr;</div>
          </div>
          <div className="space-y-4">
            {topProducts.map((prod) => (
              <div key={prod.name} className="flex flex-col gap-1">
                <div className="text-sm font-medium text-black">{prod.name}</div>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-black rounded w-16"></div>
                  <span className="text-xs text-gray-600">{prod.orders} orders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="font-bold text-lg">Recent Orders</div>
            <div className="text-xs text-gray-400">Lorem ipsum dolor sit amet, consectetur adipis.</div>
          </div>
          <button className="text-xs text-gray-700 font-medium">See all &rarr;</button>
        </div>
        <div className="divide-y">
          {recentOrders.map((order, idx) => (
            <div key={idx} className="flex items-center py-4 gap-6">
              {/* Status */}
              <div className="flex items-center gap-2 min-w-[100px]">
                <span
                  className={`h-3 w-3 rounded-full ${
                    order.status === "Completed"
                      ? "bg-green-400"
                      : order.status === "Pending"
                      ? "bg-yellow-400"
                      : "bg-gray-400"
                  }`}
                ></span>
                <span className="text-sm font-semibold">{order.status}</span>
              </div>
              {/* Customer & Order Info */}
              <div className="flex-1">
                <div className="font-medium text-black">{order.customer}</div>
                <div className="text-xs text-gray-500">{order.orderId}</div>
              </div>
              {/* Amount */}
              <div className="font-bold text-base text-black min-w-[100px]">{order.amount}</div>
              {/* Tag */}
              <div className="text-xs text-gray-500 min-w-[120px]">{order.tag}</div>
              {/* Actions */}
              <div className="ml-auto">
                <button className="text-gray-400 hover:text-black px-2">•••</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
