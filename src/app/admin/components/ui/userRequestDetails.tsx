'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface UserData {
  id: string;
  clientId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  status: 'active' | 'requested' | 'inactive';
  businessType?: string;
  industry?: string;
  website?: string;
  gst?: string;
  address?: string;
  roleInCompany?: string;
  currency?: string;
  language?: string;
  createdAt: any;
}

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  userData: UserData | null;
  onAddNewPricing?: (userId: string) => void;
}

export default function RequestedUserDetailsModal({ 
  open, 
  onClose, 
  userData,
  onApprove,
  onReject
}: UserDetailsModalProps & { onApprove?: (userId: string) => void; onReject?: (userId: string, reason?: string) => void; }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const handleApprove = async () => {
    if (!userData || !onApprove) return;
    setActionLoading('approve');
    await onApprove(userData.id);
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!userData || !onReject) return;
    setActionLoading('reject');
    await onReject(userData.id, rejectionReason);
    setActionLoading(null);
  };

  // Close modal on outside click
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

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);


  if (!open || !userData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div 
        ref={modalRef} 
        className="bg-white rounded-md shadow-lg max-w-2xl w-full mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-black">User Request Detail</h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-black text-xl font-bold"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="font-semibold mb-2">Account Information</div>
              <div className="text-sm text-gray-700 mb-1">Full Name: <span className="font-medium">{userData.displayName}</span></div>
              <div className="text-sm text-gray-700 mb-1">Email Address: <span className="font-medium">{userData.email}</span></div>
              <div className="text-sm text-gray-700 mb-1">Phone Number: <span className="font-medium">{userData.phoneNumber || 'Not provided'}</span></div>
              <div className="text-sm text-gray-400 mb-1">Password: (hidden for security)</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Business Information</div>
              <div className="text-sm text-gray-700 mb-1">Company Name: <span className="font-medium">{userData.companyName || 'N/A'}</span></div>
              <div className="text-sm text-gray-700 mb-1">Company Address: <span className="font-medium">{userData.address || 'Not provided'}</span></div>
              <div className="text-sm text-gray-700 mb-1">GST Number: <span className="font-medium">{userData.gst || 'Not provided'}</span></div>
              <div className="text-sm text-gray-700 mb-1">Company Registration ID: <span className="font-medium">{userData.businessType || 'DT90/2025'}</span></div>
              <div className="text-sm text-gray-700 mb-1">Website: <span className="font-medium">{userData.website || 'Not provided'}</span></div>
            </div>
          </div>
          <div className="mb-6">
            <div className="font-semibold mb-2">Request Information</div>
            <div className="text-sm text-gray-700 mb-1">Request Date: <span className="font-medium">{userData.createdAt ? formatDate(userData.createdAt) : 'N/A'}</span></div>
            <div className="text-sm text-gray-700 mb-1">Status: <span className="font-medium">Pending</span></div>
            <div className="text-sm text-gray-700 mb-1">Notes: <span className="font-medium">Wants access to Toner & Printer categories</span></div>
          </div>
          <div className="mb-6">
            <select 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            >
              <option value="">Add Reason of Rejection</option>
              <option value="Incomplete Information">Incomplete Information</option>
              <option value="Invalid Documents">Invalid Documents</option>
              <option value="Not Eligible">Not Eligible</option>
            </select>
            <div className="flex gap-4">
              <button 
                className="admin-button w-1/2 bg-white text-black border border-gray-300 hover:bg-red-100 hover:text-red-700"
                onClick={handleReject}
                disabled={actionLoading === 'reject'}
              >
                {actionLoading === 'reject' ? 'Processing...' : 'Reject Request'}
              </button>
              <button 
                className="admin-button w-1/2 bg-black text-white"
                onClick={handleApprove}
                disabled={actionLoading === 'approve'}
              >
                {actionLoading === 'approve' ? 'Processing...' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
