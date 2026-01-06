import dbConnect from '@/lib/mongodb';
import PurchaseHistory from '@/models/PurchaseHistory';
import PaymentReminder from '@/models/PaymentReminder';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/purchase-history/[id]
// Get a single purchase record by ID
export async function GET(request, { params }) {
    const { id } = params;
    console.log(`GET /api/inventory/purchase-history/${id} - Request received`);

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

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
        console.error(`Error in GET /api/inventory/purchase-history/${id}:`, error);
        return NextResponse.json(
            { message: 'Failed to fetch purchase record', error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/purchase-history/[id]
// Delete a purchase record
export async function DELETE(request, { params }) {
    const { id } = params;
    console.log(`DELETE /api/inventory/purchase-history/${id} - Request received`);

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        const purchase = await PurchaseHistory.findOneAndDelete({ _id: id, userId });

        if (!purchase) {
            return NextResponse.json(
                { message: 'Purchase record not found' },
                { status: 404 }
            );
        }

        console.log(`Purchase record ${id} deleted successfully`);

        return NextResponse.json({ message: 'Purchase record deleted successfully' });
    } catch (error) {
        console.error(`Error in DELETE /api/inventory/purchase-history/${id}:`, error);
        return NextResponse.json(
            { message: 'Failed to delete purchase record', error: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/purchase-history/[id]
// Update payment status of a purchase record
export async function PUT(request, { params }) {
    const { id } = params;
    console.log(`PUT /api/inventory/purchase-history/${id} - Request received`);

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const data = await request.json();

        await dbConnect();

        const updateData = {};

        // Update payment status
        if (data.isPaid !== undefined) {
            updateData.isPaid = data.isPaid;
        }

        // Update payment details
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

        // Update notes
        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        const purchase = await PurchaseHistory.findOneAndUpdate(
            { _id: id, userId },
            { $set: updateData },
            { new: true }
        );

        if (!purchase) {
            return NextResponse.json(
                { message: 'Purchase record not found' },
                { status: 404 }
            );
        }

        // If payment is marked as paid, cancel any active reminders
        if (data.isPaid === true) {
            const cancelledReminders = await PaymentReminder.updateMany(
                { purchaseId: id, status: 'active' },
                { $set: { status: 'completed' } }
            );
            console.log(`Cancelled ${cancelledReminders.modifiedCount} payment reminders for purchase ${id}`);
        }

        console.log(`Purchase record ${id} updated successfully`);

        return NextResponse.json(purchase);
    } catch (error) {
        console.error(`Error in PUT /api/inventory/purchase-history/${id}:`, error);
        return NextResponse.json(
            { message: 'Failed to update purchase record', error: error.message },
            { status: 500 }
        );
    }
}
