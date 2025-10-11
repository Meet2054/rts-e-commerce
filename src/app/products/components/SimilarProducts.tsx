'use client';
import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useCartActions } from '@/hooks/use-cart';
import Link from 'next/link';
import { ArrowRight, Plus, Minus, Loader2  } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProductImageUrlQuick } from '@/lib/product-image-utils';
import ProductImage from '@/components/ui/product-image';



// Accept product and products as props
interface Product {
    sku: string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    price: number;
    category: string;
    brand: string;
    katunPN?: string;
}

interface SimilarProductsProps {
    product: Product;
    products: Product[];
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({ product, products }) => {
    // Find 4 similar products by category or brand, excluding the selected product
    const [quantities, setQuantities] = useState<{ [sku: string]: number }>({});
    const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
      
    const { addToCart } = useCartActions();

     const formatPrice = (price: number) => {
        return `${price.toFixed(2)}`;
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

    const handleAddToCart = async (item: Product) => {
        try {
            setIsAddingToCart(item.sku);
            await addToCart({
                id: item.sku,
                sku: item.sku,
                name: item.name,
                image: getProductImageUrlQuick(item.sku),
                price: item.price,
                brand: item.brand,
                category: item.category
            }, quantities[item.sku] || 1);
            // Reset only this item's quantity
            setQuantities(q => ({ ...q, [item.sku]: 1 }));
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(null);
        }
    };

    const similar = useMemo(() => {
        return products
            .filter(p => (p.category === product.category || p.brand === product.brand) && p.sku !== product.sku)
            .slice(0, 4);
    }, [products, product.category, product.brand, product.sku]);

    // Initialize quantities for similar products
    useEffect(() => {
        const initial: { [sku: string]: number } = {};
        similar.forEach(item => { initial[item.sku] = 1; });
        setQuantities(initial);
    }, [similar]);

    return (
        <div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
            <div className='flex flex-col w-full'>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl pl-3 font-bold border-l-8 border-[#2E318E] p-0.5 text-black">Similar Products</h2>
                    <Link href="/products" className="flex items-center admin-button">
                        View more
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {similar.map((item) => (
                        <motion.div
							key={item.sku}
							className="bg-white rounded-md shadow-sm p-3 gap-4 flex flex-col justify-between"
							whileHover={{ scale: 1.05 }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
						>                            
                            <div 
                            className="w-full justify-center cursor-pointer overflow-hidden flex flex-col items-center gap-4 mb-2"
                            onClick={() => window.location.href = `/products/${item.sku}`}
                            >
                                <Link href={`/products/${item.sku}`} className="flex justify-end w-full" title="Open">
                                    <ArrowRight size={20} className='-rotate-45' />
                                </Link>
                                <ProductImage 
                                    sku={item.sku} 
                                    katunPn={item.katunPN}
                                    name={item.name} 
                                    width={200} 
                                    height={200} 
                                    className="object-contain rounded-lg" 
                                />
                            </div>
                            <div className='flex flex-row gap-2 justify-between'>
                                <div className='flex w-[60%] flex-col gap-1'>
                                    <div className="font-semibold text-base text-black">{item.name}</div>
                                    <div className="text-lg font-bold text-black">${formatPrice(item.price)}</div>
                                </div>
                                <div>
                                    <div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
                                        <button
                                            onClick={() => setQuantities(q => ({
                                                ...q,
                                                [item.sku]: Math.max(1, (q[item.sku] || 1) - 1)
                                            }))}
                                            disabled={(quantities[item.sku] || 1) <= 1}
                                            className="cursor-pointer"
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
                                            onClick={() => setQuantities(q => ({
                                                ...q,
                                                [item.sku]: Math.min(999, (q[item.sku] || 1) + 1)
                                            }))}
                                            disabled={(quantities[item.sku] || 1) >= 999}
                                            className="cursor-pointer"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(item)}
                                        disabled={isAddingToCart === item.sku}
                                        className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base block text-center hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        {isAddingToCart === item.sku ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            `Add Cart`
                                        )}
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

export default SimilarProducts;
