'use client';
import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddProductProps {
  open: boolean;
  onClose: () => void;
}

export default function AddProductModal({ open, onClose }: AddProductProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
        {/* Image upload boxes */}
        <div className="flex gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-32 h-24 border rounded-lg flex items-center justify-center relative bg-[#F1F2F4]">
              <span className="absolute top-2 right-2 text-gray-400 text-sm cursor-pointer"><X /></span>
              <span className="text-xs text-gray-400">Image {i}</span>
            </div>
          ))}
        </div>
        {/* Form fields */}
        <form className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1 text-black">Product Name</label>
            <input type="text" className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" defaultValue="HP Toner Cartridge" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-black">Description:</label>
            <textarea className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" rows={2} defaultValue="High-quality toner cartridge compatible with HP LaserJet printers. Long-lasting and reliable print performance." />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-black">Category:</label>
            <input type="text" className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" defaultValue="Ink & Toner" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-black">Price:</label>
              <input type="text" className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" defaultValue="$ 3500" />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-black">Stock:</label>
              <input type="text" className="w-full text-sm border rounded px-4 py-2 bg-[#F1F2F4]" defaultValue="12" />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full bg-black text-white py-3 rounded-lg font-medium text-base"
          >
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
}
