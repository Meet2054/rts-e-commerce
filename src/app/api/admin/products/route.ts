import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

// Verify admin or employee authorization
async function verifyAuthorization(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing or invalid authorization header' };
  }

  try {
    // Here you could verify the token and check user role
    // For now, we'll assume the token is valid if it exists
    return { authorized: true };
  } catch (error) {
    return { authorized: false, error: 'Invalid token' };
  }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    
    // Verify authorization
    const { authorized, error } = await verifyAuthorization(authorization);
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description = '',
      category = '',
      price,
      stock = 0,
      sku,
      brand = '',
      oem = '',
      oemPN = '',
      katunPN = '',
      image,
      isActive = true
    } = body;

    // Validate required fields
    if (!name || !sku || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, and price are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingProduct = await adminDb.collection('products').where('sku', '==', sku).get();
    if (!existingProduct.empty) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      );
    }

    // Create product document data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      brand: brand.trim(),
      price: parseFloat(price),
      sku: sku.trim().toUpperCase(),
      oem: oem.trim(),
      oemPN: oemPN.trim(),
      katunPN: katunPN.trim(),
      image: image || '',
      isActive: Boolean(isActive),
      stock: parseInt(stock) || 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Add product to Firestore
    const docRef = await adminDb.collection('products').add(productData);
    
    console.log(`✅ [API] Product created successfully: ${sku} (ID: ${docRef.id})`);
    
    return NextResponse.json({
      success: true,
      message: 'Product added successfully',
      productId: docRef.id,
      sku: productData.sku
    });
    
  } catch (error) {
    console.error('❌ [API] Create product error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    
    // Verify authorization
    const { authorized, error } = await verifyAuthorization(authorization);
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';

    let query = adminDb.collection('products').orderBy('createdAt', 'desc');

    // Apply search filter if provided
    if (search) {
      // Search by name or SKU (basic text search)
      const searchLower = search.toLowerCase();
      query = query.where('sku', '>=', searchLower.toUpperCase())
                   .where('sku', '<=', searchLower.toUpperCase() + '\uf8ff');
    }

    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedSnapshot = await query.offset(offset).limit(limit).get();

    const products = paginatedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, total)
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Get products error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}