import dbConnect from '@/lib/mongodb';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface RawMaterialItem {
    name?: string;
    sku?: string;
    costPerUnit?: number | string;
    quantity?: number | string;
    unit?: string;
    description?: string;
    category?: string;
    minimumStock?: number | string;
    shelf?: string;
    supplier?: string;
    supplierContact?: string;
    gstin?: string;
    hsnCode?: string;
    gstPercentage?: number | string;
    expiryDate?: string | Date;
    invoiceNumber?: string;
    invoiceDate?: string | Date;
    // Additional fields for price derivation
    totalCost?: number | string;
    basePrice?: number | string;
    gstAmount?: number | string;
}

interface BatchUpsertRequest {
    items: RawMaterialItem[];
}

interface ConsolidatedItem {
    name: string;
    description: string;
    sku: string;
    category: string;
    unit: string;
    costPerUnit: number;
    quantity: number;
    minimumStock: number;
    shelf: string;
    supplier: string;
    supplierContact: string;
    gstin: string;
    hsnCode: string;
    gstPercentage: number;
    expiryDate: Date | null;
    invoiceNumber: string;
    invoiceDate: Date | null;
    lastPurchaseDate: Date;
    lastPurchasePrice: number;
}

interface UpsertResult {
    sku: string;
    action: 'created' | 'updated';
    material: unknown;
    previousQuantity?: number;
    addedQuantity?: number;
    newQuantity?: number;
}

interface UpsertError {
    sku: string;
    name: string;
    message: string;
}

interface ExistingMaterial {
    _id: string;
    sku: string;
    quantity: number;
    costPerUnit: number;
    supplier: string;
    supplierContact: string;
    gstin: string;
    hsnCode: string;
    gstPercentage: number;
    invoiceNumber: string;
    invoiceDate: Date | null;
    lastPurchasePrice: number;
}

/**
 * POST /api/inventory/raw-materials/batch-upsert
 * 
 * Atomically processes multiple raw materials - creates new ones or updates existing ones.
 * This prevents race conditions when processing multiple items from an invoice scan.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('POST /api/inventory/raw-materials/batch-upsert - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { items }: BatchUpsertRequest = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { message: 'Items array is required and must not be empty' },
                { status: 400 }
            );
        }

        await dbConnect();

        // First, consolidate items with the same SKU in the request
        const consolidatedItems: Record<string, ConsolidatedItem> = {};
        for (const item of items) {
            const sku = item.sku?.trim();
            if (!sku) {
                continue; // Skip items without SKU
            }

            if (consolidatedItems[sku]) {
                // Same SKU in this batch - add quantities
                consolidatedItems[sku].quantity += (parseFloat(String(item.quantity)) || 0);
            } else {
                // Parse all price-related fields
                const quantity = parseFloat(String(item.quantity)) || 1;
                const directCostPerUnit = parseFloat(String(item.costPerUnit)) || 0;
                const totalCost = parseFloat(String(item.totalCost)) || 0;
                const basePrice = parseFloat(String(item.basePrice)) || 0;
                const gstAmount = parseFloat(String(item.gstAmount)) || 0;

                // Derive costPerUnit with fallback chain:
                // 1. Direct costPerUnit
                // 2. basePrice + gstAmount
                // 3. totalCost / quantity
                const calculatedFromBase = basePrice > 0 ? (basePrice + gstAmount) : 0;
                const derivedFromTotal = (totalCost > 0 && quantity > 0) ? (totalCost / quantity) : 0;
                const finalCostPerUnit = directCostPerUnit || calculatedFromBase || derivedFromTotal;

                consolidatedItems[sku] = {
                    name: String(item.name || '').trim(),
                    description: item.description ? String(item.description).trim() : '',
                    sku: sku,
                    category: item.category ? String(item.category).trim() : 'Uncategorized',
                    unit: (item.unit || 'pcs').toLowerCase().trim(),
                    costPerUnit: finalCostPerUnit,
                    quantity: quantity,
                    minimumStock: item.minimumStock ? parseInt(String(item.minimumStock), 10) : 10,
                    shelf: item.shelf ? String(item.shelf) : 'Default',
                    supplier: item.supplier ? String(item.supplier).trim() : '',
                    supplierContact: item.supplierContact ? String(item.supplierContact).trim() : '',
                    gstin: item.gstin ? String(item.gstin).trim() : '',
                    hsnCode: item.hsnCode ? String(item.hsnCode).trim() : '',
                    gstPercentage: parseFloat(String(item.gstPercentage)) || 0,
                    expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                    invoiceNumber: item.invoiceNumber ? String(item.invoiceNumber).trim() : '',
                    invoiceDate: item.invoiceDate ? new Date(item.invoiceDate) : null,
                    lastPurchaseDate: new Date(),
                    lastPurchasePrice: finalCostPerUnit
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
        const existingMap: Record<string, ExistingMaterial> = {};
        for (const material of existingMaterials) {
            existingMap[material.sku] = material;
        }

        const results: UpsertResult[] = [];
        const errors: UpsertError[] = [];
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
                            // Update GSTIN if provided
                            gstin: itemData.gstin || existingMaterial.gstin,
                            // Update HSN code and GST percentage if provided
                            hsnCode: itemData.hsnCode || existingMaterial.hsnCode,
                            gstPercentage: itemData.gstPercentage > 0 ? itemData.gstPercentage : existingMaterial.gstPercentage,
                            // Update invoice info if provided
                            invoiceNumber: itemData.invoiceNumber || existingMaterial.invoiceNumber,
                            invoiceDate: itemData.invoiceDate || existingMaterial.invoiceDate,
                            // Update purchase tracking
                            lastPurchaseDate: new Date(),
                            lastPurchasePrice: itemData.costPerUnit > 0 ? itemData.costPerUnit : existingMaterial.lastPurchasePrice,
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
                const err = error as Error;
                console.error(`Error processing SKU ${sku}:`, error);
                errors.push({
                    sku,
                    name: itemData.name,
                    message: err.message || 'Unknown error'
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
        const err = error as Error;
        console.error('Error in POST /api/inventory/raw-materials/batch-upsert:', error);
        return NextResponse.json(
            { message: 'Failed to process batch upsert', error: err.message },
            { status: 500 }
        );
    }
}
