// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductService, PricingService } from '@/lib/firebase-products';
import { getUserData } from '@/lib/firebase-auth';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const searchTerm = searchParams.get('search');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get products
    const result = await ProductService.getProducts({
      categoryId: categoryId || undefined,
      searchTerm: searchTerm || undefined,
      pageSize,
    });

    // Get current user for pricing
    const authHeader = request.headers.get('authorization');
    let clientId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(token);
        clientId = decodedToken.uid;
      } catch (error) {
        // User not authenticated, continue without custom pricing
      }
    }

    // Add custom pricing if user is authenticated
    const productsWithPricing = await Promise.all(
      result.products.map(async (product) => {
        let effectivePrice = product.basePrice;
        
        if (clientId) {
          try {
            effectivePrice = await PricingService.getEffectivePrice(clientId, product.id!);
          } catch (error) {
            // Use base price if custom pricing fails
          }
        }

        return {
          ...product,
          effectivePrice,
          hasCustomPricing: effectivePrice !== product.basePrice,
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithPricing,
      hasMore: result.hasMore,
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
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

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const productData = await request.json();
    const productId = await ProductService.createProduct(productData);

    return NextResponse.json({
      success: true,
      productId,
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}