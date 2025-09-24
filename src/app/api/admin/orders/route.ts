import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Order} from '@/lib/firebase-types';
import { RedisCache } from '@/lib/redis-cache';

// Extended Order interface with user details populated
export interface OrderWithUser extends Order {
  user?: {
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: 'admin' | 'client' | 'support';
    status: 'requested' | 'active' | 'inactive';
    companyName?: string;
  };
}

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    console.log('Fetching orders from Firebase with params:', { page, limit, status, startDate, endDate });
    
    // For now, let's use a simple approach that avoids composite index issues
    // We'll fetch orders with minimal filters and do additional filtering client-side when needed
    
    let query = adminDb.collection('orders').orderBy('createdAt', 'desc');
    let needsClientSideFilter = false;
    const clientSideFilters: {
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {};
    
    // Only apply status filter if there are no date filters (to avoid composite index)
    if (status && status !== 'all' && !startDate && !endDate) {
      query = query.where('status', '==', status);
    } else if (status && status !== 'all') {
      needsClientSideFilter = true;
      clientSideFilters.status = status;
    }
    
    // Only apply date filters if there's no status filter (to avoid composite index)
    if (!status || status === 'all') {
      if (startDate) {
        const startTimestamp = new Date(startDate + 'T00:00:00.000Z');
        query = query.where('createdAt', '>=', startTimestamp);
      }
      if (endDate) {
        const endTimestamp = new Date(endDate + 'T23:59:59.999Z');
        query = query.where('createdAt', '<=', endTimestamp);
      }
    } else if (startDate || endDate) {
      needsClientSideFilter = true;
      if (startDate) clientSideFilters.startDate = startDate;
      if (endDate) clientSideFilters.endDate = endDate;
    }

    let allOrdersData: any[] = [];
    let total = 0;

    if (needsClientSideFilter) {
      // Get all orders and filter client-side
      const allOrdersSnapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
      const allOrders = allOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Apply client-side filters
      let filteredOrders = allOrders;
      
      if (clientSideFilters.status) {
        filteredOrders = filteredOrders.filter((order: any) => order.status === clientSideFilters.status);
      }
      
      if (clientSideFilters.startDate) {
        const startTime = new Date(clientSideFilters.startDate + 'T00:00:00.000Z').getTime();
        filteredOrders = filteredOrders.filter((order: any) => {
          const orderTime = order.createdAt?.toDate?.()?.getTime() || new Date(order.createdAt).getTime();
          return orderTime >= startTime;
        });
      }
      
      if (clientSideFilters.endDate) {
        const endTime = new Date(clientSideFilters.endDate + 'T23:59:59.999Z').getTime();
        filteredOrders = filteredOrders.filter((order: any) => {
          const orderTime = order.createdAt?.toDate?.()?.getTime() || new Date(order.createdAt).getTime();
          return orderTime <= endTime;
        });
      }
      
      total = filteredOrders.length;
      
      // Apply pagination
      const offset = (page - 1) * limit;
      allOrdersData = filteredOrders.slice(offset, offset + limit);
      
      console.log(`Client-side filtering: ${allOrders.length} total orders, ${filteredOrders.length} after filters, ${allOrdersData.length} on page ${page}`);
      
    } else {
      // Use Firebase query directly
      try {
        const totalSnapshot = await query.get();
        total = totalSnapshot.size;
        
        // Apply pagination
        const offset = (page - 1) * limit;
        const paginatedSnapshot = await query.offset(offset).limit(limit).get();
        allOrdersData = paginatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
      } catch (error) {
        console.error('Firebase query failed, falling back to client-side:', error);
        // Fallback to getting all orders and filtering client-side
        const allOrdersSnapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
        const allOrders = allOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        total = allOrders.length;
        const offset = (page - 1) * limit;
        allOrdersData = allOrders.slice(offset, offset + limit);
      }
    }

    const totalPages = Math.ceil(total / limit);

    if (allOrdersData.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
        count: 0,
        message: 'No orders found'
      });
    }

    // Process each order and fetch user details
    const orders: OrderWithUser[] = [];
    
    for (const orderData of allOrdersData) {
      // Fetch user details for this order
      let userDetails = null;
      if (orderData.clientId) {
        try {
          const userDoc = await adminDb.collection('users').doc(orderData.clientId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userDetails = {
              email: userData?.email || orderData.clientEmail || 'Unknown',
              displayName: userData?.displayName || userData?.name || 'Unknown User',
              phoneNumber: userData?.phoneNumber || userData?.phone || null,
              role: userData?.role || 'client',
              status: userData?.status || 'requested',
              companyName: userData?.companyName || null
            };
          }
        } catch (userError) {
          console.warn(`Failed to fetch user details for clientId ${orderData.clientId}:`, userError);
        }
      }

      // Construct the order object
      const order: OrderWithUser = {
        id: orderData.id,
        orderId: orderData.orderId || orderData.id,
        clientId: orderData.clientId || '',
        clientEmail: orderData.clientEmail || '',
        status: orderData.status || 'pending',
        items: Array.isArray(orderData.items) ? orderData.items : [],
        totals: orderData.totals || {
          itemCount: 0,
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0
        },
        currency: orderData.currency || 'INR',
        shippingInfo: orderData.shippingInfo || {
          fullName: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          }
        },
        notes: orderData.notes || '',
        paymentInfo: orderData.paymentInfo || {
          method: 'cash_on_delivery',
          status: 'pending'
        },
        trackingInfo: orderData.trackingInfo || null,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        user: userDetails || undefined
      };

      orders.push(order);
    }

    const filterType = needsClientSideFilter ? 'client-side filtered' : 'Firebase query';
    console.log(`Successfully fetched ${orders.length} orders with user details (page ${page}/${totalPages}) - ${filterType}`);

    return NextResponse.json({
      success: true,
      orders: orders,
      total,
      totalPages,
      currentPage: page,
      count: orders.length,
      message: `Found ${total} orders, showing page ${page} of ${totalPages} (${filterType})`
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        orders: []
      },
      { status: 500 }
    );
  }
}

