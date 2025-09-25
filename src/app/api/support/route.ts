import { NextRequest, NextResponse } from 'next/server';

interface SupportQuery {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'processing' | 'solved';
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

// In-memory storage for demo purposes
// In a real application, this would be stored in a database
const supportQueries: SupportQuery[] = [];

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
    const newQuery: SupportQuery = {
      id: generateQueryId(),
      userId: userId || `USER-${Date.now()}`,
      fullName,
      email,
      phone,
      message,
      status: 'pending',
      createdAt: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    // Add to storage
    supportQueries.unshift(newQuery); // Add to beginning of array

    console.log('Support query created:', newQuery);

    return NextResponse.json({
      success: true,
      message: 'Support query submitted successfully',
      queryId: newQuery.id
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
    
    let filteredQueries = supportQueries;
    
    // Filter by status if provided
    if (status && status !== 'all') {
      filteredQueries = supportQueries.filter(query => query.status === status);
    }

    return NextResponse.json({
      success: true,
      queries: filteredQueries,
      total: filteredQueries.length
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

    // Find and update the query
    const queryIndex = supportQueries.findIndex(q => q.id === queryId);
    
    if (queryIndex === -1) {
      return NextResponse.json(
        { error: 'Support query not found' },
        { status: 404 }
      );
    }

    // Update the query
    supportQueries[queryIndex] = {
      ...supportQueries[queryIndex],
      status,
      updatedAt: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      updatedBy: updatedBy || 'Admin'
    };

    console.log('Support query updated:', supportQueries[queryIndex]);

    return NextResponse.json({
      success: true,
      message: 'Support query updated successfully',
      query: supportQueries[queryIndex]
    });

  } catch (error) {
    console.error('Error updating support query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}