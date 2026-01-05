import dbConnect from '@/lib/mongodb';
import PurchaseHistory from '@/models/PurchaseHistory';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/purchase-history
// Get all purchase history for the authenticated user
export async function GET(request) {
    console.log('GET /api/inventory/purchase-history - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const purchaseType = searchParams.get('type') || 'manufacturing';
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const skip = (page - 1) * limit;

        const query = { userId };
        if (purchaseType !== 'all') {
            query.purchaseType = purchaseType;
        }

        const [purchases, total] = await Promise.all([
            PurchaseHistory.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            PurchaseHistory.countDocuments(query)
        ]);

        console.log(`Fetched ${purchases.length} purchase records for user ${userId}`);

        return NextResponse.json({
            purchases,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in GET /api/inventory/purchase-history:', error);
        return NextResponse.json(
            { message: 'Failed to fetch purchase history', error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/purchase-history
// Create a new purchase record
export async function POST(request) {
    console.log('POST /api/inventory/purchase-history - Request received');

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
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            return NextResponse.json(
                { message: 'Items array is required and must not be empty' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Calculate totals if not provided
        const itemCount = data.items.length;
        const totalValue = data.totalValue || data.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

        const purchase = new PurchaseHistory({
            userId,
            purchaseType: data.purchaseType || 'manufacturing',
            items: data.items.map(item => ({
                name: item.name || '',
                sku: item.sku || '',
                quantity: item.quantity || 0,
                unit: item.unit || 'pcs',
                basePrice: item.basePrice || 0,
                costPerUnit: item.costPerUnit || item.basePrice || 0,
                gstPercentage: item.gstPercentage || 0,
                gstAmount: item.gstAmount || 0,
                totalCost: item.totalCost || 0,
                category: item.category || 'Uncategorized',
                hsnCode: item.hsnCode || ''
            })),
            itemCount,
            totalValue,
            supplier: data.supplier ? {
                name: data.supplier.name || '',
                gstin: data.supplier.gstin || '',
                contact: data.supplier.contact || '',
                address: data.supplier.address || ''
            } : null,
            isPaid: data.isPaid || false,
            paymentDetails: data.isPaid && data.paymentDetails ? {
                method: data.paymentDetails.method || 'cash',
                transactionId: data.paymentDetails.transactionId || '',
                bankName: data.paymentDetails.bankName || '',
                accountNumber: data.paymentDetails.accountNumber || '',
                chequeNumber: data.paymentDetails.chequeNumber || '',
                chequeDate: data.paymentDetails.chequeDate || null,
                upiId: data.paymentDetails.upiId || '',
                notes: data.paymentDetails.notes || ''
            } : null,
            invoiceNumber: data.invoiceNumber || '',
            invoiceDate: data.invoiceDate || null,
            notes: data.notes || ''
        });

        const savedPurchase = await purchase.save();
        console.log('Purchase record created successfully:', savedPurchase._id);

        return NextResponse.json(savedPurchase, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/inventory/purchase-history:', error);
        return NextResponse.json(
            { message: 'Failed to create purchase record', error: error.message },
            { status: 500 }
        );
    }
}
