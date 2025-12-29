import dbConnect from '@/lib/mongodb';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/raw-materials
// Get all raw materials for the authenticated user
export async function GET(request) {
    console.log('GET /api/inventory/raw-materials - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        const materials = await RawMaterial.find({ userId }).sort({ createdAt: -1 });
        console.log(`Fetched ${materials.length} raw materials for user ${userId}`);

        return NextResponse.json(materials);
    } catch (error) {
        console.error('Error in GET /api/inventory/raw-materials:', error);
        return NextResponse.json(
            { message: 'Failed to fetch raw materials', error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/raw-materials
// Create a new raw material
export async function POST(request) {
    console.log('POST /api/inventory/raw-materials - Request received');

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
        const requiredFields = ['name', 'sku', 'costPerUnit', 'quantity', 'unit'];
        const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { message: 'Missing required fields', missingFields },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check for duplicate SKU
        const existing = await RawMaterial.findOne({ userId, sku: data.sku });
        if (existing) {
            return NextResponse.json(
                { message: 'A raw material with this SKU already exists' },
                { status: 400 }
            );
        }

        const material = new RawMaterial({
            userId,
            name: String(data.name).trim(),
            description: data.description ? String(data.description).trim() : '',
            sku: String(data.sku).trim(),
            category: data.category ? String(data.category).trim() : 'Uncategorized',
            unit: data.unit || 'pcs',
            costPerUnit: parseFloat(data.costPerUnit),
            quantity: parseFloat(data.quantity),
            minimumStock: data.minimumStock ? parseInt(data.minimumStock, 10) : 10,
            shelf: data.shelf || 'Default',
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            supplier: data.supplier ? String(data.supplier).trim() : '',
            supplierContact: data.supplierContact ? String(data.supplierContact).trim() : ''
        });

        const savedMaterial = await material.save();
        console.log('Raw material created successfully:', savedMaterial._id);

        return NextResponse.json(savedMaterial, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/inventory/raw-materials:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { message: 'A raw material with this SKU already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Failed to create raw material', error: error.message },
            { status: 500 }
        );
    }
}
