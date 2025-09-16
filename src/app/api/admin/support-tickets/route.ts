import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supportTickets, user } from '@/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const offset = (page - 1) * limit;

    const conditions = [];
    if (status) {
      conditions.push(eq(supportTickets.status, status));
    }
    if (priority) {
      conditions.push(eq(supportTickets.priority, priority));
    }

    // Build base query
    const baseQuery = db.select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      customerEmail: supportTickets.customerEmail,
      customerName: supportTickets.customerName,
      subject: supportTickets.subject,
      status: supportTickets.status,
      priority: supportTickets.priority,
      source: supportTickets.source,
      assignedTo: supportTickets.assignedTo,
      assignedUserName: user.name,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt
    })
    .from(supportTickets)
    .leftJoin(user, eq(supportTickets.assignedTo, user.id));

    // Apply conditions and execute query
    const result = await (conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery
    )
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await (conditions.length > 0 
      ? db.select({ count: count() }).from(supportTickets).where(and(...conditions))
      : db.select({ count: count() }).from(supportTickets)
    );
    const total = totalResult[0].count;

    return NextResponse.json({
      tickets: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}
