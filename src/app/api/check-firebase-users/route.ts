import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('Checking Firebase users...');
    
    // Fetch all users from Firebase Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    
    const allUsers: any[] = [];
    const nonAdminUsers: any[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userInfo = {
        id: doc.id,
        name: userData.name || userData.displayName || 'Unknown User',
        email: userData.email || 'No email',
        role: userData.role || 'customer',
        createdAt: userData.createdAt?.toDate() || null,
        phone: userData.phoneNumber || userData.phone || null
      };
      
      allUsers.push(userInfo);
      
      if (userData.role !== 'admin') {
        nonAdminUsers.push(userInfo);
      }
    });

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      nonAdminUsers: nonAdminUsers.length,
      users: {
        all: allUsers,
        nonAdmin: nonAdminUsers
      }
    });

  } catch (error) {
    console.error('Firebase check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Firebase connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
