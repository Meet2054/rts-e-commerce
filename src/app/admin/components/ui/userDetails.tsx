'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface UserOrder {
  id: string;
  orderId: string;
  date: any;
  status: 'pending' | 'complete' | 'cancelled';
  amount: number;
}

interface UserData {
  id: string;
  clientId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  status: 'active' | 'requested' | 'inactive';
  businessType?: string;
  industry?: string;
  website?: string;
  gst?: string;
  address?: string;
  roleInCompany?: string;
  currency?: string;
  language?: string;
  createdAt: any;
  totalOrders: number;
  lastOrderDate?: any;
  orders?: UserOrder[];
}

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  userData: UserData | null;
  onAddNewPricing?: (userId: string) => void;
}

export default function UserDetailsModal({ 
  open, 
  onClose, 
  userData,
  onAddNewPricing 
}: UserDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [suspendedAccount, setSuspendedAccount] = useState(false);

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSuspendAccount = () => {
    setSuspendedAccount(!suspendedAccount);
    // Here you would typically make an API call to suspend/unsuspend the account
  };

  const handleExportClientData = () => {
    if (!userData) return;
    
    // Create CSV content
    const csvContent = [
      ['Field', 'Value'],
      ['Client ID', userData.clientId],
      ['Name', userData.displayName],
      ['Email', userData.email],
      ['Phone', userData.phoneNumber || ''],
      ['Company', userData.companyName || ''],
      ['Status', userData.status],
      ['Total Orders', userData.totalOrders.toString()],
      ['Last Order', userData.lastOrderDate ? formatDate(userData.lastOrderDate) : ''],
      ['Created', formatDate(userData.createdAt)]
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-${userData.clientId}-data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!open || !userData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'complete':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {userData.displayName} ({userData.companyName || 'RTS Imaging Pvt. Ltd.'})
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(userData.status)}`}>
                {userData.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Full Name:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.displayName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email Address:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone Number:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Password:</span>
                  <p className="text-sm font-medium text-gray-900">[hidden for security]</p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Company Name:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.companyName || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Company Address:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.address || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">GST Number:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.gst || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Company Registration ID:</span>
                  <p className="text-sm font-medium text-gray-900">DT90/2025</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Website:</span>
                  <p className="text-sm font-medium text-gray-900">{userData.website || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Total Orders:</span>
                <p className="text-sm font-medium text-gray-900">{userData.totalOrders}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Order Date:</span>
                <p className="text-sm font-medium text-gray-900">
                  {userData.lastOrderDate ? formatDate(userData.lastOrderDate) : 'No orders yet'}
                </p>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Recent Orders</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData.orders && userData.orders.length > 0 ? (
                      userData.orders.slice(0, 3).map((order) => (
                        <tr key={order.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">#{order.orderId}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(order.date)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">₹{order.amount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm text-gray-500 text-center">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={suspendedAccount}
                onChange={handleSuspendAccount}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-700">Suspended Account</span>
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportClientData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export Client Data
            </button>
            
            {onAddNewPricing && (
              <button
                onClick={() => onAddNewPricing(userData.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Add New Pricing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
