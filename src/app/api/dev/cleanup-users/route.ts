// src/app/api/dev/cleanup-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// WARNING: Development only endpoint - should be removed in production
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' }, 
      { status: 403 }
    );
  }

  try {
    console.log('🧹 [DEV] Starting user cleanup...');
    
    // Get all users from Auth
    const listUsersResult = await adminAuth.listUsers();
    const users = listUsersResult.users;
    
    if (users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users to delete',
        deletedCount: 0 
      });
    }
    
    console.log(`🔍 [DEV] Found ${users.length} users to delete`);
    
    // Delete from Firebase Auth
    const deletePromises = users.map(async (user) => {
      try {
        await adminAuth.deleteUser(user.uid);
        console.log(`🗑️ [DEV] Deleted auth user: ${user.email}`);
        
        // Also delete from Firestore if exists
        try {
          await adminDb.collection('users').doc(user.uid).delete();
          console.log(`🗑️ [DEV] Deleted firestore user: ${user.email}`);
        } catch (firestoreError) {
          // Ignore if document doesn't exist
          console.log(`ℹ️ [DEV] Firestore user document not found: ${user.email}`);
        }
        
        return { success: true, email: user.email };
      } catch (error) {
        console.error(`❌ [DEV] Failed to delete ${user.email}:`, error);
        return { success: false, email: user.email, error: error };
      }
    });
    
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    console.log(`✅ [DEV] Cleanup complete: ${successCount} deleted, ${failedCount} failed`);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${successCount} users deleted, ${failedCount} failed`,
      deletedCount: successCount,
      failedCount: failedCount,
      results: results
    });
    
  } catch (error) {
    console.error('❌ [DEV] Cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
