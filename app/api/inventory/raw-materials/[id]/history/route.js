import dbConnect from '@/lib/mongodb';
import ProductionLog from '@/models/ProductionLog';
import ManufacturingProduct from '@/models/ManufacturingProduct';
import RawMaterial from '@/models/RawMaterial';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/raw-materials/[id]/history
// Get complete usage history of a specific raw material
export async function GET(request, { params }) {
    console.log('GET /api/inventory/raw-materials/[id]/history - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { message: 'Raw material ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fetch the raw material
        const rawMaterial = await RawMaterial.findOne({ _id: id, userId });
        if (!rawMaterial) {
            return NextResponse.json(
                { message: 'Raw material not found' },
                { status: 404 }
            );
        }

        // Get URL params for pagination/filtering
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query for production logs that consumed this material
        let logQuery = {
            userId,
            'materialsConsumed.rawMaterialId': id
        };

        if (startDate || endDate) {
            logQuery.productionDate = {};
            if (startDate) logQuery.productionDate.$gte = new Date(startDate);
            if (endDate) logQuery.productionDate.$lte = new Date(endDate);
        }

        // Fetch production logs where this material was consumed
        const productionLogs = await ProductionLog.find(logQuery)
            .sort({ productionDate: -1 })
            .limit(limit);

        // Get all products that use this material in their BOM
        const productsUsingMaterial = await ManufacturingProduct.find({
            userId,
            'billOfMaterials.rawMaterialId': id
        }).select('name sku category billOfMaterials sellingPrice totalCost finishedQuantity');

        // Process the logs to extract only this material's consumption data
        const usageHistory = productionLogs.map(log => {
            const materialConsumed = log.materialsConsumed.find(
                m => m.rawMaterialId.toString() === id
            );

            return {
                _id: log._id,
                type: 'production',
                productId: log.productId,
                productName: log.productName,
                productSku: log.productSku,
                batchNumber: log.batchNumber,
                quantityConsumed: materialConsumed?.quantityConsumed || 0,
                unit: materialConsumed?.unit || rawMaterial.unit,
                costPerUnit: materialConsumed?.costPerUnit || rawMaterial.costPerUnit,
                totalCost: materialConsumed?.totalCost || 0,
                productQuantityProduced: log.quantityProduced,
                totalProductionCost: log.totalProductionCost,
                status: log.status,
                notes: log.notes,
                productionDate: log.productionDate,
                createdAt: log.createdAt
            };
        });

        // Calculate summary statistics
        const totalConsumed = usageHistory.reduce((sum, h) => sum + h.quantityConsumed, 0);
        const totalCost = usageHistory.reduce((sum, h) => sum + h.totalCost, 0);
        const uniqueProducts = [...new Set(usageHistory.map(h => h.productId.toString()))].length;
        const totalBatches = usageHistory.length;

        // Get product usage breakdown
        const productUsageBreakdown = {};
        usageHistory.forEach(h => {
            const prodKey = h.productId.toString();
            if (!productUsageBreakdown[prodKey]) {
                productUsageBreakdown[prodKey] = {
                    productId: h.productId,
                    productName: h.productName,
                    productSku: h.productSku,
                    totalQuantityUsed: 0,
                    totalCost: 0,
                    batches: 0,
                    lastUsed: h.productionDate
                };
            }
            productUsageBreakdown[prodKey].totalQuantityUsed += h.quantityConsumed;
            productUsageBreakdown[prodKey].totalCost += h.totalCost;
            productUsageBreakdown[prodKey].batches += 1;
            if (new Date(h.productionDate) > new Date(productUsageBreakdown[prodKey].lastUsed)) {
                productUsageBreakdown[prodKey].lastUsed = h.productionDate;
            }
        });

        // Convert to array and sort by total usage
        const productUsageArray = Object.values(productUsageBreakdown)
            .sort((a, b) => b.totalQuantityUsed - a.totalQuantityUsed);

        // Build monthly usage trend (last 12 months)
        const monthlyTrend = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend[key] = { month: key, quantityUsed: 0, cost: 0, batches: 0 };
        }

        usageHistory.forEach(h => {
            const date = new Date(h.productionDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyTrend[key]) {
                monthlyTrend[key].quantityUsed += h.quantityConsumed;
                monthlyTrend[key].cost += h.totalCost;
                monthlyTrend[key].batches += 1;
            }
        });

        const monthlyTrendArray = Object.values(monthlyTrend);

        console.log(`Fetched usage history for raw material ${rawMaterial.name}: ${totalBatches} batches`);

        return NextResponse.json({
            rawMaterial: {
                _id: rawMaterial._id,
                name: rawMaterial.name,
                sku: rawMaterial.sku,
                category: rawMaterial.category,
                unit: rawMaterial.unit,
                costPerUnit: rawMaterial.costPerUnit,
                currentStock: rawMaterial.quantity,
                minimumStock: rawMaterial.minimumStock
            },
            summary: {
                totalConsumed,
                totalCost,
                uniqueProducts,
                totalBatches,
                avgConsumptionPerBatch: totalBatches > 0 ? totalConsumed / totalBatches : 0,
                avgCostPerBatch: totalBatches > 0 ? totalCost / totalBatches : 0
            },
            productsUsingMaterial: productsUsingMaterial.map(p => {
                const bomItem = p.billOfMaterials.find(b => b.rawMaterialId.toString() === id);
                return {
                    _id: p._id,
                    name: p.name,
                    sku: p.sku,
                    category: p.category,
                    quantityRequiredPerUnit: bomItem?.quantityRequired || 0,
                    unit: bomItem?.unit || rawMaterial.unit,
                    sellingPrice: p.sellingPrice,
                    totalCost: p.totalCost,
                    finishedQuantity: p.finishedQuantity
                };
            }),
            productUsageBreakdown: productUsageArray,
            monthlyTrend: monthlyTrendArray,
            usageHistory
        });
    } catch (error) {
        console.error('Error in GET /api/inventory/raw-materials/[id]/history:', error);
        return NextResponse.json(
            { message: 'Failed to fetch raw material history', error: error.message },
            { status: 500 }
        );
    }
}
