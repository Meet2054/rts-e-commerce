'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Upload, Database, Trash2, CheckCircle } from 'lucide-react';

export default function TestAdminPanel() {
  const { userData, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customerEmail, setCustomerEmail] = useState('test@customer.com');
  const [uploadResult, setUploadResult] = useState<any>(null);

  if (!userData || userData.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">You need admin access to view this panel.</p>
          <p className="text-sm text-red-500 mt-1">
            Sign up first, then manually change your role to 'admin' in Firestore Console.
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

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
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
        setUploadResult(data.result);
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

        {/* Price Upload Testing */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Test Price Upload
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
              <label className="block text-sm font-medium mb-1">Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <button
              onClick={handleFileUpload}
              disabled={loading || !selectedFile}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Uploading...' : 'Upload Prices'}
            </button>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Upload Results:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Rows:</span> {uploadResult.totalRows}
                </div>
                <div>
                  <span className="font-medium">Successful:</span> 
                  <span className="text-green-600 ml-1">{uploadResult.successfulUpdates}</span>
                </div>
                <div>
                  <span className="font-medium">Failed:</span> 
                  <span className="text-red-600 ml-1">{uploadResult.failedUpdates}</span>
                </div>
                <div>
                  <span className="font-medium">File:</span> {uploadResult.fileName}
                </div>
              </div>

              {uploadResult.errors?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <ul className="text-xs text-red-600 list-disc list-inside">
                    {uploadResult.errors.map((error: any, index: number) => (
                      <li key={index}>Row {error.row}: {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sample Excel Format */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Sample Excel Format:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">sku</th>
                  <th className="text-left p-2 font-medium">price</th>
                  <th className="text-left p-2 font-medium">productName</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">HP-LASERJET-1100</td>
                  <td className="p-2">179.99</td>
                  <td className="p-2">HP LaserJet Pro 1100</td>
                </tr>
                <tr>
                  <td className="p-2">HP-INK-664-BK</td>
                  <td className="p-2">25.99</td>
                  <td className="p-2">HP 664 Black Ink</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}