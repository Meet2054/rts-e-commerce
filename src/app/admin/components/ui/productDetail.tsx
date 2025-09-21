'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';


interface ProductDetailProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Callback to refresh parent component
  product: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: string;
    stock: number;
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
  const [stock, setStock] = useState(product.stock);
  const [status, setStatus] = useState(product.status);

  // Images (dummy for now)
  const [images, setImages] = useState([1, 2, 3]);

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
      setStock(product.stock);
      setStatus(product.status);
      setError('');
      setSuccess('');
      setEditMode(false);
    }
    
    // Reset session state when modal closes
    if (!open) {
      setError('');
      setSuccess('');
      setEditMode(false);
      setHasBeenUpdated(false); // Reset for next modal session
    }
  }, [open, product.id, hasBeenUpdated]); // Only depend on modal open state and product ID

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
        setCat(latestProduct.brand || 'Ink & Toner');
        setPrice(`$${latestProduct.price.toLocaleString()}`);
        setStock(0); // API doesn't provide stock
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
        
        {/* Images */}
        <div className="flex gap-4 mb-6">
          {images.map((i, idx) => (
            <div key={i} className="w-40 h-28 border rounded-lg flex items-center justify-center relative bg-[#F1F2F4]">
              {editMode && (
                <button
                  className="absolute -top-2 -right-2 p-0.5 items-center justify-center rounded-full bg-gray-400 cursor-pointer"
                  onClick={() => setImages(imgs => imgs.filter((_, j) => j !== idx))}
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              )}
              <span className="text-xs text-gray-400">Image {i}</span>
            </div>
          ))}
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
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-semibold text-base mb-1 text-black">Price:</label>
              <input
                type="text"
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
                value={price}
                onChange={e => setPrice(e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-base mb-1 text-black">Stock:</label>
              <input
                type="text"
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
                value={stock}
                onChange={e => setStock(Number(e.target.value))}
                disabled={!editMode}
              />
            </div>
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
            onClose={() => setDeleteOpen(false)}
            onDelete={() => {
              setDeleteOpen(false);
              onClose();
              // Add delete logic here
            }}
          />
        )}
      </div>
    </div>
  );
}

interface DeleteProductPopupProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

function DeleteProductPopup({ open, onClose, onDelete }: DeleteProductPopupProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="bg-white border-2 border-gray-300 rounded-md p-6 w-full max-w-sm mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-black text-xl font-bold"
          aria-label="Close"
        >
          <X />
        </button>
        <div className="font-bold text-lg mb-4">Delete Product</div>
        <div className="text-gray-700 mb-4">
          Are you sure you want to delete this product? This action cannot be undone.
        </div>
        <div className="flex gap-4 justify-between w-full">
          <button
            className="border-2 border-[#F1F2F4] text-black px-4 py-2.5 w-1/2 rounded font-semibold"
            onClick={onClose}
          >
            Back
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2.5 w-1/2 rounded font-semibold"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
