import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Order, OrderItem } from '@/lib/firebase-types';
import { RedisCache } from '@/lib/redis-cache';
import { adminLogger, LogCategory, withPerformanceLogging } from '@/lib/admin-logger';

// Generate unique order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    adminLogger.info(LogCategory.ORDERS, 'Processing new order request', {
      endpoint: '/api/orders',
      method: 'POST'
    });
    
    const body = await request.json();
    const {
      items,
      subtotal,
      tax,
      shipping,
      total,
      currency = 'USD',
      shippingAddress,
      notes,
      userId,
      userEmail
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.fullName) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order total' },
        { status: 400 }
      );
    }

    // Convert cart items to order items
    const orderItems: OrderItem[] = items.map((item: any) => ({
      productId: item.id || item.sku || `product-${item.sku}`,
      sku: item.sku,
      nameSnap: item.name,
      brandSnap: item.brand || '',
      imageSnap: item.image || '',
      qty: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
      katunPN: item.katunPN || ''
    }));

    // Create order document
    const orderId = generateOrderId();
    const now = new Date();
    
    const orderData: Omit<Order, 'id'> = {
      orderId,
      clientId: userId || 'anonymous',
      clientEmail: userEmail || 'customer@example.com',
      status: 'unprocessed',
      items: orderItems,
      totals: {
        itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        subtotal: subtotal || 0,
        tax: tax || 0,
        shipping: shipping || 0,
        total: total
      },
      currency,
      shippingInfo: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone || '',
        address: {
          street: shippingAddress.addressLine1 + (shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''),
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          zipCode: shippingAddress.postalCode || '',
          country: shippingAddress.country || 'USA'
        }
      },
      ...(notes ? { notes } : {}),
      paymentInfo: {
        method: 'cash_on_delivery',
        status: 'pending'
      },
      createdAt: now as any,
      updatedAt: now as any
    };

    adminLogger.info(LogCategory.ORDERS, "Creating new order", { orderId, itemCount: orderItems.length });

    // Save to Firestore
    const orderRef = await adminDb.collection('orders').add(orderData);
    const orderWithId = { 
      id: orderRef.id, 
      ...orderData 
    };

    adminLogger.info(LogCategory.ORDERS, 'Order created successfully', { orderId, firestoreId: orderRef.id });

    // Cache the order
    await RedisCache.set(`order:${orderRef.id}`, orderWithId, { ttl: 3600 });
    
    // Cache user's orders (invalidate cache)
    if (userId) {
      await RedisCache.delete(`orders:user:${userId}`);
    }

    // Send confirmation (in real app, send email/SMS here)
    adminLogger.info(LogCategory.ORDERS, 'Order confirmation ready', { orderId });

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderDocumentId: orderRef.id,
      message: 'Order placed successfully! We will contact you soon to confirm details.',
      order: {
        id: orderRef.id,
        orderId: orderId,
        status: 'unprocessed',
        total: total,
        currency: currency,
        itemCount: orderData.totals.itemCount
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    adminLogger.error(LogCategory.ORDERS, 'Order creation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get user's orders or all orders (admin)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let orderId: string | null = null;
  let status: string | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get('userId');
    orderId = searchParams.get('orderId');
    status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    adminLogger.info(LogCategory.ORDERS, 'Orders request received', {
      userId,
      orderId,
      status,
      limit,
      endpoint: '/api/orders',
      method: 'GET'
    });

    // Get specific order
    if (orderId) {
      const cacheKey = `order:${orderId}`;
      let order = await RedisCache.get<Order>(cacheKey);

      if (!order) {
        adminLogger.debug(LogCategory.ORDERS, 'Order not in cache, fetching from Firebase', { orderId });
        const orderDoc = await adminDb.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          );
        }

        order = { id: orderDoc.id, ...orderDoc.data() } as Order;
        await RedisCache.set(cacheKey, order, { ttl: 3600 });
      }

      return NextResponse.json({
        success: true,
        order: order
      });
    }

    // Get user's orders
    if (userId) {
      const cacheKey = `orders:user:${userId}`;
      let orders = await RedisCache.get<Order[]>(cacheKey);

      if (!orders) {
        adminLogger.debug(LogCategory.ORDERS, 'User orders not in cache, fetching from Firebase', { userId });
        
        // For now, get all orders and filter by clientId to avoid index requirements
        // In production, you should create the proper Firestore indexes
        const snapshot = await adminDb.collection('orders').get();
        const allOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        // Filter by user and sort by creation date
        orders = allOrders
          .filter(order => 
            order.clientId === userId || 
            order.clientEmail === userId
          )
          .sort((a, b) => {
            // Handle different timestamp formats from Firestore
            const aTime = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt 
              ? a.createdAt.seconds * 1000 
              : new Date(a.createdAt).getTime();
            const bTime = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt 
              ? b.createdAt.seconds * 1000 
              : new Date(b.createdAt).getTime();
            return bTime - aTime; // Newest first
          })
          .slice(0, limit);

        await RedisCache.set(cacheKey, orders, { ttl: 600 });
        adminLogger.debug(LogCategory.ORDERS, 'Cached user orders', { userId, orderCount: orders.length });
      }

      return NextResponse.json({
        success: true,
        orders: orders,
        count: orders.length
      });
    }

    // Get all orders (admin only - add auth check in real app)
    const cacheKey = `orders:all:${status || 'all'}:${limit}`;
    let orders = await RedisCache.get<Order[]>(cacheKey);

    if (!orders) {
      adminLogger.debug(LogCategory.ORDERS, 'All orders not in cache, fetching from Firebase');
      let query = adminDb.collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      await RedisCache.set(cacheKey, orders, { ttl: 300 });
    }

    const duration = Date.now() - startTime;
    adminLogger.info(LogCategory.ORDERS, 'Orders retrieved successfully', {
      orderCount: orders.length,
      duration: `${duration}ms`,
      userId,
      orderId,
      status
    });

    return NextResponse.json({
      success: true,
      orders: orders,
      count: orders.length
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    adminLogger.error(LogCategory.ORDERS, 'Orders fetch error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      userId,
      orderId,
      status,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders - Update order status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, trackingNumber, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['unprocessed', 'partially_processed', 'unprocessed_partially', 'archived', 'cancelled', 'merged', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    adminLogger.info(LogCategory.ORDERS, 'Updating order status', { orderId, status });

    // Update in Firestore
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (trackingNumber && status === 'delivered') {
      updateData.trackingInfo = {
        trackingNumber,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
    }

    if (notes) {
      updateData.adminNotes = notes;
    }

    await adminDb.collection('orders').doc(orderId).update(updateData);

    // Invalidate cache
    await RedisCache.delete(`order:${orderId}`);
    
    // Get updated order
    const updatedDoc = await adminDb.collection('orders').doc(orderId).get();
    const updatedOrder = { id: updatedDoc.id, ...updatedDoc.data() } as Order;
    
    // Update cache
    await RedisCache.set(`order:${orderId}`, updatedOrder, { ttl: 3600 });
    
    // Clear user's orders cache
    if (updatedOrder.clientId) {
      await RedisCache.delete(`orders:user:${updatedOrder.clientId}`);
    }

    adminLogger.info(LogCategory.ORDERS, 'Order updated successfully', { orderId });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('❌ [API] Order update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}