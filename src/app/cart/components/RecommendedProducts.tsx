'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { useCartActions } from '@/hooks/use-cart';
import { useAuth } from '@/components/auth/auth-provider';

// Updated Product interface to match API
interface Product {
    id: string;
    sku: string;
    name: string;
    image?: string;
    price: number;
    category?: string;
    brand?: string;
}

const RecommendedProducts: React.FC = () => {
    const { addToCart } = useCartActions();
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    // Fetch recommended products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };

                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const response = await fetch('/api/products', { headers });
                const data = await response.json();
                
                if (data.success && Array.isArray(data.products)) {
                    // Take first 4 products as recommended
                    const recommended = data.products.slice(0, 4);
                    setProducts(recommended);
                    
                    // Initialize quantities
                    const initial: Record<string, number> = {};
                    recommended.forEach((p: Product) => { 
                        initial[p.sku] = 1; 
                    });
                    setQuantities(initial);
                }
            } catch (error) {
                console.error('Failed to fetch recommended products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [token]);

    // Handle add to cart
    const handleAddToCart = async (product: Product, quantity: number) => {
        try {
            setAddingToCart(prev => ({ ...prev, [product.sku]: true }));
            
            await addToCart({
                id: product.sku, // Use SKU as the product ID
                sku: product.sku,
                name: product.name,
                image: '/product.png',
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

    if (loading) {
        return (
            <div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
                <div className='flex flex-col w-full'>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl pl-3 font-bold text-black">Recommended Products</h2>
                        <div className="w-20 h-6 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-md shadow-sm p-4 animate-pulse">
                                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
            <div className='flex flex-col w-full'>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl pl-3 font-bold text-black">Recommended <br className='block sm:hidden'/> Products</h2>
                    <Link href="/products" className="flex items-center py-2 text-gray-700 hover:text-black text-sm font-medium">
                        View more
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {products.map((item) => (
                        <div key={item.sku} className="bg-white rounded-md shadow-sm p-4 flex flex-col">
                            <div className="relative w-full justify-center flex mb-2">
                                <Link href={`/products/${item.sku}`} className="absolute right-0 -rotate-45" title="Open">
                                    <ArrowRight size={20} />
                                </Link>
                                <Image 
                                    src={'/product.png'} 
                                    alt={item.name} 
                                    width={300} 
                                    height={200} 
                                    className="object-contain my-10 rounded-lg" 
                                />
                            </div>
                            <div className='flex flex-row justify-between'>
                                <div className='flex w-[60%] flex-col gap-1'>
                                    <div className="font-semibold text-base text-black">{item.name}</div>
                                    <div className="text-lg font-bold text-black">${item.price.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
                                        <button 
                                            className="cursor-pointer" 
                                            onClick={() => setQuantities(q => ({ ...q, [item.sku]: Math.max(1, (q[item.sku] || 1) - 1) }))}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="px-2 text-base">{quantities[item.sku] || 1}</span>
                                        <button 
                                            className="cursor-pointer" 
                                            onClick={() => setQuantities(q => ({ ...q, [item.sku]: (q[item.sku] || 1) + 1 }))}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        className="mt-2 bg-[#2E318E] cursor-pointer text-white px-4 py-1.5 rounded-md text-base disabled:opacity-50"
                                        disabled={addingToCart[item.sku]}
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleAddToCart(item, quantities[item.sku] || 1);
                                        }}
                                    >
                                        {addingToCart[item.sku] ? 'Adding...' : 'Add Cart'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecommendedProducts;
