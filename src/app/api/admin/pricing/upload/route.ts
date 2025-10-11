// src/app/api/admin/pricing/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import { verifyAuthToken } from '../../../../../lib/auth-utils';

interface PricingRow {
  sku?: string;
  price?: number | string;
  productName?: string;
  'OEM PN'?: string;
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
  sheetsProcessed?: number;
  sheetNames?: string[];
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

    const totalResult: UploadResult = {
      totalRows: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      skippedRows: 0,
      errors: [],
      warnings: []
    };

    console.log(`Processing ${workbook.SheetNames.length} worksheets: ${workbook.SheetNames.join(', ')}`);

    // Process each worksheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📊 Processing worksheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Get raw data to handle different formats
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rawData.length < 2) {
        totalResult.warnings.push({
          row: 0,
          sku: 'N/A',
          warning: `Sheet '${sheetName}' skipped: Must contain at least a header row and one data row`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: Insufficient data`);
        continue;
      }

      // Find header row and detect column positions
      let headerRowIndex = 0;
      let headers: string[] = [];
      
      // Look for the first row with meaningful headers
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i] as unknown[];
        if (row && row.length > 0) {
          const hasSkuColumn = row.some((cell: unknown) => 
            cell && (String(cell).toLowerCase().includes('oem pn') || 
            String(cell).toLowerCase().includes('product') ||
            String(cell).toLowerCase().includes('katun pn') ||
            String(cell).toLowerCase().includes('katun_pn') ||
            String(cell).toLowerCase().includes('katunpn'))
          );
          const hasPriceColumn = row.some((cell: unknown) => 
            cell && (String(cell).toLowerCase().includes('price') || 
            String(cell).toLowerCase().includes('amount') || 
            String(cell).toLowerCase().includes('cost'))
          );
          
          if (hasSkuColumn && hasPriceColumn) {
            headerRowIndex = i;
            headers = row.map((h: unknown) => String(h || '').trim());
            break;
          }
        }
      }
      
      if (headers.length === 0) {
        totalResult.warnings.push({
          row: 0,
          sku: 'N/A',
          warning: `Sheet '${sheetName}' skipped: Could not find header row with SKU and Price columns`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: No valid header row found`);
        continue;
      }

      // Convert data starting from header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: headers,
        range: headerRowIndex 
      });
      
      // Remove the header row itself from data
      const data = jsonData.slice(1) as PricingRow[];

      if (data.length === 0) {
        totalResult.warnings.push({
          row: 0,
          sku: 'N/A',
          warning: `Sheet '${sheetName}' skipped: No valid data rows found`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: No data rows`);
        continue;
      }

      // Parse headers and find column indexes (case-insensitive)
      const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
      const skuColumnIndex = normalizedHeaders.findIndex(h => 
        h.includes('oem pn') || h.includes('product id') || h.includes('product_id') || h.includes('productid') || 
        h.includes('katun pn') || h.includes('katun_pn') || h.includes('katunpn')
      );
      const priceColumnIndex = normalizedHeaders.findIndex(h => 
        h.includes('price') || h.includes('amount') || h.includes('cost')
      );

      console.log(`📋 Sheet '${sheetName}' - Headers found:`, headers);
      console.log(`📊 Sheet '${sheetName}' - OEM PN column at index: ${skuColumnIndex}, Price column at index: ${priceColumnIndex}`);

      if (skuColumnIndex === -1) {
        totalResult.warnings.push({
          row: 0,
          sku: 'N/A',
          warning: `Sheet '${sheetName}' skipped: Could not find OEM PN column`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: No OEM PN column found`);
        continue;
      }

      if (priceColumnIndex === -1) {
        totalResult.warnings.push({
          row: 0,
          sku: 'N/A',
          warning: `Sheet '${sheetName}' skipped: Could not find Price column`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: No Price column found`);
        continue;
      }

      console.log(`📋 Sheet '${sheetName}' - Processing ${data.length} rows`);
      totalResult.totalRows += data.length;

      // Process each data row in this sheet
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
          totalResult.errors.push({
            row: rowNumber,
            sku: 'N/A',
            error: `Sheet '${sheetName}': Missing OEM PN value`
          });
          totalResult.failedUpdates++;
          continue;
        }

        if (!priceStr) {
          totalResult.errors.push({
            row: rowNumber,
            sku: sku,
            error: `Sheet '${sheetName}': Missing price value`
          });
          totalResult.failedUpdates++;
          continue;
        }

        // Parse price (remove currency symbols and commas)
        const price = parseFloat(priceStr.replace(/[^0-9.-]/g, ''));
        if (isNaN(price) || price < 0) {
          totalResult.errors.push({
            row: rowNumber,
            sku: sku,
            error: `Sheet '${sheetName}': Invalid price: "${priceStr}"`
          });
          totalResult.failedUpdates++;
          continue;
        }

        // Find product by SKU using admin database
        const productQuery = await adminDb.collection('products')
          .where('sku', '==', sku)
          .limit(1)
          .get();
        
        if (productQuery.empty) {
          totalResult.errors.push({
            row: rowNumber,
            sku: sku,
            error: `Sheet '${sheetName}': Product not found with this OEM PN`
          });
          totalResult.failedUpdates++;
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
          totalResult.errors.push({
            row: rowNumber,
            sku: sku,
            error: `Sheet '${sheetName}': User not found with email: ${clientEmail}`
          });
          totalResult.failedUpdates++;
          continue;
        }

        const userDoc = userQuery.docs[0];
        const userId = userDoc.id;

        // Check if custom pricing already exists in user's subcollection
        const userPricingRef = adminDb.collection('users').doc(userId).collection('customPricing').doc(productId);
        const existingPriceDoc = await userPricingRef.get();
        
        if (existingPriceDoc.exists) {
          totalResult.warnings.push({
            row: rowNumber,
            sku: sku,
            warning: `Sheet '${sheetName}': Custom price already exists for this product. Updating with new price.`
          });
        }

        // Store custom price in user's subcollection
        const customPriceData = {
          productId: productId,
          sku: sku,
          customPrice: price, // Store as decimal value like regular prices
          source: `excel:${file.name}:${sheetName}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await userPricingRef.set(customPriceData);

        totalResult.successfulUpdates++;
        
        console.log(`✅ Sheet '${sheetName}' - Updated custom pricing for user ${clientEmail}, OEM PN: ${sku}, Price: ${price}`);

      } catch (error) {
        console.error(`Error processing row ${rowNumber} in sheet '${sheetName}':`, error);
        totalResult.errors.push({
          row: rowNumber,
          sku: sku || 'Unknown',
          error: `Sheet '${sheetName}': ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        totalResult.failedUpdates++;
      }
    }

    }

    console.log(`📊 Processed ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
    console.log(`✅ Total pricing upload completed: ${totalResult.successfulUpdates} successful, ${totalResult.failedUpdates} failed, ${totalResult.skippedRows} skipped`);

    return NextResponse.json({
      success: true,
      result: {
        ...totalResult,
        fileName: file.name,
        clientEmail: clientEmail,
        uploadedBy: authResult.userData.uid || 'unknown',
        sheetsProcessed: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames
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