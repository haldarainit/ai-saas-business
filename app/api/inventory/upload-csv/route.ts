import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse, NextRequest } from 'next/server';
import Papa from 'papaparse';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface CSVRow {
    name?: string;
    product_name?: string;
    item_name?: string;
    description?: string;
    desc?: string;
    sku?: string;
    code?: string;
    item_code?: string;
    category?: string;
    type?: string;
    product_type?: string;
    price?: string;
    selling_price?: string;
    unit_price?: string;
    cost?: string;
    purchase_price?: string;
    unit_cost?: string;
    quantity?: string;
    stock?: string;
    inventory?: string;
    units?: string;
    shelf?: string;
    location?: string;
    rack?: string;
    expiry_date?: string;
    expiry?: string;
    expire_date?: string;
    supplier?: string;
    vendor?: string;
    manufacturer?: string;
}

interface ValidatedProduct {
    name: string;
    description: string;
    sku: string;
    category: string;
    price: number;
    cost: number;
    quantity: number;
    shelf: string;
    expiryDate: Date | null;
    supplier: string;
}

interface ValidationError {
    row: number;
    error: string;
    data: CSVRow;
}

interface UploadResults {
    success: unknown[];
    duplicates: Array<{ sku: string; name: string; message: string }>;
    errors: Array<{ sku: string; name: string; error: string }>;
}

// POST /api/inventory/upload-csv
// Upload CSV file and create products for the authenticated user
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('POST /api/inventory/upload-csv - Request received');

    try {
        // Get authenticated user
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.log('Authenticated user:', userId);

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

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
        const parseResult = Papa.parse<CSVRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
            transform: (value: string) => {
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
        const validatedProducts: ValidatedProduct[] = [];
        const validationErrors: ValidationError[] = [];

        for (let i = 0; i < products.length; i++) {
            const row = products[i];
            const rowNumber = i + 2; // +2 because CSV rows are 1-indexed and header is row 1

            try {
                // Map CSV columns to product fields
                const expiryDateStr = row.expiry_date || row.expiry || row.expire_date;
                const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

                const product: ValidatedProduct = {
                    name: row.name || row.product_name || row.item_name || '',
                    description: row.description || row.desc || '',
                    sku: row.sku || row.code || row.item_code || '',
                    category: row.category || row.type || row.product_type || 'Uncategorized',
                    price: parseFloat(row.price || row.selling_price || row.unit_price || '0') || 0,
                    cost: parseFloat(row.cost || row.purchase_price || row.unit_cost || '0') || 0,
                    quantity: parseInt(row.quantity || row.stock || row.inventory || row.units || '0') || 0,
                    shelf: row.shelf || row.location || row.rack || 'Default',
                    expiryDate: expiryDate,
                    supplier: row.supplier || row.vendor || row.manufacturer || ''
                };

                // Validate required fields
                const requiredFields: (keyof ValidatedProduct)[] = ['name', 'sku'];
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
                const err = error as Error;
                validationErrors.push({
                    row: rowNumber,
                    error: `Validation error: ${err.message}`,
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
        const results: UploadResults = {
            success: [],
            duplicates: [],
            errors: []
        };

        for (const product of validatedProducts) {
            try {
                // Check for existing SKU for this user
                const existingProduct = await Product.findOne({ userId, sku: product.sku });

                if (existingProduct) {
                    results.duplicates.push({
                        sku: product.sku,
                        name: product.name,
                        message: 'Product with this SKU already exists'
                    });
                    continue;
                }

                // Create new product with userId
                const newProduct = new Product({ ...product, userId });
                const savedProduct = await newProduct.save();
                results.success.push(savedProduct);

            } catch (error) {
                const err = error as Error;
                console.error(`Error saving product ${product.sku}:`, error);
                results.errors.push({
                    sku: product.sku,
                    name: product.name,
                    error: err.message
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
        const err = error as Error;
        console.error('Error in CSV upload:', error);
        return NextResponse.json(
            {
                message: 'Internal server error during CSV upload',
                error: process.env.NODE_ENV === 'development' ? err.message : 'Upload failed'
            },
            { status: 500 }
        );
    }
}
