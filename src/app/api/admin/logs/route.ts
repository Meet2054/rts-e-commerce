// app/api/admin/logs/route.ts - API endpoint for fetching admin logs
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { LogLevel, LogCategory } from '@/lib/admin-logger';

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const level = url.searchParams.get('level') as LogLevel;
    const category = url.searchParams.get('category') as LogCategory;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    const search = url.searchParams.get('search');

    // Simplified query to avoid composite index requirements
    // Get all logs ordered by timestamp and filter in memory
    const snapshot = await adminDb.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(Math.max(500, limit * 3)) // Get more to allow for filtering
      .get();
    let logs = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Safe timestamp conversion
      let timestamp: Date;
      if (data.timestamp) {
        if (typeof data.timestamp === 'object' && typeof data.timestamp.toDate === 'function') {
          // Firestore Timestamp
          timestamp = data.timestamp.toDate();
        } else if (data.timestamp instanceof Date) {
          // Already a Date object
          timestamp = data.timestamp;
        } else if (typeof data.timestamp === 'string') {
          // String timestamp
          timestamp = new Date(data.timestamp);
        } else if (typeof data.timestamp === 'number') {
          // Unix timestamp
          timestamp = new Date(data.timestamp);
        } else {
          // Fallback
          timestamp = new Date();
        }
      } else {
        timestamp = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        timestamp: timestamp.toISOString() // Convert to ISO string for consistent JSON serialization
      };
    }) as any[];

    // Apply level filtering
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    // Apply category filtering
    if (category) {
      logs = logs.filter(log => log.category === category);
    }

    // Apply userId filtering
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    // Apply date filtering
    if (startDate || endDate) {
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate + 'T23:59:59.999Z')) return false;
        return true;
      });
    }

    // Apply search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.userEmail?.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    // Get stats for dashboard
    const stats = {
      totalLogs: logs.length,
      logsByLevel: {
        error: logs.filter(l => l.level === LogLevel.ERROR).length,
        warn: logs.filter(l => l.level === LogLevel.WARN).length,
        info: logs.filter(l => l.level === LogLevel.INFO).length,
        success: logs.filter(l => l.level === LogLevel.SUCCESS).length,
        debug: logs.filter(l => l.level === LogLevel.DEBUG).length,
      },
      logsByCategory: Object.values(LogCategory).reduce((acc, cat) => {
        acc[cat] = logs.filter(l => l.category === cat).length;
        return acc;
      }, {} as Record<string, number>),
      recentErrors: logs.filter(l => l.level === LogLevel.ERROR).slice(0, 10),
      topUsers: (() => {
        const userCounts: Record<string, number> = {};
        logs.forEach(log => {
          if (log.userEmail) {
            userCounts[log.userEmail] = (userCounts[log.userEmail] || 0) + 1;
          }
        });
        return Object.entries(userCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([email, count]) => ({ email, count }));
      })()
    };

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(logs.length / limit),
        totalCount: logs.length,
        limit
      },
      stats,
      filters: {
        levels: Object.values(LogLevel),
        categories: Object.values(LogCategory)
      }
    });

  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for clearing old logs
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const olderThanDays = parseInt(url.searchParams.get('olderThanDays') || '30');
    const category = url.searchParams.get('category') as LogCategory;
    const level = url.searchParams.get('level') as LogLevel;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let query = adminDb.collection('admin_logs')
      .where('timestamp', '<', cutoffDate);

    if (category) {
      query = query.where('category', '==', category);
    }
    if (level) {
      query = query.where('level', '==', level);
    }

    const snapshot = await query.get();
    const batch = adminDb.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount: snapshot.docs.length,
      message: `Deleted ${snapshot.docs.length} log entries older than ${olderThanDays} days`
    });

  } catch (error) {
    console.error('Error deleting logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}