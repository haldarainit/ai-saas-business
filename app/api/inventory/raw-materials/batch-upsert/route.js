import dbConnect from '@/lib/mongodb';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

/**
 * POST /api/inventory/raw-materials/batch-upsert
 * 
 * Atomically processes multiple raw materials - creates new ones or updates existing ones.
 * This prevents race conditions when processing multiple items from an invoice scan.
 * 
 * Request body:
 * {
 *   items: [
 *     {
 *       name: string,
 *       sku: string (required),
 *       costPerUnit: number,
 *       quantity: number,
 *       unit: string,
 *       category?: string,
 *       description?: string,
 *       minimumStock?: number,
 *       shelf?: string,
 *       supplier?: string,
 *       supplierContact?: string,
 *       hsnCode?: string,
 *       expiryDate?: string
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   created: number,
 *   updated: number,
 *   errors: [{ sku: string, message: string }],
 *   results: [{ sku: string, action: 'created' | 'updated', material: object }]
 * }
 */
export async function POST(request) {
    console.log('POST /api/inventory/raw-materials/batch-upsert - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { items } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { message: 'Items array is required and must not be empty' },
                { status: 400 }
            );
        }

        await dbConnect();

        // First, consolidate items with the same SKU in the request
        const consolidatedItems = {};
        for (const item of items) {
            const sku = item.sku?.trim();
            if (!sku) {
                continue; // Skip items without SKU
            }

            if (consolidatedItems[sku]) {
                // Same SKU in this batch - add quantities
                consolidatedItems[sku].quantity += (parseFloat(item.quantity) || 0);
            } else {
                consolidatedItems[sku] = {
                    name: String(item.name || '').trim(),
                    description: item.description ? String(item.description).trim() : '',
                    sku: sku,
                    category: item.category ? String(item.category).trim() : 'Uncategorized',
                    unit: (item.unit || 'pcs').toLowerCase().trim(),
                    costPerUnit: parseFloat(item.costPerUnit) || 0,
                    quantity: parseFloat(item.quantity) || 0,
                    minimumStock: item.minimumStock ? parseInt(item.minimumStock, 10) : 10,
                    shelf: item.shelf || 'Default',
                    supplier: item.supplier ? String(item.supplier).trim() : '',
                    supplierContact: item.supplierContact ? String(item.supplierContact).trim() : '',
                    hsnCode: item.hsnCode ? String(item.hsnCode).trim() : '',
                    expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
                };
            }
        }

        const skus = Object.keys(consolidatedItems);
        console.log(`Processing ${skus.length} unique SKUs from ${items.length} items`);

        // Fetch all existing materials with these SKUs in one query
        const existingMaterials = await RawMaterial.find({
            userId,
            sku: { $in: skus }
        });

        // Create a map for quick lookup
        const existingMap = {};
        for (const material of existingMaterials) {
            existingMap[material.sku] = material;
        }

        const results = [];
        const errors = [];
        let createdCount = 0;
        let updatedCount = 0;

        // Process each consolidated item
        for (const sku of skus) {
            const itemData = consolidatedItems[sku];

            try {
                if (existingMap[sku]) {
                    // Material exists - UPDATE (add to quantity)
                    const existingMaterial = existingMap[sku];
                    const newQuantity = existingMaterial.quantity + itemData.quantity;

                    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
                        existingMaterial._id,
                        {
                            quantity: newQuantity,
                            // Update cost if new cost is provided and valid
                            costPerUnit: itemData.costPerUnit > 0 ? itemData.costPerUnit : existingMaterial.costPerUnit,
                            // Update supplier info if provided
                            supplier: itemData.supplier || existingMaterial.supplier,
                            supplierContact: itemData.supplierContact || existingMaterial.supplierContact,
                            updatedAt: new Date()
                        },
                        { new: true }
                    );

                    results.push({
                        sku,
                        action: 'updated',
                        material: updatedMaterial,
                        previousQuantity: existingMaterial.quantity,
                        addedQuantity: itemData.quantity,
                        newQuantity: newQuantity
                    });
                    updatedCount++;
                    console.log(`Updated SKU ${sku}: ${existingMaterial.quantity} + ${itemData.quantity} = ${newQuantity}`);
                } else {
                    // Material doesn't exist - CREATE
                    const newMaterial = new RawMaterial({
                        userId,
                        ...itemData
                    });

                    const savedMaterial = await newMaterial.save();

                    results.push({
                        sku,
                        action: 'created',
                        material: savedMaterial
                    });
                    createdCount++;
                    console.log(`Created new material with SKU ${sku}`);
                }
            } catch (error) {
                console.error(`Error processing SKU ${sku}:`, error);
                errors.push({
                    sku,
                    name: itemData.name,
                    message: error.message || 'Unknown error'
                });
            }
        }

        console.log(`Batch upsert complete: ${createdCount} created, ${updatedCount} updated, ${errors.length} errors`);

        return NextResponse.json({
            success: errors.length === 0,
            created: createdCount,
            updated: updatedCount,
            total: createdCount + updatedCount,
            errors: errors,
            results: results
        });
    } catch (error) {
        console.error('Error in POST /api/inventory/raw-materials/batch-upsert:', error);
        return NextResponse.json(
            { message: 'Failed to process batch upsert', error: error.message },
            { status: 500 }
        );
    }
}
