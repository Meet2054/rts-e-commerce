'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface UserOrder {
  id: string;
  orderId: string;
  createdAt: Date | { toDate(): Date } | string;
  status: 'unprocessed' | 'partially_processed' | 'unprocessed_partially' | 'archived' | 'cancelled' | 'merged' | 'delivered';
  totals: {
    total: number;
  };
}

interface UserData {
  id: string;
  // Basic info
  displayName: string;
  email: string;
  role: string;
  status: 'active' | 'requested' | 'inactive';
  createdAt: Date | { toDate(): Date } | string;
  updatedAt: Date | { toDate(): Date } | string;
  phoneNumber?: string;
  companyName?: string;
  roleInCompany?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  agreedToTerms?: boolean;
  agreementDate?: Date | { toDate(): Date } | string;
  approved?: boolean;
  approvedAt?: Date | { toDate(): Date } | string;
  rejectedAt?: Date | { toDate(): Date } | string;
  approvedBy?: string;
  rejectedBy?: string;
  totalOrders: number;
  lastOrderDate?: Date | { toDate(): Date } | string;
  orders?: UserOrder[];
}

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  userData: UserData | null;
  onAddNewPricing?: (userId: string) => void;
  currentUserRole?: string; // Add current user role to check if admin
}

export default function UserDetailsModal({ 
  open, 
  onClose, 
  userData,
  onAddNewPricing,
  currentUserRole = 'client' // Default to client if not provided
}: UserDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [suspendedAccount, setSuspendedAccount] = useState(false);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
      // Close role dropdown when clicking outside
      if (showRoleDropdown && e.target && !(e.target as Element).closest('.relative')) {
        setShowRoleDropdown(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, showRoleDropdown]);

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
  const fetchUserOrders = useCallback(async () => {
    if (!userData) return;
    
    setLoadingOrders(true);
    try {
      // Try different identifiers to match orders
      const identifiers = [
        userData.id,
        userData.email
      ].filter(Boolean); // Remove any undefined/null values
      
      console.log('Trying to fetch orders for identifiers:', identifiers, 'userData:', userData);
      
      let foundOrders: UserOrder[] = [];
      
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
  }, [userData]);

  useEffect(() => {
    if (open && userData) {
      fetchUserOrders();
    }
  }, [open, userData, fetchUserOrders]);

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
      ['User ID', userData.id],
      ['Name', userData.displayName],
      ['Email', userData.email],
      ['Phone', userData.phoneNumber || ''],
      ['Company', userData.companyName || ''],
      ['Role in Company', userData.roleInCompany || ''],
      ['Address', userData.address || ''],
      ['City', userData.city || ''],
      ['State', userData.state || ''],
      ['ZIP Code', userData.zipCode || ''],
      ['Country', userData.country || ''],
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
    a.download = `user-${userData.id}-data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRoleChange = async (newRole: string) => {
    if (!userData) return;
    
    setChangingRole(true);
    try {
      const response = await fetch('/api/admin/users-firebase', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer dummy-token-for-testing', // Use appropriate auth token
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData.id,
          action: 'changeRole',
          role: newRole
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Role changed successfully:', result);
        
        // Update local userData to reflect the change
        if (userData) {
          userData.role = newRole;
        }
        
        // Close dropdown
        setShowRoleDropdown(false);
        
        // You might want to refresh the parent component or show a success message
        alert(`Role changed to ${newRole} successfully!`);
      } else {
        const error = await response.json();
        console.error('Failed to change role:', error);
        alert(`Failed to change role: ${error.error}`);
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Error changing role. Please try again.');
    } finally {
      setChangingRole(false);
    }
  };

  if (!open || !userData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'unprocessed':
        return 'text-yellow-600 bg-yellow-100';
      case 'partially_processed':
        return 'text-blue-600 bg-blue-100';
      case 'unprocessed_partially':
        return 'text-orange-600 bg-orange-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      case 'merged':
        return 'text-purple-600 bg-purple-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full max-h-[90vh] overflow-hidden flex flex-col"
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

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="font-semibold mb-2">Account Information</div>
              <div className="text-sm text-gray-700 mb-1">Full Name: <span className="font-medium">{userData.displayName}</span></div>
              <div className="text-sm text-gray-700 mb-1">Email Address: <span className="font-medium">{userData.email}</span></div>
              <div className="text-sm text-gray-700 mb-1">Phone Number: <span className="font-medium">{userData.phoneNumber}</span></div>
              <div className="text-sm text-gray-700 mb-1">System Role: <span className={`font-medium px-2 py-1 rounded text-xs uppercase ${
                userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                userData.role === 'employee' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>{userData.role}</span></div>
              <div className="text-sm text-gray-700 mb-1">Role in Company: <span className="font-medium">{userData.roleInCompany}</span></div>
              <div className="text-sm text-gray-400 mb-1">Password: <span className="font-medium">[hidden for security]</span></div>
              <div className="text-sm text-gray-700 mb-1">Agreed to Terms: <span className="font-medium">{userData.agreedToTerms ? 'Yes' : 'No'}</span></div>
            </div>
            <div>
              <div className="font-semibold mb-2">Company & Address Information</div>
              <div className="text-sm text-gray-700 mb-1">Company Name: <span className="font-medium">{userData.companyName}</span></div>
              <div className="text-sm text-gray-700 mb-1">Address: <span className="font-medium">{userData.address}</span></div>
              <div className="text-sm text-gray-700 mb-1">City: <span className="font-medium">{userData.city}</span></div>
              <div className="text-sm text-gray-700 mb-1">State/Province: <span className="font-medium">{userData.state}</span></div>
              <div className="text-sm text-gray-700 mb-1">Zip/Postal Code: <span className="font-medium">{userData.zipCode}</span></div>
              <div className="text-sm text-gray-700 mb-1">Country: <span className="font-medium">{userData.country}</span></div>
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
                                : order.status === 'partially_processed'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'unprocessed_partially'
                                ? 'bg-orange-100 text-orange-800'
                                : order.status === 'unprocessed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'archived'
                                ? 'bg-gray-100 text-gray-800'
                                : order.status === 'merged'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">${order.totals.total.toLocaleString()}</td>
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
        <div className="flex items-center justify-center gap-3 p-4 border-t">
          <button
            onClick={handleSuspendAccount}
            className={`px-2 py-2.5  text-sm font-medium rounded border ${
              suspendedAccount
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                : 'bg-white text-black border-gray-300 hover:bg-gray-50'
            }`}
          >
            {suspendedAccount ? 'Account Suspended' : 'Suspend Account'}
          </button>
          
          {/* Role Change Button - Only visible to admins */}
          {currentUserRole === 'admin' && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                disabled={changingRole}
                className="flex text-sm items-center gap-2 admin-button disabled:opacity-50"
              >
                {changingRole ? 'Changing...' : 'Change Role'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Role Dropdown */}
              {showRoleDropdown && (
                <div className="absolute right-0 bottom-16 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleRoleChange('admin')}
                      disabled={userData?.role === 'admin' || changingRole}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        userData?.role === 'admin' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Admin {userData?.role === 'admin' && '✓'}
                    </button>
                    <button
                      onClick={() => handleRoleChange('employee')}
                      disabled={userData?.role === 'employee' || changingRole}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        userData?.role === 'employee' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Employee {userData?.role === 'employee' && '✓'}
                    </button>
                    <button
                      onClick={() => handleRoleChange('client')}
                      disabled={userData?.role === 'client' || changingRole}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        userData?.role === 'client' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Client {userData?.role === 'client' && '✓'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleExportClientData}
            className="flex text-sm items-center gap-2 admin-button"
          >
            <Download size={16} />
            Export Client Data
          </button>
          
          {onAddNewPricing && (
            <button
              onClick={() => onAddNewPricing(userData.id)}
              className="px-4 py-2 text-sm admin-button"
            >
              Add New Pricing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
