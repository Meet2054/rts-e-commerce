// app/api/admin/products/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import { verifyAuthToken } from '../../../../../lib/auth-utils';

interface KatunProductRow {
  'OEM:': string;
  'OEM PN:': string;
  'Katun PN:': number | string;
  'Name:': string;
  'Price': number | string;
  'Comments:': string;
  'Description:': string;
  'Brand:': string;
  'Category:': string;
  'For use in:': string;
}

interface StandardProductRow {
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  specifications?: string;
  id?: number | string;
  image?: string;
  rating?: number | string;
  reviews?: number | string;
  oem?: string;
  oemPN?: string;
  katunPN?: string;
  comments?: string;
  forUseIn?: string;
}

interface UploadResult {
  totalRows: number;
  successfulAdds: number;
  successfulUpdates: number;
  failedAdds: number;
  duplicatesSkipped: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

function isKatunFormat(data: unknown[]): boolean {
  if (data.length === 0) return false;
  const firstRow = data[0] as Record<string, unknown>;
  return firstRow && 
         typeof firstRow === 'object' &&
         'OEM:' in firstRow && 
         'OEM PN:' in firstRow && 
         'Name:' in firstRow;
}

function convertKatunToStandard(katunRow: KatunProductRow): StandardProductRow {
  return {
    sku: String(katunRow['OEM PN:']).trim(),
    name: String(katunRow['Name:']).trim(),
    description: katunRow['Description:'] ? String(katunRow['Description:']).trim() : undefined,
    category: katunRow['Category:'] ? String(katunRow['Category:']).trim().toLowerCase() : 'general',
    brand: katunRow['Brand:'] ? String(katunRow['Brand:']).trim() : undefined,
    price: katunRow['Price'] ? parseFloat(String(katunRow['Price'])) : undefined,
    oem: katunRow['OEM:'] ? String(katunRow['OEM:']).trim() : undefined,
    oemPN: katunRow['OEM PN:'] ? String(katunRow['OEM PN:']).trim() : undefined,
    katunPN: String(katunRow['Katun PN:']).trim(),
    comments: katunRow['Comments:'] ? String(katunRow['Comments:']).trim() : undefined,
    forUseIn: katunRow['For use in:'] ? String(katunRow['For use in:']).trim() : undefined
  };
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

    const totalResult: UploadResult = {
      totalRows: 0,
      successfulAdds: 0,
      successfulUpdates: 0,
      failedAdds: 0,
      duplicatesSkipped: 0,
      errors: [],
      warnings: []
    };

    console.log(`Processing ${workbook.SheetNames.length} worksheets: ${workbook.SheetNames.join(', ')}`);

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
          if (rowString.includes('oem') || 
              rowString.includes('katun') || 
              rowString.includes('description') ||
              rowString.includes('name') ||
              rowString.includes('category')) {
            headerRowIndex = i;
            headers = row.map(h => String(h || '').trim());
            break;
          }
        }
      }
      
      if (headerRowIndex === -1) {
        totalResult.warnings.push({
          row: 0,
          warning: `Sheet '${sheetName}' skipped: Could not find header row with OEM column`
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
      const data = jsonData.slice(1);

      if (data.length === 0) {
        totalResult.warnings.push({
          row: 0,
          warning: `Sheet '${sheetName}' skipped: No valid data rows found`
        });
        console.log(`⚠️ Sheet '${sheetName}' skipped: No data rows`);
        continue;
      }

      // Detect format and process each row in this sheet
      const isKatun = isKatunFormat(data);
      console.log(`📋 Sheet '${sheetName}' - Detected format: ${isKatun ? 'Katun' : 'Standard'} (${data.length} rows)`);

      // Update total row count
      totalResult.totalRows += data.length;

      for (let i = 0; i < data.length; i++) {
      const originalRow = data[i];
      const rowNumber = headerRowIndex + i + 2; // Actual Excel row number

      try {
        // Convert Katun format to standard format if needed
        const row: StandardProductRow = isKatun 
          ? convertKatunToStandard(originalRow as KatunProductRow)
          : originalRow as StandardProductRow;

        // Validate required fields
        if (!row.sku || !row.name || !row.category) {
          totalResult.errors.push({
            row: rowNumber,
            error: 'Missing required fields: OEM PN, name, and category are required'
          });
          totalResult.failedAdds++;
          continue;
        }

        // Clean and validate data
        const cleanedSku = String(row.sku).trim();
        const cleanedName = String(row.name).trim();
        const cleanedCategory = String(row.category).trim().toLowerCase();

        if (!cleanedSku || !cleanedName || !cleanedCategory) {
          totalResult.errors.push({
            row: rowNumber,
            error: 'SKU, name, and category cannot be empty'
          });
          totalResult.failedAdds++;
          continue;
        }

        // Check if product already exists
        const existingProductSnapshot = await adminDb
          .collection('products')
          .where('sku', '==', cleanedSku)
          .get();

        // Helper function to compare product data
        const compareProductData = (existing: Record<string, unknown>, newData: Record<string, unknown>): boolean => {
          const fieldsToCompare = ['name', 'category', 'description', 'brand', 'price', 'image', 'imageUrl', 'rating', 'reviews', 'oem', 'oemPN', 'katunPN', 'comments', 'forUseIn', 'specifications'];
          
          for (const field of fieldsToCompare) {
            const existingValue = existing[field];
            const newValue = newData[field];
            
            // Handle undefined/null values
            if ((existingValue === undefined || existingValue === null) && (newValue === undefined || newValue === null)) {
              continue;
            }
            
            // If one is undefined and other has value, they're different
            if ((existingValue === undefined || existingValue === null) !== (newValue === undefined || newValue === null)) {
              return true;
            }
            
            // Compare values (convert to string for comparison to handle type differences)
            if (String(existingValue || '').trim() !== String(newValue || '').trim()) {
              return true;
            }
          }
          return false;
        };

        // Prepare product data
        const productData: Record<string, unknown> = {
          sku: cleanedSku,
          name: cleanedName,
          category: cleanedCategory,
          updatedAt: new Date(),
          isActive: true
        };
        
        // Only set createdAt for new products
        if (existingProductSnapshot.empty) {
          productData.createdAt = new Date();
        }

        // Add optional fields if provided
        if (row.id) {
          const id = parseInt(String(row.id));
          if (!isNaN(id)) {
            productData.id = id;
          }
        }

        if (row.description) {
          productData.description = String(row.description).trim();
        }

        if (row.brand) {
          productData.brand = String(row.brand).trim();
        }

        if (row.price) {
          const price = parseFloat(String(row.price));
          if (!isNaN(price) && price >= 0) {
            productData.price = price;
          } else {
            totalResult.warnings.push({
              row: rowNumber,
              warning: 'Invalid price format. Price not set.'
            });
          }
        }

        // Handle both 'image' and 'imageUrl' fields
        const imageField = row.image || row.imageUrl;
        if (imageField) {
          const imageUrl = String(imageField).trim();
          // Accept both full URLs and relative paths
          if (imageUrl.match(/^(https?:\/\/.+|\/.*\.(jpg|jpeg|png|gif|webp)$)/i)) {
            productData.image = imageUrl;
            productData.imageUrl = imageUrl; // Keep both for compatibility
          } else {
            totalResult.warnings.push({
              row: rowNumber,
              warning: 'Invalid image URL/path format. Image not set.'
            });
          }
        }

        if (row.rating) {
          const rating = parseFloat(String(row.rating));
          if (!isNaN(rating) && rating >= 0 && rating <= 5) {
            productData.rating = rating;
          } else {
            totalResult.warnings.push({
              row: rowNumber,
              warning: 'Invalid rating (should be 0-5). Rating not set.'
            });
          }
        }

        if (row.reviews) {
          const reviews = parseInt(String(row.reviews));
          if (!isNaN(reviews) && reviews >= 0) {
            productData.reviews = reviews;
          } else {
            totalResult.warnings.push({
              row: rowNumber,
              warning: 'Invalid reviews count. Reviews not set.'
            });
          }
        }

        if (row.oem) {
          productData.oem = String(row.oem).trim();
        }

        if (row.oemPN) {
          productData.oemPN = String(row.oemPN).trim();
        }

        if (row.katunPN) {
          productData.katunPN = String(row.katunPN).trim();
        }

        if (row.comments) {
          productData.comments = String(row.comments).trim();
        }

        if (row.forUseIn) {
          productData.forUseIn = String(row.forUseIn).trim();
        }

        if (row.specifications) {
          try {
            const specs = typeof row.specifications === 'string' 
              ? JSON.parse(row.specifications)
              : row.specifications;
            productData.specifications = specs;
          } catch {
            totalResult.warnings.push({
              row: rowNumber,
              warning: 'Invalid specifications JSON format. Specifications not set.'
            });
          }
        }

        // Handle existing vs new products
        if (!existingProductSnapshot.empty) {
          // Product exists - check if update is needed
          const existingDoc = existingProductSnapshot.docs[0];
          const existingData = existingDoc.data();
          
          if (compareProductData(existingData, productData)) {
            // Data is different - update the product
            await existingDoc.ref.update(productData);
            totalResult.successfulUpdates++;
            totalResult.warnings.push({
              row: rowNumber,
              warning: `Product with SKU '${cleanedSku}' updated with new data.`
            });
          } else {
            // Data is identical - skip
            totalResult.duplicatesSkipped++;
            totalResult.warnings.push({
              row: rowNumber,
              warning: `Product with SKU '${cleanedSku}' already exists with identical data. Skipped.`
            });
          }
        } else {
          // New product - add to Firestore
          await adminDb.collection('products').add(productData);
          totalResult.successfulAdds++;
        }

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        totalResult.errors.push({
          row: rowNumber,
          error: `Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        totalResult.failedAdds++;
      }
    }
    }

    console.log(`\n✅ Processing complete across all worksheets:`);
    console.log(`📊 Processed ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
    console.log(`📊 Total: ${totalResult.totalRows} rows, ${totalResult.successfulAdds} added, ${totalResult.successfulUpdates} updated, ${totalResult.failedAdds} failed, ${totalResult.duplicatesSkipped} duplicates`);

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
    console.error('Product upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}