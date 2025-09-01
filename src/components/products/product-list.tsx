// src/components/products/product-list.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Product } from '@/lib/firebase-types';
import { Search, ShoppingCart, Package } from 'lucide-react';

interface ProductWithPricing extends Product {
  effectivePrice: number;
  hasCustomPricing: boolean;
}

export default function ProductList() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductWithPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/products?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`; // Convert from cents
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.hasCustomPricing && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Your Price
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {product.brand} • SKU: {product.sku}
                </p>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(product.effectivePrice)}
                  </span>
                  {product.hasCustomPricing && product.effectivePrice !== product.basePrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.basePrice)}
                    </span>
                  )}
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}