'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface Product {
	id: string;
	sku: string;
	name: string;
	price: number;
	image: string;
	imageUrl: string;
	brand: string;
	description: string;
	rating: number;
	reviews: number;
}

interface BestSellingProduct extends Product {
	quantity: number;
}

const BestSelling = () => {
	const { token } = useAuth();
	const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
	const [loading, setLoading] = useState(true);

	// Fetch best selling products from API
	useEffect(() => {
		const fetchBestSellingProducts = async () => {
			try {
				const headers: HeadersInit = {
					'Content-Type': 'application/json',
				};

				if (token) {
					headers.Authorization = `Bearer ${token}`;
				}

				const response = await fetch('/api/products?limit=4&sortBy=popularity', { headers });
				if (response.ok) {
					const data = await response.json();
					const productsWithQuantity = data.products
						.slice(0, 4)
						.map((product: Product) => ({
							...product,
							quantity: 1
						}));
					setBestSellingProducts(productsWithQuantity);
				} else {
					// Fallback to regular products if popularity sorting isn't available
					const fallbackResponse = await fetch('/api/products?limit=4', { headers });
					if (fallbackResponse.ok) {
						const fallbackData = await fallbackResponse.json();
						const productsWithQuantity = fallbackData.products
							.slice(0, 4)
							.map((product: Product) => ({
								...product,
								quantity: 1
							}));
						setBestSellingProducts(productsWithQuantity);
					}
				}
			} catch (error) {
				console.error('Error fetching best selling products:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchBestSellingProducts();
	}, [token]);

	if (loading) {
		return (
			<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
				<div className='flex flex-col w-full'>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl pl-3 font-bold text-black">Our Best-Selling Products</h2>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
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
					<h2 className="text-2xl pl-3 font-bold text-black">Our Best-Selling Products</h2>
					<Link href="/products" className="flex items-center py-2 text-gray-700 hover:text-black text-sm font-medium">
						View more
						<ArrowRight size={20} />
					</Link>
				</div>

				{/* Product Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
					{bestSellingProducts.map((product) => (
						<div key={product.id} className="bg-white rounded-md shadow-sm p-4 flex flex-col">
							<div className="relative w-full justify-center flex mb-2">
								<button className="absolute right-0 -rotate-45" title="Open">
									<ArrowRight size={20} />
								</button>
								<Image 
									src={'/product.png'} 
									alt={product.name} 
									width={300} 
									height={200} 
									className="object-contain my-10 rounded-lg"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.src = '/product-placeholder.png';
									}}
								/>
							</div>

							<div className='flex flex-row justify-between'>
								<div className='flex flex-col w-[60%] gap-1'>
									<div className="font-semibold text-base text-black">{product.name}</div>
									{token ? (
										<div className="text-lg font-bold text-black">₹{product.price.toLocaleString()}</div>
									) : (
										<div className="text-sm text-gray-500">Sign in to view pricing</div>
									)}
								</div>
								{token && (
									<div>
										<div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
											<button className=""><Minus size={16} /></button>
											<span className="px-2 text-base">{product.quantity}</span>
											<button className=""><Plus size={16} /></button>
										</div>
										<Link 
											href={`/products/${product.sku}`}
											className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base block text-center hover:bg-blue-700 transition-colors"
										>
											Add Cart
										</Link>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default BestSelling;
