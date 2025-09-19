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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user token for API calls
          const userToken = await firebaseUser.getIdToken();
          setToken(userToken);
          
          // Get user data from Firestore
          const userData = await getUserData(firebaseUser.uid);
          setUserData(userData);
          
          // Determine admin status and approval status
          if (userData) {
            const isUserAdmin = userData.role === 'admin';
            setIsAdmin(isUserAdmin);
            
            // Admin users are always approved
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

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, token, isApproved, approvalStatus, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}