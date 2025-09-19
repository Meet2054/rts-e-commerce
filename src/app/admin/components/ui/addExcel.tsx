'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface AddExcelProps {
  open: boolean;
  onClose: () => void;
}

export default function AddExcelModal({ open, onClose }: AddExcelProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState('');

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

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a product file');
      return;
    }
    setLoading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to upload product file');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-black flex items-center gap-2">
          <Package className="h-6 w-6" />
          Upload Products (Excel)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Excel File</label>
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
            className="bg-[#2E318E] hover:bg-black disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 w-full"
          >
            <Package className="h-4 w-4" />
            {loading ? 'Uploading Products...' : 'Upload Products'}
          </button>
        </div>
        {/* Upload Results */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Product Upload Results:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Rows:</span> {uploadResult.totalRows}
              </div>
              <div>
                <span className="font-medium">Successfully Added:</span>
                <span className="text-green-600 ml-1">{uploadResult.successfulAdds}</span>
              </div>
              <div>
                <span className="font-medium">Failed:</span>
                <span className="text-red-600 ml-1">{uploadResult.failedAdds}</span>
              </div>
              <div>
                <span className="font-medium">Duplicates Skipped:</span>
                <span className="text-yellow-600 ml-1">{uploadResult.duplicatesSkipped || 0}</span>
              </div>
            </div>
            {uploadResult.errors?.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-red-600">Errors:</h4>
                <ul className="text-xs text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((error: any, index: number) => (
                    <li key={index}>Row {error.row}: {error.error}</li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.warnings?.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                <ul className="text-xs text-yellow-600 list-disc list-inside max-h-40 overflow-y-auto">
                  {uploadResult.warnings.map((warning: any, index: number) => (
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
