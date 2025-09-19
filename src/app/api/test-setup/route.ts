import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sampleProducts, sampleCategories } from '@/lib/test-data';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const batch = adminDb.batch();
    
    // Add categories
    sampleCategories.forEach((category) => {
      const categoryRef = adminDb.collection('categories').doc(category.id);
      batch.set(categoryRef, {
        ...category,
        createdAt: FieldValue.serverTimestamp()
      });
    });

    // Add products
    sampleProducts.forEach((product) => {
      const productRef = adminDb.collection('products').doc(product.id);
      batch.set(productRef, {
        ...product,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      note: 'This endpoint creates sample/test data for development and testing purposes',
      productsCreated: sampleProducts.length,
      categoriesCreated: sampleCategories.length
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Delete all test data
    const batch = adminDb.batch();

    // Delete products
    for (const product of sampleProducts) {
      const productRef = adminDb.collection('products').doc(product.id);
      batch.delete(productRef);
    }

    // Delete categories
    for (const category of sampleCategories) {
      const categoryRef = adminDb.collection('categories').doc(category.id);
      batch.delete(categoryRef);
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Test data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting test data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete test data' },
      { status: 500 }
    );
  }
}