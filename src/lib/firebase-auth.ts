// src/lib/firebase-auth.ts
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './firebase-config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from './firebase-types';

// Auth functions
export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUp = async (email: string, password: string, userData: Partial<User>) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Filter out undefined and empty values before saving to Firestore
    const userDocData: any = {
      email,
      role: 'client' as const, // default role
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Only add fields that have actual values
    if (userData.displayName && userData.displayName.trim() !== '') {
      userDocData.displayName = userData.displayName.trim();
    }
    if (userData.phoneNumber && userData.phoneNumber.trim() !== '') {
      userDocData.phoneNumber = userData.phoneNumber.trim();
    }

    await setDoc(doc(db, 'users', result.user.uid), userDocData);
    
    console.log('✅ [Auth] User created with profile:', result.user.uid);
    
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('❌ [Auth] Sign up error:', error);
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Update user profile with additional data
export const updateUserProfile = async (uid: string, updateData: Partial<User>) => {
  try {
    // Filter out undefined and empty string values to prevent Firestore errors
    const filteredData: any = {};
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        filteredData[key] = value;
      }
    });
    
    // Always add the timestamp
    filteredData.updatedAt = serverTimestamp();
    
    // Add agreement timestamp if agreeing to terms
    if (updateData.agreedToTerms === true) {
      filteredData.agreementDate = serverTimestamp();
    }
    
    await setDoc(doc(db, 'users', uid), filteredData, { merge: true });
    
    console.log('✅ [Auth] User profile updated:', uid, Object.keys(filteredData));
    return { error: null };
  } catch (error: any) {
    console.error('❌ [Auth] Profile update error:', error);
    return { error: error.message };
  }
};

// Auth state observer
export const useAuthState = () => {
  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};
