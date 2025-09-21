import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Order, OrderItem, User } from '@/lib/firebase-types';
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

export async function GET() {
  try {
    console.log('Fetching orders from Firebase...');
    
    // Fetch all orders from Firebase
    const ordersSnapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    
    if (ordersSnapshot.empty) {
      console.log('No orders found in Firebase');
      return NextResponse.json({ 
        success: true, 
        orders: [],
        message: 'No orders found' 
      });
    }

    const orders: OrderWithUser[] = [];
    
    // Process each order and fetch associated user details
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      
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

      // Construct the order object with proper types
      const order: OrderWithUser = {
        id: orderDoc.id,
        orderId: orderData.orderId || orderDoc.id,
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

    console.log(`Successfully fetched ${orders.length} orders with user details`);

    return NextResponse.json({
      success: true,
      orders: orders,
      count: orders.length,
      message: `Found ${orders.length} orders`
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
