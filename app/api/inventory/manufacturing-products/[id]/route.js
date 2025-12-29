import dbConnect from '@/lib/mongodb';
import ManufacturingProduct from '@/models/ManufacturingProduct';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/manufacturing-products/[id]
export async function GET(request, { params }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = params;

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
        console.error('Error in GET /api/inventory/manufacturing-products/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to fetch manufacturing product', error: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/manufacturing-products/[id]
export async function PUT(request, { params }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = params;
        const data = await request.json();

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
        let billOfMaterials = existing.billOfMaterials;
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
                    quantityRequired: parseFloat(item.quantityRequired),
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
            ? parseFloat(data.manufacturingCost)
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
            sellingPrice: data.sellingPrice !== undefined ? parseFloat(data.sellingPrice) : existing.sellingPrice,
            finishedQuantity: data.finishedQuantity !== undefined ? parseInt(data.finishedQuantity, 10) : existing.finishedQuantity,
            minimumStock: data.minimumStock !== undefined ? parseInt(data.minimumStock, 10) : existing.minimumStock,
            shelf: data.shelf || existing.shelf,
            updatedAt: new Date()
        };

        const updatedProduct = await ManufacturingProduct.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error in PUT /api/inventory/manufacturing-products/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update manufacturing product', error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/manufacturing-products/[id]
export async function DELETE(request, { params }) {
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
        console.error('Error in DELETE /api/inventory/manufacturing-products/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to delete manufacturing product', error: error.message },
            { status: 500 }
        );
    }
}
