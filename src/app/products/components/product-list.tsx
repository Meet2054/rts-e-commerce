'use client';

import React, { useState, useContext } from 'react';
import { CartContext } from "../../../context/CartContext";
// import { useAuth } from '@/components/auth/auth-provider';
// import { Product } from '@/lib/firebase-types';
import { products as staticProducts } from '../../components/data';
import { Package, ArrowRight, Minus, Plus } from 'lucide-react';
import Image from 'next/image';

function ProductPage() {
  const cartCtx = useContext(CartContext);
  const { addToCart } = cartCtx ?? {};

// interface ProductWithPricing extends Product {
//   effectivePrice: number;
//   hasCustomPricing: boolean;
// }

  // const { token } = useAuth();
  // const [products, setProducts] = useState<ProductWithPricing[]>([]);
  // const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [quantities, setQuantities] = useState(() => {
    const initial: Record<number, number> = {};
    staticProducts.forEach(p => { initial[p.id] = 1; });
    return initial;
  });
  // const [error, setError] = useState('');

  // useEffect(() => {
  //   fetchProducts();
  // }, [searchTerm, token]);

  // const fetchProducts = async () => {
  //   try {
  //     setLoading(true);
  //     const params = new URLSearchParams();
  //     if (searchTerm) params.append('search', searchTerm);

  //     const headers: HeadersInit = {
  //       'Content-Type': 'application/json',
  //     };

  //     if (token) {
  //       headers.Authorization = `Bearer ${token}`;
  //     }

  //     const response = await fetch(`/api/products?${params}`, { headers });
  //     const data = await response.json();

  //     if (data.success) {
  //       setProducts(data.products);
  //       setError('');
  //     } else {
  //       setError(data.error || 'Failed to fetch products');
  //     }
  //   } catch (err) {
  //     setError('Failed to fetch products');
  //     console.error('Error fetching products:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const formatPrice = (price: number) => {
  //   return `$${(price / 100).toFixed(2)}`; // Convert from cents
  // };

  // if (loading) {
  //   return (
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  //       {[...Array(8)].map((_, i) => (
  //         <div key={i} className="bg-white rounded-lg shadow animate-pulse">
  //           <div className="h-48 bg-gray-200 rounded-t-lg"></div>
  //           <div className="p-4 space-y-3">
  //             <div className="h-4 bg-gray-200 rounded"></div>
  //             <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  //             <div className="h-6 bg-gray-200 rounded w-1/3"></div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="text-center py-12">
  //       <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  //       <p className="text-red-600">{error}</p>
  //       <button 
  //         onClick={fetchProducts}
  //         className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
  //       >
  //         Try Again
  //       </button>
  //     </div>
  //   );
  // }

  // Use static products from data.ts
  let filteredProducts = staticProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logic
  if (sortOption === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortOption === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-12 lg:px-16 flex gap-6">
      {/* Left Sidebar Filters */}
      <aside className="w-[260px] hidden lg:block pt-6">
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

      {/* Main Content */}
      <div className="flex-1 pt-6">
        {/* Top Bar: Results & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-black">
            Found <span className="text-blue-600">{filteredProducts.length}</span> results for <span className="text-blue-600">{searchTerm || 'All'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded hover:bg-white" title="Grid View">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </button>
            <button className="p-2 rounded hover:bg-white" title="List View">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1" /><circle cx="3" cy="12" r="1" /><circle cx="3" cy="18" r="1" /></svg>
            </button>
            <div className="relative">
              <select
                className="bg-white rounded px-3 py-2 text-base font-medium text-gray-700"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
              >
                <option value="featured">Sort by Featured</option>
                <option value="price-low">Sort by Price: Low to High</option>
                <option value="price-high">Sort by Price: High to Low</option>
                <option value="rating">Sort by Rating</option>
              </select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((order) => (
              <div key={order.id} className="bg-white rounded-md shadow-sm p-4 flex flex-col hover:shadow-lg transition-shadow">
                <div className="relative w-full justify-center flex mb-2">
                  <span className="absolute right-0 -rotate-45" title="Open">
                    <ArrowRight size={20} />
                  </span>
                  <div
                    className="cursor-pointer"
                    onClick={() => window.location.href = `/products/${order.sku}`}
                  >
                    <Image 
                      src={order.image} 
                      alt={order.name} 
                      width={300} 
                      height={200} 
                      className="object-contain my-10 rounded-lg" 
                    />
                  </div>
                </div>

                <div className='flex flex-row justify-between'>
                  <div className='flex flex-col gap-1'>
                    <div
                      className="font-semibold text-base text-black cursor-pointer"
                      onClick={() => window.location.href = `/products/${order.sku}`}
                    >
                      {order.name}
                    </div>
                    <div className="text-lg font-bold text-black">${order.price}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {/* Star rating */}
                      <span className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="16" height="16" fill={i < Math.floor(order.rating) ? '#FFA500' : '#E5E7EB'} stroke="none" className="inline"><polygon points="8,2 10,6 14,6.5 11,9.5 12,14 8,11.5 4,14 5,9.5 2,6.5 6,6" /></svg>
                        ))}
                      </span>
                      <span>{order.reviews}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
                      <button className="cursor-pointer" onClick={e => { e.preventDefault(); setQuantities(q => ({ ...q, [order.id]: Math.max(1, q[order.id] - 1) })); }}><Minus size={16} /></button>
                      <span className="px-2 text-base">{quantities[order.id]}</span>
                      <button className="cursor-pointer" onClick={e => { e.preventDefault(); setQuantities(q => ({ ...q, [order.id]: q[order.id] + 1 })); }}><Plus size={16} /></button>
                    </div>
                    <button
                      className="mt-2 bg-black cursor-pointer text-white px-4 py-1.5 rounded-md text-base"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (addToCart) {
                          addToCart({ id: order.id, name: order.name, image: order.image, price: order.price }, quantities[order.id]);
                        }
                      }}
                    >
                      Add Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductListWithCart() {
  return <ProductPage />;
}