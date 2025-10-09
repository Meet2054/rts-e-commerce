// app/api/admin/products/update-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-utils';
import * as XLSX from 'xlsx';

interface ProductDetailRow {
  'Katun PN:'?: string | number;
  'For use in:'?: string;
  'Description:'?: string;
  'Specifications:'?: string;
  'Comments:'?: string;
  // Also support standard column names
  katunPN?: string | number;
  forUseIn?: string;
  description?: string;
  specifications?: string;
  comments?: string;
}

interface UpdateResult {
  totalRows: number;
  successfulUpdates: number;
  failedUpdates: number;
  notFound: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or employee
    if (authResult.userData.role !== 'admin' && authResult.userData.role !== 'employee') {
      return NextResponse.json(
        { success: false, error: 'Admin or employee access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
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

    // Read and parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const totalResult: UpdateResult = {
      totalRows: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      notFound: 0,
      errors: [],
      warnings: []
    };

    console.log(`Processing ${workbook.SheetNames.length} worksheets for product detail updates: ${workbook.SheetNames.join(', ')}`);

    // Process each worksheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📊 Processing worksheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];

      // Get raw data to handle the specific format
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find the header row (skip empty rows)
      let headerRowIndex = -1;
      let headers: string[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as unknown[];
        if (row && row.length > 0) {
          // Check if this row contains typical header keywords
          const rowString = row.map(cell => String(cell || '').toLowerCase()).join(' ');
          if (rowString.includes('katun') || 
              rowString.includes('description') ||
              rowString.includes('for use') ||
              rowString.includes('specifications') ||
              rowString.includes('comments')) {
            headerRowIndex = i;
            headers = row.map(h => String(h || '').trim());
            break;
          }
        }
      }
      
      if (headerRowIndex === -1) {
        totalResult.warnings.push({
          row: 0,
          warning: `Sheet '${sheetName}' skipped: Could not find header row with Katun PN column`
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
      const data = jsonData.slice(1) as ProductDetailRow[];

      if (data.length === 0) {
        totalResult.warnings.push({
          row: 0,
          warning: `Sheet '${sheetName}' skipped: No valid data rows found`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: No data rows`);
        continue;
      }

      console.log(`📋 Sheet '${sheetName}' - Processing ${data.length} rows for product detail updates`);

      // Update total row count
      totalResult.totalRows += data.length;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = headerRowIndex + i + 2; // Actual Excel row number

        try {
          // Get Katun PN from either column format
          const katunPN = String(row['Katun PN:'] || row.katunPN || '').trim();

          if (!katunPN) {
            totalResult.errors.push({
              row: rowNumber,
              error: 'Katun PN is required to identify the product'
            });
            totalResult.failedUpdates++;
            continue;
          }

          // Find existing product by SKU (Katun PN)
          const productQuery = await adminDb
            .collection('products')
            .where('sku', '==', katunPN)
            .limit(1)
            .get();

          if (productQuery.empty) {
            totalResult.errors.push({
              row: rowNumber,
              error: `Product with Katun PN '${katunPN}' not found`
            });
            totalResult.notFound++;
            continue;
          }

          const productDoc = productQuery.docs[0];
          const updateData: Record<string, unknown> = {
            updatedAt: new Date()
          };

          // Check and add fields that need to be updated
          let hasUpdates = false;

          // For use in
          const forUseIn = String(row['For use in:'] || row.forUseIn || '').trim();
          if (forUseIn) {
            updateData.forUseIn = forUseIn;
            hasUpdates = true;
          }

          // Description
          const description = String(row['Description:'] || row.description || '').trim();
          if (description) {
            updateData.description = description;
            hasUpdates = true;
          }

          // Comments
          const comments = String(row['Comments:'] || row.comments || '').trim();
          if (comments) {
            updateData.comments = comments;
            hasUpdates = true;
          }

          // Specifications (try to parse as JSON if it looks like JSON, otherwise store as string)
          const specifications = String(row['Specifications:'] || row.specifications || '').trim();
          if (specifications) {
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(specifications);
              updateData.specifications = parsed;
            } catch {
              // Store as string if not valid JSON
              updateData.specifications = specifications;
            }
            hasUpdates = true;
          }

          if (!hasUpdates) {
            totalResult.warnings.push({
              row: rowNumber,
              warning: `No update fields provided for Katun PN '${katunPN}'`
            });
            continue;
          }

          // Update the product
          await productDoc.ref.update(updateData);
          totalResult.successfulUpdates++;

          console.log(`✅ Updated product ${katunPN} with ${Object.keys(updateData).length - 1} fields`);

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error);
          totalResult.errors.push({
            row: rowNumber,
            error: `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
          totalResult.failedUpdates++;
        }
      }
    }

    console.log(`\n✅ Product detail update complete across all worksheets:`);
    console.log(`📊 Processed ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
    console.log(`📊 Total: ${totalResult.totalRows} rows, ${totalResult.successfulUpdates} updated, ${totalResult.failedUpdates} failed, ${totalResult.notFound} not found`);

    return NextResponse.json({
      success: true,
      result: {
        ...totalResult,
        fileName: file.name,
        sheetsProcessed: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames
      }
    });

  } catch (error) {
    console.error('Product detail update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}