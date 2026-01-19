import dbConnect from '@/lib/mongodb';
import PurchaseHistory from '@/models/PurchaseHistory';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface PaymentDetails {
    method?: string;
    transactionId?: string;
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    chequeDate?: string | Date | null;
    upiId?: string;
    notes?: string;
}

interface UpdatePurchaseData {
    isPaid?: boolean;
    paymentDetails?: PaymentDetails;
    notes?: string;
}

// GET /api/inventory/purchase-history/[id]
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

        const purchase = await PurchaseHistory.findOne({ _id: id, userId });

        if (!purchase) {
            return NextResponse.json(
                { message: 'Purchase record not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(purchase);
    } catch (error) {
        const err = error as Error;
        console.error('Error in GET /api/inventory/purchase-history/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to fetch purchase record', error: err.message },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/purchase-history/[id]
// Update payment status and details
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
        const data: UpdatePurchaseData = await request.json();

        await dbConnect();

        const existing = await PurchaseHistory.findOne({ _id: id, userId });
        if (!existing) {
            return NextResponse.json(
                { message: 'Purchase record not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {
            updatedAt: new Date()
        };

        if (data.isPaid !== undefined) {
            updateData.isPaid = data.isPaid;
            if (data.isPaid) {
                updateData.paidAt = new Date();
            }
        }

        if (data.paymentDetails) {
            updateData.paymentDetails = {
                method: data.paymentDetails.method || 'cash',
                transactionId: data.paymentDetails.transactionId || '',
                bankName: data.paymentDetails.bankName || '',
                accountNumber: data.paymentDetails.accountNumber || '',
                chequeNumber: data.paymentDetails.chequeNumber || '',
                chequeDate: data.paymentDetails.chequeDate || null,
                upiId: data.paymentDetails.upiId || '',
                notes: data.paymentDetails.notes || ''
            };
        }

        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        const updatedPurchase = await PurchaseHistory.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return NextResponse.json(updatedPurchase);
    } catch (error) {
        const err = error as Error;
        console.error('Error in PUT /api/inventory/purchase-history/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to update purchase record', error: err.message },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/purchase-history/[id]
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

        const purchase = await PurchaseHistory.findOneAndDelete({ _id: id, userId });

        if (!purchase) {
            return NextResponse.json(
                { message: 'Purchase record not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Purchase record deleted successfully' });
    } catch (error) {
        const err = error as Error;
        console.error('Error in DELETE /api/inventory/purchase-history/[id]:', error);
        return NextResponse.json(
            { message: 'Failed to delete purchase record', error: err.message },
            { status: 500 }
        );
    }
}
