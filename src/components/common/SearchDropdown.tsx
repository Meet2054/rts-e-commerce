'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  oem: string;
}

interface SearchDropdownProps {
  onClose?: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ onClose }) => {
  const [availableOEMs, setAvailableOEMs] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOEMDropdown, setShowOEMDropdown] = useState(false);
  const [selectedOEM, setSelectedOEM] = useState('');
  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingOEM, setIsLoadingOEM] = useState(false);
  const [isLoadingProductType, setIsLoadingProductType] = useState(false);
  const oemDropdownRef = useRef<HTMLDivElement>(null);
  const productTypeDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Product types based on analysis
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

  // Fetch all OEMs on component mount
  useEffect(() => {
    const fetchOEMs = async () => {
      try {
        const response = await fetch('/api/products?pageSize=1000'); // Get all products to extract OEMs
        if (response.ok) {
          const data = await response.json();
          
          // Extract unique OEMs from products
          const products: Product[] = data.products as Product[];
          const oems = [...new Set(products
            .map((p: Product) => p.oem)
            .filter((oem: string | undefined): oem is string => Boolean(oem && oem.trim()))
          )].sort() as string[];
          
          setAvailableOEMs(oems);
        }
      } catch (error) {
        console.error('Error fetching OEMs for search:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOEMs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (oemDropdownRef.current && !oemDropdownRef.current.contains(event.target as Node)) {
        setShowOEMDropdown(false);
      }
      if (productTypeDropdownRef.current && !productTypeDropdownRef.current.contains(event.target as Node)) {
        setShowProductTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle free search functionality
  const performFreeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&pageSize=100`);
      if (response.ok) {
        const data = await response.json();
        setSelectedProducts(data.products || []);
        setSelectedOEM(''); // Clear OEM selection when doing free search
        setSelectedProductType(''); // Clear product type selection
      }
    } catch (error) {
      console.error('Error performing free search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced free search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchModel.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performFreeSearch(searchModel);
      }, 500); // 500ms debounce
    } else if (searchModel.trim().length === 0) {
      // Clear search results when input is cleared
      if (selectedProducts.length > 0 && !selectedOEM) {
        setSelectedProducts([]);
      }
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchModel, selectedProducts.length, selectedOEM]);

  // Fetch products for selected OEM and product type
  const fetchProductsForOEM = async (oem: string) => {
    try {
      setIsLoadingOEM(true);
      const url = `/api/products?oem=${encodeURIComponent(oem)}&pageSize=100`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        let products = data.products || [];
        
        // Filter by product type if selected
        if (selectedProductType) {
          products = products.filter((product: Product) => 
            product.name.toLowerCase().includes(selectedProductType.toLowerCase())
          );
        }
        
        setSelectedProducts(products);
      }
    } catch (error) {
      console.error('Error fetching products for OEM:', error);
    } finally {
      setIsLoadingOEM(false);
    }
  };

  const handleOEMSelect = (oem: string) => {
    setSelectedOEM(oem);
    setShowOEMDropdown(false);
    fetchProductsForOEM(oem);
  };

  const handleProductTypeSelect = (productType: string) => {
    setSelectedProductType(productType);
    setShowProductTypeDropdown(false);
    // Re-fetch products if OEM is already selected
    if (selectedOEM) {
      setIsLoadingProductType(true);
      fetchProductsForOEM(selectedOEM).finally(() => {
        setIsLoadingProductType(false);
      });
    }
  };

  // Function to split products into columns
  const splitProductsIntoColumns = (products: Product[], numColumns: number) => {
    const columns: Product[][] = Array.from({ length: numColumns }, () => []);
    products.forEach((product, index) => {
      columns[index % numColumns].push(product);
    });
    return columns;
  };

  const handleFreeSearch = () => {
    performFreeSearch(searchModel);
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    // Add OEM filter if selected
    if (selectedOEM.trim()) {
      searchParams.set('oem', selectedOEM);
    }
    
    // Add product type filter if selected
    if (selectedProductType.trim()) {
      searchParams.set('productType', selectedProductType);
    }
    
    // Add search term if entered
    if (searchModel.trim()) {
      searchParams.set('search', searchModel);
    }
    
    const queryString = searchParams.toString();
    
    // Close dropdown before navigation
    if (onClose) {
      onClose();
    }
    
    // Navigate to products page with filters
    window.location.href = `/products${queryString ? '?' + queryString : ''}`;
  };

  if (loading) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 top-24 z-40 w-[92%] max-w-[1550px] bg-white rounded-md border border-gray-200 px-8 py-5">
        <div className="mb-6 text-2xl font-semibold text-black">Search for products, categories, or brands...</div>
        <div className="animate-pulse">
          <div className="flex gap-6 mb-6">
            <div className="flex-1 bg-gray-200 rounded-lg h-10"></div>
            <div className="flex-1 bg-gray-200 rounded-lg h-10"></div>
            <div className="flex-1 bg-gray-200 rounded-lg h-10"></div>
            <div className="bg-gray-200 rounded-lg h-10 w-24"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
// (Removed duplicate return block)
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-24 z-40 w-[92%] max-w-[1550px] bg-white rounded-md border border-gray-200 px-8 py-5">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-semibold text-black">
          {selectedOEM ? `${selectedOEM} Products` : 
           searchModel.length >= 2 ? `Search results for "${searchModel}"` :
           'Search for products, categories, or brands...'}
          {isSearching && (
            <span className="ml-2 text-base text-gray-500">
              <span className="animate-spin inline-block">⟳</span> Searching...
            </span>
          )}
        </div>
        {(selectedOEM || searchModel.length >= 2) && (
          <button
            onClick={() => {
              setSelectedOEM('');
              setSelectedProductType('');
              setSelectedProducts([]);
              setSearchModel('');
              setIsSearching(false);
              setIsLoadingOEM(false);
              setIsLoadingProductType(false);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Clear Search
          </button>
        )}
      </div>
      <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-base mb-6">
        <div className="relative flex-1" ref={oemDropdownRef}>
          <button
            onClick={() => setShowOEMDropdown(!showOEMDropdown)}
            className="w-full bg-gray-100 rounded-lg py-1.5 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-between"
          >
            {selectedOEM || "Select a Printer Brand"}
            <span className="text-gray-500">▼</span>
          </button>
          {showOEMDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {availableOEMs.map((oem) => (
                <button
                  key={oem}
                  onClick={() => handleOEMSelect(oem)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 border-b border-gray-100 last:border-b-0"
                >
                  {oem}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex-1" ref={productTypeDropdownRef}>
          <button
            onClick={() => setShowProductTypeDropdown(!showProductTypeDropdown)}
            className="w-full bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-between"
          >
            {selectedProductType || "Select Product Type"}
            <span className="text-gray-500">▼</span>
          </button>
          {showProductTypeDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {productTypes.map((productType) => (
                <button
                  key={productType}
                  onClick={() => handleProductTypeSelect(productType)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 border-b border-gray-100 last:border-b-0"
                >
                  {productType}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="text"
          value={searchModel}
          onChange={(e) => setSearchModel(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleFreeSearch();
              if (onClose) {
                onClose();
              }
            }
          }}
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Search products by name, SKU, model..."
        />
        <button 
          onClick={handleSearch}
          className="bg-[#2E318E] text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
      <div className="grid grid-cols-4 gap-8">
        {(isSearching || isLoadingOEM || isLoadingProductType) ? (
          // Show skeleton loading when searching or loading
          <div className="col-span-4">
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 xl:gap-8">
                {[...Array(4)].map((_, columnIndex) => (
                  <div key={columnIndex} className="border border-gray-200 rounded-lg bg-white">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="px-4 py-2">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                        </div>
                        {index < 7 && (
                          <div className="border-b border-gray-100 mt-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedProducts.length > 0 ? (
          // Show products when we have search results or OEM selection
          <div className="col-span-4">
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 xl:gap-8">
                {splitProductsIntoColumns(selectedProducts, 4).map((column, columnIndex) => (
                  <div key={columnIndex} className="border border-gray-200 rounded-lg bg-white">
                    {column.map((product, index) => (
                      <div key={product.id}>
                        <Link
                          href={`/products/${product.sku}`}
                          onClick={() => onClose && onClose()}
                          className="block px-4 py-2 hover:bg-gray-50 transition-colors text-gray-600 hover:text-blue-600"
                        >
                          <span className="text-sm">
                            {product.name} ({product.sku})
                          </span>
                        </Link>
                        {index < column.length - 1 && (
                          <div className="border-b border-gray-100"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : searchModel.length >= 2 && !isSearching ? (
          // Show no results message for search
          <div className="col-span-4 text-center py-12">
            <div className="text-gray-500">
              <div className="text-lg mb-2">No products found</div>
              <div className="text-sm">Try adjusting your search terms</div>
            </div>
          </div>
        ) : !selectedOEM && searchModel.length < 2 ? (
          // Show default OEM list when no OEM is selected and no search
          availableOEMs.slice(0, 16).map((oem) => (
            <div key={oem} className="mb-4">
              <button
                onClick={() => handleOEMSelect(oem)}
                className="block w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="font-semibold text-gray-900 mb-2">
                  {oem}
                </div>
                <div className="text-xs text-gray-500">
                  Click to view products
                </div>
              </button>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );

};

export default SearchDropdown;
