import dbConnect from '@/lib/mongodb';
import ManufacturingProduct from '@/models/ManufacturingProduct';
import RawMaterial from '@/models/RawMaterial';
import ProductionLog from '@/models/ProductionLog';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface DateQuery {
    $gte?: Date;
    $lte?: Date;
}

interface ProductionQuery {
    userId: string;
    productId?: string;
    productionDate?: DateQuery;
}

interface ProductionData {
    productId: string;
    quantityToProduce: number | string;
    batchNumber?: string;
    notes?: string;
    productionDate?: string | Date;
}

interface BOMItem {
    rawMaterialId: string;
    rawMaterialName: string;
    quantityRequired: number;
}

interface MaterialConsumed {
    rawMaterialId: string;
    rawMaterialName: string;
    rawMaterialSku: string;
    quantityConsumed: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
}

interface InsufficientMaterial {
    name: string;
    required: number;
    available: number;
    shortage: number;
    unit: string;
}

// GET /api/inventory/production
// Get production logs with optional filters
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log('GET /api/inventory/production - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        await dbConnect();

        const query: ProductionQuery = { userId };

        if (productId) {
            query.productId = productId;
        }

        if (startDate || endDate) {
            query.productionDate = {};
            if (startDate) query.productionDate.$gte = new Date(startDate);
            if (endDate) query.productionDate.$lte = new Date(endDate);
        }

        const logs = await ProductionLog.find(query)
            .sort({ productionDate: -1 })
            .limit(limit);

        console.log(`Fetched ${logs.length} production logs for user ${userId}`);

        return NextResponse.json(logs);
    } catch (error) {
        const err = error as Error;
        console.error('Error in GET /api/inventory/production:', error);
        return NextResponse.json(
            { message: 'Failed to fetch production logs', error: err.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/production
// Record a new production - consumes raw materials and produces finished goods
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('POST /api/inventory/production - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const data: ProductionData = await request.json();

        // Validate required fields
        if (!data.productId || !data.quantityToProduce) {
            return NextResponse.json(
                { message: 'Product ID and quantity to produce are required' },
                { status: 400 }
            );
        }

        const quantityToProduce = parseInt(String(data.quantityToProduce), 10);
        if (quantityToProduce < 1) {
            return NextResponse.json(
                { message: 'Quantity to produce must be at least 1' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fetch the manufacturing product
        const product = await ManufacturingProduct.findOne({ _id: data.productId, userId });
        if (!product) {
            return NextResponse.json(
                { message: 'Manufacturing product not found' },
                { status: 404 }
            );
        }

        if (product.billOfMaterials.length === 0) {
            return NextResponse.json(
                { message: 'Product has no Bill of Materials defined. Cannot produce.' },
                { status: 400 }
            );
        }

        // Check if we have enough raw materials
        const materialsConsumed: MaterialConsumed[] = [];
        const insufficientMaterials: InsufficientMaterial[] = [];

        for (const bomItem of product.billOfMaterials as BOMItem[]) {
            const rawMaterial = await RawMaterial.findOne({ _id: bomItem.rawMaterialId, userId });

            if (!rawMaterial) {
                return NextResponse.json(
                    { message: `Raw material not found: ${bomItem.rawMaterialName}` },
                    { status: 400 }
                );
            }

            const requiredQty = bomItem.quantityRequired * quantityToProduce;

            if (rawMaterial.quantity < requiredQty) {
                insufficientMaterials.push({
                    name: rawMaterial.name,
                    required: requiredQty,
                    available: rawMaterial.quantity,
                    shortage: requiredQty - rawMaterial.quantity,
                    unit: rawMaterial.unit
                });
            }

            materialsConsumed.push({
                rawMaterialId: rawMaterial._id,
                rawMaterialName: rawMaterial.name,
                rawMaterialSku: rawMaterial.sku,
                quantityConsumed: requiredQty,
                unit: rawMaterial.unit,
                costPerUnit: rawMaterial.costPerUnit,
                totalCost: requiredQty * rawMaterial.costPerUnit
            });
        }

        if (insufficientMaterials.length > 0) {
            return NextResponse.json(
                {
                    message: 'Insufficient raw materials for production',
                    insufficientMaterials
                },
                { status: 400 }
            );
        }

        // Deduct raw materials
        for (const consumed of materialsConsumed) {
            await RawMaterial.findByIdAndUpdate(
                consumed.rawMaterialId,
                {
                    $inc: { quantity: -consumed.quantityConsumed },
                    updatedAt: new Date()
                }
            );
        }

        // Calculate costs
        const totalRawMaterialCost = materialsConsumed.reduce((sum, m) => sum + m.totalCost, 0);
        const manufacturingCost = (product.manufacturingCost || 0) * quantityToProduce;
        const totalProductionCost = totalRawMaterialCost + manufacturingCost;
        const costPerUnit = totalProductionCost / quantityToProduce;

        // Generate batch number
        const batchNumber = data.batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create production log
        const productionLog = new ProductionLog({
            userId,
            productId: product._id,
            productName: product.name,
            productSku: product.sku,
            quantityProduced: quantityToProduce,
            batchNumber,
            materialsConsumed,
            totalRawMaterialCost,
            manufacturingCost,
            totalProductionCost,
            costPerUnit,
            status: 'completed',
            notes: data.notes || '',
            productionDate: data.productionDate ? new Date(data.productionDate) : new Date()
        });

        await productionLog.save();

        // Update manufacturing product - add to finished quantity
        await ManufacturingProduct.findByIdAndUpdate(
            product._id,
            {
                $inc: {
                    finishedQuantity: quantityToProduce,
                    totalProduced: quantityToProduce
                },
                lastProductionDate: new Date(),
                updatedAt: new Date()
            }
        );

        console.log(`Production completed: ${quantityToProduce} units of ${product.name}`);

        return NextResponse.json({
            message: 'Production completed successfully',
            productionLog,
            summary: {
                productName: product.name,
                quantityProduced: quantityToProduce,
                batchNumber,
                totalRawMaterialCost,
                manufacturingCost,
                totalProductionCost,
                costPerUnit,
                materialsConsumed: materialsConsumed.map(m => ({
                    name: m.rawMaterialName,
                    quantity: m.quantityConsumed,
                    unit: m.unit,
                    cost: m.totalCost
                }))
            }
        }, { status: 201 });
    } catch (error) {
        const err = error as Error;
        console.error('Error in POST /api/inventory/production:', error);
        return NextResponse.json(
            { message: 'Failed to complete production', error: err.message },
            { status: 500 }
        );
    }
}
