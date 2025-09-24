import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called (Firebase version with role filtering)');
    
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
    const role = url.searchParams.get('role'); // 'admin', 'client', 'employee'
    const search = url.searchParams.get('search'); // search term
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const offset = (page - 1) * limit;

    console.log('Query params:', { page, limit, status, role, search, startDate, endDate, offset });

    // Fetch users from Firebase Firestore
    try {
      const usersSnapshot = await adminDb.collection('users').get();
      console.log('Fetched users from Firebase:', usersSnapshot.size);

      const allUsers: any[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        // Include all users (admins and non-admins)
        allUsers.push({
          id: doc.id,
          // Use the actual field name from sign-up (displayName)
          name: userData.displayName || 'Unknown User',
          email: userData.email || 'No email',
          role: userData.role || 'client',
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          // Sign-up form fields - Account Information
          displayName: userData.displayName || '',
          phoneNumber: userData.phoneNumber || '',
          companyName: userData.companyName || '',
          roleInCompany: userData.roleInCompany || '',
          // Sign-up form fields - Address Information  
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          zipCode: userData.zipCode || '',
          country: userData.country || '',
          // Sign-up form fields - Terms Agreement
          agreedToTerms: userData.agreedToTerms || false,
          agreementDate: userData.agreementDate || null,
          // Status and approval fields
          status: userData.status || 'requested',
          approved: userData.approved || false,
          approvedAt: userData.approvedAt || null,
          rejectedAt: userData.rejectedAt || null,
          approvedBy: userData.approvedBy || null,
          rejectedBy: userData.rejectedBy || null
        });
      });

      console.log('All users found:', allUsers.length);

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
          
          console.log(`🔍 [STATUS] User ${user.displayName || user.name} (${user.email}):`, {
            approved: userData?.approved,
            status: userData?.status,
            createdAt: user.createdAt
          });
          
          // Check if user has been explicitly approved or rejected
          if (userData && userData.approved === true) {
            userStatus = 'active';
            console.log(`📍 [STATUS] → Set to 'active' (approved=true)`);
          } else if (userData && userData.status) {
            // Use explicit status field if available
            userStatus = userData.status as 'active' | 'requested' | 'inactive';
            console.log(`📍 [STATUS] → Set to '${userStatus}' (from status field)`);
          } else if (userData && userData.approved === false) {
            // Users with approved=false are pending approval (requested)
            userStatus = 'requested';
            console.log(`📍 [STATUS] → Set to 'requested' (approved=false, pending approval)`);
          } else {
            // Fallback: If user was created recently (last 7 days), consider them as 'requested'
            const daysSinceCreated = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            userStatus = daysSinceCreated <= 7 ? 'requested' : 'active';
            console.log(`📍 [STATUS] → Set to '${userStatus}' (fallback: ${daysSinceCreated} days old)`);
          }

          return {
            id: user.id,
            // Basic info (for backward compatibility)
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            // Actual sign-up form fields
            displayName: user.displayName,
            phoneNumber: user.phoneNumber, 
            companyName: user.companyName,
            roleInCompany: user.roleInCompany,
            address: user.address,
            city: user.city,
            state: user.state,
            zipCode: user.zipCode,
            country: user.country,
            agreedToTerms: user.agreedToTerms,
            agreementDate: user.agreementDate,
            // Status info
            totalOrders,
            status: userStatus,
            approved: user.approved,
            approvedAt: user.approvedAt,
            rejectedAt: user.rejectedAt,
            approvedBy: user.approvedBy,
            rejectedBy: user.rejectedBy
          };
        })
      );

      console.log('Users with order counts:', usersWithOrderCounts.length);

      // Apply all filters
      let filteredUsers = usersWithOrderCounts;

      // Filter by status if provided
      if (status) {
        filteredUsers = filteredUsers.filter(u => u.status === status);
        console.log(`After status filter '${status}':`, filteredUsers.length);
      }

      // Filter by role if provided
      if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
        console.log(`After role filter '${role}':`, filteredUsers.length);
      }

      // Filter by search term if provided (search in name, email, company)
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
          (u.name || '').toLowerCase().includes(searchLower) ||
          (u.email || '').toLowerCase().includes(searchLower) ||
          (u.companyName || '').toLowerCase().includes(searchLower) ||
          (u.displayName || '').toLowerCase().includes(searchLower)
        );
        console.log(`After search filter '${search}':`, filteredUsers.length);
      }

      // Filter by date range if provided
      if (startDate || endDate) {
        filteredUsers = filteredUsers.filter(u => {
          const userDate = u.createdAt;
          if (!userDate) return false;

          if (startDate) {
            const start = new Date(startDate);
            if (userDate < start) return false;
          }

          if (endDate) {
            const end = new Date(endDate + 'T23:59:59.999Z'); // End of day
            if (userDate > end) return false;
          }

          return true;
        });
        console.log(`After date range filter (${startDate} to ${endDate}):`, filteredUsers.length);
      }

      console.log(`Final filtered users:`, filteredUsers.length);
      console.log('All user statuses with roles:', usersWithOrderCounts.map(u => ({ 
        id: u.id, 
        name: u.name, 
        status: u.status, 
        role: u.role, 
        approved: u.approved 
      })));

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

    const body = await request.json();
    const { userId, action, role } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate action type
    if (action && !['approve', 'reject', 'changeRole'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Validate role for role change action
    if (action === 'changeRole') {
      if (!role || !['admin', 'client', 'employee'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role. Must be admin, client, or employee' }, { status: 400 });
      }
    }

    try {
      // Update user in Firebase
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
      } else if (action === 'reject') {
        updateData.status = 'inactive';
        updateData.approved = false;
        updateData.rejectedAt = new Date();
      } else if (action === 'changeRole') {
        updateData.role = role;
        console.log(`Changing role for user ${userId} to ${role}`);
      } else {
        // Handle legacy requests that don't specify an action but have approve/reject
        if (!action && !role) {
          return NextResponse.json({ error: 'Action or role is required' }, { status: 400 });
        }
      }

      await userRef.update(updateData);

      console.log(`User ${userId} updated successfully:`, updateData);

      return NextResponse.json({ 
        message: action === 'changeRole' 
          ? `User role changed to ${role} successfully`
          : `User ${action}d successfully`,
        userId,
        action,
        role: action === 'changeRole' ? role : undefined
      });

    } catch (firebaseError) {
      console.error('Firebase update error:', firebaseError);
      return NextResponse.json({
        error: 'Failed to update user in Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
