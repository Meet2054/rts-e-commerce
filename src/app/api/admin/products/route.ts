// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, categories, brands } from '@/db/schema';
import { eq, and, or, ilike, count, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-clients'; // Adjust import based on your auth setup

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');

    let query = db.select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      basePrice: products.basePrice,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      categoryName: categories.name,
      brandName: brands.name,
      images: products.images
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id));

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )
      );
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (brandId) {
      conditions.push(eq(products.brandId, brandId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const offset = (page - 1) * limit;
    const result = await query.limit(limit).offset(offset);

    // Get total count
    const totalQuery = db.select({ count: count() }).from(products);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const totalResult = await totalQuery;
    const total = totalResult[0].count;

    return NextResponse.json({
      products: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/admin/products
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      categoryId,
      brandId,
      basePrice,
      images = [],
      specifications = {},
      stockQuantity = 0,
      minOrderQuantity = 1,
      tags = []
    } = body;

    // Validate required fields
    if (!name || !sku || !categoryId || !brandId || !basePrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if SKU already exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }

    const productId = crypto.randomUUID();
    await db.insert(products).values({
      id: productId,
      name,
      description,
      sku,
      categoryId,
      brandId,
      basePrice: basePrice.toString(),
      images,
      specifications,
      stockQuantity,
      minOrderQuantity,
      tags,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, productId }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
