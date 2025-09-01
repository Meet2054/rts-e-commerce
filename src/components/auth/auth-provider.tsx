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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  token: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

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
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setToken(null);
        }
      } else {
        setUserData(null);
        setToken(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}