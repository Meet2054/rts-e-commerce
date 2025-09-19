// src/components/auth/approval-guard.tsx
'use client';

import React from 'react';
import { useAuth } from './auth-provider';
import { signOut } from '@/lib/firebase-auth';
import { useRouter } from 'next/navigation';

interface ApprovalGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ApprovalGuard({ children, fallback }: ApprovalGuardProps) {
  const { user, userData, loading, isApproved, approvalStatus, isAdmin } = useAuth();
  const router = useRouter();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Checking access permissions...</div>
      </div>
    );
  }

  // Not logged in - redirect to sign in
  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Admin users always have access to everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Regular user is approved - allow access
  if (isApproved) {
    return <>{children}</>;
  }

  // User is not approved - show appropriate message
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Account Approval Pending
        </h2>
        
        <div className="text-gray-600 mb-6">
          {approvalStatus === 'requested' && (
            <>
              <p className="mb-3">
                Your account is currently under review by our admin team.
              </p>
              <p className="mb-3">
                You will receive access to the platform once your account is approved.
              </p>
              <p className="text-sm">
                This usually takes 24-48 hours during business days.
              </p>
            </>
          )}
          
          {approvalStatus === 'inactive' && (
            <>
              <p className="mb-3">
                Your account access has been restricted.
              </p>
              <p className="mb-3">
                Please contact our support team for assistance.
              </p>
            </>
          )}
          
          {approvalStatus === 'unknown' && (
            <>
              <p className="mb-3">
                We're having trouble verifying your account status.
              </p>
              <p className="mb-3">
                Please try refreshing the page or contact support.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
          
          <button
            onClick={async () => {
              await signOut();
              router.push('/sign-in');
            }}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Need help?</p>
            <a 
              href="mailto:support@yourcompany.com" 
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
