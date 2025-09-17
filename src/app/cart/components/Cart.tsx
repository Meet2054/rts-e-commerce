"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, useCartSummary, useCartActions, useCartState } from "@/hooks/use-cart";
import { useAuth } from '@/components/auth/auth-provider';
import { ShippingAddress } from '@/lib/cart-types';
import { Minus, Plus, Trash2, ShoppingCart as CartIcon, Loader2 } from 'lucide-react';

const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  fullName: "Abhishek Guleria",
  addressLine1: "1234 Elm Street",
  addressLine2: "",
  city: "Springfield",
  state: "CA",
  postalCode: "12345",
  country: "USA",
  phone: "+91 00000-00000"
};

export default function ShoppingCart() {
	const { user } = useAuth();
	const { loading, error, items } = useCartState();
	const { itemCount, subtotal, tax, shipping, total, isEmpty, currency } = useCartSummary();
	const { removeFromCart, updateQuantity, clearCart } = useCartActions();
	
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(DEFAULT_SHIPPING_ADDRESS);
	const [orderNotes, setOrderNotes] = useState("");

	// Handle quantity update with optimistic UI
	const handleQuantityChange = async (itemId: string, newQuantity: number) => {
		if (newQuantity < 1 || newQuantity > 100) return;
		
		try {
			await updateQuantity(itemId, newQuantity);
		} catch (error) {
			console.error('Failed to update quantity:', error);
		}
	};

	// Handle item removal with confirmation
	const handleRemoveItem = async (itemId: string, itemName: string) => {
		if (window.confirm(`Remove "${itemName}" from your cart?`)) {
			try {
				await removeFromCart(itemId);
			} catch (error) {
				console.error('Failed to remove item:', error);
			}
		}
	};

	// Handle order submission
	const handleSubmitOrder = async () => {
		if (isEmpty) return;

		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const orderData = {
				items: items,
				subtotal,
				tax,
				shipping,
				total,
				currency,
				shippingAddress,
				notes: orderNotes,
				userId: user?.uid,
			};

			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(orderData)
			});

			const result = await response.json();

			if (result.success) {
				setSubmitSuccess(true);
				setTimeout(async () => {
					await clearCart();
					setSubmitSuccess(false);
				}, 2000);
			} else {
				throw new Error(result.error || 'Failed to submit order');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to submit order';
			setSubmitError(errorMessage);
			console.error('Order submission failed:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center py-24 w-full">
				<div className="flex items-center gap-3">
					<Loader2 className="h-6 w-6 animate-spin" />
					<span className="text-lg">Loading your cart...</span>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-auto max-w-md">
				<div className="text-red-800 font-semibold mb-2">Error Loading Cart</div>
				<div className="text-red-600 mb-4">{error}</div>
				<button
					onClick={() => window.location.reload()}
					className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
				>
					Retry
				</button>
			</div>
		);
	}

	// Empty cart state
	if (isEmpty) {
		return (
			<div className="bg-[#F1F2F4] py-24 w-full flex flex-col items-center justify-center">
				<CartIcon className="w-24 h-24 text-gray-400 mb-6" />
				<div className="text-xl font-semibold mb-2 text-center">Your cart is empty</div>
				<div className="text-gray-500 mb-8 text-center max-w-md">
					Looks like you haven't added anything yet. Start shopping to build your cart!
				</div>
				<Link
					href="/products"
					className="bg-black text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors"
				>
					Continue Shopping
				</Link>
			</div>
		);
	}

	// Success state
	if (submitSuccess) {
		return (
			<div className="bg-green-50 border border-green-200 rounded-lg p-8 mx-auto max-w-md text-center">
				<div className="text-green-800 text-xl font-semibold mb-2">Order Submitted Successfully!</div>
				<div className="text-green-600 mb-4">
					Thank you for your order. Our team will contact you soon to confirm details and arrange payment & delivery.
				</div>
				<Link
					href="/products"
					className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 inline-block"
				>
					Continue Shopping
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-[1550px] px-4 md:px-12 lg:px-16 mx-auto py-10">
			<div className="flex flex-col lg:flex-row gap-10">
				{/* Cart Items */}
				<div className="flex flex-col w-full lg:w-2/3">
					<div className="flex flex-row justify-between items-center mb-6">
						<h1 className="text-2xl font-bold">Your Cart</h1>
						<div className="flex flex-col items-end">
							<span className="text-gray-600">
								{itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
							</span>
							<span className="text-xl font-bold">
								Total: {currency === 'USD' ? '$' : ''}{total.toFixed(2)}
							</span>
						</div>
					</div>

					{/* Clear Cart Button */}
					{items.length > 0 && (
						<div className="flex justify-end mb-4">
							<button
								onClick={() => {
									if (window.confirm('Are you sure you want to clear your entire cart?')) {
										clearCart();
									}
								}}
								className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
							>
								<Trash2 className="w-4 h-4" />
								Clear Cart
							</button>
						</div>
					)}

					{/* Cart Items List */}
					<div className="space-y-4">
						{items.map((item) => (
							<div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
								<div className="flex flex-col md:flex-row items-start md:items-center gap-4">
									{/* Product Image and Info */}
									<div className="flex items-center gap-4 flex-1">
										<Link href={`/products/${item.sku}`}>
											<Image 
												src={item.image} 
												alt={item.name} 
												width={80} 
												height={80} 
												className="rounded-md object-contain bg-gray-50 p-2" 
											/>
										</Link>
										<div className="flex-1">
											<Link 
												href={`/products/${item.sku}`}
												className="font-semibold text-base text-black hover:text-blue-600"
											>
												{item.name}
											</Link>
											<div className="text-sm text-gray-500 mt-1">
												SKU: {item.sku}
											</div>
											{item.brand && (
												<div className="text-sm text-gray-500">
													Brand: {item.brand}
												</div>
											)}
											<div className="text-lg font-bold text-black mt-2">
												{currency === 'USD' ? '$' : ''}{item.price.toFixed(2)} each
											</div>
										</div>
									</div>

									{/* Quantity Controls */}
									<div className="flex items-center gap-3">
										<div className="flex items-center border rounded-md">
											<button
												onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
												disabled={item.quantity <= 1}
												className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Minus className="w-4 h-4" />
											</button>
											<span className="px-4 py-2 font-medium min-w-[3rem] text-center">
												{item.quantity}
											</span>
											<button
												onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
												disabled={item.quantity >= 100}
												className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Plus className="w-4 h-4" />
											</button>
										</div>

										{/* Item Total */}
										<div className="text-lg font-bold min-w-[4rem] text-right">
											{currency === 'USD' ? '$' : ''}{(item.price * item.quantity).toFixed(2)}
										</div>

										{/* Remove Button */}
										<button
											onClick={() => handleRemoveItem(item.id, item.name)}
											className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
											title="Remove item"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Order Summary */}
				<div className="w-full lg:w-1/3">
					<div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
						<h2 className="text-xl font-bold mb-6">Order Summary</h2>

						{/* Order Totals */}
						<div className="space-y-3 mb-6 pb-6 border-b">
							<div className="flex justify-between">
								<span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
								<span>{currency === 'USD' ? '$' : ''}{subtotal.toFixed(2)}</span>
							</div>
							<div className="flex justify-between">
								<span>Tax</span>
								<span>{currency === 'USD' ? '$' : ''}{tax.toFixed(2)}</span>
							</div>
							<div className="flex justify-between">
								<span>Shipping</span>
								<span>
									{shipping === 0 ? (
										<span className="text-green-600 font-medium">FREE</span>
									) : (
										`${currency === 'USD' ? '$' : ''}${shipping.toFixed(2)}`
									)}
								</span>
							</div>
							<div className="flex justify-between text-lg font-bold pt-3 border-t">
								<span>Total</span>
								<span>{currency === 'USD' ? '$' : ''}{total.toFixed(2)}</span>
							</div>
						</div>

						{/* Shipping Address */}
						<div className="space-y-3 mb-6">
							<div className="flex justify-between items-center">
								<span className="font-semibold text-sm">Full Name</span>
								<span className="text-sm text-right">{shippingAddress.fullName}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-sm">Phone</span>
								<span className="text-sm text-right">{shippingAddress.phone}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-sm">Email</span>
								<span className="text-sm text-right">{user?.email || 'Not provided'}</span>
							</div>
							<div className="flex justify-between items-start">
								<span className="font-semibold text-sm">Address</span>
								<div className="text-sm text-right max-w-[60%]">
									{shippingAddress.addressLine1}
									{shippingAddress.addressLine2 && (
										<div>{shippingAddress.addressLine2}</div>
									)}
									<div>
										{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
									</div>
									<div>{shippingAddress.country}</div>
								</div>
							</div>
						</div>

						{/* Order Notes */}
						<div className="mb-6">
							<label htmlFor="orderNotes" className="block text-sm font-semibold mb-2">
								Additional Notes (Optional)
							</label>
							<textarea
								id="orderNotes"
								value={orderNotes}
								onChange={(e) => setOrderNotes(e.target.value)}
								placeholder="Special instructions, delivery preferences, etc."
								className="w-full px-3 py-2 border rounded-md text-sm resize-none"
								rows={3}
								maxLength={500}
							/>
						</div>

						{/* Disclaimer */}
						<div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded-md">
							<strong>Note:</strong> This is an order request only. No payment is collected online. 
							Our team will contact you to confirm your order and arrange payment & delivery.
						</div>

						{/* Submit Error */}
						{submitError && (
							<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
								<div className="text-red-800 text-sm font-medium">Error</div>
								<div className="text-red-600 text-sm">{submitError}</div>
							</div>
						)}

						{/* Submit Button */}
						<button
							onClick={handleSubmitOrder}
							disabled={isSubmitting || isEmpty}
							className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Submitting Order...
								</>
							) : (
								'Submit Order Request'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
