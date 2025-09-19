import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';

export async function POST() {
  try {
    console.log('Creating test users...');
    
    const testUsers = [
      {
        id: crypto.randomUUID(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'customer',
        emailVerified: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Jane Smith', 
        email: 'jane.smith@example.com',
        role: 'customer',
        emailVerified: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        emailVerified: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'customer',
        emailVerified: true
      }
    ];

    // Insert test users
    const result = await db.insert(user).values(testUsers).returning();

    return NextResponse.json({
      success: true,
      message: 'Test users created successfully',
      users: result
    });

  } catch (error) {
    console.error('Error creating test users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create test users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
