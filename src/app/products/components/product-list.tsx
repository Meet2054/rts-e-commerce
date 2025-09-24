'use client';

import React, { useState, useEffect, useRef } from 'react';
// Sidebar filter component
function ProductFilterSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Only render sidebar for mobile/tablet as popup
  return (
    <div className={`fixed top-32 inset-0 z-50 flex ${open ? '' : 'pointer-events-none opacity-0'}`}>
      <div className="bg-white w-[90vw] max-w-[320px] h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">Filters</div>
          <button onClick={onClose} className="text-gray-500"><X size={30} /></button>
        </div>
        <div className="font-bold text-lg mb-6">Printer Type</div>
        <div className="space-y-2 mb-6">
          {['Inkjet', 'LaserJet', 'All-in-One', '3D Printer'].map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-6">Brand</div>
        <div className="space-y-2 mb-6">
          {['HP', 'Canon', 'Epson', 'Brother', 'Ricoh', 'Zebra (Labels & Barcode Printers)', 'DEERC'].map(brand => (
            <label key={brand} className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-blue-600" />
              {brand}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-6">Cartridge Type</div>
        <div className="space-y-2 mb-6">
          {['Black', 'Blue', 'All'].map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-2 text-gray-400">Printing Features</div>
        <div className="space-y-2 mb-6">
          {['Wireless', 'Duplex (Double-sided)', 'Mobile Printing (AirPrint / Google Print)', 'High-Speed Printing'].map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-400">
              <input type="checkbox" disabled className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>
      </div>
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose}></div>
    </div>
  );
}
import { useAuth } from '@/components/auth/auth-provider';
import { useCartActions } from '@/hooks/use-cart';
import { Package, ArrowRight, Minus, Plus, X, ListFilterPlus } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
}

function ProductList() {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showSortDropdown]);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const { addToCart } = useCartActions();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<{totalItems: number; totalPages: number} | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('pageSize', '50'); // Request 100 products by default

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/products?${params}`, { headers });
      const data = await response.json();

      console.log('🔍 [Frontend] API Response:', data);

      // Check if response is successful (handle both formats)
      if (response.ok && (data.success !== false) && Array.isArray(data.products)) {
        setProducts(data.products);
        
        // Store pagination data
        if (data.pagination) {
          setPagination({
            totalItems: data.pagination.totalItems,
            totalPages: data.pagination.totalPages
          });
        }
        
        // Initialize quantities for all products using SKU
        const initial: Record<string, number> = {};
        data.products.forEach((p: Product) => { initial[p.sku] = 1; });
        setQuantities(initial);
        
        setError('');
        
        // Log pagination info if available
        if (data.pagination) {
          console.log(`📊 [Frontend] Showing ${data.products.length} of ${data.pagination.totalItems} products`);
        }
        
        // Log cache source information
        if (data.source) {
          console.log(`📊 [Frontend] Data source: ${data.source}${data.cached ? ' (cached)' : ' (fresh)'}`);
        }
      } else {
        const errorMessage = data.error || data.message || 'Failed to fetch products';
        setError(errorMessage);
        console.error('❌ [Frontend] API Error:', errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(`Failed to fetch products: ${errorMessage}`);
      console.error('❌ [Frontend] Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual quantity input
  const handleQuantityInput = (sku: string, value: string) => {
    // Allow empty input for typing
    if (value === '') {
      setQuantities(prev => ({
        ...prev,
        [sku]: 0
      }));
      return;
    }

    // Parse and validate the input
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 999) {
      setQuantities(prev => ({
        ...prev,
        [sku]: numValue
      }));
    }
  };

  // Handle quantity input on enter or blur
  const handleQuantitySubmit = (sku: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      // Reset to 1 if invalid
      setQuantities(prev => ({
        ...prev,
        [sku]: 1
      }));
    } else if (numValue > 999) {
      // Cap at 999
      setQuantities(prev => ({
        ...prev,
        [sku]: 999
      }));
    }
  };

  // Handle add to cart with loading state
  const handleAddToCart = async (product: Product, quantity: number) => {
    try {
      setAddingToCart(prev => ({ ...prev, [product.sku]: true }));
      
      await addToCart({
        id: product.sku, // Use SKU as the product ID
        sku: product.sku,
        name: product.name,
        image: product.image || '/product.png',
        price: product.price
      }, quantity);
      
      // Reset quantity after successful add
      setQuantities(prev => ({ ...prev, [product.sku]: 1 }));
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.sku]: false }));
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchProducts}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Use fetched products from database
  let filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logic
  if (sortOption === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortOption === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex gap-6">
      {/* Left Sidebar Filters (desktop only) */}
      <aside className="w-[260px] hidden xl:block pt-6">
        <div className="font-bold text-lg mb-6">Printer Type</div>
        <div className="space-y-2 mb-6">
          {['Inkjet', 'LaserJet', 'All-in-One', '3D Printer'].map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-6">Brand</div>
        <div className="space-y-2 mb-6">
          {['HP', 'Canon', 'Epson', 'Brother', 'Ricoh', 'Zebra (Labels & Barcode Printers)', 'DEERC'].map(brand => (
            <label key={brand} className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-blue-600" />
              {brand}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-6">Cartridge Type</div>
        <div className="space-y-2 mb-6">
          {['Black', 'Blue', 'All'].map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-2 text-gray-400">Printing Features</div>
        <div className="space-y-2 mb-6">
          {['Wireless', 'Duplex (Double-sided)', 'Mobile Printing (AirPrint / Google Print)', 'High-Speed Printing'].map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-400">
              <input type="checkbox" disabled className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>
      </aside>

      {/* Filter button for mobile/tablet */}
      <button
        className="xl:hidden fixed mt-4 left-2 z-40 bg-[#2E318E] text-white px-4 py-2 rounded-md shadow-lg"
        onClick={() => setShowFilterSidebar(true)}
      >
        <ListFilterPlus />
      </button>
      {/* Popup sidebar for mobile/tablet */}
      <ProductFilterSidebar open={showFilterSidebar} onClose={() => setShowFilterSidebar(false)} />

      {/* Main Content */}
      <div className="flex-1 pt-6">
        {/* Top Bar: Results & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="text-2xl pl-4 font-bold text-black">
            Found <span className="text-blue-600">{filteredProducts.length}</span> results for <span className="text-blue-600">{searchTerm || 'All'}</span>
            {pagination && pagination.totalItems > filteredProducts.length && (
              <div className="text-sm text-gray-500 mt-2">
                Showing {filteredProducts.length} of {pagination.totalItems} total products
              </div>
            )}
          </div>
          <div className="flex items-center mt-5 md:mt-0 gap-3">
            <div className="relative" ref={sortDropdownRef}>
              <button
                className="bg-white rounded-md px-3 py-2 text-base font-medium text-gray-700 border border-gray-300 shadow-lg flex items-center gap-2 min-w-[220px]"
                onClick={() => setShowSortDropdown((prev) => !prev)}
                type="button"
              >
                {sortOption === 'featured' && 'Sort by Featured'}
                {sortOption === 'price-low' && 'Sort by Price: Low to High'}
                {sortOption === 'price-high' && 'Sort by Price: High to Low'}
                <span className="ml-auto text-gray-500">▼</span>
              </button>
              {showSortDropdown && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-md shadow-xl z-50">
                  <button
                    className={`block w-full text-left px-4 py-2 text-base hover:bg-blue-50 ${sortOption === 'featured' ? 'bg-blue-100 font-bold' : ''}`}
                    onClick={() => { setSortOption('featured'); setShowSortDropdown(false); }}
                  >
                    Sort by Featured
                  </button>
                  {token && (
                    <button
                      className={`block w-full text-left px-4 py-2 text-base hover:bg-blue-50 ${sortOption === 'price-low' ? 'bg-blue-100 font-bold' : ''}`}
                      onClick={() => { setSortOption('price-low'); setShowSortDropdown(false); }}
                    >
                      Sort by Price: Low to High
                    </button>
                  )}
                  {token && (
                    <button
                      className={`block w-full text-left px-4 py-2 text-base hover:bg-blue-50 ${sortOption === 'price-high' ? 'bg-blue-100 font-bold' : ''}`}
                      onClick={() => { setSortOption('price-high'); setShowSortDropdown(false); }}
                    >
                      Sort by Price: High to Low
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10 gap-4">
            {filteredProducts.map((order) => (
              <motion.div
                key={order.id} 
                className="bg-white rounded-md shadow-sm p-4 flex flex-col hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative w-full justify-center flex mb-2">
                  <span className="absolute right-0 -rotate-45" title="Open">
                    <ArrowRight size={20} />
                  </span>
                  <div
                    className="cursor-pointer"
                    onClick={() => window.location.href = `/products/${order.sku}`}
                  >
                    <Image 
                      src={'/product.png'} 
                      alt={order.name} 
                      width={300} 
                      height={200} 
                      className="object-contain my-7 rounded-lg" 
                    />
                  </div>
                </div>

                <div className='flex flex-row gap-4 justify-between'>
                  <div className='flex flex-col w-[60%] gap-2'>
                    <div
                      className="font-semibold text-base text-black cursor-pointer"
                      onClick={() => window.location.href = `/products/${order.sku}`}
                    >
                      {order.name}
                    </div>
                    {token && <div className="text-lg font-bold text-black">{formatPrice(order.price)}</div>}
                    {!token && <div className="text-sm text-gray-500">Sign in to view pricing</div>}
          
                  </div>
                  {token && (
                    <div className='flex flex-col w-[40%] gap-1'>
                      <div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
                        <button className="cursor-pointer" onClick={e => { e.preventDefault(); setQuantities(q => ({ ...q, [order.sku]: Math.max(1, (q[order.sku] || 1) - 1) })); }}><Minus size={16} /></button>
                        <input
                          type="text"
                          value={quantities[order.sku] || 1}
                          onChange={(e) => handleQuantityInput(order.sku, e.target.value)}
                          onBlur={(e) => handleQuantitySubmit(order.sku, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleQuantitySubmit(order.sku, e.currentTarget.value);
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-12 px-1 text-base text-center bg-transparent border-none outline-none"
                          min="1"
                          max="999"
                        />
                        <button className="cursor-pointer" onClick={e => { e.preventDefault(); setQuantities(q => ({ ...q, [order.sku]: Math.min(999, (q[order.sku] || 1) + 1) })); }}><Plus size={16} /></button>
                      </div>
                      <button
                        className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base block text-center hover:bg-blue-700 transition-colors cursor-pointer"
                        disabled={addingToCart[order.sku]}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(order, quantities[order.sku] || 1);
                        }}
                      >
                        {addingToCart[order.sku] ? 'Adding...' : 'Add Cart'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductListWithCart() {
  return <ProductList />;
}