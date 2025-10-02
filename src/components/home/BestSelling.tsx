'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/hooks/use-cart';
import { getProductImageUrlQuick } from '@/lib/product-image-utils';
import ProductImage from '@/components/ui/product-image';

interface Product {
	id: string;
	sku: string;
	name: string;
	price: number;
	image: string;
	imageUrl: string;
	brand: string;
	description: string;
	rating?: number;
	reviews?: number;
}

interface BestSellingProduct extends Product {
	quantity: number;
	totalSold: number; // Track how many units were sold
	orderCount: number; // Track how many orders included this product
}

const BestSelling = () => {
	const { token } = useAuth();
	const { addToCart } = useCart();
	const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

	// Update quantity
	const updateQuantity = (productId: string, delta: number) => {
		setQuantities(prev => ({
			...prev,
			[productId]: Math.max(1, (prev[productId] || 1) + delta)
		}));
	};

	// Handle manual quantity input
	const handleQuantityInput = (productId: string, value: string) => {
		// Allow empty input for typing
		if (value === '') {
			setQuantities(prev => ({
				...prev,
				[productId]: 0
			}));
			return;
		}

		// Parse and validate the input
		const numValue = parseInt(value);
		if (!isNaN(numValue) && numValue >= 1 && numValue <= 999) {
			setQuantities(prev => ({
				...prev,
				[productId]: numValue
			}));
		}
	};

	// Handle quantity input on enter or blur
	const handleQuantitySubmit = (productId: string, value: string) => {
		const numValue = parseInt(value);
		if (isNaN(numValue) || numValue < 1) {
			// Reset to 1 if invalid
			setQuantities(prev => ({
				...prev,
				[productId]: 1
			}));
		} else if (numValue > 999) {
			// Cap at 999
			setQuantities(prev => ({
				...prev,
				[productId]: 999
			}));
		}
	};

	// Add to cart handler
	const handleAddToCart = async (product: BestSellingProduct) => {
		const quantity = quantities[product.id] || 1;
		
		try {
			setAddingToCart(prev => ({ ...prev, [product.id]: true }));
			
							await addToCart({
								id: product.id,
								sku: product.sku,
								name: product.name,
								brand: product.brand || '',
								price: product.price,
								image: getProductImageUrlQuick(product.sku),
							}, quantity);			console.log(`✅ [Best Selling] Added ${product.name} x${quantity} to cart`);
		} catch (error) {
			console.error('❌ [Best Selling] Add to cart error:', error);
		} finally {
			setAddingToCart(prev => ({ ...prev, [product.id]: false }));
		}
	};

	// Fetch best selling products from order data
	useEffect(() => {
		const fetchBestSellingProducts = async () => {
			try {
				setLoading(true);
				console.log('🔍 [Best Selling] Fetching sales data...');

				const headers: HeadersInit = {
					'Content-Type': 'application/json',
				};

				if (token) {
					headers.Authorization = `Bearer ${token}`;
				}

				// Try to fetch admin orders (fallback to products if no access)
				let response;
				try {
					response = await fetch('/api/admin/orders?limit=50&status=delivered', { headers });
					
					if (response.status === 401 || response.status === 403) {
						console.log('🔄 [Best Selling] No admin access, using products API...');
						await fetchFallbackProducts();
						return;
					}
					
					if (!response.ok) {
						console.warn('Failed to fetch delivered orders, trying all admin orders...');
						response = await fetch('/api/admin/orders?limit=50', { headers });
						if (!response.ok) {
							console.warn('⚠️ [Best Selling] Admin orders failed, using products API...');
							await fetchFallbackProducts();
							return;
						}
					}
				} catch (error) {
					console.log('🔄 [Best Selling] Admin API error, using products API...', error);
					await fetchFallbackProducts();
					return;
				}

				const data = await response.json();
				console.log('📦 [Best Selling] Received order data:', data);

				if (data.success && data.orders) {
					await processOrdersForBestSellers(data.orders);
				} else {
					console.warn('⚠️ [Best Selling] No orders data, falling back to product API...');
					await fetchFallbackProducts();
				}
			} catch (error) {
				console.error('❌ [Best Selling] Error fetching orders:', error);
				await fetchFallbackProducts();
			} finally {
				setLoading(false);
			}
		};

		const processOrdersForBestSellers = async (orders: Array<{items?: Array<{
			sku?: string;
			productId?: string;
			id?: string;
			qty?: number;
			quantity?: number;
			unitPrice?: number;
			price?: number;
			nameSnap?: string;
			brandSnap?: string;
			imageSnap?: string;
		}>}>) => {
			console.log('📊 [Best Selling] Processing', orders.length, 'orders for analysis...');
			
			// Map to track product sales data
			const productSalesMap = new Map<string, {
				product: Product;
				totalSold: number;
				orderCount: number;
				revenue: number;
			}>();

			// Process all orders to count product sales
			orders.forEach(order => {
				if (order.items && Array.isArray(order.items)) {
					order.items.forEach((item) => {
						const productKey = item.sku || item.productId || item.id;
						const quantity = item.qty || item.quantity || 1;
						const unitPrice = item.unitPrice || item.price || 0;
						
						if (productKey && item.nameSnap) {
							const existing = productSalesMap.get(productKey);
							if (existing) {
								existing.totalSold += quantity;
								existing.orderCount += 1;
								existing.revenue += (unitPrice * quantity);
							} else {
								productSalesMap.set(productKey, {
									product: {
										id: productKey,
										sku: productKey,
										name: item.nameSnap || 'Unknown Product',
										brand: item.brandSnap || 'Unknown Brand',
										price: unitPrice,
										image: getProductImageUrlQuick(productKey),
										imageUrl: getProductImageUrlQuick(productKey),
										description: `${item.brandSnap || ''} ${item.nameSnap || ''}`.trim(),
									},
									totalSold: quantity,
									orderCount: 1,
									revenue: unitPrice * quantity
								});
							}
						}
					});
				}
			});

			// Convert to array and sort by total units sold (or you could sort by revenue/orderCount)
			const sortedProducts = Array.from(productSalesMap.values())
				.sort((a, b) => b.totalSold - a.totalSold) // Sort by total units sold
				.slice(0, 4) // Take top 4
				.map(item => ({
					...item.product,
					quantity: 1, // Default cart quantity
					totalSold: item.totalSold,
					orderCount: item.orderCount
				}));

			console.log('🏆 [Best Selling] Top products by sales:', sortedProducts);
			setBestSellingProducts(sortedProducts);
			
			// Initialize quantities
			const initialQuantities: Record<string, number> = {};
			sortedProducts.forEach(product => {
				initialQuantities[product.id] = 1;
			});
			setQuantities(initialQuantities);
		};

		const fetchFallbackProducts = async () => {
			console.log('🔄 [Best Selling] Using fallback product API...');
			try {
				const headers: HeadersInit = {
					'Content-Type': 'application/json',
				};

				if (token) {
					headers.Authorization = `Bearer ${token}`;
				}

				const response = await fetch('/api/products?limit=4', { headers });
				if (response.ok) {
					const data = await response.json();
					if (data.products && Array.isArray(data.products)) {
						const productsWithQuantity = data.products
							.slice(0, 4)
							.map((product: Product) => ({
								...product,
								quantity: 1,
								totalSold: 0,
								orderCount: 0
							}));
						setBestSellingProducts(productsWithQuantity);
						
						// Initialize quantities
						const initialQuantities: Record<string, number> = {};
						productsWithQuantity.forEach((product: Product) => {
							initialQuantities[product.id] = 1;
						});
						setQuantities(initialQuantities);
						console.log('✅ [Best Selling] Loaded fallback products:', productsWithQuantity.length);
					} else {
						console.warn('⚠️ [Best Selling] No products in API response');
						setBestSellingProducts([]);
					}
				} else {
					console.error('❌ [Best Selling] Products API failed with status:', response.status);
					setBestSellingProducts([]);
				}
			} catch (fallbackError) {
				console.error('❌ [Best Selling] Fallback failed too:', fallbackError);
				setBestSellingProducts([]);
			}
		};

		fetchBestSellingProducts();
	}, [token]);

	if (loading) {
		return (
			<div className="flex flex-col lg:flex-row max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-6 gap-10">
				<div className='flex flex-col w-full'>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl pl-3 font-bold border-l-8 border-[#2E318E] p-0.5 text-black">Our Best-Selling Products</h2>
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
				<div className="flex items-center justify-between mb-10">
					<h2 className="text-2xl pl-3 font-bold border-l-8 border-[#2E318E] p-0.5 text-black">Our Best-Selling Products</h2>
					<Link href="/products" className="flex items-center admin-button">
						View more
						<ArrowRight size={20} />
					</Link>
				</div>

				{/* Product Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
					{bestSellingProducts.map((product) => {
						const currentQuantity = quantities[product.id] || 1;
						const isLoading = addingToCart[product.id] || false;
						
						return (
							<motion.div
								key={product.id}
								className="bg-white rounded-md shadow-sm p-3 gap-4 flex flex-col justify-between"
								whileHover={{ scale: 1.05 }}
								transition={{ type: "spring", stiffness: 300, damping: 20 }}
							>
							<div 
							className="w-full justify-center cursor-pointer overflow-hidden flex flex-col items-center gap-4 mb-2"
							onClick={() => window.location.href = `/products/${product.sku}`}
							>
								<button className="flex justify-end w-full hover:text-[#2E318E] transition-colors" title="Open">
									<ArrowRight size={20} className='-rotate-45' />
								</button>
								<ProductImage 
									sku={product.sku}
									name={product.name} 
									width={300} 
									height={200} 
									className="object-contain rounded-lg"
								/>
							</div>

							<div className='flex flex-row justify-between'>
								<div className='flex flex-col w-[60%] gap-1'>
									<div className="font-semibold text-base text-black line-clamp-2">{product.name}</div>
									{token ? (
										<div className="text-lg font-bold text-black">${product.price.toFixed(2)}</div>
									) : (
										<div className="text-sm text-gray-500">Sign in to view pricing</div>
									)}
									{/* Show sales stats if available */}
									{product.totalSold > 0 && (
										<div className="text-xs text-green-600">
											{product.totalSold} sold
										</div>
									)}
								</div>
								{token && (
									<div>
										<div className="flex items-center rounded-md py-1.5 bg-[#F1F2F4] justify-between px-2">
											<button 
												className="cursor-pointer hover:text-[#2E318E] transition-colors disabled:opacity-50"
												onClick={() => updateQuantity(product.id, -1)}
												disabled={currentQuantity <= 1}
											>
												<Minus size={16} />
											</button>
											<input
												type="text"
												value={currentQuantity}
												onChange={(e) => handleQuantityInput(product.id, e.target.value)}
												onBlur={(e) => handleQuantitySubmit(product.id, e.target.value)}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														handleQuantitySubmit(product.id, e.currentTarget.value);
														e.currentTarget.blur();
													}
												}}
												className="w-12 px-1 text-base text-center bg-transparent border-none outline-none"
												min="1"
												max="999"
											/>
											<button 
												className="cursor-pointer hover:text-[#2E318E] transition-colors"
												onClick={() => updateQuantity(product.id, 1)}
											>
												<Plus size={16} />
											</button>
										</div>
										<button 
											onClick={() => handleAddToCart(product)}
											disabled={isLoading}
											className="mt-2 bg-[#2E318E] text-white px-4 py-1.5 rounded-md text-base hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
										>
											{isLoading ? 'Adding...' : 'Add Cart'}
										</button>
									</div>
								)}
							</div>
						</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default BestSelling;
