import dbConnect from '@/lib/mongodb';
import PurchaseHistory from '@/models/PurchaseHistory';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// POST /api/inventory/purchase-history/notify-pending
// Send notifications for pending payment purchases
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('POST /api/inventory/purchase-history/notify-pending - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find all pending purchases for this user
        const pendingPurchases = await PurchaseHistory.find({
            userId,
            isPaid: false
        }).sort({ createdAt: -1 });

        console.log(`Found ${pendingPurchases.length} pending purchases for user ${userId}`);

        // Calculate totals
        const totalPendingAmount = pendingPurchases.reduce(
            (sum, p) => sum + (p.totalValue || 0),
            0
        );

        // Group by supplier
        const supplierBreakdown: Record<string, { count: number; total: number; supplier: string }> = {};
        pendingPurchases.forEach(purchase => {
            const supplierName = purchase.supplier?.name || 'Unknown Supplier';
            if (!supplierBreakdown[supplierName]) {
                supplierBreakdown[supplierName] = {
                    count: 0,
                    total: 0,
                    supplier: supplierName
                };
            }
            supplierBreakdown[supplierName].count += 1;
            supplierBreakdown[supplierName].total += purchase.totalValue || 0;
        });

        return NextResponse.json({
            success: true,
            message: `Found ${pendingPurchases.length} pending payments`,
            summary: {
                totalPending: pendingPurchases.length,
                totalAmount: totalPendingAmount,
                supplierBreakdown: Object.values(supplierBreakdown)
            },
            purchases: pendingPurchases.map(p => ({
                _id: p._id,
                invoiceNumber: p.invoiceNumber,
                supplier: p.supplier?.name || 'Unknown',
                totalValue: p.totalValue,
                itemCount: p.itemCount,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        const err = error as Error;
        console.error('Error in POST /api/inventory/purchase-history/notify-pending:', error);
        return NextResponse.json(
            { message: 'Failed to fetch pending purchases', error: err.message },
            { status: 500 }
        );
    }
}

// GET /api/inventory/purchase-history/notify-pending
// Get summary of pending payments
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log('GET /api/inventory/purchase-history/notify-pending - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        const pendingCount = await PurchaseHistory.countDocuments({
            userId,
            isPaid: false
        });

        const pendingPurchases = await PurchaseHistory.find({
            userId,
            isPaid: false
        }).select('totalValue supplier.name invoiceNumber createdAt');

        const totalPendingAmount = pendingPurchases.reduce(
            (sum, p) => sum + (p.totalValue || 0),
            0
        );

        return NextResponse.json({
            pendingCount,
            totalPendingAmount,
            oldestPending: pendingPurchases.length > 0 ? pendingPurchases[pendingPurchases.length - 1] : null
        });
    } catch (error) {
        const err = error as Error;
        console.error('Error in GET /api/inventory/purchase-history/notify-pending:', error);
        return NextResponse.json(
            { message: 'Failed to fetch pending summary', error: err.message },
            { status: 500 }
        );
    }
}
