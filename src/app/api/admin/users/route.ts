import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called');
    
    // Simplified auth check - just check if Authorization header exists
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Token found, proceeding with request');

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'active', 'requested', 'inactive'
    const offset = (page - 1) * limit;

    console.log('Query params:', { page, limit, status, offset });

    // Get users excluding admins from mock database
    const users = mockDb.getUsersExcludingRole('admin');
    console.log('Fetched users from mock DB:', users.length);

    // Get users with order counts
    const usersWithOrderCounts = users.map((u) => {
      const totalOrders = mockDb.getOrderCountByEmail(u.email);
      
      // Set status based on creation date for demo
      let userStatus: 'active' | 'requested' | 'inactive' = 'active';
      const daysSinceCreated = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      userStatus = daysSinceCreated <= 7 ? 'requested' : 'active';

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        companyName: 'N/A', // This would come from a profile table in a real app
        phoneNumber: 'N/A', // This would come from a profile table in a real app
        totalOrders,
        status: userStatus,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    });

    console.log('Users with order counts:', usersWithOrderCounts.length);

    // Filter by status if provided
    const filteredUsers = status 
      ? usersWithOrderCounts.filter(u => u.status === status)
      : usersWithOrderCounts;

    console.log('Filtered users:', filteredUsers.length);

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // Get total count
    const totalCount = filteredUsers.length;
    const totalPages = Math.ceil(totalCount / limit);

    console.log('Returning response:', { userCount: paginatedUsers.length, totalCount, totalPages });

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Simplified auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { userId, action } = await request.json();
    
    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Find and update user in mock database
    const user = mockDb.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status based on action
    const newStatus = action === 'approve' ? 'active' : 'inactive';
    mockDb.updateUser(userId, { role: newStatus === 'active' ? 'customer' : 'rejected' });
    
    return NextResponse.json({ 
      message: `User ${action}d successfully`,
      userId,
      action
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
