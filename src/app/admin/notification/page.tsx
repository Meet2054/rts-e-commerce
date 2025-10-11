"use client";
import React, { useState, useEffect } from 'react';

interface SupportQuery {
	id: string;
	userId: string;
	fullName: string;
	email: string;
	phone?: string;
	message: string;
	status: 'pending' | 'processing' | 'solved';
	createdAt: string;
	updatedAt?: string;
	updatedBy?: string;
}

export default function NotificationPage() {
	const [supportQueries, setSupportQueries] = useState<SupportQuery[]>([]);
	const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
	const [showQueryModal, setShowQueryModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const [fetchLoading, setFetchLoading] = useState(true);

	// Fetch support queries from API
	useEffect(() => {
		const fetchSupportQueries = async () => {
			try {
				setFetchLoading(true);
				const response = await fetch('/api/support');
				const data = await response.json();
				
				if (data.success) {
					setSupportQueries(data.queries || []);
				} else {
					console.error('Failed to fetch support queries:', data.error);
				}
			} catch (error) {
				console.error('Error fetching support queries:', error);
			} finally {
				setFetchLoading(false);
			}
		};

		fetchSupportQueries();
	}, []);

	// Status colors for different query states
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending': return 'text-red-600 bg-red-100';
			case 'processing': return 'text-yellow-600 bg-yellow-100';
			case 'solved': return 'text-green-600 bg-green-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	};

	const handleViewQuery = (query: SupportQuery) => {
		setSelectedQuery(query);
		setShowQueryModal(true);
	};

	const handleStatusUpdate = async (queryId: string, newStatus: 'pending' | 'processing' | 'solved') => {
		setLoading(true);
		try {
			const response = await fetch('/api/support', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					queryId,
					status: newStatus,
					updatedBy: 'Admin'
				})
			});

			const data = await response.json();
			
			if (response.ok && data.success) {
				// Update the query in local state
				setSupportQueries(prev => 
					prev.map(query => 
						query.id === queryId 
							? { ...query, status: newStatus, updatedAt: data.query.updatedAt, updatedBy: data.query.updatedBy }
							: query
					)
				);
				
				// Update selected query if it's the one being updated
				if (selectedQuery?.id === queryId) {
					setSelectedQuery(prev => prev ? { ...prev, status: newStatus, updatedAt: data.query.updatedAt, updatedBy: data.query.updatedBy } : null);
				}
			} else {
				throw new Error(data.error || 'Failed to update status');
			}
			
		} catch (error) {
			console.error('Error updating query status:', error);
			alert('Failed to update status. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const markAllAsRead = async () => {
		const pendingQueries = supportQueries.filter(query => query.status === 'pending');
		
		if (pendingQueries.length === 0) {
			return;
		}

		const confirmMarkRead = confirm(`Are you sure you want to mark ${pendingQueries.length} pending queries as read (processing)?`);
		
		if (!confirmMarkRead) return;

		setLoading(true);
		try {
			// Update each pending query to processing status
			const updatePromises = pendingQueries.map(async (query) => {
				const response = await fetch('/api/support', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						queryId: query.id,
						status: 'processing',
						updatedBy: 'Admin'
					})
				});
				
				if (!response.ok) {
					throw new Error(`Failed to update query ${query.id}`);
				}
				
				return response.json();
			});

			await Promise.all(updatePromises);
			
			// Update all pending queries to processing in local state
			setSupportQueries(prev => 
				prev.map(query => 
					query.status === 'pending' 
						? { 
							...query, 
							status: 'processing' as const,
							updatedAt: new Date().toLocaleString('en-US', {
								day: '2-digit',
								month: 'short',
								hour: '2-digit',
								minute: '2-digit',
								hour12: true
							}),
							updatedBy: 'Admin'
						}
						: query
				)
			);
			
		} catch (error) {
			console.error('Error marking queries as read:', error);
			alert('Failed to mark some queries as read. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const clearSolvedQueries = async () => {
		const solvedQueries = supportQueries.filter(query => query.status === 'solved');
		
		if (solvedQueries.length === 0) {
			return;
		}

		const confirmClear = confirm(`Are you sure you want to delete ${solvedQueries.length} solved queries? This action cannot be undone.`);
		
		if (!confirmClear) return;

		setLoading(true);
		try {
			// Delete each solved query
			const deletePromises = solvedQueries.map(async (query) => {
				const response = await fetch('/api/support', {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						queryId: query.id
					})
				});
				
				if (!response.ok) {
					throw new Error(`Failed to delete query ${query.id}`);
				}
				
				return response.json();
			});

			await Promise.all(deletePromises);
			
			// Remove solved queries from local state
			setSupportQueries(prev => prev.filter(query => query.status !== 'solved'));
			
		} catch (error) {
			console.error('Error clearing solved queries:', error);
			alert('Failed to clear some queries. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-[1200px] mx-auto p-8">
			<div className="mb-6">
				<div className="text-xl font-bold text-black">Notifications</div>
				<div className="text-gray-500 text-base">Manage and track all system, order, and stock alerts.</div>
			</div>
			<div className="flex justify-between items-center mb-8">
				<h2 className="text-lg font-semibold text-black">Support Queries</h2>
				<div className="flex gap-2">
					<button 
						onClick={clearSolvedQueries}
						disabled={loading || supportQueries.filter(q => q.status === 'solved').length === 0}
						className="px-4 py-2 rounded-lg border cursor-pointer border-red-500 text-sm font-medium text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Clear Solved ({supportQueries.filter(q => q.status === 'solved').length})
					</button>
					<button 
						onClick={markAllAsRead}
						disabled={loading || supportQueries.filter(q => q.status === 'pending').length === 0}
						className="px-4 py-2 rounded-lg border border-blue-300 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Mark All as Read ({supportQueries.filter(q => q.status === 'pending').length})
					</button>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border p-2">
				{fetchLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-gray-500">Loading support queries...</div>
					</div>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-gray-500 font-semibold border-b">
								<th className="py-3 px-4">Query ID</th>
								<th className="py-3 px-4">User Name</th>
								<th className="py-3 px-4">Email</th>
								<th className="py-3 px-4">Date &amp; Time</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4">Action</th>
							</tr>
						</thead>
						<tbody>
							{fetchLoading ? (
								<tr>
									<td colSpan={6} className="py-12 text-center text-gray-500">
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></div>
											Loading support queries...
										</div>
									</td>
								</tr>
							) : supportQueries.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-12 text-center text-gray-500">
										No support queries found
									</td>
								</tr>
							) : (
								supportQueries.map((query, idx) => (
									<tr key={idx} className="border-b last:border-b-0">
										<td className="py-2 px-4 font-medium">{query.id}</td>
										<td className="py-2 px-4">{query.fullName}</td>
										<td className="py-2 px-4">{query.email}</td>
										<td className="py-2 px-4">{query.createdAt}</td>
										<td className="py-2 px-4">
											<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(query.status)}`}>
												{query.status === 'pending' && <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>}
												{query.status === 'processing' && <span className="w-2 h-2 rounded-full bg-yellow-600 inline-block"></span>}
												{query.status === 'solved' && <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>}
												{query.status.charAt(0).toUpperCase() + query.status.slice(1)}
											</span>
										</td>
										<td className="py-2 px-4">
											<button 
												onClick={() => handleViewQuery(query)}
												className="text-[#2E318E] font-semibold hover:underline text-xs"
											>
												View Query
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				)}
			</div>

			{/* Query Detail Modal */}
			{showQueryModal && selectedQuery && (
				<div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4">
						<div className="p-6">
							<div className="flex justify-between items-start mb-6">
								<h2 className="text-xl font-bold text-gray-900">Support Query Details</h2>
								<button
									onClick={() => setShowQueryModal(false)}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M18 6L6 18M6 6l12 12"/>
									</svg>
								</button>
							</div>

							<div className="space-y-4">
								{/* Query Info */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Query ID</label>
										<div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">{selectedQuery.id}</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
										<div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">{selectedQuery.userId}</div>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
										<div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedQuery.fullName}</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
										<div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedQuery.email}</div>
									</div>
								</div>

								{selectedQuery.phone && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
										<div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedQuery.phone}</div>
									</div>
								)}

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
									<div className="text-sm text-gray-900 bg-gray-50 p-3 rounded min-h-[100px] whitespace-pre-wrap">{selectedQuery.message}</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
										<div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedQuery.createdAt}</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
										<select
											value={selectedQuery.status}
											onChange={(e) => handleStatusUpdate(selectedQuery.id, e.target.value as 'pending' | 'processing' | 'solved')}
											disabled={loading}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
										>
											<option value="pending">Pending</option>
											<option value="processing">Processing</option>
											<option value="solved">Solved</option>
										</select>
									</div>
								</div>

								{selectedQuery.updatedAt && (
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
											<div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedQuery.updatedAt}</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
											<div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedQuery.updatedBy}</div>
										</div>
									</div>
								)}
							</div>

							<div className="flex justify-end gap-3 mt-6 pt-4 border-t">
								<button
									onClick={() => setShowQueryModal(false)}
									className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
								>
									Close
								</button>
								<button
									onClick={async () => {
										if (selectedQuery && selectedQuery.status === 'pending') {
											await handleStatusUpdate(selectedQuery.id, 'processing');
										}
										setShowQueryModal(false);
									}}
									disabled={loading || selectedQuery?.status !== 'pending'}
									className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
										selectedQuery?.status === 'pending' 
											? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
											: 'bg-gray-400 text-gray-200 cursor-not-allowed'
									} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
								>
									{selectedQuery?.status === 'pending' ? 'Mark as Read' : 'Already Read'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
