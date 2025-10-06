import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';



// Collection reference
const SUPPORT_COLLECTION = 'supportQueries';

// Generate a unique ID for new queries
function generateQueryId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SUP-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, message, userId } = body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, message' },
        { status: 400 }
      );
    }

    // Create new support query
    const queryId = generateQueryId();
    const now = Timestamp.now();
    
    const newQuery = {
      id: queryId,
      userId: userId || `USER-${Date.now()}`,
      fullName,
      email,
      phone,
      message,
      status: 'pending' as const,
      createdAt: now,
      createdAtFormatted: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    // Save to Firestore
    await adminDb.collection(SUPPORT_COLLECTION).doc(queryId).set(newQuery);

    console.log('Support query created:', queryId);

    return NextResponse.json({
      success: true,
      message: 'Support query submitted successfully',
      queryId: queryId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating support query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Get queries from Firestore
    let query = adminDb.collection(SUPPORT_COLLECTION).orderBy('createdAt', 'desc');
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const queries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        // Convert Firestore timestamp to formatted string for frontend
        createdAt: data.createdAtFormatted || data.createdAt.toDate().toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        updatedAt: data.updatedAt ? (data.updatedAtFormatted || data.updatedAt.toDate().toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })) : undefined
      };
    });

    return NextResponse.json({
      success: true,
      queries: queries,
      total: queries.length
    });

  } catch (error) {
    console.error('Error fetching support queries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId, status, updatedBy } = body;

    if (!queryId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: queryId, status' },
        { status: 400 }
      );
    }

    // Check if query exists
    const queryDoc = await adminDb.collection(SUPPORT_COLLECTION).doc(queryId).get();
    
    if (!queryDoc.exists) {
      return NextResponse.json(
        { error: 'Support query not found' },
        { status: 404 }
      );
    }

    const now = Timestamp.now();
    const updatedAtFormatted = new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Update the query
    const updateData = {
      status,
      updatedAt: now,
      updatedAtFormatted,
      updatedBy: updatedBy || 'Admin'
    };

    await adminDb.collection(SUPPORT_COLLECTION).doc(queryId).update(updateData);

    // Get updated query for response
    const updatedDoc = await adminDb.collection(SUPPORT_COLLECTION).doc(queryId).get();
    const updatedQuery = {
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAtFormatted || updatedDoc.data()?.createdAt.toDate().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      updatedAt: updatedAtFormatted
    };

    console.log('Support query updated:', queryId);

    return NextResponse.json({
      success: true,
      message: 'Support query updated successfully',
      query: updatedQuery
    });

  } catch (error) {
    console.error('Error updating support query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId } = body;

    if (!queryId) {
      return NextResponse.json(
        { error: 'Missing required field: queryId' },
        { status: 400 }
      );
    }

    // Check if query exists
    const queryDoc = await adminDb.collection(SUPPORT_COLLECTION).doc(queryId).get();
    
    if (!queryDoc.exists) {
      return NextResponse.json(
        { error: 'Support query not found' },
        { status: 404 }
      );
    }

    // Delete the query
    await adminDb.collection(SUPPORT_COLLECTION).doc(queryId).delete();

    console.log('Support query deleted:', queryId);

    return NextResponse.json({
      success: true,
      message: 'Support query deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting support query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}