import dbConnect from '@/lib/mongodb';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface UpdateRawMaterialData {
    name?: string;
    description?: string;
    sku?: string;
    category?: string;
    unit?: string;
    costPerUnit?: number | string;
    quantity?: number | string;
    minimumStock?: number | string;
    shelf?: string;
    expiryDate?: string | Date | null;
    supplier?: string;
    supplierContact?: string;
}

interface PatchData {
    quantity?: number | string;
    operation?: 'add' | 'subtract' | 'set';
    lastPurchasePrice?: number | string;
    lastPurchaseDate?: string | Date;
}

interface UpdateData {
    quantity: number;
    updatedAt: Date;
    lastPurchasePrice?: number;
    costPerUnit?: number;
    lastPurchaseDate?: Date;
}

// GET /api/inventory/raw-materials/[id]
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

        const material = await RawMaterial.findOne({ _id: id, userId });

        if (!material) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(material);
    } catch (error) {
        const err = error as Error;
        console.error('Error in GET /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to fetch raw material', error: err.message },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/raw-materials/[id]
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
        const data: UpdateRawMaterialData = await request.json();

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
            costPerUnit: data.costPerUnit !== undefined ? parseFloat(String(data.costPerUnit)) : existing.costPerUnit,
            quantity: data.quantity !== undefined ? parseFloat(String(data.quantity)) : existing.quantity,
            minimumStock: data.minimumStock !== undefined ? parseInt(String(data.minimumStock), 10) : existing.minimumStock,
            shelf: data.shelf || existing.shelf,
            expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : existing.expiryDate,
            supplier: data.supplier !== undefined ? String(data.supplier).trim() : existing.supplier,
            supplierContact: data.supplierContact !== undefined ? String(data.supplierContact).trim() : existing.supplierContact,
            updatedAt: new Date()
        };

        const updatedMaterial = await RawMaterial.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedMaterial);
    } catch (error) {
        const err = error as Error;
        console.error('Error in PUT /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update raw material', error: err.message },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/raw-materials/[id]
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

        const material = await RawMaterial.findOneAndDelete({ _id: id, userId });

        if (!material) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Raw material deleted successfully' });
    } catch (error) {
        const err = error as Error;
        console.error('Error in DELETE /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to delete raw material', error: err.message },
            { status: 500 }
        );
    }
}

// PATCH /api/inventory/raw-materials/[id] - for updating quantity (stock adjustments)
export async function PATCH(
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
        const { quantity, operation, lastPurchasePrice, lastPurchaseDate }: PatchData = await request.json();

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
            newQuantity = material.quantity + parseFloat(String(quantity));
        } else if (operation === 'subtract') {
            newQuantity = Math.max(0, material.quantity - parseFloat(String(quantity)));
        } else if (operation === 'set') {
            newQuantity = parseFloat(String(quantity));
        }

        const updateData: UpdateData = {
            quantity: newQuantity,
            updatedAt: new Date()
        };

        // Update purchase info if provided (for restocking)
        if (lastPurchasePrice !== undefined) {
            updateData.lastPurchasePrice = parseFloat(String(lastPurchasePrice));
            updateData.costPerUnit = parseFloat(String(lastPurchasePrice)); // Update cost to latest price
        }
        if (lastPurchaseDate) {
            updateData.lastPurchaseDate = new Date(lastPurchaseDate);
        }

        const updatedMaterial = await RawMaterial.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedMaterial);
    } catch (error) {
        const err = error as Error;
        console.error('Error in PATCH /api/inventory/raw-materials/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update raw material quantity', error: err.message },
            { status: 500 }
        );
    }
}
