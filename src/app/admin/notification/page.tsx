"use client";
import React, { useState } from 'react';

const orderRequests = [
	{ id: 'ORD-REQ-1056', message: 'Rajesh Kumar placed order worth ₹15,250', date: '06 Sept, 10:30 AM', status: 'New' },
	{ id: 'ORD-REQ-1056', message: 'Rajesh Kumar placed order worth ₹15,250', date: '06 Sept, 10:30 AM', status: 'Read' },
	{ id: 'ORD-REQ-1057', message: 'Anita Desai placed order worth ₹22,800', date: '07 Sept, 11:15 AM', status: 'New' },
	{ id: 'ORD-REQ-1058', message: 'Vikram Singh placed order worth ₹29,450', date: '07 Sept, 1:00 PM', status: 'New' },
	{ id: 'ORD-REQ-1059', message: 'Sita Sharma placed order worth ₹5,750', date: '08 Sept, 2:45 PM', status: 'New' },
	{ id: 'ORD-REQ-1060', message: 'Arjun Mehta placed order worth ₹12,300', date: '09 Sept, 9:30 AM', status: 'New' },
	{ id: 'ORD-REQ-1061', message: 'Priya Singh placed order worth ₹18,600', date: '09 Sept, 3:15 PM', status: 'New' },
	{ id: 'ORD-REQ-1062', message: 'Rahul Verma placed order worth ₹27,000', date: '10 Sept, 10:00 AM', status: 'New' },
	{ id: 'ORD-REQ-1063', message: 'Geeta Rani placed order worth ₹20,150', date: '10 Sept, 11:45 AM', status: 'New' },
	{ id: 'ORD-REQ-1064', message: 'Nikhil Bhatia placed order worth ₹8,300', date: '11 Sept, 1:30 PM', status: 'New' },
	{ id: 'ORD-REQ-1065', message: 'Sanjay Gupta placed order worth ₹35,000', date: '11 Sept, 4:00 PM', status: 'New' },
];

const stockAlerts = Array.from({ length: 15 }).map((_, i) => ({
	id: 'ORD-REQ-1056',
	product: 'Canon Toner Cartridge',
	alert: 'Low Stock (5 left)',
	date: '06 Sept, 10:30 AM',
	status: i === 1 ? 'Read' : 'New',
}));

export default function NotificationPage() {
	const [tab, setTab] = useState<'order' | 'stock'>('order');

	return (
		<div className="max-w-[1200px] mx-auto p-8">
			<div className="mb-2">
				<div className="text-xl font-bold text-black">Notifications</div>
				<div className="text-gray-500 text-base">Manage and track all system, order, and stock alerts.</div>
			</div>
			<div className="flex gap-2 mb-6">
				<button
					className={`px-4 py-2 rounded-lg font-semibold text-sm ${tab === 'order' ? 'bg-black text-white' : 'bg-[#F1F2F4] text-black'}`}
					onClick={() => setTab('order')}
				>
					Order Requests
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-semibold text-sm ${tab === 'stock' ? 'bg-black text-white' : 'bg-[#F1F2F4] text-black'}`}
					onClick={() => setTab('stock')}
				>
					Stock Alerts
				</button>
				<button className="ml-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white">Mark All as Read</button>
			</div>
			<div className="flex justify-end mb-2">
				<button className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1">
					Filter by <span className="font-bold">Date Range</span>
					<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
				</button>
			</div>
			<div className="bg-white rounded-xl shadow-sm border p-2">
				{tab === 'order' ? (
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-gray-500 font-semibold border-b">
								<th className="py-3 px-4">Notification ID</th>
								<th className="py-3 px-4">Message</th>
								<th className="py-3 px-4">Date &amp; Time</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4">Action</th>
							</tr>
						</thead>
						<tbody>
							{orderRequests.map((item, idx) => (
								<tr key={idx} className="border-b last:border-b-0">
									<td className="py-2 px-4 font-medium">{item.id}</td>
									<td className="py-2 px-4">{item.message}</td>
									<td className="py-2 px-4">{item.date}</td>
									<td className="py-2 px-4">
										{item.status === 'New' ? (
											<span className="inline-flex items-center gap-1 text-red-600 font-semibold text-xs">
												<span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span> New
											</span>
										) : (
											<span className="text-gray-500 text-xs">Read</span>
										)}
									</td>
									<td className="py-2 px-4">
										<button className="text-[#2E318E] font-semibold hover:underline text-xs">View Order</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-gray-500 font-semibold border-b">
								<th className="py-3 px-4">Notification ID</th>
								<th className="py-3 px-4">Product</th>
								<th className="py-3 px-4">Alert</th>
								<th className="py-3 px-4">Date &amp; Time</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4">Action</th>
							</tr>
						</thead>
						<tbody>
							{stockAlerts.map((item, idx) => (
								<tr key={idx} className="border-b last:border-b-0">
									<td className="py-2 px-4 font-medium">{item.id}</td>
									<td className="py-2 px-4">{item.product}</td>
									<td className="py-2 px-4">{item.alert}</td>
									<td className="py-2 px-4">{item.date}</td>
									<td className="py-2 px-4">
										{item.status === 'New' ? (
											<span className="inline-flex items-center gap-1 text-red-600 font-semibold text-xs">
												<span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span> New
											</span>
										) : (
											<span className="text-gray-500 text-xs">Read</span>
										)}
									</td>
									<td className="py-2 px-4">
										<button className="text-[#2E318E] font-semibold hover:underline text-xs">View Inventory</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{/* Pagination */}
				<div className="flex justify-between items-center px-4 py-3">
					<span className="text-xs text-gray-500">Page 1 of 10</span>
					<div className="flex gap-2">
						<button className="px-4 py-1 rounded bg-[#F1F2F4] text-sm font-medium">Previous</button>
						<button className="px-4 py-1 rounded bg-[#F1F2F4] text-sm font-medium">Next</button>
					</div>
				</div>
			</div>
		</div>
	);
}
