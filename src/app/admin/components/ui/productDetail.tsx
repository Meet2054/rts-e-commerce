'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X, Loader2, Upload, Camera } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import ProductImage from '@/components/ui/product-image';
import { uploadProductImage, deleteProductImage } from '@/lib/firebase-storage';
import Image from 'next/image';


interface ProductDetailProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Callback to refresh parent component
  product: {
    id: string;
    sku: string;
    name: string;
    description: string;
    category: string;
    price: string;
    status: string;
    images?: string[];
  };
}

export default function ProductDetailModal({ open, onClose, onUpdate, product }: ProductDetailProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasBeenUpdated, setHasBeenUpdated] = useState(false); // Track if this modal session has been updated
  
  const [name, setName] = useState(product.name);
  const [desc, setDesc] = useState(product.description);
  const [cat, setCat] = useState(product.category);
  const [price, setPrice] = useState(product.price);
  const [status, setStatus] = useState(product.status);

  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete states
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    // Only reset fields when modal opens for the first time or when opening a different product
    // Don't reset if we're in the middle of an update session
    if (open && !hasBeenUpdated) {
      setName(product.name);
      setDesc(product.description);
      setCat(product.category);
      setPrice(product.price);
      setStatus(product.status);
      setError('');
      setSuccess('');
      setEditMode(false);
      setSelectedFile(null);
      setImagePreview(null);
    }
    
    // Reset session state when modal closes
    if (!open) {
      setError('');
      setSuccess('');
      setEditMode(false);
      setHasBeenUpdated(false); // Reset for next modal session
      setSelectedFile(null);
      setImagePreview(null);
      setIsDragOver(false);
    }
  }, [open, product.id, product.name, product.description, product.category, product.price, product.status, hasBeenUpdated])

  // Function to fetch latest product data
  const fetchLatestProductData = async () => {
    if (!user || !product.id) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.product) {
        const latestProduct = data.product;
        // Update form fields with latest data from API
        setName(latestProduct.name);
        setDesc(latestProduct.description || '');
        setCat(latestProduct.category || latestProduct.brand || '');
        setPrice(`$${latestProduct.price.toLocaleString()}`);
        setStatus(latestProduct.isActive ? 'Active' : 'Inactive');
        console.log('✅ Refreshed modal with latest product data');
      }
    } catch (error) {
      console.error('❌ Error fetching latest product data:', error);
      // Don't show error to user, just log it
    }
  };

  // Function to update product details
  const updateProduct = async () => {
    if (!user) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert price from string to number (remove $ and commas)
      const numericPrice = parseFloat(price.replace(/[$,]/g, ''));
      
      if (isNaN(numericPrice) || numericPrice < 0) {
        setError('Please enter a valid price');
        return;
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim(),
          brand: cat, // Using category as brand for now
          price: numericPrice,
          isActive: status === 'Active'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Product updated successfully!');
        setEditMode(false);
        setHasBeenUpdated(true); // Mark this modal session as having been updated
        
        // Update the form fields to show the latest values immediately
        // (This ensures the modal shows updated data even before parent refreshes)
        setName(name.trim());
        setDesc(desc.trim());
        setCat(cat);
        setPrice(`$${numericPrice.toLocaleString()}`);
        // Status stays the same as it was already set by the user
        
        // Call parent refresh callback with a small delay to ensure API cache is cleared
        if (onUpdate) {
          console.log('🔄 Triggering product list refresh after update...');
          setTimeout(() => {
            onUpdate();
            // Also refresh the modal with latest data after parent refreshes
            setTimeout(() => {
              fetchLatestProductData();
            }, 200);
          }, 500); // 500ms delay to ensure cache clearing completes
        }
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to update only product status
  const updateProductStatus = async (newStatus: string) => {
    if (!user) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = await user.getIdToken();
      
      // Convert price from string to number for the API
      const numericPrice = parseFloat(price.replace(/[$,]/g, ''));
      
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim(),
          brand: cat,
          price: numericPrice,
          isActive: newStatus === 'Active' // Only 'Active' is true, 'Hold' and 'Out Of Stock' are false
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Product status updated successfully!');
        setStatus(newStatus);
        setHasBeenUpdated(true); // Mark this modal session as having been updated
        
        // Call parent refresh callback with a small delay to ensure API cache is cleared
        if (onUpdate) {
          console.log('🔄 Triggering product list refresh after status update...');
          setTimeout(() => {
            onUpdate();
            // Also refresh the modal with latest data after parent refreshes
            setTimeout(() => {
              fetchLatestProductData();
            }, 200);
          }, 500); // 500ms delay to ensure cache clearing completes
        }
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Validate image file
  const validateImageFile = (file: File): string | null => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file';
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  // Process selected image file
  const processImageFile = (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setError(''); // Clear any existing errors
  };

  // Handle image file selection from input
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processImageFile(file);
    }
  };

  // Handle image upload to Firebase Storage
  const handleImageUpload = async () => {
    if (!selectedFile || !user || !product.sku) {
      setError('Missing required data for upload');
      return;
    }

    setUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      console.log(`🔄 Uploading image for product SKU: ${product.sku}`);
      
      // Upload the image with SKU as filename (returns URL string directly)
      const downloadURL = await uploadProductImage(selectedFile, product.sku);
      
      setSuccess(`Image uploaded successfully! New image will appear shortly.`);
      
      // Clear the selected file and preview
      setSelectedFile(null);
      setImagePreview(null);
      setIsDragOver(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Mark as updated
      setHasBeenUpdated(true);
      
      // Trigger parent refresh to show updated image
      if (onUpdate) {
        setTimeout(() => {
          onUpdate();
        }, 1000); // Give some time for Firebase Storage to propagate
      }
      
      console.log('✅ Image upload completed successfully:', downloadURL);
    } catch (error) {
      console.error('❌ Image upload error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!user || !product.id || !product.sku) {
      setError('Missing required data for deletion');
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      console.log(`🗑️ Deleting product: ${product.name} (SKU: ${product.sku})`);
      
      const token = await user.getIdToken();
      
      // Step 1: Delete product from database
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete product from database');
      }

      console.log('✅ Product deleted from database successfully');
      
      // Step 2: Delete product image from Firebase Storage
      try {
        await deleteProductImage(product.sku);
        console.log('✅ Product image deleted from Firebase Storage successfully');
      } catch (imageError) {
        console.warn('⚠️ Failed to delete image from Firebase Storage (image may not exist):', imageError);
        // Don't fail the entire operation if image deletion fails
      }
      
      setSuccess('Product and image deleted successfully!');
      
      // Call parent refresh callback to update the product list
      if (onUpdate) {
        console.log('🔄 Triggering product list refresh after deletion...');
        setTimeout(() => {
          onUpdate();
        }, 500);
      }
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
      console.log('✅ Product deletion completed successfully');
    } catch (error) {
      console.error('❌ Product deletion error:', error);
      setError(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div ref={modalRef} className="bg-white border-2 border-gray-200 rounded-md shadow-xl max-w-2xl w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
          aria-label="Close"
        >
          <X />
        </button>
        <h2 className="text-xl font-bold mb-6 text-black">Product Details</h2>
        
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {/* Product Image Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-base mb-3 text-black">Product Image</h3>
          <div className="flex gap-4 items-start">
            {/* Current Product Image */}
            <div className="relative">
              <ProductImage 
                sku={product.sku}
                name={product.name}
                width={160}
                height={120}
                className="object-contain rounded-lg border"
                showMessage={true}
              />
              {editMode && (
                <div className="absolute -top-2 -right-2">
                  <button
                    className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload new image"
                  >
                    <Camera size={14} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Image Preview (when uploading) */}
            {imagePreview && (
              <div className="relative">
                <Image 
                  src={imagePreview} 
                  alt="Preview" 
                  width={160}
                  height={112}
                  className="object-contain rounded-lg border"
                />
                <div className="absolute -top-2 -right-2">
                  <button
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                      setIsDragOver(false);
                    }}
                    title="Remove preview"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg text-center">
                  New Image
                </div>
              </div>
            )}
            
            {/* Upload Button (Edit Mode) */}
            {editMode && !imagePreview && (
              <div 
                className={`w-40 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={24} className={`mb-1 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-xs text-center px-2 ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`}>
                  {isDragOver ? 'Drop image here' : 'Click or drag to upload'}
                </span>
              </div>
            )}
          </div>
          
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Upload Image Button */}
          {selectedFile && imagePreview && (
            <button
              onClick={handleImageUpload}
              disabled={uploadingImage}
              className="mt-3 bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Image
                </>
              )}
            </button>
          )}
        </div>
        {/* Product Info */}
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await updateProduct();
          }}
        >
          <div>
            <label className="block font-semibold mb-1 text-base text-black">Product Name</label>
            <input
              type="text"
              className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block font-semibold text-base mb-1 text-black">Description:</label>
            <textarea
              className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block font-semibold text-base mb-1 text-black">Category:</label>
            <input
              type="text"
              className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
              value={cat}
              onChange={e => setCat(e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block font-semibold text-base mb-1 text-black">Price:</label>
            <input
              type="text"
              className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
              value={price}
              onChange={e => setPrice(e.target.value)}
              disabled={!editMode}
            />
          </div>
          {editMode ? (
            <button
              type="submit"
              disabled={loading}
              className="mt-4 admin-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Details'
              )}
            </button>
          ) : (
            <div className="flex justify-between items-center gap-4 mt-6">
              <button
                className="admin-button"
                onClick={() => setDeleteOpen(true)}
                type="button"
              >
                Delete
              </button>
              <button
                className="admin-button"
                onClick={() => setEditMode(true)}
                type="button"
              >
                Update product details
              </button>
              <div className="relative">
                <button
                  className="admin-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={loading}
                  onClick={() => setStatusDropdownOpen((open) => !open)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update status'
                  )}
                </button>
                {statusDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border rounded-lg shadow-lg z-50 flex flex-col items-center py-4">
                    {["Active", "Hold", "Out Of Stock"].map((option) => (
                      <button
                        key={option}
                        disabled={loading}
                        className={`w-full py-2 text-center text-black hover:bg-[#F1F2F4] disabled:opacity-50 disabled:cursor-not-allowed ${
                          status === option ? "font-bold" : ""
                        }`}
                        onClick={async () => {
                          setStatusDropdownOpen(false);
                          setError('');
                          setSuccess('');
                          await updateProductStatus(option);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
        {/* Delete Popup */}
        {deleteOpen && (
          <DeleteProductPopup
            open={deleteOpen}
            deleting={deleting}
            onClose={() => setDeleteOpen(false)}
            onDelete={async () => {
              setDeleteOpen(false);
              await handleDeleteProduct();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface DeleteProductPopupProps {
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

function DeleteProductPopup({ open, deleting, onClose, onDelete }: DeleteProductPopupProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="bg-white border-2 border-gray-300 rounded-md p-6 w-full max-w-sm mx-4 relative">
        <button
          onClick={onClose}
          disabled={deleting}
          className="absolute top-3 right-3 text-gray-400 hover:text-black text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <X />
        </button>
        <div className="font-bold text-lg mb-4">Delete Product</div>
        <div className="text-gray-700 mb-4">
          Are you sure you want to delete this product? This will also delete the product image from Firebase Storage. This action cannot be undone.
        </div>
        <div className="flex gap-4 justify-between w-full">
          <button
            className="border-2 border-[#F1F2F4] text-black px-4 py-2.5 w-1/2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2.5 w-1/2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
