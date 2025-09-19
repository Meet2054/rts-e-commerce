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
  failedAdds: number;
  duplicatesSkipped: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

function isKatunFormat(data: any[]): boolean {
  if (data.length === 0) return false;
  const firstRow = data[0];
  return firstRow.hasOwnProperty('OEM:') && 
         firstRow.hasOwnProperty('Katun PN:') && 
         firstRow.hasOwnProperty('Name:');
}

function convertKatunToStandard(katunRow: KatunProductRow): StandardProductRow {
  return {
    sku: String(katunRow['Katun PN:']).trim(),
    name: String(katunRow['Name:']).trim(),
    description: katunRow['Description:'] ? String(katunRow['Description:']).trim() : undefined,
    category: katunRow['OEM:'] ? String(katunRow['OEM:']).trim().toLowerCase() : 'general',
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

    // Check if user is admin
    if (authResult.userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
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
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get raw data to handle the specific format
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find the header row (skip empty rows)
    let headerRowIndex = -1;
    let headers: string[] = [];
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (row && row.length > 0 && row[0] && String(row[0]).includes('OEM')) {
        headerRowIndex = i;
        headers = row.map(h => String(h || '').trim());
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Could not find header row in Excel file. Expected headers starting with "OEM:"' },
        { status: 400 }
      );
    }
    
    // Convert data starting from header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: headers,
      range: headerRowIndex 
    });
    
    // Remove the header row itself from data
    const data = jsonData.slice(1);

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Excel file is empty or has no valid data rows' },
        { status: 400 }
      );
    }

    const result: UploadResult = {
      totalRows: data.length,
      successfulAdds: 0,
      failedAdds: 0,
      duplicatesSkipped: 0,
      errors: [],
      warnings: []
    };

    // Get existing categories for validation
    const categoriesSnapshot = await adminDb.collection('categories').get();
    const existingCategories = new Set(
      categoriesSnapshot.docs.map(doc => doc.id)
    );

    // Detect format and process each row
    const isKatun = isKatunFormat(data);
    console.log('Detected format:', isKatun ? 'Katun' : 'Standard');

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
          result.errors.push({
            row: rowNumber,
            error: 'Missing required fields: sku, name, and category are required'
          });
          result.failedAdds++;
          continue;
        }

        // Clean and validate data
        const cleanedSku = String(row.sku).trim();
        const cleanedName = String(row.name).trim();
        const cleanedCategory = String(row.category).trim().toLowerCase();

        if (!cleanedSku || !cleanedName || !cleanedCategory) {
          result.errors.push({
            row: rowNumber,
            error: 'SKU, name, and category cannot be empty'
          });
          result.failedAdds++;
          continue;
        }

        // Check if category exists
        if (!existingCategories.has(cleanedCategory)) {
          result.warnings.push({
            row: rowNumber,
            warning: `Category '${cleanedCategory}' does not exist. Product will be created but category may need to be added separately.`
          });
        }

        // Check if product already exists
        const existingProductSnapshot = await adminDb
          .collection('products')
          .where('sku', '==', cleanedSku)
          .get();

        if (!existingProductSnapshot.empty) {
          result.duplicatesSkipped++;
          result.warnings.push({
            row: rowNumber,
            warning: `Product with SKU '${cleanedSku}' already exists. Skipped.`
          });
          continue;
        }

        // Prepare product data (removed category field completely)
        const productData: any = {
          sku: cleanedSku,
          name: cleanedName,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };

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
            result.warnings.push({
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
            result.warnings.push({
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
            result.warnings.push({
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
            result.warnings.push({
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
          } catch (error) {
            result.warnings.push({
              row: rowNumber,
              warning: 'Invalid specifications JSON format. Specifications not set.'
            });
          }
        }

        // Add product to Firestore
        await adminDb.collection('products').add(productData);
        result.successfulAdds++;

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          error: `Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        result.failedAdds++;
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        fileName: file.name,
        detectedFormat: isKatun ? 'Katun' : 'Standard'
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