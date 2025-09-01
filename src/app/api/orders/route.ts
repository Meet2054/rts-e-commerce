
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { OrderService } from '@/lib/firebase-orders';
import { getUserData } from '@/lib/firebase-auth';

// GET - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const orders = await OrderService.getClientOrders(decodedToken.uid);

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userData = await getUserData(decodedToken.uid);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const orderData = await request.json();
    const orderId = await OrderService.createOrder({
      clientId: decodedToken.uid,
      clientEmail: userData.email,
      cartItems: orderData.cartItems,
      shippingInfo: orderData.shippingInfo,
    });

    // Generate order number for display
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      message: 'Order placed successfully. Our team will contact you shortly.',
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}