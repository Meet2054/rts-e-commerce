import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { adminLogger, LogCategory, withPerformanceLogging } from '@/lib/admin-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  
  try {
    adminLogger.info(LogCategory.API, 'Admin users API called (Firebase version)', {
      endpoint: '/api/admin/users-firebase',
      method: 'GET',
      userAgent: request.headers.get('user-agent')
    });
    
    // Check authentication - simplified version
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      adminLogger.warn(LogCategory.AUTH, 'No valid authorization header found', {
        endpoint: '/api/admin/users-firebase',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      adminLogger.warn(LogCategory.AUTH, 'No token provided in authorization header', {
        endpoint: '/api/admin/users-firebase'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    adminLogger.debug(LogCategory.AUTH, 'Token found, fetching Firebase data', {
      tokenLength: token.length
    });

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'active', 'requested', 'inactive'
    const role = url.searchParams.get('role'); // 'admin', 'client', 'employee'
    const search = url.searchParams.get('search'); // search term
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const offset = (page - 1) * limit;

    adminLogger.debug(LogCategory.USER_MANAGEMENT, 'Processing user query with parameters', {
      page, limit, status, role, search, startDate, endDate, offset
    });

    // Fetch users from Firebase Firestore
    try {
      const usersSnapshot = await withPerformanceLogging(
        LogCategory.FIREBASE,
        'Fetch users from Firestore',
        () => adminDb.collection('users').get()
      );
      
      adminLogger.success(LogCategory.FIREBASE, `Fetched ${usersSnapshot.size} users from Firebase`, {
        totalUsers: usersSnapshot.size
      });

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

      adminLogger.info(LogCategory.USER_MANAGEMENT, `Processed ${allUsers.length} user records`, {
        totalUsers: allUsers.length
      });

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
            adminLogger.debug(LogCategory.ORDERS, 'No orders found for user or orders collection error', {
              userEmail: user.email,
              error: orderError instanceof Error ? orderError.message : String(orderError)
            });
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
        adminLogger.debug(LogCategory.USER_MANAGEMENT, `Applied role filter '${role}'`, {
          filteredCount: filteredUsers.length
        });
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
        adminLogger.debug(LogCategory.USER_MANAGEMENT, `Applied search filter '${search}'`, {
          filteredCount: filteredUsers.length
        });
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
        adminLogger.debug(LogCategory.USER_MANAGEMENT, `Applied date range filter (${startDate} to ${endDate})`, {
          filteredCount: filteredUsers.length
        });
      }

      adminLogger.info(LogCategory.USER_MANAGEMENT, `Final user filtering completed`, {
        totalFiltered: filteredUsers.length,
        filters: { status, role, search, startDate, endDate }
      });
      
      adminLogger.debug(LogCategory.USER_MANAGEMENT, 'User summary data', {
        userCount: usersWithOrderCounts.length,
        statusBreakdown: usersWithOrderCounts.reduce((acc, u) => {
          acc[u.status] = (acc[u.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      // Apply pagination
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);

      // Get total count
      const totalCount = filteredUsers.length;
      const totalPages = Math.ceil(totalCount / limit);

      const duration = Date.now() - startTime;
      adminLogger.success(LogCategory.API, 'Users API request completed', {
        endpoint: '/api/admin/users-firebase',
        method: 'GET',
        duration,
        userCount: paginatedUsers.length,
        totalCount,
        totalPages,
        statusCode: 200
      });

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
      const duration = Date.now() - startTime;
      adminLogger.error(LogCategory.FIREBASE, 'Firebase error in users API', {
        endpoint: '/api/admin/users-firebase',
        method: 'GET',
        duration,
        error: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
        statusCode: 500
      });
      
      return NextResponse.json({
        error: 'Failed to fetch users from Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      }, { status: 500 });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    adminLogger.error(LogCategory.API, 'Unexpected error in users API', {
      endpoint: '/api/admin/users-firebase',
      method: 'GET',
      duration,
      error: error instanceof Error ? error.message : String(error),
      statusCode: 500
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    adminLogger.info(LogCategory.API, 'User update API called', {
      endpoint: '/api/admin/users-firebase',
      method: 'PUT'
    });
    
    // Simplified auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      adminLogger.warn(LogCategory.AUTH, 'No authorization header in user update request');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action, role } = body;
    
    adminLogger.debug(LogCategory.USER_MANAGEMENT, 'Processing user update request', {
      userId, action, role
    });
    
    if (!userId) {
      adminLogger.warn(LogCategory.USER_MANAGEMENT, 'User update request missing userId');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate action type
    if (action && !['approve', 'reject', 'changeRole'].includes(action)) {
      adminLogger.warn(LogCategory.USER_MANAGEMENT, 'Invalid action in user update request', { action });
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Validate role for role change action
    if (action === 'changeRole') {
      if (!role || !['admin', 'client', 'employee'].includes(role)) {
        adminLogger.warn(LogCategory.USER_MANAGEMENT, 'Invalid role in changeRole request', { role });
        return NextResponse.json({ error: 'Invalid role. Must be admin, client, or employee' }, { status: 400 });
      }
    }

    try {
      // Update user in Firebase
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        adminLogger.warn(LogCategory.USER_MANAGEMENT, 'User not found for update', { userId });
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const userData = userDoc.data();
      adminLogger.debug(LogCategory.USER_MANAGEMENT, 'User document retrieved for update', {
        userId,
        currentStatus: userData?.status,
        currentRole: userData?.role,
        currentApproval: userData?.approved
      });

      // Update user based on action
      const updateData: any = {
        updatedAt: new Date()
      };

      if (action === 'approve') {
        updateData.status = 'active';
        updateData.approved = true;
        updateData.approvedAt = new Date();
        adminLogger.info(LogCategory.USER_MANAGEMENT, 'Approving user', { userId });
      } else if (action === 'reject') {
        updateData.status = 'inactive';
        updateData.approved = false;
        updateData.rejectedAt = new Date();
        adminLogger.info(LogCategory.USER_MANAGEMENT, 'Rejecting user', { userId });
      } else if (action === 'changeRole') {
        updateData.role = role;
        adminLogger.info(LogCategory.USER_MANAGEMENT, 'Changing user role', {
          userId,
          fromRole: userData?.role,
          toRole: role
        });
      } else {
        // Handle legacy requests that don't specify an action but have approve/reject
        if (!action && !role) {
          adminLogger.warn(LogCategory.USER_MANAGEMENT, 'No action or role specified in update request', { userId });
          return NextResponse.json({ error: 'Action or role is required' }, { status: 400 });
        }
      }

      await userRef.update(updateData);

      const duration = Date.now() - startTime;
      adminLogger.info(LogCategory.USER_MANAGEMENT, 'User updated successfully', {
        userId,
        action,
        role: action === 'changeRole' ? role : undefined,
        updateFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
        duration: `${duration}ms`
      });

      return NextResponse.json({ 
        message: action === 'changeRole' 
          ? `User role changed to ${role} successfully`
          : `User ${action}d successfully`,
        userId,
        action,
        role: action === 'changeRole' ? role : undefined
      });

    } catch (firebaseError) {
      const duration = Date.now() - startTime;
      adminLogger.error(LogCategory.USER_MANAGEMENT, 'Firebase update error', {
        userId,
        action,
        error: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error',
        duration: `${duration}ms`,
        stack: firebaseError instanceof Error ? firebaseError.stack : undefined
      });
      
      return NextResponse.json({
        error: 'Failed to update user in Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      }, { status: 500 });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    adminLogger.error(LogCategory.USER_MANAGEMENT, 'Error updating user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
