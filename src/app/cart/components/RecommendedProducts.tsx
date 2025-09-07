'use client';
import React, { useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { CartContext } from "../../../context/CartContext";
import { products as staticProducts } from '../../components/data';

// Accept product and products as props
interface Product {
    id: number;
    sku: string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    price: number;
    category: string;
    brand: string;
}

const RecommendedProducts: React.FC = () => {
    const cartCtx = useContext(CartContext);
    const cart = cartCtx?.cart ?? [];
    const { addToCart } = cartCtx ?? {};
    
    let referenceProduct: Product | undefined;
    if (cart.length > 0) {
        referenceProduct = staticProducts.find(p => p.id === cart[0].id);
    }
    let similar: Product[];
    if (referenceProduct) {
        similar = staticProducts
            .filter(p => (p.category === referenceProduct.category || p.brand === referenceProduct.brand) && p.id !== referenceProduct.id)
            .slice(0, 4);
    } else {
        // fallback: show first 4 products
        similar = staticProducts.slice(0, 4);
    }

    return (
        <div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-16 py-6 gap-10">
            <div className='flex flex-col w-full'>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl pl-3 font-bold text-black">Recommended Products</h2>
                    <Link href="/products" className="flex items-center py-2 text-gray-700 hover:text-black text-sm font-medium">
                        View more
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {similar.map((item) => (
                        <div key={item.sku} className="bg-white rounded-md shadow-sm p-4 flex flex-col">
                            <div className="relative w-full justify-center flex mb-2">
                                <Link href={`/products/${item.sku}`} className="absolute right-0 -rotate-45" title="Open">
                                    <ArrowRight size={20} />
                                </Link>
                                <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    width={300} 
                                    height={200} 
                                    className="object-contain my-10 rounded-lg" 
                                />
                            </div>
                            <div className='flex flex-row justify-between'>
                                <div className='flex w-[60%] flex-col gap-1'>
                                    <div className="font-semibold text-base text-black">{item.name}</div>
                                    <div className="text-lg font-bold text-black">${item.price}</div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} width="16" height="16" fill={i < Math.floor(item.rating) ? '#FFA500' : '#E5E7EB'} stroke="none" className="inline"><polygon points="8,2 10,6 14,6.5 11,9.5 12,14 8,11.5 4,14 5,9.5 2,6.5 6,6" /></svg>
                                            ))}
                                        </span>
                                        <span>{item.reviews}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
                                        <button className=""><Minus size={16} /></button>
                                        <span className="px-2 text-base">1</span>
                                        <button className=""><Plus size={16} /></button>
                                    </div>
                                    <button
                                        className="mt-2 bg-black cursor-pointer text-white px-4 py-1.5 rounded-md text-base"
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (addToCart) {
                                            addToCart({ id: item.id, name: item.name, image: item.image, price: item.price }, 1);
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
            </div>
        </div>
    );
};

export default RecommendedProducts;
