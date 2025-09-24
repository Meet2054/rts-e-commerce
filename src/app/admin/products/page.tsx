'use client';
import React, { useState, useRef, useEffect } from 'react';
import AddProductModal from '../components/ui/addProduct';
import AddExcelModal from '../components/ui/addExcel';
import ProductDetailModal from '../components/ui/productDetail';
import { Upload, Plus, ChevronDown, Search, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  brand: string;
  price: number;
  image: string;
  oem: string;
  oemPN: string;
  katunPN: string;
  isActive: boolean;
  category?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface ModalProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  status: string;
  images?: string[];
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export default function ProductsPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ModalProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Products per page
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Fetching products page ${currentPage} from API...`);
        
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          ...(searchTerm && { search: searchTerm })
        });
        
        const response = await fetch(`/api/products?${searchParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ Loaded ${data.products.length} products from ${data.source}`);
          setProducts(data.products);
          setFilteredProducts(data.products); // Not needed for pagination, but keeping for compatibility
          setPagination(data.pagination);
          setError('');
        } else {
          console.error('❌ Failed to fetch products:', data.error);
          setError(data.error || 'Failed to fetch products');
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setError('Network error while fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, pageSize, searchTerm]); // Refetch when page or search changes

  // Refresh function that can be called from child components
  const refreshProducts = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Refreshing products page ${currentPage} from API...`);
      
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        // Add cache-busting parameter to force fresh data
        t: Date.now().toString(),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/products?${searchParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Refreshed ${data.products.length} products from ${data.source}`);
        setProducts(data.products);
        setFilteredProducts(data.products);
        setPagination(data.pagination);
        setError('');
      } else {
        console.error('❌ Failed to refresh products:', data.error);
        setError(data.error || 'Failed to refresh products');
      }
    } catch (error) {
      console.error('❌ Error refreshing products:', error);
      setError('Network error while refreshing products');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debouncing to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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

  const openDetailModal = (product: Product) => {
    // Convert the API product structure to the format expected by ProductDetailModal
    const modalProduct = {
      id: product.sku, // Use SKU for the API endpoint
      name: product.name,
      description: product.description,
      category: product.category || 'Ink & Toner',
      price: `$${product.price.toLocaleString()}`,
      stock: 0, // API doesn't provide stock info
      status: product.isActive ? 'Active' : 'Inactive',
      images: product.image ? [product.image] : []
    };
    
    setSelectedProduct(modalProduct);
    setDetailOpen(true);
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (pagination?.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (pagination?.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-[1550px] p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
        <div>
          <div className="text-xl font-bold text-black">Products -</div>
          <div className="text-gray-500 text-base">
            {loading ? 'Loading products...' : (
              pagination ? 
                `Showing ${pagination.startIndex}-${pagination.endIndex} of ${pagination.totalItems} products` :
                `Manage ${products.length} products in your catalog`
            )}
            {searchTerm && !loading && ` (search: "${searchTerm}")`}
          </div>
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
      
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products by name, SKU, brand, OEM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1">
          Filter by <span className="font-bold">Date Range</span>
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black font-semibold border-b">
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Brand</th>
              <th className="py-3 px-4">OEM</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-gray-500">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center">
                  <p className="text-gray-500">
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </p>
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} className=" text-[#84919A]">
                  <td className="py-2.5 px-4 font-medium">{prod.sku}</td>
                  <td className="py-2.5 px-4 max-w-xs truncate" title={prod.name}>{prod.name}</td>
                  <td className="py-2.5 px-4">{prod.brand}</td>
                  <td className="py-2.5 px-4">{prod.oem}</td>
                  <td className="py-2.5 px-4 font-semibold">${prod.price.toLocaleString()}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      prod.isActive 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {prod.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <button
                      className="text-[#2E318E] font-semibold hover:underline"
                      onClick={() => openDetailModal(prod)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-black">
            {loading ? 'Loading...' : (
              pagination ? 
                `Showing ${pagination.startIndex}-${pagination.endIndex} of ${pagination.totalItems} products` :
                'No pagination data'
            )}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={prevPage}
              disabled={!pagination?.hasPrevPage || loading}
              className={`admin-button ${
                pagination?.hasPrevPage && !loading
                  ? 'border-[#F1F2F4] hover:bg-gray-50 cursor-pointer' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex gap-1">
                {/* Show page numbers around current page */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else {
                    const start = Math.max(1, pagination.currentPage - 2);
                    const end = Math.min(pagination.totalPages, start + 4);
                    pageNumber = start + i;
                    if (pageNumber > end) return null;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      disabled={loading}
                      className={`px-3 py-2.5 rounded border-2 text-sm font-medium transition-colors ${
                        pageNumber === pagination.currentPage
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-[#F1F2F4] hover:bg-gray-50 cursor-pointer'
                      } ${loading ? 'cursor-not-allowed' : ''}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            )}
            
            <button 
              onClick={nextPage}
              disabled={!pagination?.hasNextPage || loading}
              className={`admin-button ${
                pagination?.hasNextPage && !loading
                  ? 'border-[#F1F2F4] hover:bg-gray-50 cursor-pointer' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <AddProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AddExcelModal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} />
      <ProductDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={refreshProducts}
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
