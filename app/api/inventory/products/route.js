import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

// GET /api/inventory/products
// Get all products
export async function GET() {
  console.log('GET /api/inventory/products - Request received');
  
  try {
    // Log environment for debugging
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
    });

    console.log('Connecting to database...');
    await dbConnect();
    
    console.log('Database connected. Fetching products...');
    
    try {
      const products = await Product.find({}).sort({ createdAt: -1 });
      console.log(`Successfully fetched ${products.length} products`);
      
      // Ensure we're sending proper JSON
      const response = NextResponse.json(products);
      
      // Add CORS headers if needed
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Content-Type', 'application/json');
      
      return response;
    } catch (queryError) {
      console.error('Error querying products:', {
        name: queryError.name,
        message: queryError.message,
        stack: queryError.stack
      });
      
      return NextResponse.json(
        { 
          message: 'Error querying products',
          error: queryError.message,
          stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/inventory/products:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        message: 'Failed to process request',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// POST /api/inventory/products
// Create a new product
export async function POST(request) {
  console.log('POST /api/inventory/products - Request received');
  
  try {
    // Log request headers for debugging
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Request headers:', headers);
    
    // Parse request body
    let productData;
    try {
      productData = await request.json();
      console.log('Request body parsed successfully:', productData);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { 
          message: 'Invalid JSON in request body',
          error: parseError.message
        },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const requiredFields = ['name', 'sku', 'price', 'cost', 'quantity'];
    const missingFields = requiredFields.filter(field => {
      const value = productData[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          message: 'Missing required fields',
          missingFields,
          receivedData: productData,
          error: `The following fields are required: ${missingFields.join(', ')}`
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Type validation with detailed error messages
    const validationErrors = [];
    
    if (isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
      validationErrors.push('Price must be a positive number');
    }

    if (isNaN(Number(productData.cost)) || Number(productData.cost) < 0) {
      validationErrors.push('Cost must be a non-negative number');
    }

    const quantity = Number(productData.quantity);
    if (isNaN(quantity) || !Number.isInteger(quantity) || quantity < 0) {
      validationErrors.push('Quantity must be a non-negative integer');
    }

    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: validationErrors,
          receivedData: productData
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Connect to database
    console.log('Connecting to database...');
    await dbConnect();
    
    // Check for duplicate SKU
    console.log('Checking for existing product with SKU:', productData.sku);
    try {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        console.error('Product with SKU already exists:', productData.sku);
        return NextResponse.json(
          { 
            message: 'A product with this SKU already exists',
            existingProductId: existingProduct._id,
            error: 'Duplicate SKU'
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (queryError) {
      console.error('Error checking for existing product:', queryError);
      return NextResponse.json(
        { 
          message: 'Error checking for existing product',
          error: queryError.message,
          stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined
        },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create and save new product
    console.log('Creating new product with data:', productData);
    try {
      const product = new Product({
        name: String(productData.name).trim(),
        description: productData.description ? String(productData.description).trim() : '',
        sku: String(productData.sku).trim(),
        category: productData.category ? String(productData.category).trim() : 'Uncategorized',
        price: parseFloat(productData.price),
        cost: parseFloat(productData.cost),
        quantity: parseInt(productData.quantity, 10),
        shelf: productData.shelf ? String(productData.shelf).trim() : 'Default',
        expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : null,
        supplier: productData.supplier ? String(productData.supplier).trim() : ''
      });
      
      const savedProduct = await product.save();
      console.log('Product created successfully:', savedProduct);

      return NextResponse.json(
        savedProduct,
        { 
          status: 201,
          headers: { 
            'Content-Type': 'application/json',
            'Location': `/api/inventory/products/${savedProduct._id}`
          }
        }
      );
    } catch (saveError) {
      console.error('Error saving product:', {
        name: saveError.name,
        message: saveError.message,
        stack: saveError.stack,
        code: saveError.code,
        keyPattern: saveError.keyPattern,
        keyValue: saveError.keyValue
      });
      
      // Handle MongoDB duplicate key error
      if (saveError.code === 11000) {
        return NextResponse.json(
          { 
            message: 'Duplicate key error',
            error: 'A product with this SKU already exists',
            keyPattern: saveError.keyPattern,
            keyValue: saveError.keyValue
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Handle validation errors
      if (saveError.name === 'ValidationError') {
        const errors = {};
        Object.keys(saveError.errors).forEach(key => {
          errors[key] = saveError.errors[key].message;
        });
        
        return NextResponse.json(
          { 
            message: 'Validation failed',
            errors,
            error: 'Validation error',
            receivedData: productData
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw saveError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Unhandled error in POST /api/inventory/products:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
      ...(error.keyPattern && { keyPattern: error.keyPattern }),
      ...(error.keyValue && { keyValue: error.keyValue })
    });
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          ...(error.code && { code: error.code })
        })
      },
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
