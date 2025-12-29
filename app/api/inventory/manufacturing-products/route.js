import dbConnect from '@/lib/mongodb';
import ManufacturingProduct from '@/models/ManufacturingProduct';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/manufacturing-products
// Get all manufacturing products for the authenticated user
export async function GET(request) {
    console.log('GET /api/inventory/manufacturing-products - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        const products = await ManufacturingProduct.find({ userId }).sort({ createdAt: -1 });
        console.log(`Fetched ${products.length} manufacturing products for user ${userId}`);

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error in GET /api/inventory/manufacturing-products:', error);
        return NextResponse.json(
            { message: 'Failed to fetch manufacturing products', error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/manufacturing-products
// Create a new manufacturing product with Bill of Materials
export async function POST(request) {
    console.log('POST /api/inventory/manufacturing-products - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        const requiredFields = ['name', 'sku', 'sellingPrice'];
        const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { message: 'Missing required fields', missingFields },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check for duplicate SKU
        const existing = await ManufacturingProduct.findOne({ userId, sku: data.sku });
        if (existing) {
            return NextResponse.json(
                { message: 'A manufacturing product with this SKU already exists' },
                { status: 400 }
            );
        }

        // Process Bill of Materials if provided
        let billOfMaterials = [];
        if (data.billOfMaterials && Array.isArray(data.billOfMaterials)) {
            // Fetch current costs from raw materials
            for (const item of data.billOfMaterials) {
                const rawMaterial = await RawMaterial.findOne({ _id: item.rawMaterialId, userId });
                if (!rawMaterial) {
                    return NextResponse.json(
                        { message: `Raw material not found: ${item.rawMaterialId}` },
                        { status: 400 }
                    );
                }

                billOfMaterials.push({
                    rawMaterialId: rawMaterial._id,
                    rawMaterialName: rawMaterial.name,
                    rawMaterialSku: rawMaterial.sku,
                    quantityRequired: parseFloat(item.quantityRequired),
                    unit: rawMaterial.unit,
                    costPerUnit: rawMaterial.costPerUnit
                });
            }
        }

        const product = new ManufacturingProduct({
            userId,
            name: String(data.name).trim(),
            description: data.description ? String(data.description).trim() : '',
            sku: String(data.sku).trim(),
            category: data.category ? String(data.category).trim() : 'Uncategorized',
            billOfMaterials,
            manufacturingCost: data.manufacturingCost ? parseFloat(data.manufacturingCost) : 0,
            sellingPrice: parseFloat(data.sellingPrice),
            finishedQuantity: data.finishedQuantity ? parseInt(data.finishedQuantity, 10) : 0,
            minimumStock: data.minimumStock ? parseInt(data.minimumStock, 10) : 10,
            shelf: data.shelf || 'Default'
        });

        const savedProduct = await product.save();
        console.log('Manufacturing product created successfully:', savedProduct._id);

        return NextResponse.json(savedProduct, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/inventory/manufacturing-products:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { message: 'A manufacturing product with this SKU already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Failed to create manufacturing product', error: error.message },
            { status: 500 }
        );
    }
}
