'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
// Sidebar filter component
function ProductFilterSidebar({ 
  open, 
  onClose, 
  availableOEMs, 
  selectedOEMs, 
  toggleOEM,
  productTypes,
  selectedProductTypes,
  toggleProductType,
  colorOptions,
  selectedColors,
  toggleColor
}: { 
  open: boolean; 
  onClose: () => void;
  availableOEMs: string[];
  selectedOEMs: string[];
  toggleOEM: (oem: string) => void;
  productTypes: string[];
  selectedProductTypes: string[];
  toggleProductType: (type: string) => void;
  colorOptions: string[];
  selectedColors: string[];
  toggleColor: (color: string) => void;
}) {
  // Only render sidebar for mobile/tablet as popup
  return (
    <div className={`fixed top-32 inset-0 z-50 flex ${open ? '' : 'pointer-events-none opacity-0'}`}>
      <div className="bg-white w-[90vw] max-w-[320px] h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">Filters</div>
          <button onClick={onClose} className="text-gray-500"><X size={30} /></button>
        </div>
        <div className="font-bold text-lg mb-6">Product Type</div>
        <div className="space-y-2 mb-6">
          {productTypes.map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-700">
              <input 
                type="checkbox" 
                className="accent-blue-600" 
                checked={selectedProductTypes.includes(type)}
                onChange={() => toggleProductType(type)}
              />
              {type}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-6">OEM Brand</div>
        <div className="space-y-2 mb-6">
          {availableOEMs.length === 0 ? (
            // Show skeleton loading for OEMs
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))
          ) : (
            availableOEMs.map(oem => (
              <label key={oem} className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  className="accent-blue-600" 
                  checked={selectedOEMs.includes(oem)}
                  onChange={() => toggleOEM(oem)}
                />
                {oem}
              </label>
            ))
          )}
        </div>
        <div className="font-bold text-lg mb-6">Color Type</div>
        <div className="space-y-2 mb-6">
          {colorOptions.map(color => (
            <label key={color} className="flex items-center gap-2 text-gray-700">
              <input 
                type="checkbox" 
                className="accent-blue-600" 
                checked={selectedColors.includes(color)}
                onChange={() => toggleColor(color)}
              />
              {color}
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
import { motion } from 'framer-motion';
import ProductImage from '@/components/ui/product-image';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  oem?: string;
  katunPN?: string;
}

function ProductList() {
  const searchParams = useSearchParams();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<{totalItems: number; totalPages: number; currentPage: number} | null>(null);
  const [availableOEMs, setAvailableOEMs] = useState<string[]>([]);
  const [selectedOEMs, setSelectedOEMs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Product types (same as SearchDropdown)
  const productTypes = [
    'Toner',
    'Cartridge', 
    'Drum',
    'Roller',
    'Kit',
    'Unit',
    'Container',
    'Belt',
    'Developer',
    'Blade'
  ];

  // Color options for cartridges/toners
  const colorOptions = [
    'Black',
    'Cyan', 
    'Magenta',
    'Yellow',
    'Color Pack',
    'Tri-Color',
    'Photo Black',
    'Light Cyan',
    'Light Magenta'
  ];

  const fetchOEMs = useCallback(async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/products?pageSize=1000', { headers }); // Get all products to extract OEMs
      const data = await response.json();

      if (response.ok && data.products) {
        // Extract unique OEMs from products
        const oems = [...new Set(data.products
          .map((p: { oem?: string }) => p.oem)
          .filter((oem: string | undefined): oem is string => Boolean(oem && oem.trim()))
        )].sort() as string[];
        
        setAvailableOEMs(oems);
        console.log('📋 Available OEMs:', oems);
      }
    } catch (error) {
      console.error('Failed to fetch OEMs:', error);
    }
  }, [token]);

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      // Add OEM filtering to API request
      if (selectedOEMs.length > 0) {
        selectedOEMs.forEach(oem => params.append('oem', oem));
      }
      
      params.append('page', page.toString());
      params.append('pageSize', '50');

      // Add cache-busting parameter when user is authenticated to ensure fresh user-specific pricing
      if (token) {
        params.append('t', Date.now().toString());
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔐 [Frontend] Fetching products with user authentication for custom pricing');
      } else {
        console.log('🔓 [Frontend] Fetching products without authentication (base pricing only)');
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
            totalPages: data.pagination.totalPages,
            currentPage: page
          });
          setCurrentPage(page);
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

        // Log custom pricing information if available
        if (token && data.products?.length > 0) {
          const productsWithCustomPricing = data.products.filter((p: Product & { hasCustomPrice?: boolean }) => p.hasCustomPrice);
          if (productsWithCustomPricing.length > 0) {
            console.log(`💰 [Frontend] ${productsWithCustomPricing.length} products have user-specific pricing applied`);
          } else {
            console.log(`💰 [Frontend] No custom pricing found for current user`);
          }
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
  }, [searchTerm, token, selectedOEMs]);

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

  const toggleOEM = (oem: string) => {
    setSelectedOEMs(prev => 
      prev.includes(oem) 
        ? prev.filter(o => o !== oem)
        : [...prev, oem]
    );
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const toggleProductType = (type: string) => {
    setSelectedProductTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    // No page reset needed for client-side filtering
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
    // No page reset needed for client-side filtering
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  useEffect(() => {
    fetchOEMs();
  }, [fetchOEMs]);

  // Initialize filters from URL parameters
  useEffect(() => {
    const oemParam = searchParams.get('oem');
    const productTypeParam = searchParams.get('productType');
    const searchParam = searchParams.get('search');

    // Set OEM filter if present in URL
    if (oemParam) {
      setSelectedOEMs([oemParam]);
    }

    // Set product type filter if present in URL
    if (productTypeParam) {
      setSelectedProductTypes([productTypeParam]);
    }

    // Set search term if present in URL
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Refresh products when user authentication changes to get user-specific pricing
  useEffect(() => {
    if (token) {
      console.log('🔄 [Frontend] User authenticated, refreshing products for user-specific pricing');
      setCurrentPage(1);
      // Use a timeout to ensure the token is fully set before fetching
      setTimeout(() => {
        fetchProducts(1);
      }, 100);
    }
  }, [token, fetchProducts]);

  // Remove full page loading - we'll show skeleton in the products grid instead

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => fetchProducts(currentPage)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Apply client-side filtering for product type and color
  let filteredProducts = products;

  // Filter by product type (check if product name contains the type)
  if (selectedProductTypes.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      selectedProductTypes.some(type => 
        product.name.toLowerCase().includes(type.toLowerCase())
      )
    );
  }

  // Filter by color (check if product name contains the color)
  if (selectedColors.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      selectedColors.some(color => 
        product.name.toLowerCase().includes(color.toLowerCase())
      )
    );
  }

  // Sorting logic (if needed on frontend)
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
        <div className="font-bold text-lg mb-6">Product Type</div>
        <div className="space-y-2 mb-6">
          {productTypes.map(type => (
            <label key={type} className="flex items-center gap-2 text-gray-700">
              <input 
                type="checkbox" 
                className="accent-blue-600" 
                checked={selectedProductTypes.includes(type)}
                onChange={() => toggleProductType(type)}
              />
              {type}
            </label>
          ))}
        </div>
        <div className="font-bold text-lg mb-6">OEM Brand</div>
        <div className="space-y-2 mb-6">
          {availableOEMs.length === 0 ? (
            // Show skeleton loading for OEMs
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))
          ) : (
            availableOEMs.map(oem => (
              <label key={oem} className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  className="accent-blue-600" 
                  checked={selectedOEMs.includes(oem)}
                  onChange={() => toggleOEM(oem)}
                />
                {oem}
              </label>
            ))
          )}
        </div>
        <div className="font-bold text-lg mb-6">Color Type</div>
        <div className="space-y-2 mb-6">
          {colorOptions.map(color => (
            <label key={color} className="flex items-center gap-2 text-gray-700">
              <input 
                type="checkbox" 
                className="accent-blue-600" 
                checked={selectedColors.includes(color)}
                onChange={() => toggleColor(color)}
              />
              {color}
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
      <ProductFilterSidebar 
        open={showFilterSidebar} 
        onClose={() => setShowFilterSidebar(false)}
        availableOEMs={availableOEMs}
        selectedOEMs={selectedOEMs}
        toggleOEM={toggleOEM}
        productTypes={productTypes}
        selectedProductTypes={selectedProductTypes}
        toggleProductType={toggleProductType}
        colorOptions={colorOptions}
        selectedColors={selectedColors}
        toggleColor={toggleColor}
      />

      {/* Main Content */}
      <div className="flex-1 pt-6">
        {/* Top Bar: Results & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="text-2xl pl-4 font-bold text-black">
            Found <span className="text-blue-600">
              {loading ? (
                <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                filteredProducts.length
              )}
            </span> results for <span className="text-blue-600">{searchTerm || (selectedOEMs.length > 0 ? selectedOEMs.join(', ') : 'All')}</span>
            {(selectedOEMs.length > 0 || selectedProductTypes.length > 0 || selectedColors.length > 0) && (
              <div className="text-sm text-gray-600 mt-2">
                {selectedOEMs.length > 0 && <div>OEM: {selectedOEMs.join(', ')}</div>}
                {selectedProductTypes.length > 0 && <div>Product Type: {selectedProductTypes.join(', ')}</div>}
                {selectedColors.length > 0 && <div>Color: {selectedColors.join(', ')}</div>}
                <button 
                  onClick={() => {
                    setSelectedOEMs([]); // This will trigger page reset via API call
                    setSelectedProductTypes([]); // Client-side only
                    setSelectedColors([]); // Client-side only
                    setSearchTerm(''); // Clear search term
                    setCurrentPage(1);
                    // Update URL to remove filters
                    window.history.pushState({}, '', '/products');
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
            {loading ? (
              <div className="text-sm text-gray-500 mt-2">
                <span className="inline-block w-64 h-4 bg-gray-200 rounded animate-pulse"></span>
              </div>
            ) : pagination && (
              <div className="text-sm text-gray-500 mt-2">
                Showing {filteredProducts.length} of {pagination.totalItems} total products (Page {pagination.currentPage} of {pagination.totalPages})
                {(selectedProductTypes.length > 0 || selectedColors.length > 0) && (
                  <span className="text-blue-600"> - Filtered on page</span>
                )}
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-md shadow-sm p-3 gap-4 flex flex-col justify-between animate-pulse">
                <div className="w-full justify-center flex flex-col overflow-hidden items-center gap-4 mb-2">
                  <span className="flex justify-end w-full">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  </span>
                  <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="flex flex-row gap-4 justify-between">
                  <div className="flex flex-col w-[60%] gap-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="flex flex-col w-[40%] gap-1">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10 gap-4">
            {filteredProducts.map((order) => (
              <motion.div
                key={order.id} 
                className="bg-white rounded-md shadow-sm p-3 gap-4 flex flex-col justify-between hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="w-full justify-center cursor-pointer flex flex-col overflow-hidden items-center gap-4 mb-2">
                  <span className="flex justify-end w-full" title="Open">
                    <ArrowRight size={20} className='-rotate-45' />
                  </span>
                  <div
                    className="cursor-pointer rounded-lg"
                    onClick={() => window.location.href = `/products/${order.sku}`}
                  >
                    <ProductImage 
                      sku={order.sku} 
                      katunPn={order.katunPN}
                      name={order.name} 
                      width={200} 
                      height={200} 
                      className="object-cover rounded-lg"
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
                    {token && <div className="text-lg font-bold text-black">${formatPrice(order.price)}</div>}
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

        {/* Pagination Controls */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="flex justify-end items-center gap-4 mt-8">
            <button
              onClick={() => fetchProducts(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-4 py-2 cursor-poi bg-white text-black hover:text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchProducts(pageNum)}
                    className={`px-3 py-1 rounded ${
                      pageNum === currentPage 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-700 cursor-pointer hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => fetchProducts(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 cursor-pointer bg-white text-black hover:text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductListWithCart() {
  return <ProductList />;
}