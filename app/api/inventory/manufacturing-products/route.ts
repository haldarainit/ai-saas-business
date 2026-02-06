import dbConnect from '@/lib/mongodb';
import ManufacturingProduct from '@/models/ManufacturingProduct';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface BOMItemInput {
    rawMaterialId: string;
    quantityRequired: number | string;
}

interface ProcessedBOMItem {
    rawMaterialId: string;
    rawMaterialName: string;
    rawMaterialSku: string;
    quantityRequired: number;
    unit: string;
    costPerUnit: number;
}

interface ManufacturingProductData {
    name: string;
    sku: string;
    sellingPrice: number | string;
    description?: string;
    category?: string;
    billOfMaterials?: BOMItemInput[];
    manufacturingCost?: number | string;
    finishedQuantity?: number | string;
    minimumStock?: number | string;
    shelf?: string;
}

interface MongoError extends Error {
    code?: number;
}

// GET /api/inventory/manufacturing-products
// Get all manufacturing products for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse> {
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
        const err = error as Error;
        console.error('Error in GET /api/inventory/manufacturing-products:', error);
        return NextResponse.json(
            { message: 'Failed to fetch manufacturing products', error: err.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/manufacturing-products
// Create a new manufacturing product with Bill of Materials
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('POST /api/inventory/manufacturing-products - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const data: ManufacturingProductData = await request.json();

        // Validate required fields
        const requiredFields: (keyof ManufacturingProductData)[] = ['name', 'sku', 'sellingPrice'];
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
        const billOfMaterials: ProcessedBOMItem[] = [];
        const rawMaterialsToUpdate: { id: string; newQuantity: number; name: string }[] = [];

        if (data.billOfMaterials && Array.isArray(data.billOfMaterials)) {
            // Fetch current costs from raw materials and validate quantities
            for (const item of data.billOfMaterials) {
                const rawMaterial = await RawMaterial.findOne({ _id: item.rawMaterialId, userId });
                if (!rawMaterial) {
                    return NextResponse.json(
                        { message: `Raw material not found: ${item.rawMaterialId}` },
                        { status: 400 }
                    );
                }

                const quantityRequired = parseFloat(String(item.quantityRequired));

                // Check if raw material has zero quantity - prevent product creation
                if (rawMaterial.quantity === 0) {
                    return NextResponse.json(
                        { message: `Cannot add product: Raw material "${rawMaterial.name}" has zero quantity in inventory` },
                        { status: 400 }
                    );
                }

                // Check if there's sufficient quantity available
                if (rawMaterial.quantity < quantityRequired) {
                    return NextResponse.json(
                        {
                            message: `Insufficient quantity for raw material "${rawMaterial.name}". ` +
                                `Required: ${quantityRequired} ${rawMaterial.unit}, ` +
                                `Available: ${rawMaterial.quantity} ${rawMaterial.unit}`
                        },
                        { status: 400 }
                    );
                }

                // Calculate the new quantity after deduction
                const newQuantity = rawMaterial.quantity - quantityRequired;

                // Ensure quantity doesn't go below zero (additional safety check)
                if (newQuantity < 0) {
                    return NextResponse.json(
                        { message: `Cannot deduct ${quantityRequired} from raw material "${rawMaterial.name}". Would result in negative inventory.` },
                        { status: 400 }
                    );
                }

                // Store the raw material update info for later
                rawMaterialsToUpdate.push({
                    id: rawMaterial._id.toString(),
                    newQuantity: newQuantity,
                    name: rawMaterial.name
                });

                billOfMaterials.push({
                    rawMaterialId: rawMaterial._id.toString(),
                    rawMaterialName: rawMaterial.name,
                    rawMaterialSku: rawMaterial.sku,
                    quantityRequired: quantityRequired,
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
            manufacturingCost: data.manufacturingCost ? parseFloat(String(data.manufacturingCost)) : 0,
            sellingPrice: parseFloat(String(data.sellingPrice)),
            finishedQuantity: data.finishedQuantity ? parseInt(String(data.finishedQuantity), 10) : 0,
            minimumStock: data.minimumStock ? parseInt(String(data.minimumStock), 10) : 10,
            shelf: data.shelf || 'Default'
        });

        const savedProduct = await product.save();
        console.log('Manufacturing product created successfully:', savedProduct._id);

        // Now deduct the raw material quantities from inventory
        for (const materialUpdate of rawMaterialsToUpdate) {
            await RawMaterial.findByIdAndUpdate(
                materialUpdate.id,
                {
                    $set: { quantity: materialUpdate.newQuantity },
                    $currentDate: { updatedAt: true }
                }
            );
            console.log(`Deducted quantity from raw material "${materialUpdate.name}". New quantity: ${materialUpdate.newQuantity}`);
        }

        return NextResponse.json(savedProduct, { status: 201 });
    } catch (error) {
        const err = error as MongoError;
        console.error('Error in POST /api/inventory/manufacturing-products:', error);

        if (err.code === 11000) {
            return NextResponse.json(
                { message: 'A manufacturing product with this SKU already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Failed to create manufacturing product', error: err.message },
            { status: 500 }
        );
    }
}
