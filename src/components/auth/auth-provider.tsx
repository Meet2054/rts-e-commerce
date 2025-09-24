// src/components/auth/auth-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserData } from '@/lib/firebase-auth';
import { User } from '@/lib/firebase-types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  token: string | null;
  isApproved: boolean;
  approvalStatus: 'active' | 'requested' | 'inactive' | 'unknown';
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  token: null,
  isApproved: false,
  approvalStatus: 'unknown',
  isAdmin: false
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'active' | 'requested' | 'inactive' | 'unknown'>('unknown');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear existing interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user token for API calls with force refresh
          const userToken = await firebaseUser.getIdToken(true); // Force refresh token
          setToken(userToken);
          
          // Set up automatic token refresh before expiration
          const refreshToken = async () => {
            try {
              const freshToken = await firebaseUser.getIdToken(true);
              setToken(freshToken);
              console.log('🔄 [Auth] Token refreshed successfully');
            } catch (error) {
              console.error('❌ [Auth] Token refresh failed:', error);
            }
          };

          // Refresh token every 50 minutes (tokens expire after 1 hour)
          tokenRefreshInterval = setInterval(refreshToken, 50 * 60 * 1000);
          
          // Get user data from Firestore
          const userData = await getUserData(firebaseUser.uid);
          setUserData(userData);
          
          // Determine admin status and approval status
          if (userData) {
            const isUserAdmin = userData.role === 'admin' || userData.role === 'employee';
            setIsAdmin(isUserAdmin);
            
            // Admin and employee users are always approved
            if (isUserAdmin) {
              setIsApproved(true);
              setApprovalStatus('active');
            } else {
              // For regular users, check approval status
              const approved = userData.approved === true || userData.status === 'active';
              const status = userData.status || (approved ? 'active' : 'requested');
              
              setIsApproved(approved);
              setApprovalStatus(status as 'active' | 'requested' | 'inactive');
            }
          } else {
            setIsApproved(false);
            setApprovalStatus('unknown');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setToken(null);
          setIsApproved(false);
          setApprovalStatus('unknown');
          setIsAdmin(false);
        }
      } else {
        setUserData(null);
        setToken(null);
        setIsApproved(false);
        setApprovalStatus('unknown');
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    // Clean up interval on unmount
    return () => {
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, token, isApproved, approvalStatus, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}