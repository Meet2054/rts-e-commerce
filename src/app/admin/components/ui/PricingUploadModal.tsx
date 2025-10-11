'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Truck } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface PricingUploadModalProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  userId: string;
  userName: string;
  // Bulk upload props
  isBulkUpload?: boolean;
  selectedClientEmails?: string[];
  selectedClientNames?: string[];
  onBulkSuccess?: () => void;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successfulUpdates: number;
  failedUpdates: number;
  errors?: Array<{ row: number; sku: string; error: string }>;
  clients?: number;
  clientResults?: Array<{ client: string; result: any }>;
}

export default function PricingUploadModal({ 
  open, 
  onClose, 
  userEmail, 
  userName,
  isBulkUpload = false,
  selectedClientEmails = [],
  selectedClientNames = [],
  onBulkSuccess
}: PricingUploadModalProps) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'pricing' | 'shipping'>('pricing');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(1000);
  const [updatingFreeShipping, setUpdatingFreeShipping] = useState(false);

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

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      alert('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!token) {
      alert('Authentication required. Please sign in again.');
      return;
    }

    setUploading(true);
    
    try {
      if (isBulkUpload && selectedClientEmails.length > 0) {
        // Handle bulk upload
        const allResults = [];
        
        for (let i = 0; i < selectedClientEmails.length; i++) {
          const clientEmail = selectedClientEmails[i];
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('clientEmail', clientEmail);

          const response = await fetch('/api/admin/pricing/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const result = await response.json();
          allResults.push({ 
            client: selectedClientNames[i] || clientEmail, 
            result: result.result || {} 
          });
        }
        
        // Calculate combined results
        const combinedResult = {
          success: true,
          totalRows: allResults.reduce((sum, r) => sum + (r.result.totalRows || 0), 0),
          successfulUpdates: allResults.reduce((sum, r) => sum + (r.result.successfulUpdates || 0), 0),
          failedUpdates: allResults.reduce((sum, r) => sum + (r.result.failedUpdates || 0), 0),
          clients: allResults.length,
          clientResults: allResults
        };
        
        setUploadResult(combinedResult);
        
        if (combinedResult.successfulUpdates > 0 && onBulkSuccess) {
          setTimeout(() => {
            onBulkSuccess();
          }, 2000);
        }
      } else {
        // Handle individual upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('clientEmail', userEmail);

        const response = await fetch('/api/admin/pricing/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();
        
        if (result.success) {
          setUploadResult(result.result);
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFreeShippingUpdate = async () => {
    if (!token) return;
    
    setUpdatingFreeShipping(true);
    try {
      if (isBulkUpload && selectedClientEmails && selectedClientEmails.length > 0) {
        // Bulk update
        const response = await fetch('/api/admin/users-firebase', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'bulkUpdateFreeShipping',
            freeShippingThreshold,
            clientEmails: selectedClientEmails
          })
        });

        const result = await response.json();
        if (response.ok) {
          alert(`Free shipping threshold updated for ${result.updatedCount} clients successfully!`);
          if (onBulkSuccess) {
            onBulkSuccess();
          }
        } else {
          alert(`Failed to update free shipping threshold: ${result.error}`);
        }
      } else {
        // Individual update - use bulk update with single email
        const response = await fetch('/api/admin/users-firebase', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'bulkUpdateFreeShipping',
            freeShippingThreshold,
            clientEmails: [userEmail]
          })
        });

        const result = await response.json();
        if (response.ok) {
          alert('Free shipping threshold updated successfully!');
        } else {
          alert(`Failed to update free shipping threshold: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Free shipping update error:', error);
      alert('Failed to update free shipping threshold. Please try again.');
    } finally {
      setUpdatingFreeShipping(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csvContent = "OEM PN,Price,Product Name (Optional)\\n" +
                      "EXAMPLE-001,99.99,Example Product\\n" +
                      "EXAMPLE-002,149.50,Another Product\\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Reset state when switching tabs
  const handleTabChange = (tab: 'pricing' | 'shipping') => {
    setActiveTab(tab);
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetModal = () => {
    setActiveTab('pricing');
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl overflow-y-auto w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {isBulkUpload ? 'Bulk Client Management' : 'Client Management'}
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Client Info */}
          {isBulkUpload ? (
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-1">Managing {selectedClientEmails.length} selected clients:</p>
              <div className="bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                {selectedClientNames.map((name, index) => (
                  <div key={index} className="text-xs">• {name}</div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              Client: <span className="font-medium">{userName}</span> ({userEmail})
            </p>
          )}

          {/* Tab Selection */}
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('pricing')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'pricing'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Custom Pricing
            </button>
            <button
              onClick={() => handleTabChange('shipping')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'shipping'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Free Shipping Threshold
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'pricing' ? (
            // Pricing Tab Content
            !uploadResult ? (
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Custom Pricing Instructions:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Excel file must have columns: &quot;OEM PN&quot; and &quot;Price&quot;</li>
                    <li>• OEM PN must match existing products in the database</li>
                    <li>• Price should be in INR (e.g., 99.99)</li>
                    <li>• First row should contain column headers</li>
                  </ul>
                </div>

              {/* Download Template */}
              <div className="flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
              </div>

              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    <FileSpreadsheet className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Drop your Excel file here, or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-gray-500">Supports .xlsx and .xls files</p>
                    </div>
                  </div>
                )}
              </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* Upload Results */
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                uploadResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${
                    uploadResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {isBulkUpload ? 'Bulk Upload Completed!' : (uploadResult.success ? 'Upload Successful!' : 'Upload Completed with Issues')}
                  </p>
                  <p className={`text-sm ${
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isBulkUpload ? (
                      <>Applied to {uploadResult.clients} clients - {uploadResult.successfulUpdates} of {uploadResult.totalRows} prices updated successfully</>
                    ) : (
                      <>{uploadResult.successfulUpdates} of {uploadResult.totalRows} prices updated successfully</>
                    )}
                  </p>
                </div>
              </div>

              {/* Show bulk client results if available */}
              {isBulkUpload && uploadResult.clientResults && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Client Details:</h4>
                  <div className="text-sm space-y-2 max-h-40 overflow-y-auto">
                    {uploadResult.clientResults.map((clientResult, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{clientResult.client}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          clientResult.result?.successfulUpdates > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {clientResult.result?.successfulUpdates || 0} / {clientResult.result?.totalRows || 0} updated
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">Issues found:</h4>
                  <div className="text-sm text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
                    {uploadResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index}>
                        Row {error.row} (OEM PN: {error.sku}): {error.error}
                      </div>
                    ))}
                    {uploadResult.errors.length > 5 && (
                      <div className="text-xs italic">
                        ...and {uploadResult.errors.length - 5} more issues
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          // Shipping Tab Content
            <div className="space-y-6">
              {/* Shipping Instructions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-900 mb-2">Free Shipping Threshold:</h3>
                <p className="text-sm text-green-800">
                  Set the minimum order amount for free shipping. Orders above this amount will automatically qualify for free shipping.
                </p>
              </div>

              {/* Client Info for Shipping */}
              {isBulkUpload ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Setting threshold for {selectedClientEmails.length} clients:
                  </h4>
                  <div className="bg-white p-2 rounded max-h-32 overflow-y-auto">
                    {selectedClientNames.map((name, index) => (
                      <div key={index} className="text-xs text-gray-600 py-1">• {name}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Client:</h4>
                  <p className="text-sm text-gray-600">{userName} ({userEmail})</p>
                </div>
              )}

              {/* Threshold Input */}
              <div className="space-y-3">
                <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-gray-700">
                  Minimum Order Amount (INR)
                </label>
                <input
                  id="freeShippingThreshold"
                  type="number"
                  min="0"
                  step="1"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Enter amount..."
                />
                <p className="text-xs text-gray-500">
                  Orders above this amount will qualify for free shipping. Set to 0 to disable free shipping.
                </p>
              </div>

              {/* Update Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleFreeShippingUpdate}
                  disabled={updatingFreeShipping || freeShippingThreshold < 0}
                  className="flex items-center space-x-2 px-6 py-3 text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Truck className="h-5 w-5" />
                  <span>
                    {updatingFreeShipping 
                      ? 'Updating...' 
                      : `Update ${isBulkUpload ? 'All' : ''} Free Shipping Threshold${isBulkUpload ? 's' : ''}`
                    }
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          {activeTab === 'pricing' ? (
            // Pricing Tab Footer
            uploadResult ? (
              <>
                <button
                  onClick={resetModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Upload Another File
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Pricing'}
                </button>
              </>
            )
          ) : (
            // Shipping Tab Footer
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>

    </div>
  );
}