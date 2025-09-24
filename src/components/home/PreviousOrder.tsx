'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus, Minus, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/hooks/use-cart';
import { motion } from 'framer-motion';
import { OrderItem } from '@/lib/firebase-types';

interface PreviousOrderItem extends OrderItem {
  orderId: string;
  orderDate: unknown;
}

const PreviousOrders = () => {
	const { user, token } = useAuth();
	const { addToCart } = useCart();
	const [previousOrders, setPreviousOrders] = useState<PreviousOrderItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

	// Fetch previous orders - Using same logic as userDetails
	useEffect(() => {
		console.log('🔍 [Previous Orders] useEffect triggered');
		console.log('🔍 [Previous Orders] user:', user);
		console.log('🔍 [Previous Orders] user.uid:', user?.uid);
		console.log('🔍 [Previous Orders] token:', token ? 'present' : 'missing');

		if (!user?.uid || !token) {
			console.log('⚠️ [Previous Orders] Missing user ID or token, skipping fetch');
			setLoading(false);
			return;
		}

		const fetchPreviousOrders = async () => {
			try {
				setLoading(true);
				setError(null);
				console.log('🔍 [Previous Orders] Starting API call for user:', user.uid);

				// Try different identifiers to match orders (same as userDetails)
				const identifiers = [
					user.uid,
					user.email
				].filter(Boolean);
				
				console.log('🔍 [Previous Orders] Trying identifiers:', identifiers);
				
				let foundOrders: Array<{
					id: string;
					orderId: string;
					status: string;
					createdAt: string | Date;
					items: Array<{
						productId: string;
						sku: string;
						nameSnap: string;
						brandSnap: string;
						imageSnap?: string;
						unitPrice: number;
					}>;
				}> = [];
				
				// Try each identifier until we find orders (same as userDetails)
				for (const identifier of identifiers) {
					console.log(`🔍 [Previous Orders] Trying identifier: ${identifier}`);
					
					const response = await fetch(`/api/orders?userId=${identifier}`);
					console.log(`📡 [Previous Orders] API Response status for ${identifier}:`, response.status);
					
					if (response.ok) {
						const result = await response.json();
						console.log(`� [Previous Orders] API Response for ${identifier}:`, result);
						
						if (result.success && result.orders && result.orders.length > 0) {
							foundOrders = result.orders;
							console.log(`✅ [Previous Orders] Found ${foundOrders.length} orders for identifier: ${identifier}`);
							break; // Stop trying once we find orders
						}
					} else {
						console.error(`❌ [Previous Orders] API failed for ${identifier} with status:`, response.status);
					}
				}
				
				if (foundOrders.length === 0) {
					console.log('� [Previous Orders] No orders found for any identifier');
					setPreviousOrders([]);
					setQuantities({});
					return;
				}

				// Extract items from recent orders (limit to 4 unique items)
				const recentItems: PreviousOrderItem[] = [];
				const seenProducts = new Set<string>();
				
				// Sort orders by date (newest first) and only include delivered/completed orders
				const eligibleOrders = foundOrders
					.filter(order => ['delivered', 'confirmed', 'processing'].includes(order.status))
					.sort((a, b) => {
						const aTime = new Date(a.createdAt).getTime();
						const bTime = new Date(b.createdAt).getTime();
						return bTime - aTime;
					});

				console.log(`🎯 [Previous Orders] Processing ${eligibleOrders.length} eligible orders`);

				for (const order of eligibleOrders) {
					if (recentItems.length >= 4) break; // Limit to 4 items
					
					if (order.items && Array.isArray(order.items)) {
						for (const item of order.items) {
							const productKey = item.sku || item.productId;
							
							if (!seenProducts.has(productKey) && recentItems.length < 4) {
								seenProducts.add(productKey);
								recentItems.push({
                                    ...item,
                                    orderId: order.orderId,
                                    orderDate: order.createdAt,
                                    qty: 0,
                                    lineTotal: 0
                                });
								console.log(`✅ [Previous Orders] Added item: ${item.nameSnap} from order ${order.orderId}`);
							}
						}
					}
				}

				setPreviousOrders(recentItems);
				
				// Initialize quantities to 1 for each item
				const initialQuantities: Record<string, number> = {};
				recentItems.forEach((item) => {
					const key = item.sku || item.productId;
					initialQuantities[key] = 1;
				});
				setQuantities(initialQuantities);
				
				console.log(`✅ [Previous Orders] Final result: ${recentItems.length} unique recent items`);

			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to fetch previous orders';
				console.error('❌ [Previous Orders] Error:', errorMessage);
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchPreviousOrders();
	}, [user, token]);

	// Update quantity
	const updateQuantity = (itemKey: string, delta: number) => {
		setQuantities(prev => ({
			...prev,
			[itemKey]: Math.max(1, (prev[itemKey] || 1) + delta)
		}));
	};

	// Handle manual quantity input
	const handleQuantityInput = (itemKey: string, value: string) => {
		// Allow empty input for typing
		if (value === '') {
			setQuantities(prev => ({
				...prev,
				[itemKey]: 0
			}));
			return;
		}

		// Parse and validate the input
		const numValue = parseInt(value);
		if (!isNaN(numValue) && numValue >= 1 && numValue <= 999) {
			setQuantities(prev => ({
				...prev,
				[itemKey]: numValue
			}));
		}
	};

	// Handle quantity input on enter or blur
	const handleQuantitySubmit = (itemKey: string, value: string) => {
		const numValue = parseInt(value);
		if (isNaN(numValue) || numValue < 1) {
			// Reset to 1 if invalid
			setQuantities(prev => ({
				...prev,
				[itemKey]: 1
			}));
		} else if (numValue > 999) {
			// Cap at 999
			setQuantities(prev => ({
				...prev,
				[itemKey]: 999
			}));
		}
	};

	// Add to cart handler
	const handleAddToCart = async (item: PreviousOrderItem) => {
		const itemKey = item.sku || item.productId;
		const quantity = quantities[itemKey] || 1;

		try {
			setAddingToCart(prev => ({ ...prev, [itemKey]: true }));
			
			// Convert OrderItem to CartItem format
			await addToCart({
				id: item.productId,
				sku: item.sku,
				name: item.nameSnap,
				brand: item.brandSnap,
				price: item.unitPrice,
				image: item.imageSnap || '/product.png', // fallback image
			}, quantity);

			console.log(`✅ [Previous Orders] Added ${item.nameSnap} x${quantity} to cart`);
		} catch (error) {
			console.error('❌ [Previous Orders] Add to cart error:', error);
		} finally {
			setAddingToCart(prev => ({ ...prev, [itemKey]: false }));
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6">
				<div className='flex flex-col w-full'>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl pl-3 font-bold text-black">Previous Orders</h2>
					</div>
					<div className="flex items-center justify-center py-12">
						<Loader2 className="animate-spin w-8 h-8 text-[#2E318E]" />
						<span className="ml-2 text-gray-600">Loading your previous orders...</span>
					</div>
				</div>
			</div>
		);
	}

	// Only show previous orders if user is authenticated and has orders
	if (!token || !user?.uid) {
		console.log('🚫 [Previous Orders] Not showing component - no token or user');
		return null;
	}

	// Show empty state if no orders (for debugging)
	if (previousOrders.length === 0 && !loading) {
		console.log('📭 [Previous Orders] No previous orders found, showing debug info');
		return (
			<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6">
				<div className='flex flex-col w-full'>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl pl-3 font-bold text-black">Previous Orders</h2>
					</div>
					<div className="text-center py-12">
						<p className="text-gray-600 mb-2">No previous orders found</p>
						<p className="text-sm text-gray-400">User ID: {user.uid}</p>
						<p className="text-sm text-gray-400">Check console for API debugging info</p>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6">
				<div className='flex flex-col w-full'>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl pl-3 font-bold text-black">Previous Orders</h2>
					</div>
					<div className="text-center py-12">
						<p className="text-red-600 mb-4">Failed to load previous orders</p>
						<button 
							onClick={() => window.location.reload()} 
							className="text-[#2E318E] hover:underline"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
			<div className='flex flex-col w-full'>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-2xl pl-3 font-bold text-black">Previous Orders</h2>
					<Link href="/orders" className="flex items-center admin-button">
						View more
						<ArrowRight size={20} />
					</Link>
				</div>

				{/* Product Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
					{previousOrders.map((order) => {
						const itemKey = order.sku || order.productId;
						const currentQuantity = quantities[itemKey] || 1;
						const isLoading = addingToCart[itemKey] || false;
						
						return (
							<motion.div
								key={itemKey}
								className="bg-white rounded-md shadow-sm p-4 flex flex-col"
								whileHover={{ scale: 1.05 }}
								transition={{ type: "spring", stiffness: 300, damping: 20 }}
							>
								<div className="relative w-full justify-center flex mb-2">
									<button 
										className="absolute right-0 -rotate-45 z-10 hover:text-[#2E318E] transition-colors" 
										title="View Details"
                                        onClick={() => window.location.href = `/products/${order.sku}`}
									>
										<ArrowRight size={20} />
									</button>
									<div 
										className="cursor-pointer"
                                        onClick={() => window.location.href = `/products/${order.sku}`}
									>
										<Image 
											src={'/product.png'} 
											alt={order.nameSnap} 
											width={300} 
											height={200} 
											className="object-contain my-7 rounded-lg" 
										/>
									</div>
								</div>

								<div className='flex flex-row justify-between'>
									<div className='flex flex-col w-[60%] gap-1'>
										<div className="font-semibold text-base text-black line-clamp-2">{order.nameSnap}</div>
										<div className="text-lg font-bold text-black">${order.unitPrice}</div>
									</div>
									<div>
										<div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
											<button 
												className="cursor-pointer hover:text-[#2E318E] transition-colors disabled:opacity-50"
												onClick={() => updateQuantity(itemKey, -1)}
												disabled={currentQuantity <= 1}
											>
												<Minus size={16} />
											</button>
											<input
												type="text"
												value={currentQuantity}
												onChange={(e) => handleQuantityInput(itemKey, e.target.value)}
												onBlur={(e) => handleQuantitySubmit(itemKey, e.target.value)}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														handleQuantitySubmit(itemKey, e.currentTarget.value);
														e.currentTarget.blur();
													}
												}}
												className="w-12 px-1 text-base text-center bg-transparent border-none outline-none"
												min="1"
												max="999"
											/>
											<button 
												className="cursor-pointer hover:text-[#2E318E] transition-colors"
												onClick={() => updateQuantity(itemKey, 1)}
											>
												<Plus size={16} />
											</button>
										</div>
										<button 
											className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
											onClick={() => handleAddToCart(order)}
											disabled={isLoading}
										>
											{isLoading ? (
												<>
													<Loader2 className="animate-spin w-4 h-4 mr-1" />
													Adding...
												</>
											) : (
												'Add Cart'
											)}
										</button>
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default PreviousOrders;
