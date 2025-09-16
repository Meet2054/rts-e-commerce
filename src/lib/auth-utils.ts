// lib/auth-utils.ts
import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

interface AuthResult {
  success: boolean;
  userData?: any;
  error?: string;
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No valid authorization header found'
      };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return {
        success: false,
        error: 'No token provided'
      };
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const userData = userDoc.data();
    
    return {
      success: true,
      userData: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...userData
      }
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<any> {
  if (!request) {
    return null;
  }

  const authResult = await verifyAuthToken(request);
  
  if (authResult.success && authResult.userData) {
    return authResult.userData;
  }
  
  return null;
}