'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { uploadProductImage, validateImageFile } from '@/lib/firebase-storage';

interface AddProductProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  price: string;
  sku: string;
  brand: string;
  oem: string;
  oemPN: string;
  katunPN: string;
}

export default function AddProductModal({ open, onClose }: AddProductProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'Ink & Toner',
    price: '',
    sku: '',
    brand: '',
    oem: '',
    oemPN: '',
    katunPN: ''
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file');
      return;
    }
    
    setSelectedImage(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name || !formData.sku || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!selectedImage) {
      setError('Please select a product image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload image to Firebase Storage
      console.log('📁 [Add Product] Uploading image for SKU:', formData.sku);
      const imageUrl = await uploadProductImage(selectedImage, formData.sku);
      
      // Create product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        image: imageUrl,
        isActive: true
      };
      
      // Submit to API
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [Add Product] Product added successfully');
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: 'Ink & Toner',
          price: '',
          sku: '',
          brand: '',
          oem: '',
          oemPN: '',
          katunPN: ''
        });
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        throw new Error(result.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('❌ [Add Product] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };
  
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div ref={modalRef} className="bg-white border-2 border-gray-200 rounded-md max-w-2xl w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
          aria-label="Close"
        >
          <X />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-black">Add Product</h2>
        
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Image upload */}
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-black">Product Image *</label>
          <div className="flex gap-4">
            {imagePreview ? (
              <div className="w-32 h-24 border rounded-lg relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 bg-[#F1F2F4]"
              >
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Upload Image</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
        
        {/* Form fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-black">Product Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="HP Toner Cartridge"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">SKU *</label>
              <input 
                type="text" 
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="HP-123456"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block font-semibold mb-1 text-black">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
              rows={2} 
              placeholder="High-quality toner cartridge compatible with HP LaserJet printers"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-black">Category</label>
              <input 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Brand</label>
              <input 
                type="text" 
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="HP"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-black">Price *</label>
              <input 
                type="number" 
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="3500"
                step="0.01"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-black">Katun Part Number</label>
              <input 
                type="text" 
                name="katunPN"
                value={formData.katunPN}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="KTN-12345"
              />
            </div>

          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-black">OEM</label>
              <input 
                type="text" 
                name="oem"
                value={formData.oem}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="Original Equipment Manufacturer"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">OEM Part Number</label>
              <input 
                type="text" 
                name="oemPN"
                value={formData.oemPN}
                onChange={handleInputChange}
                className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" 
                placeholder="OEM-12345"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-black text-white py-3 rounded-lg font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
