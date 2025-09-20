'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminGuard } from '@/components/auth/admin-guard';
import UserDetailsModal from '@/app/admin/components/ui/userDetails';
import PricingUploadModal from '@/app/admin/components/ui/PricingUploadModal';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
  totalOrders: number;
  status: 'active' | 'requested' | 'inactive';
  createdAt: Date;
}

export default function ClientPage() {
  const [requested, setRequested] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Client | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingUser, setPricingUser] = useState<Client | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      console.log('Auth state:', { hasToken: !!token, tokenLength: token?.length });
      
      if (!token) {
        console.log('No token available - user may not be logged in');
        // For testing, let's create a dummy token
        const dummyToken = 'dummy-token-for-testing';
        console.log('Using dummy token for testing');
        
        try {
          const statusParam = requested ? 'requested' : 'active';
          console.log('Making request to:', `/api/admin/users-firebase?status=${statusParam}&page=1&limit=50`);
          
          const response = await fetch(`/api/admin/users-firebase?status=${statusParam}&page=1&limit=50`, {
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
        const statusParam = requested ? 'requested' : 'active';
        console.log('Making request to:', `/api/admin/users-firebase?status=${statusParam}&page=1&limit=50`);
        
        const response = await fetch(`/api/admin/users-firebase?status=${statusParam}&page=1&limit=50`, {
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
  }, [requested, token]); // Include token in dependencies

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
  const convertClientToUserData = (client: Client) => ({
    id: client.id,
    clientId: client.id,
    displayName: client.name,
    email: client.email,
    phoneNumber: client.phoneNumber,
    companyName: client.companyName,
    status: client.status,
    createdAt: client.createdAt,
    totalOrders: client.totalOrders,
    // Set defaults for optional fields
    businessType: undefined,
    industry: undefined,
    website: undefined,
    gst: undefined,
    address: undefined,
    roleInCompany: undefined,
    currency: 'USD',
    language: 'English',
    lastOrderDate: undefined,
    orders: []
  });

  const exportClients = () => {
    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Company', 'Phone', 'Total Orders', 'Status'];
    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        client.id,
        client.name,
        client.email,
        client.companyName || '',
        client.phoneNumber || '',
        client.totalOrders,
        client.status
      ].join(','))
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
            Client Management - {requested ? 'Approval Requests' : 'Active Clients'}
          </div>
          <div className="text-gray-500 text-base">
            {requested 
              ? 'Review and approve new user registrations' 
              : 'Manage approved clients and their orders'
            }
          </div>
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
            {requested ? 'Pending Approval' : 'View Requests'}
          </button>
          <button 
            onClick={exportClients}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-[#2E318E]"
          >
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
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  No {requested ? 'requested' : 'active'} clients found
                </td>
              </tr>
            ) : (
              clients.map((client, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="py-2 px-4 font-medium">#{client.id.slice(-6)}</td>
                  <td className="py-2 px-4">{client.name}</td>
                  <td className="py-2 px-4">{client.companyName}</td>
                  <td className="py-2 px-4">{client.email}</td>
                  <td className="py-2 px-4">{client.phoneNumber}</td>
                  <td className="py-2 px-4">{client.totalOrders}</td>
                  <td className="py-2 px-4">
                    {client.status === 'requested' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUserAction(client.id, 'approve')}
                          disabled={actionLoading === client.id}
                          className="text-green-600 font-semibold hover:underline text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === client.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => handleUserAction(client.id, 'reject')}
                          disabled={actionLoading === client.id}
                          className="text-red-600 font-semibold hover:underline text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === client.id ? 'Processing...' : 'Reject'}
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
          <span className="text-xs text-gray-500">Page 1 of 10</span>
          <div className="flex gap-2">
            <button className="px-4 py-1 rounded bg-[#F1F2F4] text-sm font-medium">Previous</button>
            <button className="px-4 py-1 rounded bg-[#F1F2F4] text-sm font-medium">Next</button>
          </div>
        </div>
      </div>
      
      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          open={showUserModal}
          onClose={handleCloseModal}
          userData={convertClientToUserData(selectedUser)}
          onAddNewPricing={handleAddNewPricing}
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