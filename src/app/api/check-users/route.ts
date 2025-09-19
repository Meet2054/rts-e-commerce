import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';

export async function GET() {
  try {
    console.log('Checking mock database for users...');
    
    // Get all users (including admins for debugging)
    const allUsers = mockDb.getUsers();
    
    // Get non-admin users
    const nonAdminUsers = mockDb.getUsersExcludingRole('admin');
    
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
    console.error('Mock database check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
