'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

const previousOrders = [
	{
		id: 1,
		name: 'DJI Phantom 2 Vision+',
		price: 599,
		image: '/product.png',
		quantity: 1,
	},
	{
		id: 2,
		name: 'DJI Phantom 2 Vision+',
		price: 599,
		image: '/product.png',
		quantity: 1,
	},
	{
		id: 3,
		name: 'DJI Phantom 2 Vision+',
		price: 599,
		image: '/product.png',
		quantity: 1,
	},
    {
		id: 4,
		name: 'DJI Phantom 2 Vision+',
		price: 599,
		image: '/product.png',
		quantity: 1,
	},
];

const PreviousOrders = () => {
	const { token } = useAuth();

	// Only show previous orders if user is authenticated
	if (!token) {
		return null;
	}

	return (
			<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
                <div className='flex flex-col w-full'>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl pl-3 font-bold text-black">Previous Orders</h2>
                        <Link href="/orders" className="flex items-center py-2 text-gray-700 hover:text-black text-sm font-medium">
                            View more
                            <ArrowRight size={20} />
                        </Link>
                    </div>

                    {/* Product Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        {previousOrders.map((order) => (
                            <div key={order.id} className="bg-white rounded-md shadow-sm p-4 flex flex-col">
                                <div className="relative w-full justify-center flex mb-2">
                                    <button className="absolute right-0 -rotate-45" title="Open">
                                        <ArrowRight size={20} />
                                    </button>
                                    <Image 
                                        src={order.image} 
                                        alt={order.name} 
                                        width={300} 
                                        height={200} 
                                        className="object-contain my-10 rounded-lg" 
                                    />
                                    
                                </div>

                                <div className='flex flex-row justify-between'>
                                    <div className='flex flex-col w-[60%] gap-1'>
                                        <div className="font-semibold text-base text-black">{order.name}</div>
                                        <div className="text-lg font-bold text-black">${order.price}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
                                            <button className=""><Minus size={16} /></button>
                                            <span className="px-2 text-base">{order.quantity}</span>
                                            <button className=""><Plus size={16} /></button>
                                        </div>
                                        <button className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base">Add Cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
			</div>
	);
};

export default PreviousOrders;
