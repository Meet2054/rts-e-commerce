import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called (Firebase version)');
    
    // Check authentication - simplified version
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

    console.log('Token found, fetching Firebase data');

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'active', 'requested', 'inactive'
    const offset = (page - 1) * limit;

    console.log('Query params:', { page, limit, status, offset });

    // Fetch users from Firebase Firestore
    try {
      const usersSnapshot = await adminDb.collection('users').get();
      console.log('Fetched users from Firebase:', usersSnapshot.size);

      const allUsers: any[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        // Only include non-admin users
        if (userData.role !== 'admin') {
          allUsers.push({
            id: doc.id,
            name: userData.name || userData.displayName || 'Unknown User',
            email: userData.email || 'No email',
            role: userData.role || 'customer',
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            // Additional fields
            companyName: userData.companyName || 'N/A',
            phoneNumber: userData.phoneNumber || userData.phone || 'N/A',
            // Status and approval fields
            status: userData.status || null,
            approved: userData.approved || null,
            approvedAt: userData.approvedAt || null,
            rejectedAt: userData.rejectedAt || null
          });
        }
      });

      console.log('Non-admin users found:', allUsers.length);

      // Get order counts for each user (if you have orders collection)
      const usersWithOrderCounts = await Promise.all(
        allUsers.map(async (user) => {
          let totalOrders = 0;
          
          try {
            // Try to get orders for this user
            const ordersSnapshot = await adminDb
              .collection('orders')
              .where('clientEmail', '==', user.email)
              .get();
            
            totalOrders = ordersSnapshot.size;
          } catch (orderError) {
            console.log('No orders collection or error fetching orders:', orderError);
            // Default to 0 if no orders collection exists
            totalOrders = 0;
          }

          // Determine status based on user's actual status or approval fields
          let userStatus: 'active' | 'requested' | 'inactive' = 'requested';
          
          const userData = allUsers.find(u => u.id === user.id);
          
          // Check if user has been explicitly approved or rejected
          if (userData && userData.approved === true) {
            userStatus = 'active';
          } else if (userData && userData.approved === false) {
            userStatus = 'inactive';
          } else if (userData && userData.status) {
            // Use explicit status field if available
            userStatus = userData.status as 'active' | 'requested' | 'inactive';
          } else {
            // Fallback: If user was created recently (last 7 days), consider them as 'requested'
            const daysSinceCreated = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            userStatus = daysSinceCreated <= 7 ? 'requested' : 'active';
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            companyName: user.companyName,
            phoneNumber: user.phoneNumber,
            totalOrders,
            status: userStatus,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
        })
      );

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

    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      return NextResponse.json({
        error: 'Failed to fetch users from Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      }, { status: 500 });
    }

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

    try {
      // Update user status in Firebase
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update user based on action
      const updateData: any = {
        updatedAt: new Date()
      };

      if (action === 'approve') {
        updateData.status = 'active';
        updateData.approved = true;
        updateData.approvedAt = new Date();
      } else {
        updateData.status = 'inactive'; // Changed from 'rejected' to 'inactive'
        updateData.approved = false;
        updateData.rejectedAt = new Date();
      }

      await userRef.update(updateData);

      return NextResponse.json({ 
        message: `User ${action}d successfully`,
        userId,
        action
      });

    } catch (firebaseError) {
      console.error('Firebase update error:', firebaseError);
      return NextResponse.json({
        error: 'Failed to update user in Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
