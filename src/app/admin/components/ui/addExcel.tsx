'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Package, X } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface AddExcelProps {
  open: boolean;
  onClose: () => void;
}

interface UploadError {
  row: number;
  error: string;
}

interface UploadWarning {
  row: number;
  warning: string;
}

interface UploadResult {
  totalRows: number;
  successfulAdds?: number;
  successfulUpdates?: number;
  failedAdds?: number;
  failedUpdates?: number;
  duplicatesSkipped?: number;
  notFound?: number;
  errors: UploadError[];
  warnings: UploadWarning[];
}

export default function AddExcelModal({ open, onClose }: AddExcelProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'update'>('main');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const { token } = useAuth();

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

  // Reset state when switching tabs
  const handleTabChange = (tab: 'main' | 'update') => {
    setActiveTab(tab);
    setSelectedFile(null);
    setUploadResult(null);
    setError('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a product file');
      return;
    }

    if (!token) {
      setError('Authentication required. Please sign in again.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploadType', activeTab); // Add upload type to form data

      const endpoint = activeTab === 'main' 
        ? '/api/admin/products/upload' 
        : '/api/admin/products/update-details';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(data.result);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload product file');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
          aria-label="Close"
        >
          <X />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-black flex items-center gap-2">
          <Package className="h-6 w-6" />
          Product Excel Management
        </h2>

        {/* Tab Selection */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => handleTabChange('main')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'main'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Main Product Upload
          </button>
          <button
            onClick={() => handleTabChange('update')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'update'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Update Product Details
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="space-y-4">
          {activeTab === 'main' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Main Product Upload</h3>
                <p className="text-sm text-blue-700">
                  Upload Excel file with basic product information. Required columns:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside mt-2">
                  <li><strong>Katun PN:</strong> Product OEM/Part Number</li>
                  <li><strong>Name:</strong> Product Name</li>
                  <li><strong>Category:</strong> Product Category</li>
                  <li><strong>Price:</strong> Product Price</li>
                  <li><strong>OEM:</strong> Original Equipment Manufacturer</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Main Product Excel File</label>
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
                className="bg-[#2E318E] hover:bg-black disabled:opacity-40 text-white px-4 py-2.5 rounded-md flex items-center gap-2 w-full"
              >
                <Package size={20} />
                {loading ? 'Adding Products...' : 'Add Products'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Update Product Details</h3>
                <p className="text-sm text-green-700">
                  Upload Excel file to update existing products by matching Katun PN. Supported columns:
                </p>
                <ul className="text-sm text-green-700 list-disc list-inside mt-2">
                  <li><strong>Katun PN:</strong> Must match existing product</li>
                  <li><strong>For use in:</strong> Compatible devices/printers</li>
                  <li><strong>Description:</strong> Detailed product description</li>
                  <li><strong>Specifications:</strong> Technical specifications</li>
                  <li><strong>Comments:</strong> Additional notes</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Product Details Excel File</label>
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
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-md flex items-center gap-2 w-full"
              >
                <Package size={20} />
                {loading ? 'Updating Product Details...' : 'Update Product Details'}
              </button>
            </div>
          )}
        </div>
        {/* Upload Results */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">
              {activeTab === 'main' ? 'Product Upload Results:' : 'Product Update Results:'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Rows:</span> {uploadResult.totalRows}
              </div>
              
              {activeTab === 'main' ? (
                <>
                  <div>
                    <span className="font-medium">Successfully Added:</span>
                    <span className="text-green-600 ml-1">{uploadResult.successfulAdds || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Failed to Add:</span>
                    <span className="text-red-600 ml-1">{uploadResult.failedAdds || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Duplicates Skipped:</span>
                    <span className="text-yellow-600 ml-1">{uploadResult.duplicatesSkipped || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-medium">Successfully Updated:</span>
                    <span className="text-green-600 ml-1">{uploadResult.successfulUpdates || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Failed to Update:</span>
                    <span className="text-red-600 ml-1">{uploadResult.failedUpdates || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Products Not Found:</span>
                    <span className="text-orange-600 ml-1">{uploadResult.notFound || 0}</span>
                  </div>
                </>
              )}
            </div>
            {uploadResult.errors?.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-red-600">Errors:</h4>
                <ul className="text-xs text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((error: UploadError, index: number) => (
                    <li key={index}>Row {error.row}: {error.error}</li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.warnings?.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                <ul className="text-xs text-yellow-600 list-disc list-inside max-h-40 overflow-y-auto">
                  {uploadResult.warnings.map((warning: UploadWarning, index: number) => (
                    <li key={index}>Row {warning.row}: {warning.warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
