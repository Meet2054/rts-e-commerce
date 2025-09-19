'use client';
import React, { useState, useRef, useEffect } from 'react';
import AddProductModal from '../components/ui/addProduct';
import AddExcelModal from '../components/ui/addExcel';
import ProductDetailModal from '../components/ui/productDetail';
import { Upload, Plus, ChevronDown } from 'lucide-react';


const products = [
  { id: 'P1023', name: 'HP Toner Cartridge', category: 'Ink & Toner', price: '$3,500', stock: 12, status: 'Active' },
  { id: 'P1024', name: 'Canon Ink Cartridge', category: 'Ink & Toner', price: '$2,200', stock: 8, status: 'Active' },
  { id: 'P1025', name: 'Brother Drum Unit', category: 'Ink & Toner', price: '$1,800', stock: 15, status: 'Active' },
  { id: 'P1026', name: 'Epson Ink Pack', category: 'Ink & Toner', price: '$1,000', stock: 20, status: 'Active' },
  { id: 'P1027', name: 'Lexmark Toner Cartridge', category: 'Ink & Toner', price: '$3,100', stock: 10, status: 'Active' },
  { id: 'P1028', name: 'Xerox Ink Cartridge', category: 'Ink & Toner', price: '$2,500', stock: 5, status: 'Active' },
  { id: 'P1029', name: 'Samsung Toner Cartridge', category: 'Ink & Toner', price: '$2,700', stock: 9, status: 'Active' },
  { id: 'P1030', name: 'Dell Ink Cartridge', category: 'Ink & Toner', price: '$1,600', stock: 12, status: 'Active' },
  { id: 'P1031', name: 'Ricoh Toner Cartridge', category: 'Ink & Toner', price: '$3,200', stock: 4, status: 'Active' },
  { id: 'P1032', name: 'OKI Toner Cartridge', category: 'Ink & Toner', price: '$2,900', stock: 7, status: 'Active' },
  { id: 'P1033', name: 'Kyocera Toner Cartridge', category: 'Ink & Toner', price: '$1,900', stock: 11, status: 'Active' },
  { id: 'P1034', name: 'Panasonic Toner Cartridge', category: 'Ink & Toner', price: '$2,400', stock: 6, status: 'Active' },
  { id: 'P1035', name: 'Sharp Ink Cartridge', category: 'Ink & Toner', price: '$3,600', stock: 3, status: 'Active' },
];

export default function ProductsPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
        <div>
          <div className="text-xl font-bold text-black">Products -</div>
          <div className="text-gray-500 text-base">Manage all products in your catalog</div>
        </div>
        <div className="flex gap-3 relative" ref={dropdownRef}>
          <button className="flex items-center gap-2 admin-button">
            <Upload size={16} /> Export Product
          </button>
          <button
            className="flex items-center gap-2 admin-button"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            <Plus size={16} />
            Add New Product
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50">
              <button
                className="w-full admin-button"
                onClick={() => {
                  setDropdownOpen(false);
                  setModalOpen(true);
                }}
              >
                Add Manually
              </button>
              <button
                className="w-full admin-button"
                onClick={() => {
                  setDropdownOpen(false);
                  setExcelModalOpen(true);
                }}
              >
                Upload Excel
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Filter */}
      <div className="flex justify-end mb-4">
        <button className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1">
          Filter by <span className="font-bold">Date Range</span>
          <ChevronDown size={20} />
        </button>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black font-semibold border-b">
              <th className="py-3 px-4">Product ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod.id} className=" text-[#84919A]">
                <td className="py-2.5 px-4 font-medium">{prod.id}</td>
                <td className="py-2.5 px-4">{prod.name}</td>
                <td className="py-2.5 px-4">{prod.category}</td>
                <td className="py-2.5 px-4">{prod.price}</td>
                <td className="py-2.5 px-4">{prod.stock}</td>
                <td className="py-2.5 px-4">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                </td>
                <td className="py-2.5 px-4">
                  <button
                    className="text-[#2E318E] font-semibold hover:underline"
                    onClick={() => {
                      setSelectedProduct(prod);
                      setDetailOpen(true);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-black">Page 1 of 10</span>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 cursor-pointer rounded border-2 border-[#F1F2F4] text-sm font-medium">Previous</button>
            <button className="px-4 py-2.5 cursor-pointer rounded border-2 border-[#F1F2F4] text-sm font-medium">Next</button>
          </div>
        </div>
      </div>
      <AddProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AddExcelModal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} />
      <ProductDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={
          selectedProduct
            ? {
                ...selectedProduct,
                description:
                  "High-quality toner cartridge compatible with HP LaserJet printers. Long-lasting and reliable print performance.",
                images: [],
              }
            : {
                id: "",
                name: "",
                description: "",
                category: "",
                price: "",
                stock: 0,
                status: "",
                images: [],
              }
        }
      />
    </div>
  );
}
