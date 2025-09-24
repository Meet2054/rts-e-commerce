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
    
    // Determine if user should be admin (you can customize this logic)
    const isAdmin = email.endsWith('@admin.com') || email === 'admin@yourdomain.com';
    
    // Base user document data - only fields that are guaranteed to exist
    const userDocData: any = {
      email,
      role: isAdmin ? 'admin' as const : 'client' as const,
      status: isAdmin ? 'active' as const : 'requested' as const,
      approved: isAdmin ? true : false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Add approval timestamp for admins
    if (isAdmin) {
      userDocData.approvedAt = serverTimestamp();
      userDocData.approvedBy = 'system';
    }
    
    // Only add fields that are actually collected in sign-up form
    // Step 1: Account Information
    if (userData.displayName?.trim()) {
      userDocData.displayName = userData.displayName.trim();
    }
    if (userData.phoneNumber?.trim()) {
      userDocData.phoneNumber = userData.phoneNumber.trim();
    }
    if (userData.companyName?.trim()) {
      userDocData.companyName = userData.companyName.trim();
    }
    if (userData.roleInCompany?.trim()) {
      userDocData.roleInCompany = userData.roleInCompany.trim();
    }
    
    // Step 2: Address Information
    if (userData.address?.trim()) {
      userDocData.address = userData.address.trim();
    }
    if (userData.city?.trim()) {
      userDocData.city = userData.city.trim();
    }
    if (userData.state?.trim()) {
      userDocData.state = userData.state.trim();
    }
    if (userData.zipCode?.trim()) {
      userDocData.zipCode = userData.zipCode.trim();
    }
    if (userData.country?.trim()) {
      userDocData.country = userData.country.trim();
    }
    
    // Step 3: Terms Agreement
    if (userData.agreedToTerms !== undefined) {
      userDocData.agreedToTerms = userData.agreedToTerms;
      if (userData.agreedToTerms) {
        userDocData.agreementDate = serverTimestamp();
      }
    }

    await setDoc(doc(db, 'users', result.user.uid), userDocData);
    
    console.log(`✅ [Auth] User created as ${isAdmin ? 'admin' : 'client'}:`, result.user.uid);
    
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

// Check if user is approved for login
export const checkUserApproval = async (uid: string): Promise<{ approved: boolean; status: string; error?: string }> => {
  try {
    const userData = await getUserData(uid);
    if (!userData) {
      return { approved: false, status: 'user_not_found', error: 'User data not found' };
    }
    
    // Admin users are always approved
    if (userData.role === 'admin') {
      return { approved: true, status: 'active' };
    }
    
    // For regular users, check if they're approved
    const isApproved = userData.approved === true || userData.status === 'active';
    const status = userData.status || (isApproved ? 'active' : 'requested');
    
    return { approved: isApproved, status };
  } catch (error: any) {
    console.error('❌ [Auth] Approval check error:', error);
    return { approved: false, status: 'error', error: error.message };
  }
};

// Admin function to approve/reject user
export const approveUser = async (uid: string, adminUid: string) => {
  try {
    const updateData = {
      approved: true,
      status: 'active' as const,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
    console.log('✅ [Auth] User approved:', uid);
    return { error: null };
  } catch (error: any) {
    console.error('❌ [Auth] Approval error:', error);
    return { error: error.message };
  }
};

export const rejectUser = async (uid: string, adminUid: string) => {
  try {
    const updateData = {
      approved: false,
      status: 'inactive' as const,
      rejectedAt: serverTimestamp(),
      rejectedBy: adminUid,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
    console.log('✅ [Auth] User rejected:', uid);
    return { error: null };
  } catch (error: any) {
    console.error('❌ [Auth] Rejection error:', error);
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
