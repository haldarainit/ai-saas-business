import dbConnect from '@/lib/mongodb';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/raw-materials/[id]
export async function GET(request, { params }) {
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

        const material = await RawMaterial.findOne({ _id: id, userId });

        if (!material) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(material);
    } catch (error) {
        console.error('Error in GET /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to fetch raw material', error: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/raw-materials/[id]
export async function PUT(request, { params }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const data = await request.json();

        await dbConnect();

        // Check if material exists and belongs to user
        const existing = await RawMaterial.findOne({ _id: id, userId });
        if (!existing) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        // Check for duplicate SKU if SKU is being changed
        if (data.sku && data.sku !== existing.sku) {
            const duplicate = await RawMaterial.findOne({ userId, sku: data.sku, _id: { $ne: id } });
            if (duplicate) {
                return NextResponse.json(
                    { message: 'A raw material with this SKU already exists' },
                    { status: 400 }
                );
            }
        }

        // Update fields
        const updateData = {
            name: data.name ? String(data.name).trim() : existing.name,
            description: data.description !== undefined ? String(data.description).trim() : existing.description,
            sku: data.sku ? String(data.sku).trim() : existing.sku,
            category: data.category ? String(data.category).trim() : existing.category,
            unit: data.unit || existing.unit,
            costPerUnit: data.costPerUnit !== undefined ? parseFloat(data.costPerUnit) : existing.costPerUnit,
            quantity: data.quantity !== undefined ? parseFloat(data.quantity) : existing.quantity,
            minimumStock: data.minimumStock !== undefined ? parseInt(data.minimumStock, 10) : existing.minimumStock,
            shelf: data.shelf || existing.shelf,
            expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : existing.expiryDate,
            supplier: data.supplier !== undefined ? String(data.supplier).trim() : existing.supplier,
            supplierContact: data.supplierContact !== undefined ? String(data.supplierContact).trim() : existing.supplierContact,
            updatedAt: new Date()
        };

        const updatedMaterial = await RawMaterial.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedMaterial);
    } catch (error) {
        console.error('Error in PUT /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update raw material', error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/raw-materials/[id]
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

        const material = await RawMaterial.findOneAndDelete({ _id: id, userId });

        if (!material) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Raw material deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to delete raw material', error: error.message },
            { status: 500 }
        );
    }
}

// PATCH /api/inventory/raw-materials/[id] - for updating quantity (stock adjustments)
export async function PATCH(request, { params }) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const { quantity, operation, lastPurchasePrice, lastPurchaseDate } = await request.json();

        await dbConnect();

        const material = await RawMaterial.findOne({ _id: id, userId });
        if (!material) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        let newQuantity = material.quantity;

        if (operation === 'add') {
            newQuantity = material.quantity + parseFloat(quantity);
        } else if (operation === 'subtract') {
            newQuantity = Math.max(0, material.quantity - parseFloat(quantity));
        } else if (operation === 'set') {
            newQuantity = parseFloat(quantity);
        }

        const updateData = {
            quantity: newQuantity,
            updatedAt: new Date()
        };

        // Update purchase info if provided (for restocking)
        if (lastPurchasePrice !== undefined) {
            updateData.lastPurchasePrice = parseFloat(lastPurchasePrice);
            updateData.costPerUnit = parseFloat(lastPurchasePrice); // Update cost to latest price
        }
        if (lastPurchaseDate) {
            updateData.lastPurchaseDate = new Date(lastPurchaseDate);
        }

        const updatedMaterial = await RawMaterial.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedMaterial);
    } catch (error) {
        console.error('Error in PATCH /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update raw material quantity', error: error.message },
            { status: 500 }
        );
    }
}
