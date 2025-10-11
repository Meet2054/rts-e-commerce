'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminGuard } from '@/components/auth/admin-guard';
import { Search } from 'lucide-react';
import PricingUploadModal from '@/app/admin/components/ui/PricingUploadModal';

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
  
  // Pricing information
  hasCustomPricing?: boolean;
  freeShippingThreshold?: number;
}

export default function CustomPricingPage() {

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingUser, setPricingUser] = useState<Client | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(15);
  const { token } = useAuth();

  // Check if current user is admin


  useEffect(() => {
    const fetchClients = async () => {
      console.log('Auth state:', { hasToken: !!token, tokenLength: token?.length });
      setLoading(true);
      
      // Build query parameters - only get active clients
      const queryParams = new URLSearchParams({
        status: 'active',
        role: 'client', // Only show clients
        page: currentPage.toString(),
        limit: usersPerPage.toString()
      });

      // Add search filter if present
      if (searchTerm) {
        queryParams.append('search', searchTerm);
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
            
            // Users already have the correct data from API
            const processedUsers = users;
            
            setClients(processedUsers);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalUsers(data.pagination?.totalCount || users.length);
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
          
          // Users already have the correct data from API
          const processedUsers = users;
          
          setClients(processedUsers);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalUsers(data.pagination?.totalCount || users.length);
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
  }, [token, currentPage, usersPerPage, searchTerm]); // Include filter dependencies

  // Filter clients based on search term
  useEffect(() => {
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchTerm]);

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

  // Handle checkbox selection
  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
  };

  // Handle bulk pricing for selected clients
  const handleBulkPricing = () => {
    if (selectedClients.length === 0) {
      return;
    }
    // Create a virtual client object for bulk pricing
    const bulkClient: Client = {
      id: 'bulk-pricing',
      name: `${selectedClients.length} Selected Clients`,
      email: 'bulk-pricing@bulk.com', // This will be handled specially in the modal
      role: 'client',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      displayName: `Bulk Pricing for ${selectedClients.length} Clients`,
      totalOrders: 0
    };
    
    setPricingUser(bulkClient);
    setShowPricingModal(true);
  };

  // Handle individual client pricing
  const handleViewClientPricing = (client: Client) => {
    setPricingUser(client);
    setShowPricingModal(true);
  };

  // Close pricing modal
  const handleClosePricingModal = () => {
    setShowPricingModal(false);
    setPricingUser(null);
  };





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
            Custom Pricing - For Clients
          </div>
          <div className="text-gray-500 text-base">
            {loading ? (
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            ) : (
              'Select clients and add custom pricing'
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleBulkPricing}
            disabled={selectedClients.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              selectedClients.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add Custom Pricing ({selectedClients.length})
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-black border border-gray-300 rounded-lg"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>
      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-center text-gray-500 font-semibold border-b">
              <th className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="py-3 px-4">Client Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Custom Pricing</th>
              <th className="py-3 px-4">Free Shipping Threshold</th>
              <th className="py-3 px-4">Total Orders</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading rows
              [...Array(10)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse text-center">
                  <td className="py-2 px-4">
                    <div className="h-4 bg-gray-200 rounded w-4 mx-auto"></div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto"></div>
                  </td>
                </tr>
              ))
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              clients.map((client: Client, idx: number) => (
                <tr key={idx} className="text-center hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-4">{client.name}</td>
                  <td className="py-2 px-4">{client.email}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.hasCustomPricing 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {client.hasCustomPricing ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className="text-sm font-medium">
                      ₹{client.freeShippingThreshold || 1000}
                    </span>
                  </td>
                  <td className="py-2 px-4">{client.totalOrders || 0}</td>
                  <td className="py-2 px-4">
                    <button 
                      onClick={() => handleViewClientPricing(client)}
                      className="text-[#2E318E] font-semibold hover:underline"
                    >
                      Add Pricing
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-base text-gray-900">
            {loading ? (
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            ) : (
              `Showing ${((currentPage - 1) * usersPerPage) + 1}-${Math.min(currentPage * usersPerPage, totalUsers)} of ${totalUsers} users`
            )}
          </span>
          <div className="flex gap-2 items-center">
            <button 
              onClick={prevPage}
              disabled={currentPage === 1 || loading}
              className={`admin-button ${
                currentPage === 1 || loading
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {loading ? (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={`skeleton-page-${i}`} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
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
            )}
            
            <button 
              onClick={nextPage}
              disabled={currentPage === totalPages || loading}
              className={`admin-button ${
                currentPage === totalPages || loading
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Unified Pricing Upload Modal */}
      {pricingUser && (
        <PricingUploadModal
          open={showPricingModal}
          onClose={handleClosePricingModal}
          userEmail={pricingUser.email}
          userId={pricingUser.id}
          userName={pricingUser.name}
          isBulkUpload={pricingUser.id === 'bulk-pricing'}
          selectedClientEmails={pricingUser.id === 'bulk-pricing' ? 
            clients.filter(client => selectedClients.includes(client.id)).map(client => client.email) : []
          }
          selectedClientNames={pricingUser.id === 'bulk-pricing' ? 
            clients.filter(client => selectedClients.includes(client.id)).map(client => client.name) : []
          }
          onBulkSuccess={() => {
            setSelectedClients([]);
            handleClosePricingModal();
          }}
        />
      )}



    </div>
    </AdminGuard>
  );
}

