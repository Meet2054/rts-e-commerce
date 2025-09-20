'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface UserOrder {
  id: string;
  orderId: string;
  createdAt: any;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totals: {
    total: number;
  };
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
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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

  // Fetch user orders when modal opens
  useEffect(() => {
    if (open && userData) {
      fetchUserOrders();
    }
  }, [open, userData]);

  const fetchUserOrders = async () => {
    if (!userData) return;
    
    setLoadingOrders(true);
    try {
      // Try different identifiers to match orders
      const identifiers = [
        userData.clientId,
        userData.id, 
        userData.email
      ].filter(Boolean); // Remove any undefined/null values
      
      console.log('Trying to fetch orders for identifiers:', identifiers, 'userData:', userData);
      
      let foundOrders: any[] = [];
      
      // Try each identifier until we find orders
      for (const identifier of identifiers) {
        const response = await fetch(`/api/orders?userId=${identifier}`);
        if (response.ok) {
          const result = await response.json();
          console.log(`Orders API response for ${identifier}:`, result);
          
          if (result.success && result.orders && result.orders.length > 0) {
            foundOrders = result.orders;
            console.log(`Found ${foundOrders.length} orders for identifier: ${identifier}`);
            break; // Stop trying once we find orders
          }
        } else {
          console.error(`Orders API failed for ${identifier} with status:`, response.status);
        }
      }
      
      setUserOrders(foundOrders.slice(0, 3)); // Show only recent 3 orders
      
      if (foundOrders.length === 0) {
        console.log('No orders found for any identifier');
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSuspendAccount = () => {
    setSuspendedAccount(!suspendedAccount);
    // Here you would typically make an API call to suspend/unsuspend the account
    if (userData) {
      console.log(`Account ${!suspendedAccount ? 'suspended' : 'activated'} for user:`, userData.id);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {userData.displayName} ({userData.companyName || 'N/A'})
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(userData.status)}`}>
                {userData.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-6">
            
            {/* Account Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Account Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Full Name:</span>
                  <p className="text-sm text-gray-900">{userData.displayName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email Address:</span>
                  <p className="text-sm text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Phone Number:</span>
                  <p className="text-sm text-gray-900">{userData.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Password:</span>
                  <p className="text-sm text-gray-900">[hidden for security]</p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Business Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Company Name:</span>
                  <p className="text-sm text-gray-900">{userData.companyName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Company Address:</span>
                  <p className="text-sm text-gray-900">{userData.address || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">GST Number:</span>
                  <p className="text-sm text-gray-900">{userData.gst || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Company Registration ID:</span>
                  <p className="text-sm text-gray-900">{userData.businessType || 'DT90/2025'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Website:</span>
                  <p className="text-sm text-gray-900">{userData.website || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="mt-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-600">Total Orders:</span>
                <p className="text-sm text-gray-900">{userData.totalOrders}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Last Order Date:</span>
                <p className="text-sm text-gray-900">
                  {userData.lastOrderDate ? formatDate(userData.lastOrderDate) : 'No orders yet'}
                </p>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Orders</h4>
              <div className="border rounded overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Order ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-sm text-gray-500 text-center">
                          Loading orders...
                        </td>
                      </tr>
                    ) : userOrders.length > 0 ? (
                      userOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">#{order.orderId}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{formatDate(order.createdAt)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                              order.status === 'delivered' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'processing'
                                ? 'bg-orange-100 text-orange-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">₹{order.totals.total.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-sm text-gray-500 text-center">
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
        <div className="flex items-center justify-center gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleSuspendAccount}
            className={`px-4 py-2 text-sm font-medium rounded border ${
              suspendedAccount
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {suspendedAccount ? 'Account Suspended' : 'Suspend Account'}
          </button>
          
          <button
            onClick={handleExportClientData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export Client Data
          </button>
          
          {onAddNewPricing && (
            <button
              onClick={() => onAddNewPricing(userData.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800"
            >
              Add New Pricing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