// POST method for creating new orders
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      clientId, 
      clientEmail, 
      items, 
      totals, 
      shippingInfo, 
      paymentInfo, 
      notes 
    } = body;

    if (!clientId || !clientEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, clientEmail, items' },
        { status: 400 }
      );
    }

    if (!totals || !totals.total || totals.total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid totals' },
        { status: 400 }
      );
    }

    if (!shippingInfo || !shippingInfo.fullName || !shippingInfo.address) {
      return NextResponse.json(
        { success: false, error: 'Complete shipping information is required' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new order with proper schema
    const newOrder = {
      orderId,
      clientId,
      clientEmail,
      status: 'pending' as const,
      items: items.map((item: any) => ({
        productId: item.productId || '',
        sku: item.sku || '',
        variantId: item.variantId || '',
        nameSnap: item.nameSnap || item.name || '',
        brandSnap: item.brandSnap || item.brand || '',
        imageSnap: item.imageSnap || item.image || '',
        qty: parseInt(item.qty) || parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || parseFloat(item.price) || 0,
        lineTotal: parseFloat(item.lineTotal) || (parseFloat(item.unitPrice || item.price || 0) * parseInt(item.qty || item.quantity || 1))
      })),
      totals: {
        itemCount: totals.itemCount || items.length,
        subtotal: parseFloat(totals.subtotal) || 0,
        tax: parseFloat(totals.tax) || 0,
        shipping: parseFloat(totals.shipping) || 0,
        total: parseFloat(totals.total)
      },
      currency: 'INR' as const,
      shippingInfo,
      notes: notes || '',
      paymentInfo: paymentInfo || {
        method: 'cash_on_delivery' as const,
        status: 'pending' as const
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Add order to Firebase
    const orderRef = await adminDb.collection('orders').add(newOrder);

    console.log(`New order created with ID: ${orderRef.id}, Order Number: ${orderId}`);

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      orderNumber: orderId,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT method for updating order status
export async function PUT(request: Request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, status, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Get the order first to know which user's cache to invalidate
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data() as Order;

    // Update order in Firebase
    await adminDb.collection('orders').doc(orderId).update(updateData);

    // Invalidate caches
    try {
      console.log(`Starting cache invalidation for order ${orderId}, clientId: ${orderData.clientId}, clientEmail: ${orderData.clientEmail}`);
      
      // Invalidate specific order cache
      await RedisCache.delete(`order:${orderId}`);
      console.log(`Deleted order cache: order:${orderId}`);
      
      // Invalidate user's orders cache (both by clientId and clientEmail)
      if (orderData.clientId && orderData.clientId !== 'anonymous') {
        await RedisCache.delete(`orders:user:${orderData.clientId}`);
        console.log(`Deleted user orders cache: orders:user:${orderData.clientId}`);
      }
      if (orderData.clientEmail && orderData.clientEmail !== 'customer@example.com') {
        await RedisCache.delete(`orders:user:${orderData.clientEmail}`);
        console.log(`Deleted user orders cache: orders:user:${orderData.clientEmail}`);
      }
      
      // Invalidate admin orders cache with various combinations
      const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      const limits = ['10', '50', '100'];
      
      for (const st of statuses) {
        for (const lim of limits) {
          await RedisCache.delete(`orders:all:${st}:${lim}`);
        }
      }
      
      console.log(`Cache invalidation completed for order ${orderId} and user ${orderData.clientId || orderData.clientEmail}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
      // Don't fail the whole request if cache invalidation fails
    }

    console.log(`Order ${orderId} updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
