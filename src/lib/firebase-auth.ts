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
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      role: 'client', // default role
      companyName: userData.companyName || '',
      displayName: userData.displayName || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...userData,
    });
    
    return { user: result.user, error: null };
  } catch (error: any) {
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

// Auth state observer
export const useAuthState = () => {
  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};
