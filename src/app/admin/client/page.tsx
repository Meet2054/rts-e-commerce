'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminGuard } from '@/components/auth/admin-guard';
import UserDetailsModal from '@/app/admin/components/ui/userDetails';
import PricingUploadModal from '@/app/admin/components/ui/PricingUploadModal';
import UserRequestedDetailsModal from '@/app/admin/components/ui/userRequestDetails';
import { Search, ChevronDown } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'requested' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  
  // Sign-up form fields - Account Information
  displayName: string;
  phoneNumber?: string;
  companyName?: string;
  roleInCompany?: string;
  
  // Sign-up form fields - Address Information
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  
  // Sign-up form fields - Terms Agreement
  agreedToTerms?: boolean;
  agreementDate?: Date | { toDate(): Date } | string;
  
  // Status and approval fields
  approved?: boolean;
  approvedAt?: Date | { toDate(): Date } | string;
  rejectedAt?: Date | { toDate(): Date } | string;
  approvedBy?: string;
  rejectedBy?: string;
  
  // Order information
  totalOrders: number;
}

export default function ClientPage() {
  const { userData } = useAuth(); // Get current user data to pass role to modal
  const [requested, setRequested] = useState(userData?.role === 'admin' ? true : false); // Only show requested by default for admins
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Client | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingUser, setPricingUser] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(15);
  const { token } = useAuth();

  // Check if current user is admin
  const isAdmin = userData?.role === 'admin';

  // Define tabs for filtering users by role
  const tabs = [
    { label: 'All' },
    { label: 'Admin' },
    { label: 'Employee' },
    { label: 'Client' }
  ];

  useEffect(() => {
    const fetchClients = async () => {
      console.log('Auth state:', { hasToken: !!token, tokenLength: token?.length });
      setLoading(true);
      
      // Non-admin users should only see active clients
      const shouldFetchRequested = requested && isAdmin;
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        status: shouldFetchRequested ? 'requested' : 'active',
        page: currentPage.toString(),
        limit: usersPerPage.toString()
      });

      // Add search filter if present
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      // Add role filter if not 'All'
      if (activeTab !== 'All') {
        queryParams.append('role', activeTab.toLowerCase());
      }

      // Add date range filters if present
      if (dateRange.startDate) {
        queryParams.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        queryParams.append('endDate', dateRange.endDate);
      }
      
      if (!token) {
        console.log('No token available - user may not be logged in');
        // For testing, let's create a dummy token
        const dummyToken = 'dummy-token-for-testing';
        console.log('Using dummy token for testing');
        
        try {
          const url = `/api/admin/users-firebase?${queryParams.toString()}`;
          console.log('Making request to:', url);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${dummyToken}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            const users = data.users || [];
            
            console.log('Fetched users:', users);
            setClients(users);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.total || users.length);
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            setError(`Failed to fetch clients: ${errorMessage}`);
            console.error('API Error:', response.status, errorData);
          }
        } catch (err) {
          console.error('Error fetching clients:', err);
          setError(`Error fetching clients: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      console.log('Fetching clients with token:', token?.substring(0, 20) + '...');

      try {
        const url = `/api/admin/users-firebase?${queryParams.toString()}`;
        console.log('Making request to:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          const users = data.users || [];
          
          console.log('Fetched users:', users);
          setClients(users);
          setTotalPages(data.totalPages || 1);
          setTotalUsers(data.total || users.length);
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          setError(`Failed to fetch clients: ${errorMessage}`);
          console.error('API Error:', response.status, errorData);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(`Error fetching clients: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [requested, token, isAdmin, currentPage, usersPerPage, searchTerm, activeTab, dateRange]); // Include all filter dependencies

  // Filter clients based on search term, active tab, and date range
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, activeTab, dateRange, requested]);

  // Pagination functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Close date filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.date-filter-dropdown')) {
        setShowDateFilter(false);
      }
    };

    if (showDateFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateFilter]);

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    if (actionLoading) return;

    setActionLoading(userId);
    setError('');

    try {
      const response = await fetch('/api/admin/users-firebase', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || 'dummy-token-for-testing'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action })
      });

      if (response.ok) {
        // Remove the user from the current list since they're no longer in 'requested' status
        setClients(clients.filter(client => client.id !== userId));
        
        // If we're in the 'active' view and user was approved, we should refresh to show them
        // If we're in the 'requested' view, they should be removed (which we already did above)
        if (!requested && action === 'approve') {
          // Refresh the data to show the approved user in active list
          window.location.reload();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Unknown error occurred';
        setError(`Failed to ${action} user: ${errorMessage}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      setError(`Error ${action}ing user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewUser = (client: Client) => {
    setSelectedUser(client);
    setShowUserModal(true);
  };

  const handleRequestedViewUser = (client: Client) => {
    setSelectedUser(client);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  const handleAddNewPricing = (userId: string) => {
    console.log('Adding new pricing for user:', userId);
    
    // Find the user by ID
    const user = clients.find(client => client.id === userId);
    if (user) {
      setPricingUser(user);
      setShowPricingModal(true);
      setShowUserModal(false); // Close user details modal
    } else {
      alert(`Could not find user with ID: ${userId}`);
    }
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
    setPricingUser(null);
  };

  // Convert Client data to UserData format for the modal
  const convertClientToUserData = (client: Client) => {
    console.log('🔄 Converting client data to user data:', client);
    
    const userData = {
      id: client.id,
      displayName: client.displayName || client.name || 'Unknown User',
      email: client.email || 'No email provided',
      phoneNumber: client.phoneNumber || '',
      companyName: client.companyName || '',
      roleInCompany: client.roleInCompany || '',
      status: client.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      totalOrders: client.totalOrders || 0,
      // Use actual sign-up form fields from API response
      address: client.address || '',
      city: client.city || '', 
      state: client.state || '',
      zipCode: client.zipCode || '',
      country: client.country || '',
      agreedToTerms: client.agreedToTerms || false,
      agreementDate: client.agreementDate || undefined,
      // Approval fields
      approved: client.approved || false,
      approvedAt: client.approvedAt || undefined,
      rejectedAt: client.rejectedAt || undefined,
      approvedBy: client.approvedBy || undefined,
      rejectedBy: client.rejectedBy || undefined,
      // Other fields
      role: client.role || 'client',
      lastOrderDate: undefined,
      orders: []
    };
    
    console.log('✅ Converted user data:', {
      id: userData.id,
      displayName: userData.displayName,
      email: userData.email,
      fieldsCount: Object.keys(userData).length
    });
    
    return userData;
  };

  const exportClients = () => {
    // Create CSV content
    const headers = requested 
      ? ['ID', 'Name', 'Email', 'Company', 'Phone', 'Status']
      : ['ID', 'Name', 'Email', 'Company', 'Phone', 'Total Orders', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...clients.map(client => {
        const baseData = [
          client.id,
          client.name,
          client.email,
          client.companyName || '',
          client.phoneNumber || '',
        ];
        
        if (requested) {
          return [...baseData, client.status].join(',');
        } else {
          return [...baseData, client.totalOrders, client.status].join(',');
        }
      })
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${requested ? 'requested' : 'active'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to set date range presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    const startDate = new Date();

    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'clear':
        setDateRange({ startDate: '', endDate: '' });
        break;
    }
    setShowDateFilter(false);
  };

  if (loading) {
    return (
      <div className="max-w-[1550px] p-8 mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-100 rounded mb-6 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="max-w-[1550px] p-8 mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xl font-bold text-black">
            Client Management - {(requested && isAdmin) ? 'Approval Requests' : 'Active Clients'}
          </div>
          <div className="text-gray-500 text-base">
            {(requested && isAdmin)
              ? 'Review and approve new user registrations' 
              : 'Manage approved clients and their orders'
            }
          </div>
        </div>
        <div className="flex gap-3">
          {/* Only show request button to admin users */}
          {isAdmin && (
            <button
              className={`px-4 py-2.5 rounded-lg text-base font-medium border-2 ${
                requested
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300'
              }`}
              onClick={() => setRequested((r) => !r)}
            >
              {requested ? 'View Active Clients' : 'View Requests'}
            </button>
          )}
          <button 
            onClick={exportClients}
            className="flex items-center gap-2 px-4 py-2 admin-button"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Clients List
          </button>
        </div>
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
      
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          {/* Date Range Inputs */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start Date"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End Date"
            />
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative date-filter-dropdown">
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              Quick Filter
              <ChevronDown size={16} />
            </button>
            
            {showDateFilter && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => setDatePreset('today')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDatePreset('week')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDatePreset('month')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setDatePreset('clear')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-black border border-gray-300 rounded-lg"
            >
              Clear Search
            </button>
          )}
          
          {(dateRange.startDate || dateRange.endDate) && (
            <button 
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 rounded-lg"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-center text-gray-500 font-semibold border-b">
              <th className="py-3 px-4">Client ID</th>
              <th className="py-3 px-4">Client Name</th>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              {!requested && <th className="py-3 px-4">Total Orders</th>}
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={requested ? 6 : 7} className="py-8 px-4 text-center text-gray-500">
                  No {requested ? 'requested' : 'active'} clients found
                </td>
              </tr>
            ) : (
              clients.map((client, idx) => (
                <tr key={idx} className="text-center">
                  <td className="py-2 px-4 font-medium">#{client.id.slice(-6)}</td>
                  <td className="py-2 px-4">{client.name}</td>
                  <td className="py-2 px-4">{client.companyName}</td>
                  <td className="py-2 px-4">{client.email}</td>
                  <td className="py-2 px-4">{client.phoneNumber}</td>
                  {!requested && <td className="py-2 px-4">{client.totalOrders}</td>}
                  <td className="py-2 px-4">
                    {client.status === 'requested' && isAdmin ? (
                      <div className="flex gap-1 justify-end">
                        <button 
                          onClick={() => handleUserAction(client.id, 'approve')}
                          disabled={actionLoading === client.id}
                          className="text-green-600 px-4 py-2.5 rounded-lg border-2 border-gray-300 font-semibold hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === client.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => handleUserAction(client.id, 'reject')}
                          disabled={actionLoading === client.id}
                          className="text-red-600 px-4 py-2.5 rounded-lg border-2 border-gray-300 font-semibold hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === client.id ? 'Processing...' : 'Reject'}
                        </button>
                        <button 
                          onClick={() => handleRequestedViewUser(client)}
                        className="text-[#2E318E] px-4 py-2.5 rounded-lg border-2 border-gray-300 text-sm font-semibold hover:underline"
                      >
                        View
                      </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleViewUser(client)}
                        className="text-[#2E318E] font-semibold hover:underline"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-base text-gray-900">
            Showing {((currentPage - 1) * usersPerPage) + 1}-{Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
          </span>
          <div className="flex gap-2 items-center">
            <button 
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`admin-button ${
                currentPage === 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNumber
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`admin-button ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* User Details Modal (active clients) */}
      {selectedUser && selectedUser.status !== 'requested' && (
        <UserDetailsModal
          open={showUserModal}
          onClose={handleCloseModal}
          userData={convertClientToUserData(selectedUser)}
          onAddNewPricing={handleAddNewPricing}
          currentUserRole={userData?.role || 'client'} // Pass current user's role
        />
      )}

      {/* User Requested Details Modal (requested clients) */}
      {selectedUser && selectedUser.status === 'requested' && (
        <UserRequestedDetailsModal
          open={showUserModal}
          onClose={handleCloseModal}
          userData={convertClientToUserData(selectedUser)}
          onAddNewPricing={handleAddNewPricing}
          onApprove={(userId) => handleUserAction(userId, 'approve')}
          onReject={(userId) => handleUserAction(userId, 'reject')}
        />
      )}

      {/* Pricing Upload Modal */}
      {pricingUser && (
        <PricingUploadModal
          open={showPricingModal}
          onClose={handleClosePricingModal}
          userEmail={pricingUser.email}
          userId={pricingUser.id}
          userName={pricingUser.name}
        />
      )}
    </div>
    </AdminGuard>
  );
}