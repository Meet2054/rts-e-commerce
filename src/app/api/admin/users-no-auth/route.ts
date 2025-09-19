import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called (no auth version)');

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
        companyName: 'N/A',
        phoneNumber: 'N/A',
        totalOrders,
        status: userStatus,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    });

    // Filter by status if provided
    const filteredUsers = status 
      ? usersWithOrderCounts.filter(u => u.status === status)
      : usersWithOrderCounts;

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // Get total count
    const totalCount = filteredUsers.length;
    const totalPages = Math.ceil(totalCount / limit);

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
