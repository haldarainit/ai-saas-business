import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface ProductData {
    name: string;
    sku: string;
    price: number | string;
    cost: number | string;
    quantity: number | string;
    description?: string;
    category?: string;
    shelf?: string;
    expiryDate?: string | Date;
    supplier?: string;
}

interface MongoError extends Error {
    code?: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message: string }>;
}

// GET /api/inventory/products
// Get all products for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log('GET /api/inventory/products - Request received');

    try {
        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Log environment for debugging
        console.log('Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
            userId: userId
        });

        console.log('Connecting to database...');
        await dbConnect();

        console.log('Database connected. Fetching products for user:', userId);

        try {
            // Filter products by userId
            const products = await Product.find({ userId }).sort({ createdAt: -1 });
            console.log(`Successfully fetched ${products.length} products for user ${userId}`);

            // Ensure we're sending proper JSON
            const response = NextResponse.json(products);

            // Add CORS headers if needed
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Content-Type', 'application/json');

            return response;
        } catch (queryError) {
            const error = queryError as Error;
            console.error('Error querying products:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            return NextResponse.json(
                {
                    message: 'Error querying products',
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                },
                { status: 500 }
            );
        }
    } catch (error) {
        const err = error as Error;
        console.error('Error in GET /api/inventory/products:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });

        return NextResponse.json(
            {
                message: 'Failed to process request',
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
// Create a new product for the authenticated user
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('POST /api/inventory/products - Request received');

    try {
        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Log request headers for debugging
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log('Request headers:', headers);
        console.log('Authenticated user:', userId);

        // Parse request body
        let productData: ProductData;
        try {
            productData = await request.json();
            console.log('Request body parsed successfully:', productData);
        } catch (parseError) {
            const error = parseError as Error;
            console.error('Error parsing request body:', error);
            return NextResponse.json(
                {
                    message: 'Invalid JSON in request body',
                    error: error.message
                },
                { status: 400 }
            );
        }

        // Validate required fields
        const requiredFields: (keyof ProductData)[] = ['name', 'sku', 'price', 'cost', 'quantity'];
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
        const validationErrors: string[] = [];

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

        // Check for duplicate SKU for this user
        console.log('Checking for existing product with SKU:', productData.sku, 'for user:', userId);
        try {
            const existingProduct = await Product.findOne({ userId, sku: productData.sku });
            if (existingProduct) {
                console.error('Product with SKU already exists for this user:', productData.sku);
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
            const error = queryError as Error;
            console.error('Error checking for existing product:', error);
            return NextResponse.json(
                {
                    message: 'Error checking for existing product',
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                },
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Create and save new product
        console.log('Creating new product with data:', productData, 'for user:', userId);
        try {
            const product = new Product({
                userId: userId,
                name: String(productData.name).trim(),
                description: productData.description ? String(productData.description).trim() : '',
                sku: String(productData.sku).trim(),
                category: productData.category ? String(productData.category).trim() : 'Uncategorized',
                price: parseFloat(String(productData.price)),
                cost: parseFloat(String(productData.cost)),
                quantity: parseInt(String(productData.quantity), 10),
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
            const error = saveError as MongoError;
            console.error('Error saving product:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code,
                keyPattern: error.keyPattern,
                keyValue: error.keyValue
            });

            // Handle MongoDB duplicate key error
            if (error.code === 11000) {
                return NextResponse.json(
                    {
                        message: 'Duplicate key error',
                        error: 'A product with this SKU already exists',
                        keyPattern: error.keyPattern,
                        keyValue: error.keyValue
                    },
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors: Record<string, string> = {};
                if (error.errors) {
                    Object.keys(error.errors).forEach(key => {
                        errors[key] = error.errors![key].message;
                    });
                }

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
        const err = error as MongoError;
        console.error('Unhandled error in POST /api/inventory/products:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            ...(err.code && { code: err.code }),
            ...(err.keyPattern && { keyPattern: err.keyPattern }),
            ...(err.keyValue && { keyValue: err.keyValue })
        });

        return NextResponse.json(
            {
                message: 'Internal server error',
                error: err.message || 'An unexpected error occurred',
                ...(process.env.NODE_ENV === 'development' && {
                    stack: err.stack,
                    ...(err.code && { code: err.code })
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
