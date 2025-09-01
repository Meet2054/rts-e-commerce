'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Star, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  effectivePrice: number;
  hasCustomPricing: boolean;
  images: string[];
  specifications: Record<string, any>;
  stockQuantity: number;
  minOrderQuantity: number;
  categoryName: string;
  brandName: string;
  variants: Array<{
    id: string;
    name: string;
    type: string;
    value: string;
    effectivePrice: number;
    stockQuantity: number;
  }>;
}

const ProductCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<Array<{ productId: string; variantId?: string; quantity: number }>>([]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products:', data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string, variantId?: string, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.productId === productId && item.variantId === variantId
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { productId, variantId, quantity }];
      }
    });
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);

    const currentPrice = selectedVariant 
      ? product.variants.find(v => v.id === selectedVariant)?.effectivePrice || product.effectivePrice
      : product.effectivePrice;

    const currentStock = selectedVariant
      ? product.variants.find(v => v.id === selectedVariant)?.stockQuantity || 0
      : product.stockQuantity;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Product Image */}
        <div className="h-48 bg-gray-200 relative">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          {product.hasCustomPricing && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Special Price
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            <span className="text-xs text-gray-500">{product.sku}</span>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {product.brandName} • {product.categoryName}
          </p>

          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options:
              </label>
              <select
                value={selectedVariant || ''}
                onChange={(e) => setSelectedVariant(e.target.value || null)}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="">Default</option>
                {product.variants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} (+${variant.effectivePrice - product.effectivePrice})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price and Stock */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                ${currentPrice.toFixed(2)}
              </span>
              {product.hasCustomPricing && (
                <span className="text-xs text-green-600 ml-1">Your Price</span>
              )}
            </div>
            <div className="text-right">
              <div className={`text-sm ${currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
              </div>
              {product.minOrderQuantity > 1 && (
                <div className="text-xs text-gray-500">
                  Min order: {product.minOrderQuantity}
                </div>
              )}
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          {currentStock > 0 && (
            <div className="flex gap-2">
              <input
                type="number"
                min={product.minOrderQuantity || 1}
                max={currentStock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => addToCart(product.id, selectedVariant || undefined, quantity)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {/* Add category options dynamically */}
            </select>
            
            {cart.length > 0 && (
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No products found</div>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
