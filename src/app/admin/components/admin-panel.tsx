'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Database, Trash2, CheckCircle, Package, DollarSign } from 'lucide-react';

export default function TestAdminPanel() {
  const { userData, token, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Price upload state
  const [selectedPriceFile, setSelectedPriceFile] = useState<File | null>(null);
  const [customerEmail, setCustomerEmail] = useState('test@customer.com');
  const [priceUploadResult, setPriceUploadResult] = useState<any>(null);

  // Product upload state
  const [selectedProductFile, setSelectedProductFile] = useState<File | null>(null);
  const [productUploadResult, setProductUploadResult] = useState<any>(null);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600">🔄 Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">⚠️ Please sign in to access the admin panel.</p>
          <p className="text-sm text-yellow-600 mt-1">
            <a href="/sign-in" className="underline">Click here to sign in</a>
          </p>
        </div>
      </div>
    );
  }

  // Show admin access required if user is not admin
  if (!userData || userData.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">🚫 You need admin access to view this panel.</p>
          <p className="text-sm text-red-500 mt-1">
            Current user: {user?.email} (Role: {userData?.role || 'none'})
          </p>
          <p className="text-sm text-red-500">
            To get admin access, manually change your role to 'admin' in Firebase Console → Firestore → users → your document.
          </p>
        </div>
      </div>
    );
  }

  const createTestData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/test-setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Created ${data.categoriesCreated} categories and ${data.productsCreated} products`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create test data');
    } finally {
      setLoading(false);
    }
  };

  const deleteTestData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/test-setup', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage('🗑️ Test data deleted successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete test data');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceFileUpload = async () => {
    if (!selectedPriceFile) {
      setError('Please select a price file');
      return;
    }

    setLoading(true);
    setError('');
    setPriceUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedPriceFile);
      formData.append('clientEmail', customerEmail);

      const response = await fetch('/api/admin/pricing/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setPriceUploadResult(data.result);
        setMessage('✅ Price upload completed successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to upload pricing file');
    } finally {
      setLoading(false);
    }
  };

  const handleProductFileUpload = async () => {
    if (!selectedProductFile) {
      setError('Please select a product file');
      return;
    }

    setLoading(true);
    setError('');
    setProductUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedProductFile);

      const response = await fetch('/api/admin/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setProductUploadResult(data.result);
        setMessage('✅ Product upload completed successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to upload product file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🧪 Test Admin Panel</h1>
        <p className="text-gray-600 mb-6">Use this panel to test the system functionality</p>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-600">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Test Data Management */}
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Data Management
          </h2>
          <div className="flex gap-3">
            <button
              onClick={createTestData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Create Test Data
            </button>
            <button
              onClick={deleteTestData}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Test Data
            </button>
          </div>
        </div>

        {/* Product Upload Section */}
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Product Upload
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSelectedProductFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <button
              onClick={handleProductFileUpload}
              disabled={loading || !selectedProductFile}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              {loading ? 'Uploading Products...' : 'Upload Products'}
            </button>
          </div>

          {/* Product Upload Results */}
          {productUploadResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Product Upload Results:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Rows:</span> {productUploadResult.totalRows}
                </div>
                <div>
                  <span className="font-medium">Successfully Added:</span> 
                  <span className="text-green-600 ml-1">{productUploadResult.successfulAdds}</span>
                </div>
                <div>
                  <span className="font-medium">Failed:</span> 
                  <span className="text-red-600 ml-1">{productUploadResult.failedAdds}</span>
                </div>
                <div>
                  <span className="font-medium">Duplicates Skipped:</span> 
                  <span className="text-yellow-600 ml-1">{productUploadResult.duplicatesSkipped || 0}</span>
                </div>
              </div>

              {productUploadResult.errors?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <ul className="text-xs text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
                    {productUploadResult.errors.map((error: any, index: number) => (
                      <li key={index}>Row {error.row}: {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {productUploadResult.warnings?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-yellow-600">Warnings:</h4>
                  <ul className="text-xs text-yellow-600 list-disc list-inside max-h-40 overflow-y-auto">
                    {productUploadResult.warnings.map((warning: any, index: number) => (
                      <li key={index}>Row {warning.row}: {warning.warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price Upload Section */}
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Customer Price Upload
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSelectedPriceFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <button
              onClick={handlePriceFileUpload}
              disabled={loading || !selectedPriceFile}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {loading ? 'Uploading Prices...' : 'Upload Prices'}
            </button>
          </div>

          {/* Price Upload Results */}
          {priceUploadResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Price Upload Results:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Rows:</span> {priceUploadResult.totalRows}
                </div>
                <div>
                  <span className="font-medium">Successful:</span> 
                  <span className="text-green-600 ml-1">{priceUploadResult.successfulUpdates}</span>
                </div>
                <div>
                  <span className="font-medium">Failed:</span> 
                  <span className="text-red-600 ml-1">{priceUploadResult.failedUpdates}</span>
                </div>
                <div>
                  <span className="font-medium">File:</span> {priceUploadResult.fileName}
                </div>
              </div>

              {priceUploadResult.errors?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <ul className="text-xs text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
                    {priceUploadResult.errors.map((error: any, index: number) => (
                      <li key={index}>Row {error.row}: {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>   
      </div>
    </div>
  );
}