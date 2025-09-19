'use client';
import React, { useState } from 'react';

const clients = Array.from({ length: 15 }).map((_, i) => ({
  id: '#124',
  name: 'Rajesh Kumar',
  company: 'RTS Imaging Pvt. Limited',
  email: 'rajesh123@gmail.com',
  phone: '+21123456..',
  totalOrders: 120,
}));

export default function ClientPage() {
  const [requested, setRequested] = useState(true);

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xl font-bold text-black">Clients Page -</div>
          <div className="text-gray-500 text-base">Manage and track all registered clients</div>
        </div>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              requested
                ? 'bg-black text-white border-black'
                : 'bg-[#F1F2F4] text-black border-[#F1F2F4]'
            }`}
            onClick={() => setRequested((r) => !r)}
          >
            Requested
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-[#2E318E]">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Clients List
          </button>
        </div>
      </div>
      {/* Filter */}
      <div className="flex justify-end mb-2">
        <button className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1">
          Filter by <span className="font-bold">Date Range</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 font-semibold border-b">
              <th className="py-3 px-4">Client ID</th>
              <th className="py-3 px-4">Client Name</th>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Total Orders</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="py-2 px-4 font-medium">{client.id}</td>
                <td className="py-2 px-4">{client.name}</td>
                <td className="py-2 px-4">{client.company}</td>
                <td className="py-2 px-4">{client.email}</td>
                <td className="py-2 px-4">{client.phone}</td>
                <td className="py-2 px-4">{client.totalOrders}</td>
                <td className="py-2 px-4">
                  <button className="text-[#2E318E] font-semibold hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-xs text-gray-500">Page 1 of 10</span>
          <div className="flex gap-2">
            <button className="px-4 py-1 rounded bg-[#F1F2F4] text-sm font-medium">Previous</button>
            <button className="px-4 py-1 rounded bg-[#F1F2F4] text-sm font-medium">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}