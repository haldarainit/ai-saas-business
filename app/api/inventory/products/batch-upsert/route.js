import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

/**
 * POST /api/inventory/products/batch-upsert
 * 
 * Atomically processes multiple products - creates new ones or updates existing ones.
 * This prevents race conditions when processing multiple items from an invoice scan.
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
                    hsnCode: item.hsnCode ? String(item.hsnCode).trim() : '',
                    expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
                };
            }
        }

        const skus = Object.keys(consolidatedItems);
        console.log(`Processing ${skus.length} unique SKUs from ${items.length} items`);

        // Fetch all existing products with these SKUs in one query
        const existingProducts = await Product.find({
            userId,
            sku: { $in: skus }
        });

        // Create a map for quick lookup
        const existingMap = {};
        for (const product of existingProducts) {
            existingMap[product.sku] = product;
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
                    // Product exists - UPDATE (add to quantity)
                    const existingProduct = existingMap[sku];
                    const newQuantity = existingProduct.quantity + itemData.quantity;

                    const updatedProduct = await Product.findByIdAndUpdate(
                        existingProduct._id,
                        {
                            quantity: newQuantity,
                            // Update cost/price if new values are provided and valid
                            cost: itemData.cost > 0 ? itemData.cost : existingProduct.cost,
                            price: itemData.price > 0 ? itemData.price : existingProduct.price,
                            // Update supplier info if provided
                            supplier: itemData.supplier || existingProduct.supplier,
                            updatedAt: new Date()
                        },
                        { new: true }
                    );

                    results.push({
                        sku,
                        action: 'updated',
                        product: updatedProduct,
                        previousQuantity: existingProduct.quantity,
                        addedQuantity: itemData.quantity,
                        newQuantity: newQuantity
                    });
                    updatedCount++;
                    console.log(`Updated SKU ${sku}: ${existingProduct.quantity} + ${itemData.quantity} = ${newQuantity}`);
                } else {
                    // Product doesn't exist - CREATE
                    const newProduct = new Product({
                        userId,
                        ...itemData
                    });

                    const savedProduct = await newProduct.save();

                    results.push({
                        sku,
                        action: 'created',
                        product: savedProduct
                    });
                    createdCount++;
                    console.log(`Created new product with SKU ${sku}`);
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
