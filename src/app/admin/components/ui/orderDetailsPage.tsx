import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

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
	onOrderUpdate?: () => void; // Add callback for when order is updated
}

const statusOptions = [
	{ label: 'Unprocessed', value: 'unprocessed' },
	{ label: 'Partially Processed', value: 'partially_processed' },
	{ label: 'Unprocessed & Partially', value: 'unprocessed_partially' },
	{ label: 'Archived', value: 'archived' },
	{ label: 'Cancelled', value: 'cancelled' },
	{ label: 'Merged', value: 'merged' },
	{ label: 'Delivered', value: 'delivered' },
];

export default function OrderDetailsModal({ open, onClose, order, onOrderUpdate }: OrderDetailsModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState(order?.status || 'unprocessed');
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [notes, setNotes] = useState(order?.notes || '');
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const { token } = useAuth();

	useEffect(() => {
		setStatus(order?.status || 'unprocessed');
		setNotes(order?.notes || '');
		setUpdateMessage(null); // Clear any previous messages when order changes
	}, [order]);

	const handleStatusUpdate = async (newStatus: string) => {
		if (!order || newStatus === status || !token) return;

		setIsUpdatingStatus(true);
		try {
			const response = await fetch('/api/admin/orders', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					orderId: order.id,
					status: newStatus,
				}),
			});

			if (response.ok) {
				setStatus(newStatus);
				setShowStatusDropdown(false);
				setUpdateMessage({ type: 'success', text: 'Order status updated successfully!' });
				
				// Call the callback to refresh parent component
				if (onOrderUpdate) {
					onOrderUpdate();
				}
				
				// Clear success message after 3 seconds
				setTimeout(() => setUpdateMessage(null), 3000);
				
				console.log('Order status updated successfully');
			} else {
				const errorData = await response.json();
				const errorMessage = errorData.error || 'Failed to update order status';
				setUpdateMessage({ type: 'error', text: errorMessage });
				console.error('Failed to update order status:', errorMessage);
			}
		} catch (error) {
			console.error('Error updating order status:', error);
			setUpdateMessage({ type: 'error', text: 'Error updating order status. Please try again.' });
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	// Export order to CSV
	const exportOrder = async () => {
		if (!order) return;
		
		try {
			setIsExporting(true);
			console.log('🔄 Starting order export for:', order.orderId);
			
			// Helper function to format Firebase timestamps
			const formatDate = (timestamp: any): string => {
				if (!timestamp) return '';
				try {
					if (timestamp._seconds) {
						return new Date(timestamp._seconds * 1000).toLocaleString();
					}
					return new Date(timestamp).toLocaleString();
				} catch (error) {
					console.warn('Error formatting date:', timestamp, error);
					return '';
				}
			};
			
			// Create CSV content
			const csvContent = [];
			
			// Order Information Section
			csvContent.push('ORDER INFORMATION');
			csvContent.push(`Order ID,${order.orderId}`);
			csvContent.push(`Status,${order.status}`);
			csvContent.push(`Created Date,${formatDate(order.createdAt)}`);
			csvContent.push(`Currency,${order.currency}`);
			csvContent.push(''); // Empty line
			
			// Customer Information Section
			csvContent.push('CUSTOMER INFORMATION');
			csvContent.push(`Name,"${order.shippingInfo?.fullName || order.user?.displayName || ''}"`); 
			csvContent.push(`Email,${order.clientEmail || order.user?.email || ''}`);
			csvContent.push(`Phone,${order.shippingInfo?.phone || order.user?.phoneNumber || ''}`);
			if (order.user?.companyName) {
				csvContent.push(`Company,"${order.user.companyName}"`);
			}
			csvContent.push(''); // Empty line
			
			// Shipping Address Section
			if (order.shippingInfo?.address) {
				csvContent.push('SHIPPING ADDRESS');
				csvContent.push(`Street,"${order.shippingInfo.address.street || ''}"`);
				csvContent.push(`City,${order.shippingInfo.address.city || ''}`);
				csvContent.push(`State,${order.shippingInfo.address.state || ''}`);
				csvContent.push(`ZIP Code,${order.shippingInfo.address.zipCode || ''}`);
				csvContent.push(`Country,${order.shippingInfo.address.country || ''}`);
				csvContent.push(''); // Empty line
			}
			
			// Order Items Section
			csvContent.push('ORDER ITEMS');
			csvContent.push('Oem PN,Product Name,Brand,Quantity,Unit Price,Line Total');
			order.items.forEach(item => {
				csvContent.push(`${item.sku},"${item.nameSnap.replace(/"/g, '""')}","${item.brandSnap || ''}",${item.qty},${item.unitPrice},${item.lineTotal}`);
			});
			csvContent.push(''); // Empty line
			
			// Order Totals Section
			csvContent.push('ORDER TOTALS');
			csvContent.push(`Item Count,${order.totals.itemCount}`);
			csvContent.push(`Subtotal,${order.totals.subtotal}`);
			csvContent.push(`Tax,${order.totals.tax}`);
			csvContent.push(`Shipping,${order.totals.shipping}`);
			csvContent.push(`Total,${order.totals.total}`);
			csvContent.push(''); // Empty line
			
			// Notes Section
			if (order.notes) {
				csvContent.push('NOTES');
				csvContent.push(`"${order.notes.replace(/"/g, '""')}"`);
			}
			
			// Create and download the file
			const csv = csvContent.join('\n');
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `order-${order.orderId}-${new Date().toISOString().split('T')[0]}.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			console.log(`✅ Successfully exported order ${order.orderId}`);
		} catch (error) {
			console.error('❌ Error exporting order:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			setUpdateMessage({ type: 'error', text: `Failed to export order: ${errorMessage}` });
		} finally {
			setIsExporting(false);
		}
	};

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
				<div ref={modalRef} className="bg-white border-2 border-gray-300 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full overflow-hidden flex flex-col">
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
						{/* Success/Error Message */}
						{updateMessage && (
							<div className={`mb-4 p-3 rounded ${
								updateMessage.type === 'success' 
									? 'bg-green-100 border border-green-400 text-green-700' 
									: 'bg-red-100 border border-red-400 text-red-700'
							}`}>
								{updateMessage.text}
							</div>
						)}
						
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
								<th className="py-2 px-4 text-left">OEM PN</th>
										<th className="py-2 px-4 text-left">Product Name</th>
										<th className="py-2 px-4 text-left">Quantity</th>
										<th className="py-2 px-4 text-left">Price</th>
										<th className="py-2 px-4 text-left">Subtotal</th>
									</tr>
								</thead>
								<tbody>
									{order.items.map((item, idx) => (
										<tr key={idx}>
											<td className="py-2 px-4 text-xs text-gray-600">{item.sku || 'N/A'}</td>
											<td className="py-2 px-4">{item.nameSnap}</td>
											<td className="py-2 px-4">{item.qty}</td>
											<td className="py-2 px-4">${item.unitPrice.toLocaleString()}</td>
											<td className="py-2 px-4">${item.lineTotal.toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mb-4 flex items-center gap-2">
							<span className="font-semibold">Status:</span>
							<span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
								status === 'delivered' ? 'bg-green-100 text-green-800' :
								status === 'unprocessed' ? 'bg-yellow-100 text-yellow-800' :
								status === 'partially_processed' ? 'bg-blue-100 text-blue-800' :
								status === 'unprocessed_partially' ? 'bg-orange-100 text-orange-800' :
								status === 'archived' ? 'bg-gray-100 text-gray-800' :
								status === 'merged' ? 'bg-purple-100 text-purple-800' :
								status === 'cancelled' ? 'bg-red-100 text-red-800' :
								'bg-gray-100 text-gray-800'
							}`}>{status === 'partially_processed' ? 'Partially Processed' :
								status === 'unprocessed_partially' ? 'Unprocessed & Partially' :
								status.charAt(0).toUpperCase() + status.slice(1)}</span>
							
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
							<button 
								className={`admin-button w-1/3 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
								onClick={exportOrder}
								disabled={isExporting}
							>
								{isExporting ? 'Exporting...' : 'Export'}
							</button>
							<div className="relative ">
								<button
									className={`admin-button ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
									onClick={() => setShowStatusDropdown((s) => !s)}
									disabled={isUpdatingStatus}
								>
									{isUpdatingStatus ? 'Updating...' : 'Update Status'}
								</button>
								{showStatusDropdown && (
									<div className="absolute left-0 bottom-14 mt-2 bg-white border rounded shadow-lg z-10 min-w-[150px]">
										{statusOptions.map(opt => (
											<button
												key={opt.value}
												className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${status === opt.value ? 'font-bold' : ''} ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
												onClick={() => handleStatusUpdate(opt.value)}
												disabled={isUpdatingStatus}
											>
												{opt.label}
											</button>
										))}
									</div>
								)}
							</div>
							<button className="admin-button w-1/3">Contact Customer</button>
						</div>
					</div>
				</div>
			</div>
	);
}
