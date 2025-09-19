'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';


interface ProductDetailProps {
  open: boolean;
  onClose: () => void;
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

export default function ProductDetailModal({ open, onClose, product }: ProductDetailProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
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
    // Reset fields when product changes or modal opens
    setName(product.name);
    setDesc(product.description);
    setCat(product.category);
    setPrice(product.price);
    setStock(product.stock);
    setStatus(product.status);
  }, [product, open]);

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
          onSubmit={e => {
            e.preventDefault();
            setEditMode(false);
            // Add update logic here
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
              className="mt-4 admin-button w-full"
            >
              Update Details
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
                  className="admin-button"
                  type="button"
                  onClick={() => setStatusDropdownOpen((open) => !open)}
                >
                  Update status
                </button>
                {statusDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border rounded-lg shadow-lg z-50 flex flex-col items-center py-4">
                    {["Active", "Hold", "Out Of Stock"].map((option) => (
                      <button
                        key={option}
                        className={`w-full py-2 text-center text-black hover:bg-[#F1F2F4] ${status === option ? "font-bold" : ""}`}
                        onClick={() => {
                          setStatus(option);
                          setStatusDropdownOpen(false);
                          // Add status update logic here
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
