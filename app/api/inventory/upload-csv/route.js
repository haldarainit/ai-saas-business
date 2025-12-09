import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// POST /api/inventory/upload-csv
// Upload CSV file and create products
export async function POST(request) {
  console.log('POST /api/inventory/upload-csv - Request received');
  
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { message: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Convert file to text
    const csvText = await file.text();
    console.log('CSV file read successfully');

    // Parse CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      transform: (value, field) => {
        // Trim whitespace from all values
        if (typeof value === 'string') {
          return value.trim();
        }
        return value;
      }
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      return NextResponse.json(
        { 
          message: 'CSV parsing failed',
          errors: parseResult.errors
        },
        { status: 400 }
      );
    }

    const products = parseResult.data;
    console.log(`Parsed ${products.length} products from CSV`);

    if (products.length === 0) {
      return NextResponse.json(
        { message: 'CSV file is empty or contains no valid data' },
        { status: 400 }
      );
    }

    // Validate and transform products
    const validatedProducts = [];
    const validationErrors = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNumber = i + 2; // +2 because CSV rows are 1-indexed and header is row 1

      try {
        // Map CSV columns to product fields
        const product = {
          name: row.name || row.product_name || row.item_name || '',
          description: row.description || row.desc || '',
          sku: row.sku || row.code || row.item_code || '',
          category: row.category || row.type || row.product_type || 'Uncategorized',
          price: parseFloat(row.price || row.selling_price || row.unit_price) || 0,
          cost: parseFloat(row.cost || row.purchase_price || row.unit_cost) || 0,
          quantity: parseInt(row.quantity || row.stock || row.inventory || row.units) || 0,
          shelf: row.shelf || row.location || row.rack || 'Default',
          expiryDate: row.expiry_date || row.expiry || row.expire_date ? new Date(row.expiry_date || row.expiry || row.expire_date) : null,
          supplier: row.supplier || row.vendor || row.manufacturer || ''
        };

        // Validate required fields
        const requiredFields = ['name', 'sku'];
        const missingFields = requiredFields.filter(field => !product[field]);

        if (missingFields.length > 0) {
          validationErrors.push({
            row: rowNumber,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            data: row
          });
          continue;
        }

        // Validate numeric fields
        if (isNaN(product.price) || product.price < 0) {
          validationErrors.push({
            row: rowNumber,
            error: 'Price must be a valid positive number',
            data: row
          });
          continue;
        }

        if (isNaN(product.cost) || product.cost < 0) {
          validationErrors.push({
            row: rowNumber,
            error: 'Cost must be a valid non-negative number',
            data: row
          });
          continue;
        }

        if (isNaN(product.quantity) || product.quantity < 0 || !Number.isInteger(product.quantity)) {
          validationErrors.push({
            row: rowNumber,
            error: 'Quantity must be a valid non-negative integer',
            data: row
          });
          continue;
        }

        // Validate expiry date
        if (product.expiryDate && isNaN(product.expiryDate.getTime())) {
          product.expiryDate = null;
        }

        validatedProducts.push(product);
      } catch (error) {
        validationErrors.push({
          row: rowNumber,
          error: `Validation error: ${error.message}`,
          data: row
        });
      }
    }

    if (validatedProducts.length === 0) {
      return NextResponse.json(
        { 
          message: 'No valid products found in CSV',
          validationErrors
        },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check for duplicate SKUs and insert products
    const results = {
      success: [],
      duplicates: [],
      errors: []
    };

    for (const product of validatedProducts) {
      try {
        // Check for existing SKU
        const existingProduct = await Product.findOne({ sku: product.sku });
        
        if (existingProduct) {
          results.duplicates.push({
            sku: product.sku,
            name: product.name,
            message: 'Product with this SKU already exists'
          });
          continue;
        }

        // Create new product
        const newProduct = new Product(product);
        const savedProduct = await newProduct.save();
        results.success.push(savedProduct);
        
      } catch (error) {
        console.error(`Error saving product ${product.sku}:`, error);
        results.errors.push({
          sku: product.sku,
          name: product.name,
          error: error.message
        });
      }
    }

    console.log(`Upload completed: ${results.success.length} successful, ${results.duplicates.length} duplicates, ${results.errors.length} errors`);

    return NextResponse.json({
      message: 'CSV upload processed successfully',
      summary: {
        total: products.length,
        successful: results.success.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length + validationErrors.length,
        validationErrors
      },
      results
    });

  } catch (error) {
    console.error('Error in CSV upload:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error during CSV upload',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Upload failed'
      },
      { status: 500 }
    );
  }
}
