'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { useCartActions } from '@/hooks/use-cart';
import { useAuth } from '@/components/auth/auth-provider';
import { motion } from 'framer-motion';
import { getProductImageUrlQuick } from '@/lib/product-image-utils';
import ProductImage from '@/components/ui/product-image';

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

    // Handle add to cart
    const handleAddToCart = async (product: Product, quantity: number) => {
        try {
            setAddingToCart(prev => ({ ...prev, [product.sku]: true }));
            
            await addToCart({
                id: product.sku, // Use SKU as the product ID
                sku: product.sku,
                name: product.name,
                image: getProductImageUrlQuick(product.sku),
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
                    <Link href="/products" className="flex items-center admin-button">
                        View more
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {products.map((item) => (
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            key={item.sku} 
                            className="bg-white rounded-md shadow-sm p-3 gap-4 flex flex-col justify-between"
                        >
                            <div 
                                onClick={() => window.location.href = `/products/${item.sku}`}
                                className="w-full justify-center cursor-pointer flex flex-col items-center gap-4 mb-2"
                            >
                                <Link href={`/products/${item.sku}`} className="flex justify-end w-full" title="Open">
                                    <ArrowRight size={20} className='-rotate-45' />
                                </Link>
                                <ProductImage 
                                    sku={item.sku}
                                    name={item.name} 
                                    width={300} 
                                    height={200} 
                                    className="object-contain rounded-lg" 
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
                                        <input
                                            type="text"
                                            value={quantities[item.sku] || 1}
                                            onChange={(e) => handleQuantityInput(item.sku, e.target.value)}
                                            onBlur={(e) => handleQuantitySubmit(item.sku, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleQuantitySubmit(item.sku, e.currentTarget.value);
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            className="w-12 px-1 text-base text-center bg-transparent border-none outline-none"
                                            min="1"
                                            max="999"
                                        />
                                        <button 
                                            className="cursor-pointer" 
                                            onClick={() => setQuantities(q => ({ ...q, [item.sku]: (q[item.sku] || 1) + 1 }))}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base block text-center hover:bg-blue-700 transition-colors cursor-pointer"
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
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecommendedProducts;
