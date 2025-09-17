// src/lib/firebase-cleanup.ts (Development only - DO NOT use in production)
import { adminAuth } from './firebase-admin';

// WARNING: This is for development only - never expose this in production
export const deleteAllUsers = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('User cleanup is not allowed in production');
  }
  
  try {
    console.log('🧹 [Cleanup] Starting user deletion...');
    
    // List all users
    const listUsers = await adminAuth.listUsers();
    
    if (listUsers.users.length === 0) {
      console.log('✅ [Cleanup] No users to delete');
      return;
    }
    
    // Delete users in batches
    const uids = listUsers.users.map(user => user.uid);
    
    for (let i = 0; i < uids.length; i += 10) {
      const batch = uids.slice(i, i + 10);
      await Promise.all(batch.map(uid => adminAuth.deleteUser(uid)));
      console.log(`🗑️ [Cleanup] Deleted ${batch.length} users (${i + batch.length}/${uids.length})`);
    }
    
    console.log('✅ [Cleanup] All users deleted successfully');
    
  } catch (error) {
    console.error('❌ [Cleanup] Error deleting users:', error);
    throw error;
  }
};

// Delete a specific user by email (Development only)
export const deleteUserByEmail = async (email: string) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('User cleanup is not allowed in production');
  }
  
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.deleteUser(user.uid);
    console.log(`✅ [Cleanup] Deleted user: ${email}`);
  } catch (error) {
    console.error('❌ [Cleanup] Error deleting user:', error);
    throw error;
  }
};
