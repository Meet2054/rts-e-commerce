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
  name?: string; // Add name as optional field
  email: string;
  phoneNumber?: string;
  phone?: string; // Add phone as optional field
  companyName?: string;
  status: 'active' | 'requested' | 'inactive';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  roleInCompany?: string;
  agreedToTerms?: boolean;
  createdAt: any;
  totalOrders: number;
  lastOrderDate?: any;
  orders?: UserOrder[];
  _meta?: {
    source: string;
    timestamp: string;
    cacheStatus: string;
  };
}

interface UserDetailsModalProps {
  user: UserData;
  onClose: () => void;
  onAddNewPricing?: (userId: string) => void;
}

export default function UserDetailsModal({ 
  user: initialUserData, 
  onClose, 
  onAddNewPricing 
}: UserDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [suspendedAccount, setSuspendedAccount] = useState(false);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(initialUserData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    lastFetch: 'Not fetched yet',
    cacheStatus: 'Unknown',
    dataSource: 'Initial props',
    apiCalls: 0,
    errors: [] as string[]
  });

  // Safe display data with fallbacks
  const displayUserData = userData || {
    id: initialUserData?.id || '',
    clientId: initialUserData?.clientId || '',
    displayName: initialUserData?.displayName || initialUserData?.name || 'Unknown User',
    name: initialUserData?.name || initialUserData?.displayName || 'Unknown User',
    email: initialUserData?.email || 'No email provided',
    phoneNumber: initialUserData?.phoneNumber || initialUserData?.phone || 'No phone provided',
    phone: initialUserData?.phone || initialUserData?.phoneNumber || 'No phone provided',
    companyName: initialUserData?.companyName || 'No company',
    status: initialUserData?.status || 'inactive',
    address: initialUserData?.address || 'No address provided',
    city: initialUserData?.city || 'No city provided',
    state: initialUserData?.state || 'No state provided',
    zipCode: initialUserData?.zipCode || 'No zip code provided',
    country: initialUserData?.country || 'No country provided',
    roleInCompany: initialUserData?.roleInCompany || 'Not specified',
    agreedToTerms: initialUserData?.agreedToTerms || false,
    createdAt: initialUserData?.createdAt || null,
    totalOrders: initialUserData?.totalOrders || 0,
    lastOrderDate: initialUserData?.lastOrderDate || null,
    orders: initialUserData?.orders || [],
    _meta: initialUserData?._meta || undefined
  };

  // Fetch enhanced user data from API
  const fetchUserData = async (bypassCache = false) => {
    if (!displayUserData.id) {
      console.error('❌ [UserDetails] No user ID available for fetching data');
      setError('No user ID available');
      return;
    }

    console.log(`🔍 [UserDetails] Fetching data for user ID: ${displayUserData.id}`);
    
    setLoading(true);
    setError(null);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      apiCalls: prev.apiCalls + 1,
      lastFetch: new Date().toLocaleTimeString()
    }));

    const userId = displayUserData.id;
    
    // Get auth token - for testing we'll use a dummy token if none found
    const token = localStorage.getItem('authToken') || 'dummy-token-for-testing';
    
    if (!token || token === 'dummy-token-for-testing') {
      console.log('⚠️ [UserDetails] No auth token found, using dummy token for testing');
    }
    
    // Set headers based on whether we want to bypass cache
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Add cache control headers if we want to bypass cache
    if (bypassCache) {
      headers['Cache-Control'] = 'no-cache';
      headers['Pragma'] = 'no-cache';
      console.log('🔄 Fetching fresh data directly from Firebase (bypassing Redis cache)');
    } else {
      console.log('🔍 Fetching data (may use Redis cache if available)');
    }
    
    console.log(`🚀 [UserDetails] Starting fetch for user ID: ${userId}`);
    console.log(`🔑 [UserDetails] Auth token available: ${!!token} (length: ${token ? token.length : 0})`);
    console.log(`🔧 [UserDetails] Request headers:`, JSON.stringify(headers));
    
    fetch(`/api/admin/users/${userId}`, {
      method: 'GET',
      headers
    })
      .then(response => {
        console.log(`📥 [UserDetails] Response status: ${response.status}`);
        console.log(`📊 [UserDetails] Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('📋 [UserDetails] Raw response data:', data);
        
        if (!data || typeof data !== 'object') {
          throw new Error('No user data received from server');
        }
        
        // Process the response data with proper field extraction
        const processedData: UserData = {
          id: data.id || userData?.id || '',
          clientId: data.clientId || data.client_id || userData?.clientId || '',
          displayName: data.displayName || data.display_name || data.name || data.fullName || userData?.displayName || 'Unknown User',
          name: data.name || data.displayName || data.display_name || userData?.name || 'Unknown User',
          email: data.email || userData?.email || 'No email provided',
          phoneNumber: data.phoneNumber || data.phone_number || data.phone || userData?.phoneNumber || 'No phone provided',
          phone: data.phone || data.phoneNumber || data.phone_number || userData?.phone || 'No phone provided',
          companyName: data.companyName || data.company_name || userData?.companyName || 'No company',
          status: data.status || userData?.status || 'inactive',
          address: data.address || userData?.address || 'No address provided',
          city: data.city || userData?.city || 'No city provided',
          state: data.state || userData?.state || 'No state provided',
          zipCode: data.zipCode || data.zip_code || userData?.zipCode || 'No zip code provided',
          country: data.country || userData?.country || 'No country provided',
          roleInCompany: data.roleInCompany || data.role_in_company || userData?.roleInCompany || 'Not specified',
          agreedToTerms: data.agreedToTerms || data.agreed_to_terms || userData?.agreedToTerms || false,
          createdAt: data.createdAt || data.created_at || userData?.createdAt || null,
          totalOrders: data.totalOrders || data.total_orders || userData?.totalOrders || 0,
          lastOrderDate: data.lastOrderDate || data.last_order_date || userData?.lastOrderDate || null,
          orders: data.orders || userData?.orders || [],
          _meta: data.meta // Store metadata for debugging
        };
        
        console.log(`✅ [UserDetails] Final processed data:`, {
          id: processedData.id,
          fieldsPresent: Object.keys(processedData).length,
          displayName: processedData.displayName,
          email: processedData.email,
          dataSource: processedData._meta?.source || 'unknown'
        });
        
        setUserData(processedData);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          cacheStatus: processedData._meta?.cacheStatus || 'Unknown',
          dataSource: processedData._meta?.source || 'API',
        }));
      })
      .catch(err => {
        console.error('❌ [UserDetails] Error fetching user details:', err);
        setError(err.message === 'No user data received from server' 
          ? 'No data received from server. Please try again.' 
          : 'Failed to fetch latest user data');
          
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, err.message]
        }));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSuspendAccount = async () => {
    setSuspendedAccount(!suspendedAccount);
  };

  const handleExportClientData = async () => {
    const dataToExport = {
      userInfo: displayUserData,
      orders: userOrders,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-data-${displayUserData.displayName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch data on component mount if we don't have enhanced data
  useEffect(() => {
    if (!userData?._meta) {
      console.log('🚀 [UserDetails] Component mounted, fetching enhanced data');
      fetchUserData(false);
    }
  }, [userData?._meta]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'requested':
        return 'text-yellow-600 bg-yellow-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
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
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {displayUserData.displayName} ({displayUserData.companyName || 'N/A'})
              </h2>
              {displayUserData._meta?.source && (
                <span 
                  className={`text-xs font-semibold ml-2 px-1.5 py-0.5 rounded ${
                    displayUserData._meta.source === 'redis' 
                      ? 'bg-green-100 text-green-800' 
                      : displayUserData._meta.source === 'firestore' 
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {displayUserData._meta.source === 'redis' ? '🔄 Cached' : 
                   displayUserData._meta.source === 'firestore' ? '🔥 Fresh' : 
                   displayUserData._meta.source}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(displayUserData.status)}`}>
                {displayUserData.status}
              </span>
              {loading && (
                <span className="text-xs text-blue-500 animate-pulse">Refreshing...</span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => fetchUserData(true)}
              disabled={loading}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 mr-2 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading user data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => fetchUserData(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading user data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Account Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Full Name:</span>
                      <p className="text-sm text-gray-900">{displayUserData.displayName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email Address:</span>
                      <p className="text-sm text-gray-900">{displayUserData.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Phone Number:</span>
                      <p className="text-sm text-gray-900">{displayUserData.phoneNumber || 'Not provided'}</p>
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
                      <p className="text-sm text-gray-900">{displayUserData.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Address:</span>
                      <p className="text-sm text-gray-900">{displayUserData.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">City:</span>
                      <p className="text-sm text-gray-900">{displayUserData.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">State/Province:</span>
                      <p className="text-sm text-gray-900">{displayUserData.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Zip/Postal Code:</span>
                      <p className="text-sm text-gray-900">{displayUserData.zipCode || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Country:</span>
                      <p className="text-sm text-gray-900">{displayUserData.country || 'Not provided'}</p>
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
                    <p className="text-sm text-gray-900">{displayUserData.totalOrders}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Last Order Date:</span>
                    <p className="text-sm text-gray-900">
                      {displayUserData.lastOrderDate ? formatDate(displayUserData.lastOrderDate) : 'No orders yet'}
                    </p>
                  </div>
                </div>

                {/* Orders table */}
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Orders</h4>
                <div className="bg-gray-50 rounded border">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayUserData.orders && displayUserData.orders.length > 0 ? (
                        displayUserData.orders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td className="px-3 py-2 text-sm text-gray-900">{order.orderId}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
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

              {/* Debug Panel */}
              <div className="mt-6">
                <h3 className="text-base font-medium text-gray-900 mb-3">Debug Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-xs font-mono text-gray-600">
                    <p><strong>Last Fetch:</strong> {debugInfo.lastFetch}</p>
                    <p><strong>Cache Status:</strong> {debugInfo.cacheStatus}</p>
                    <p><strong>Data Source:</strong> {debugInfo.dataSource}</p>
                    <p><strong>API Calls:</strong> {debugInfo.apiCalls}</p>
                    {debugInfo.errors.length > 0 && (
                      <>
                        <p><strong>Errors:</strong></p>
                        <ul className="ml-4">
                          {debugInfo.errors.map((error: string, index: number) => (
                            <li key={index} className="text-red-600">• {error}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer hover:text-gray-800">Raw Data</summary>
                      <pre className="mt-2 p-2 bg-white border rounded overflow-x-auto">
                        {JSON.stringify(userData, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          
          {onAddNewPricing && userData && (
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