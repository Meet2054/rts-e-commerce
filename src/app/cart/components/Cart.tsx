"use client";

import React, { useContext } from "react";
import { CartContext } from "../../../context/CartContext";
import Image from "next/image";

export default function ShoppingCart() {
	const cartCtx = useContext(CartContext);
	if (!cartCtx) return null;
	const { cart, removeFromCart, updateQuantity } = cartCtx;
	const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

	if (cart.length === 0) {
		return (
			<div className="bg-[#F1F2F4] py-24 w-full flex flex-col items-center justify-center">
				<Image
					src="/cart.svg"
					alt="Empty Cart"
					width={200}
					height={120}
					className="mb-6"
				/>
				<div className="text-lg font-semibold mb-2 text-center">Your cart is empty.</div>
				<div className="text-gray-500 mb-6 text-center">Looks like you haven&apos;t added anything yet.</div>
				<button
					className="bg-black text-white px-10 md:px-24 py-2 rounded-sm font-bold"
					onClick={() => window.location.href = "/products"}
				>
					Continue Shopping
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-row max-w-[1550px] px-4 md:px-12 lg:px-16 mx-auto gap-10 py-10">
			<div className="flex flex-col w-full md:w-2/3">
                <div className="flex flex-row justify-between items-center">
                    <span className="text-2xl font-bold">Your Cart</span>
                    <div className="flex flex-col mb-4">
                        <span>{cart.length} items in the cart</span>
                        <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
                    </div>
                </div>
				{cart.map(item => (
					<div key={item.id} className="bg-white rounded-lg flex flex-col md:flex-row items-center justify-between p-4 mb-3">
						<div className="flex items-center gap-4">
							<Image src={item.image} alt={item.name} width={120} height={60} className="rounded" />
							<div>
								<div className="font-semibold text-base text-black">{item.name}</div>
								<div className="text-gray-500">Price: ${item.price}</div>
							</div>
						</div>
						<div className="flex items-center space-x-10 lg:space-x-20">
							<select value={item.quantity} className="border rounded px-2 py-1" onChange={e => updateQuantity(item.id, Number(e.target.value))}>
								{[1,2,3,4,5].map(q => <option key={q} value={q}>{q}</option>)}
							</select>
							<span className="text-lg font-bold">${item.price * item.quantity}</span>
							<button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-600">
								🗑️
							</button>
						</div>
					</div>
				))}
			</div>
			<div className="w-full md:w-1/3 bg-white rounded-lg p-6 flex flex-col gap-4">
				<div className="flex justify-between items-center mb-2">
					<span className="font-bold w-1/2 text-lg">Full Name</span>
					<span className="w-1/2 text-end">Abhishek Guleria</span>
				</div>
				<div className="flex justify-between items-center mb-2">
					<span className="font-bold w-1/2 text-lg">Phone Number</span>
					<span className="w-1/2 text-end">+91 00000-00000</span>
				</div>
				<div className="flex justify-between items-center mb-2">
					<span className="font-bold w-1/2 text-lg">Email Address</span>
					<span className="w-1/2 text-end">abc@gmail.com</span>
				</div>
				<div className="flex justify-between items-center mb-2">
					<span className="font-bold w-1/2 text-lg">Delivery Address</span>
					<span className="w-1/2 text-end">1234 Elm Street, Springfield, USA</span>
				</div>
				<div className="flex justify-between items-center mb-2">
					<span className="font-bold w-1/2 text-lg">Additional Notes</span>
					<span className="w-1/2 text-end">-</span>
				</div>
				<div className="mt-4 text-gray-500 text-sm">
					This is an order request only. No payment is collected online.<br />
					Our team will contact you to confirm your order and arrange payment & delivery.
				</div>
				<button className="mt-4 bg-black text-white px-6 py-2 rounded-md text-lg font-bold">Submit Order</button>
			</div>
		</div>
	);
}
