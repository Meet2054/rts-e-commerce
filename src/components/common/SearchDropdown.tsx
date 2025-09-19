'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
}

interface BrandGroup {
  brand: string;
  products: Product[];
}

const SearchDropdown: React.FC = () => {
  const [brandGroups, setBrandGroups] = useState<BrandGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBrand, setSearchBrand] = useState('');
  const [searchSeries, setSearchSeries] = useState('');
  const [searchModel, setSearchModel] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100'); // Get more products for search
        if (response.ok) {
          const data = await response.json();
          
          // Group products by brand
          const products: Product[] = data.products as Product[];
          const grouped = products.reduce((acc: { [key: string]: Product[] }, product: Product) => {
            const brand = product.brand || 'Other';
            if (!acc[brand]) {
              acc[brand] = [];
            }
            acc[brand].push(product);
            return acc;
          }, {});

          // Convert to array format and limit products per brand
          const brandGroupsArray = Object.entries(grouped)
            .map(([brand, products]) => ({
              brand,
              products: products.slice(0, 13) // Limit to 13 products per brand
            }))
            .slice(0, 4); // Limit to 4 brands

          setBrandGroups(brandGroupsArray);
        }
      } catch (error) {
        console.error('Error fetching products for search:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = () => {
    let searchParams = new URLSearchParams();
    if (searchBrand) searchParams.set('brand', searchBrand);
    if (searchSeries) searchParams.set('search', searchSeries);
    if (searchModel) searchParams.set('model', searchModel);
    
    const queryString = searchParams.toString();
    window.location.href = `/products${queryString ? '?' + queryString : ''}`;
  };

  if (loading) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 top-12 z-40 w-[92%] max-w-[1550px] bg-white rounded-md border border-gray-200 px-8 py-5">
        <div className="mb-6 text-2xl font-semibold text-black">Search for products, categories, or brands...</div>
        <div className="animate-pulse">
          <div className="flex gap-6 mb-6">
            <div className="flex-1 bg-gray-200 rounded-lg h-10"></div>
            <div className="flex-1 bg-gray-200 rounded-lg h-10"></div>
            <div className="flex-1 bg-gray-200 rounded-lg h-10"></div>
          </div>
          <div className="grid grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-gray-200 h-6 rounded"></div>
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="bg-gray-100 h-4 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
// (Removed duplicate return block)
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-12 z-40 w-[92%] max-w-[1550px] bg-white rounded-md border border-gray-200 px-8 py-5">
      <div className="mb-6 text-2xl font-semibold text-black">Search for products, categories, or brands...</div>
      <div className="flex gap-6 text-base mb-6">
        <input
          type="text"
          value={searchBrand}
          onChange={(e) => setSearchBrand(e.target.value)}
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Select a Printer Brand"
        />
        <input
          type="text"
          value={searchSeries}
          onChange={(e) => setSearchSeries(e.target.value)}
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Select a Printer Series"
        />
        <input
          type="text"
          value={searchModel}
          onChange={(e) => setSearchModel(e.target.value)}
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Select a Printer Model"
        />
        <button 
          onClick={handleSearch}
          className="bg-[#2E318E] text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
      <div className="grid grid-cols-4 gap-8">
        {brandGroups.map((brandGroup) => (
          <div key={brandGroup.brand}>
            <div className="font-semibold text-gray-900 mb-2">Explore {brandGroup.brand} Products</div>
            <ul className="space-y-1">
              {brandGroup.products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.sku}`}
                    className="w-full text-left py-0.5 rounded text-sm text-gray-400 hover:text-orange-500 cursor-pointer transition-colors block"
                  >
                    {product.name} <span className="">({product.sku})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

};

export default SearchDropdown;
