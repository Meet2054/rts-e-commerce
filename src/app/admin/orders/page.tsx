'use client';
import React, { useState } from 'react';
import { ChevronDown, Upload } from 'lucide-react';

const orders = [
  { id: '#124', customer: 'Rajesh Kumar', contact: 15, value: '$3500', total: 120 },
  { id: '#125', customer: 'Anita Sharma', contact: 0, value: '$3500', total: 25 },
  { id: '#126', customer: 'Global Traders', contact: 30, value: '$3500', total: 45 },
  { id: '#127', customer: 'Suresh Mehta', contact: 10, value: '$3500', total: 90 },
  { id: '#128', customer: 'Priya Singh', contact: 5, value: '$3500', total: 60 },
  { id: '#129', customer: 'Tech Innovations', contact: 20, value: '$3500', total: 180 },
  { id: '#130', customer: 'Manoj Verma', contact: 15, value: '$3500', total: 50 },
  { id: '#131', customer: 'Rita Joshi', contact: 25, value: '$3500', total: 130 },
  { id: '#132', customer: 'Future Corp', contact: 0, value: '$3500', total: 30 },
  { id: '#133', customer: 'Ajay Bansal', contact: 18, value: '$3500', total: 70 },
  { id: '#134', customer: 'Deepak Yadav', contact: 12, value: '$3500', total: 20 },
  { id: '#136', customer: 'Vision Labs', contact: 3, value: '$3500', total: 40 },
  { id: '#137', customer: 'Karan Mehta', contact: 14, value: '$3500', total: 95 },
  { id: '#138', customer: 'Aditi Kapoor', contact: 8, value: '$3500', total: 35 },
  { id: '#139', customer: 'Sanjay Choudhary', contact: 19, value: '$3500', total: 115 },
];

const tabs = [
  { label: 'All' },
  { label: 'Complete' },
  { label: 'Pending' },
  { label: 'Cancelled' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xl font-bold text-black">Orders Page -</div>
          <div className="text-gray-500 text-base">Manage and track all submitted orders</div>
        </div>
        <button className="flex items-center gap-2 admin-button hover:bg-[#2E318E]">
          <Upload size={16} />
          Export Orders List
        </button>
      </div>
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
            {tab.label}
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
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="">
                <td className="py-2.5 px-4 font-medium">{order.id}</td>
                <td className="py-2.5 px-4">{order.customer}</td>
                <td className="py-2.5 px-4">{order.contact}</td>
                <td className="py-2.5 px-4">{order.value}</td>
                <td className="py-2.5 px-4">{order.total}</td>
                <td className="py-2.5 px-4">
                  <button className="text-[#2E318E] font-semibold hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-base text-gray-900">Page 1 of 10</span>
          <div className="flex gap-2">
            <button className="admin-button">Previous</button>
            <button className="admin-button">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
