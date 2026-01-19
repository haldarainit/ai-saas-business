import dbConnect from '@/lib/mongodb';
import ManufacturingProduct from '@/models/ManufacturingProduct';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface RouteParams {
    params: Promise<{ id: string }>;
}

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

interface UpdateManufacturingProductData {
    name?: string;
    description?: string;
    sku?: string;
    category?: string;
    billOfMaterials?: BOMItemInput[];
    manufacturingCost?: number | string;
    sellingPrice?: number | string;
    finishedQuantity?: number | string;
    minimumStock?: number | string;
    shelf?: string;
}

// GET /api/inventory/manufacturing-products/[id]
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await dbConnect();

        const product = await ManufacturingProduct.findOne({ _id: id, userId });

        if (!product) {
            return NextResponse.json(
                { message: 'Manufacturing product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        const err = error as Error;
        console.error('Error in GET /api/inventory/manufacturing-products/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to fetch manufacturing product', error: err.message },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/manufacturing-products/[id]
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const data: UpdateManufacturingProductData = await request.json();

        await dbConnect();

        // Check if product exists and belongs to user
        const existing = await ManufacturingProduct.findOne({ _id: id, userId });
        if (!existing) {
            return NextResponse.json(
                { message: 'Manufacturing product not found' },
                { status: 404 }
            );
        }

        // Check for duplicate SKU if SKU is being changed
        if (data.sku && data.sku !== existing.sku) {
            const duplicate = await ManufacturingProduct.findOne({ userId, sku: data.sku, _id: { $ne: id } });
            if (duplicate) {
                return NextResponse.json(
                    { message: 'A manufacturing product with this SKU already exists' },
                    { status: 400 }
                );
            }
        }

        // Process Bill of Materials if provided
        let billOfMaterials: ProcessedBOMItem[] = existing.billOfMaterials;
        if (data.billOfMaterials && Array.isArray(data.billOfMaterials)) {
            billOfMaterials = [];
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
                    quantityRequired: parseFloat(String(item.quantityRequired)),
                    unit: rawMaterial.unit,
                    costPerUnit: rawMaterial.costPerUnit
                });
            }
        }

        // Calculate raw material cost
        const rawMaterialCost = billOfMaterials.reduce((total, item) => {
            return total + (item.quantityRequired * item.costPerUnit);
        }, 0);

        const manufacturingCost = data.manufacturingCost !== undefined
            ? parseFloat(String(data.manufacturingCost))
            : existing.manufacturingCost;

        // Update fields
        const updateData = {
            name: data.name ? String(data.name).trim() : existing.name,
            description: data.description !== undefined ? String(data.description).trim() : existing.description,
            sku: data.sku ? String(data.sku).trim() : existing.sku,
            category: data.category ? String(data.category).trim() : existing.category,
            billOfMaterials,
            rawMaterialCost,
            manufacturingCost,
            totalCost: rawMaterialCost + manufacturingCost,
            sellingPrice: data.sellingPrice !== undefined ? parseFloat(String(data.sellingPrice)) : existing.sellingPrice,
            finishedQuantity: data.finishedQuantity !== undefined ? parseInt(String(data.finishedQuantity), 10) : existing.finishedQuantity,
            minimumStock: data.minimumStock !== undefined ? parseInt(String(data.minimumStock), 10) : existing.minimumStock,
            shelf: data.shelf || existing.shelf,
            updatedAt: new Date()
        };

        const updatedProduct = await ManufacturingProduct.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        const err = error as Error;
        console.error('Error in PUT /api/inventory/manufacturing-products/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update manufacturing product', error: err.message },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/manufacturing-products/[id]
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await dbConnect();

        const product = await ManufacturingProduct.findOneAndDelete({ _id: id, userId });

        if (!product) {
            return NextResponse.json(
                { message: 'Manufacturing product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Manufacturing product deleted successfully' });
    } catch (error) {
        const err = error as Error;
        console.error('Error in DELETE /api/inventory/manufacturing-products/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to delete manufacturing product', error: err.message },
            { status: 500 }
        );
    }
}
