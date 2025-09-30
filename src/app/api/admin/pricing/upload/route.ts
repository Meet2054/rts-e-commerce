// src/app/api/admin/pricing/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import { verifyAuthToken } from '../../../../../lib/auth-utils';

interface PricingRow {
  sku?: string;
  price?: number | string;
  productName?: string;
  'SKU'?: string;
  'Price'?: number | string;
  'Product ID'?: string;
  'Product_ID'?: string;
  'Amount'?: number | string;
  'Cost'?: number | string;
  'katun pn'?: string;
  'Katun PN'?: string;
  'KATUN PN'?: string;
  'Katun_PN'?: string;
  'katun_pn'?: string;
}

interface UploadResult {
  totalRows: number;
  successfulUpdates: number;
  failedUpdates: number;
  skippedRows: number;
  errors: Array<{ row: number; sku: string; error: string }>;
  warnings: Array<{ row: number; sku: string; warning: string }>;
}

export async function POST(request: NextRequest) {
  console.log('📊 [API] Pricing upload request received');
  
  try {
    // Verify admin authentication using the same method as products upload
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (authResult.userData.role !== 'admin') {
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

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { success: false, error: 'Only Excel files (.xlsx, .xls) are allowed' },
        { status: 400 }
      );
    }

    console.log(`📊 Processing pricing upload for client: ${clientEmail}, file: ${file.name}`);

    // Read and parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get raw data to handle different formats
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Excel file must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Find header row and detect column positions
    let headerRowIndex = 0;
    let headers: string[] = [];
    
    // Look for the first row with meaningful headers
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] as any[];
      if (row && row.length > 0) {
        const hasSkuColumn = row.some((cell: any) => 
          cell && (String(cell).toLowerCase().includes('sku') || 
          String(cell).toLowerCase().includes('product') ||
          String(cell).toLowerCase().includes('katun pn') ||
          String(cell).toLowerCase().includes('katun_pn') ||
          String(cell).toLowerCase().includes('katunpn'))
        );
        const hasPriceColumn = row.some((cell: any) => 
          cell && (String(cell).toLowerCase().includes('price') || 
          String(cell).toLowerCase().includes('amount') || 
          String(cell).toLowerCase().includes('cost'))
        );
        
        if (hasSkuColumn && hasPriceColumn) {
          headerRowIndex = i;
          headers = row.map((h: any) => String(h || '').trim());
          break;
        }
      }
    }
    
    if (headers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not find header row with SKU and Price columns' },
        { status: 400 }
      );
    }

    // Convert data starting from header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: headers,
      range: headerRowIndex 
    });
    
    // Remove the header row itself from data
    const data = jsonData.slice(1) as PricingRow[];

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Excel file has no valid data rows' },
        { status: 400 }
      );
    }

    // Parse headers and find column indexes (case-insensitive)
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const skuColumnIndex = normalizedHeaders.findIndex(h => 
      h.includes('sku') || h.includes('product id') || h.includes('product_id') || h.includes('productid') || 
      h.includes('katun pn') || h.includes('katun_pn') || h.includes('katunpn')
    );
    const priceColumnIndex = normalizedHeaders.findIndex(h => 
      h.includes('price') || h.includes('amount') || h.includes('cost')
    );

    console.log('📋 Headers found:', headers);
    console.log(`📊 SKU column at index: ${skuColumnIndex}, Price column at index: ${priceColumnIndex}`);

    if (skuColumnIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find SKU column. Please ensure your Excel has a column with "SKU", "Product ID", "katun pn", or similar.'
      }, { status: 400 });
    }

    if (priceColumnIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find Price column. Please ensure your Excel has a column with "Price", "Amount", or "Cost".'
      }, { status: 400 });
    }

    const result: UploadResult = {
      totalRows: data.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      skippedRows: 0,
      errors: [],
      warnings: []
    };

    // Process each data row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = headerRowIndex + i + 2; // Actual Excel row number
      let sku = 'Unknown';

      try {
        // Get SKU and price from the detected columns using the original headers
        const skuHeader = headers[skuColumnIndex];
        const priceHeader = headers[priceColumnIndex];
        
        sku = row[skuHeader as keyof PricingRow]?.toString()?.trim() || '';
        const priceStr = row[priceHeader as keyof PricingRow]?.toString()?.trim() || '';

        if (!sku) {
          result.errors.push({
            row: rowNumber,
            sku: 'N/A',
            error: 'Missing SKU value'
          });
          result.failedUpdates++;
          continue;
        }

        if (!priceStr) {
          result.errors.push({
            row: rowNumber,
            sku: sku,
            error: 'Missing price value'
          });
          result.failedUpdates++;
          continue;
        }

        // Parse price (remove currency symbols and commas)
        const price = parseFloat(priceStr.replace(/[^0-9.-]/g, ''));
        if (isNaN(price) || price < 0) {
          result.errors.push({
            row: rowNumber,
            sku: sku,
            error: `Invalid price: "${priceStr}"`
          });
          result.failedUpdates++;
          continue;
        }

        // Find product by SKU using admin database
        const productQuery = await adminDb.collection('products')
          .where('sku', '==', sku)
          .limit(1)
          .get();
        
        if (productQuery.empty) {
          result.errors.push({
            row: rowNumber,
            sku: sku,
            error: 'Product not found with this SKU'
          });
          result.failedUpdates++;
          continue;
        }

        const productDoc = productQuery.docs[0];
        const productId = productDoc.id;

        // Find the user document by email to get their UID
        const userQuery = await adminDb.collection('users')
          .where('email', '==', clientEmail)
          .limit(1)
          .get();
        
        if (userQuery.empty) {
          result.errors.push({
            row: rowNumber,
            sku: sku,
            error: `User not found with email: ${clientEmail}`
          });
          result.failedUpdates++;
          continue;
        }

        const userDoc = userQuery.docs[0];
        const userId = userDoc.id;

        // Check if custom pricing already exists in user's subcollection
        const userPricingRef = adminDb.collection('users').doc(userId).collection('customPricing').doc(productId);
        const existingPriceDoc = await userPricingRef.get();
        
        if (existingPriceDoc.exists) {
          result.warnings.push({
            row: rowNumber,
            sku: sku,
            warning: 'Custom price already exists for this product. Updating with new price.'
          });
        }

        // Store custom price in user's subcollection
        const customPriceData = {
          productId: productId,
          sku: sku,
          customPrice: price, // Store as decimal value like regular prices
          source: `excel:${file.name}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await userPricingRef.set(customPriceData);

        result.successfulUpdates++;
        
        console.log(`✅ Updated custom pricing for user ${clientEmail}, SKU: ${sku}, Price: ${price}`);

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          sku: sku || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failedUpdates++;
      }
    }

    console.log(`✅ Pricing upload completed: ${result.successfulUpdates} successful, ${result.failedUpdates} failed`);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        fileName: file.name,
        clientEmail: clientEmail,
        uploadedBy: authResult.userData.uid || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ [API] Error processing pricing upload:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : '',
      type: typeof error
    });
    
    return NextResponse.json({
      success: false,
      error: `Failed to process pricing upload: ${errorMessage}`,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}