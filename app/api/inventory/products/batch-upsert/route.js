import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

/**
 * POST /api/inventory/products/batch-upsert
 * 
 * Atomically processes multiple products - creates new ones or updates existing ones.
 * Uses MongoDB's findOneAndUpdate with upsert:true for truly atomic operations.
 * 
 * Request body:
 * {
 *   items: [
 *     {
 *       name: string,
 *       sku: string (required),
 *       price: number (selling price),
 *       cost: number (cost price),
 *       quantity: number,
 *       category?: string,
 *       description?: string,
 *       shelf?: string,
 *       supplier?: string,
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
 *   results: [{ sku: string, action: 'created' | 'updated', product: object }]
 * }
 */
export async function POST(request) {
    console.log('POST /api/inventory/products/batch-upsert - Request received');

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
                consolidatedItems[sku].quantity += (parseInt(item.quantity, 10) || 0);
            } else {
                consolidatedItems[sku] = {
                    name: String(item.name || '').trim(),
                    description: item.description ? String(item.description).trim() : '',
                    sku: sku,
                    category: item.category ? String(item.category).trim() : 'Uncategorized',
                    price: parseFloat(item.price) || 0,  // Selling price
                    cost: parseFloat(item.cost) || 0,    // Cost price
                    quantity: parseInt(item.quantity, 10) || 0,
                    shelf: item.shelf || 'Default',
                    supplier: item.supplier ? String(item.supplier).trim() : '',
                    supplierContact: item.supplierContact ? String(item.supplierContact).trim() : '',
                    hsnCode: item.hsnCode ? String(item.hsnCode).trim() : '',
                    gstPercentage: parseFloat(item.gstPercentage) || 0,
                    expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                    invoiceNumber: item.invoiceNumber ? String(item.invoiceNumber).trim() : '',
                    invoiceDate: item.invoiceDate ? new Date(item.invoiceDate) : null
                };
            }
        }

        const skus = Object.keys(consolidatedItems);
        console.log(`Processing ${skus.length} unique SKUs from ${items.length} items`);

        const results = [];
        const errors = [];
        let createdCount = 0;
        let updatedCount = 0;

        // Process each consolidated item using atomic findOneAndUpdate with upsert
        for (const sku of skus) {
            const itemData = consolidatedItems[sku];

            try {
                // Build the $set object dynamically to avoid undefined values
                const setFields = {
                    updatedAt: new Date()
                };

                // Only set these if they have valid values
                if (itemData.price > 0) {
                    setFields.price = itemData.price;
                }
                if (itemData.cost > 0) {
                    setFields.cost = itemData.cost;
                }
                if (itemData.supplier) {
                    setFields.supplier = itemData.supplier;
                }
                if (itemData.supplierContact) {
                    setFields.supplierContact = itemData.supplierContact;
                }
                if (itemData.hsnCode) {
                    setFields.hsnCode = itemData.hsnCode;
                }
                if (itemData.gstPercentage > 0) {
                    setFields.gstPercentage = itemData.gstPercentage;
                }
                if (itemData.expiryDate) {
                    setFields.expiryDate = itemData.expiryDate;
                }
                if (itemData.invoiceNumber) {
                    setFields.invoiceNumber = itemData.invoiceNumber;
                }
                if (itemData.invoiceDate) {
                    setFields.invoiceDate = itemData.invoiceDate;
                }
                // Also update name if provided (in case product name changed)
                if (itemData.name) {
                    setFields.name = itemData.name;
                }

                // Use findOneAndUpdate with upsert for atomic operation
                // This prevents race conditions completely
                const result = await Product.findOneAndUpdate(
                    { userId, sku },
                    {
                        $setOnInsert: {
                            userId,
                            sku,
                            description: itemData.description,
                            category: itemData.category,
                            shelf: itemData.shelf,
                            createdAt: new Date()
                        },
                        $set: setFields,
                        $inc: {
                            quantity: itemData.quantity
                        }
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                        setDefaultsOnInsert: true
                    }
                );

                // Determine if this was a create or update by checking if quantity equals what we just added
                // If product was newly created, its quantity will exactly match itemData.quantity
                // If updated, quantity will be higher (existing + added)
                const wasCreated = result.quantity === itemData.quantity;

                if (wasCreated) {
                    // This was a new product
                    results.push({
                        sku,
                        action: 'created',
                        product: result
                    });
                    createdCount++;
                    console.log(`Created new product with SKU ${sku}, quantity: ${result.quantity}`);
                } else {
                    // This was an update (quantity was incremented)
                    const previousQuantity = result.quantity - itemData.quantity;
                    results.push({
                        sku,
                        action: 'updated',
                        product: result,
                        previousQuantity: previousQuantity,
                        addedQuantity: itemData.quantity,
                        newQuantity: result.quantity
                    });
                    updatedCount++;
                    console.log(`Updated SKU ${sku}: ${previousQuantity} + ${itemData.quantity} = ${result.quantity}`);
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
        console.error('Error in POST /api/inventory/products/batch-upsert:', error);
        return NextResponse.json(
            { message: 'Failed to process batch upsert', error: error.message },
            { status: 500 }
        );
    }
}
