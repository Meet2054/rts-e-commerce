'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useCartActions } from '@/hooks/use-cart';
import Image from 'next/image';
import ProductImage from "../../../../public/product.png"
import Link from 'next/link';
import { ArrowRight, Plus, Minus, Loader2  } from 'lucide-react';
import { motion } from 'framer-motion';


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

    const handleAddToCart = async (item: Product) => {
        try {
            setIsAddingToCart(item.sku);
            await addToCart({
                id: item.sku,
                sku: item.sku,
                name: item.name,
                image: ProductImage.src,
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

    // Initialize quantities for similar products
    useEffect(() => {
        const initial: { [sku: string]: number } = {};
        similar.forEach(item => { initial[item.sku] = 1; });
        setQuantities(initial);
    }, [products, product]);

    const similar = products
        .filter(p => (p.category === product.category || p.brand === product.brand) && p.sku !== product.sku)
        .slice(0, 4);

    return (
        <div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
            <div className='flex flex-col w-full'>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl pl-3 font-bold text-black">Similar Products</h2>
                    <Link href="/products" className="flex items-center py-2 text-gray-700 hover:text-black text-sm font-medium">
                        View more
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {similar.map((item) => (
                        <motion.div
							key={item.sku}
							className="bg-white rounded-md shadow-sm p-4 flex flex-col"
							whileHover={{ scale: 1.05 }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
						>                            
                            <div className="relative w-full justify-center flex mb-2">
                                <Link href={`/products/${item.sku}`} className="absolute right-0 -rotate-45" title="Open">
                                    <ArrowRight size={20} />
                                </Link>
                                <Image 
                                    src={ProductImage} 
                                    alt={item.name} 
                                    width={300} 
                                    height={200} 
                                    className="object-contain my-7 rounded-lg" 
                                />
                            </div>
                            <div className='flex flex-row gap-2 justify-between'>
                                <div className='flex w-[60%] flex-col gap-1'>
                                    <div className="font-semibold text-base text-black">{item.name}</div>
                                    <div className="text-lg font-bold text-black">${item.price}</div>
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
                                        <span className="px-2 text-base">{quantities[item.sku] || 1}</span>
                                        <button
                                            onClick={() => setQuantities(q => ({
                                                ...q,
                                                [item.sku]: Math.min(100, (q[item.sku] || 1) + 1)
                                            }))}
                                            disabled={(quantities[item.sku] || 1) >= 100}
                                            className="cursor-pointer"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(item)}
                                        disabled={isAddingToCart === item.sku}
                                        className="mt-2 cursor-pointer bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base"
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
