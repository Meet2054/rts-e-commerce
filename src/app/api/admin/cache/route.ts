// src/app/api/admin/cache/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RedisCache } from '@/lib/redis-cache';
import CachedFirebaseService from '@/lib/firebase-cache';

// Get cache statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await CachedFirebaseService.getCacheStats();
        return NextResponse.json({
          success: true,
          stats
        });

      case 'keys':
        // Get sample of cache keys for debugging
        const redis = RedisCache['redis'];
        const keys = await redis.keys('*');
        return NextResponse.json({
          success: true,
          totalKeys: keys.length,
          sampleKeys: keys.slice(0, 20) // Return first 20 keys as sample
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in cache GET endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache information' },
      { status: 500 }
    );
  }
}

// Cache management operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'clear_all':
        await CachedFirebaseService.clearAllCache();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared successfully'
        });

      case 'clear_pattern':
        if (!data?.pattern) {
          return NextResponse.json({
            success: false,
            error: 'Pattern is required'
          }, { status: 400 });
        }
        await RedisCache.deletePattern(data.pattern);
        return NextResponse.json({
          success: true,
          message: `Cache pattern '${data.pattern}' cleared successfully`
        });

      case 'clear_product':
        if (!data?.productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID is required'
          }, { status: 400 });
        }
        await CachedFirebaseService.invalidateProduct(data.productId);
        return NextResponse.json({
          success: true,
          message: `Product cache for '${data.productId}' cleared successfully`
        });

      case 'clear_category':
        if (!data?.categoryId) {
          return NextResponse.json({
            success: false,
            error: 'Category ID is required'
          }, { status: 400 });
        }
        await CachedFirebaseService.invalidateCategory(data.categoryId);
        return NextResponse.json({
          success: true,
          message: `Category cache for '${data.categoryId}' cleared successfully`
        });

      case 'clear_user_orders':
        if (!data?.userEmail) {
          return NextResponse.json({
            success: false,
            error: 'User email is required'
          }, { status: 400 });
        }
        await CachedFirebaseService.invalidateUserOrders(data.userEmail);
        return NextResponse.json({
          success: true,
          message: `User orders cache for '${data.userEmail}' cleared successfully`
        });

      case 'preload_products':
        if (!data?.productIds || !Array.isArray(data.productIds)) {
          return NextResponse.json({
            success: false,
            error: 'Product IDs array is required'
          }, { status: 400 });
        }
        await CachedFirebaseService.preloadProducts(data.productIds);
        return NextResponse.json({
          success: true,
          message: `Preloaded cache for ${data.productIds.length} products`
        });

      case 'warm_up':
        // Warm up cache with frequently accessed data
        await CachedFirebaseService.getCategories();
        await CachedFirebaseService.getProducts({ limitCount: 50, isActive: true });
        return NextResponse.json({
          success: true,
          message: 'Cache warmed up successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in cache POST endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
}

// Set custom cache values (for testing)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl, prefix } = body;

    if (!key || value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Key and value are required'
      }, { status: 400 });
    }

    await RedisCache.set(key, value, { ttl, prefix });

    return NextResponse.json({
      success: true,
      message: `Cache key '${key}' set successfully`
    });

  } catch (error) {
    console.error('Error in cache PUT endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set cache value' },
      { status: 500 }
    );
  }
}

// Delete specific cache keys
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const pattern = searchParams.get('pattern');
    const prefix = searchParams.get('prefix');

    if (pattern) {
      await RedisCache.deletePattern(pattern);
      return NextResponse.json({
        success: true,
        message: `Cache pattern '${pattern}' deleted successfully`
      });
    } else if (key) {
      await RedisCache.delete(key, prefix || undefined);
      return NextResponse.json({
        success: true,
        message: `Cache key '${key}' deleted successfully`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Key or pattern is required'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in cache DELETE endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cache' },
      { status: 500 }
    );
  }
}
