// src/app/api/admin/pricing/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';
import { getUserData } from '@/lib/firebase-auth';
import { PricingService } from '@/lib/firebase-products';
import * as XLSX from 'xlsx';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientEmail = formData.get('clientEmail') as string;

    if (!file || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'File and client email are required' },
        { status: 400 }
      );
    }

    // Upload file to Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `price-uploads/${Date.now()}-${file.name}`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Process Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as Array<{
      sku: string;
      price: number;
      productName?: string;
    }>;

    let successCount = 0;
    let failCount = 0;
    const errors: Array<{ row: number; sku: string; error: string }> = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row number

      try {
        if (!row.sku || !row.price) {
          errors.push({
            row: rowNumber,
            sku: row.sku || 'N/A',
            error: 'Missing SKU or price'
          });
          failCount++;
          continue;
        }

        // Find product by SKU (you'll need to implement this)
        // For now, we'll assume you have the product ID
        // In a real implementation, you'd query Firestore to find the product

        await PricingService.setClientPrice({
          clientId: clientEmail, // Using email as clientId for simplicity
          productId: 'temp-product-id', // You'll need to resolve this from SKU
          price: Math.round(row.price * 100), // Convert to cents
          currency: 'USD',
          source: `excel:${fileName}`,
        });

        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          sku: row.sku,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        totalRows: data.length,
        successfulUpdates: successCount,
        failedUpdates: failCount,
        errors: errors.slice(0, 10), // Return first 10 errors
        filePath: fileName,
      }
    });

  } catch (error) {
    console.error('Error processing price upload:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}