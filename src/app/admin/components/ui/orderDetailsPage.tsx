import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface OrderItem {
	productId: string;
	sku: string;
	nameSnap: string;
	brandSnap: string;
	qty: number;
	unitPrice: number;
	lineTotal: number;
}

interface Order {
	id: string;
	orderId: string;
	clientId: string;
	clientEmail: string;
	status: string;
	items: OrderItem[];
	totals: {
		itemCount: number;
		subtotal: number;
		tax: number;
		shipping: number;
		total: number;
	};
	currency: string;
	shippingInfo: {
		fullName: string;
		phone: string;
		address: {
			street: string;
			city: string;
			state: string;
			zipCode: string;
			country: string;
		};
	};
	notes?: string;
	paymentInfo?: {
		method: string;
		status: string;
	};
	createdAt: any;
	updatedAt?: any;
	user?: {
		email: string;
		displayName: string;
		phoneNumber?: string;
		role: string;
		status: string;
		companyName?: string;
	};
}

interface OrderDetailsModalProps {
	open: boolean;
	onClose: () => void;
	order: Order | null;
}

const statusOptions = [
	{ label: 'Active', value: 'active' },
	{ label: 'Complete', value: 'delivered' },
	{ label: 'Hold', value: 'hold' },
	{ label: 'Out Of Stock', value: 'out_of_stock' },
];

export default function OrderDetailsModal({ open, onClose, order }: OrderDetailsModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState(order?.status || 'pending');
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [notes, setNotes] = useState(order?.notes || '');

	useEffect(() => {
		setStatus(order?.status || 'pending');
		setNotes(order?.notes || '');
	}, [order]);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		}
		if (open) {
			document.addEventListener('mousedown', handleClick);
		}
		return () => document.removeEventListener('mousedown', handleClick);
	}, [open, onClose]);

	if (!open || !order) return null;

		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
				<div ref={modalRef} className="bg-white border-2 border-gray-300 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b bg-white">
						<h2 className="text-xl font-bold text-black">Order Details Page</h2>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-black text-xl font-bold"
							aria-label="Close"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
					{/* Content (scrollable) */}
					<div className="p-6 overflow-auto flex-1">
						<div className="mb-4 font-semibold text-lg">Order ID: #{order.orderId || order.id}</div>
						<div className="mb-4">
							<div className="font-semibold mb-2">Customer Info:</div>
							<div className="text-sm text-gray-700 mb-1">Name: {order.user?.displayName || order.shippingInfo?.fullName || 'N/A'}</div>
							<div className="text-sm text-gray-700 mb-1">Phone: {order.user?.phoneNumber || order.shippingInfo?.phone || 'N/A'}</div>
							<div className="text-sm text-gray-700 mb-1">Email: {order.user?.email || order.clientEmail || 'N/A'}</div>
							<div className="text-sm text-gray-700 mb-1">Address: {order.shippingInfo?.address?.street}, {order.shippingInfo?.address?.city}, {order.shippingInfo?.address?.state}</div>
						</div>
						<div className="mb-4">
							<table className="w-full text-sm border rounded">
								<thead>
									<tr className="bg-gray-50">
										<th className="py-2 px-4 text-left">Product Name</th>
										<th className="py-2 px-4 text-left">Quantity</th>
										<th className="py-2 px-4 text-left">Price</th>
										<th className="py-2 px-4 text-left">Subtotal</th>
									</tr>
								</thead>
								<tbody>
									{order.items.map((item, idx) => (
										<tr key={idx}>
											<td className="py-2 px-4">{item.nameSnap}</td>
											<td className="py-2 px-4">{item.qty}</td>
											<td className="py-2 px-4">₹{item.unitPrice.toLocaleString()}</td>
											<td className="py-2 px-4">₹{item.lineTotal.toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mb-4 flex items-center gap-2">
							<span className="font-semibold">Status:</span>
							<span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
								status === 'delivered' ? 'bg-green-100 text-green-800' :
								status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
								status === 'processing' || status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
								status === 'shipped' ? 'bg-purple-100 text-purple-800' :
								'bg-gray-100 text-gray-800'
							}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
							<div className="relative">
								<button
									className="ml-2 px-3 py-1 rounded border border-gray-300 bg-white text-black text-xs font-medium"
									onClick={() => setShowStatusDropdown((s) => !s)}
								>
									Update Status
								</button>
								{showStatusDropdown && (
									<div className="absolute left-0 top-full mt-2 bg-white border rounded shadow-lg z-10 min-w-[150px]">
										{statusOptions.map(opt => (
											<button
												key={opt.value}
												className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${status === opt.value ? 'font-bold' : ''}`}
												onClick={() => { setStatus(opt.value); setShowStatusDropdown(false); }}
											>
												{opt.label}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
						<div className="mb-4">
							<div className="font-semibold mb-2">Notes Section:</div>
							<textarea
								className="w-full border border-gray-300 rounded px-4 py-2 text-sm"
								rows={2}
								value={notes}
								onChange={e => setNotes(e.target.value)}
								placeholder="Called customer, waiting for confirmation..."
							/>
						</div>
						<div className="flex gap-3 mt-4">
							<button className="admin-button w-1/3">Export</button>
							<button className="admin-button w-1/3">Update Status</button>
							<button className="admin-button w-1/3">Contact Customer</button>
						</div>
					</div>
				</div>
			</div>
	);
}
