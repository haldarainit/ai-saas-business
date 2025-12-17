import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET: List all invoices for the user
export async function GET(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const invoices = await Invoice.find({ userId })
            .select('invoiceNumber clientDetails companyDetails invoiceDate financials items updatedAt status sourceQuotationId')
            .sort({ updatedAt: -1 });

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new invoice
export async function POST(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // Default initial structure if not provided
        const defaultInvoice = {
            userId: userId,
            invoiceNumber: body.invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            title: body.title || "TAX INVOICE",
            companyDetails: {
                name: 'Your Company Name'
            },
            items: [{
                id: "1",
                description: "",
                quantity: 1,
                rate: 0,
                discount: 0,
                taxRate: 18,
                cgstPercent: 9,
                sgstPercent: 9,
                cgst: 0,
                sgst: 0,
                totalGst: 0
            }],
            terms: {
                termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
            }
        };

        const invoice = await Invoice.create({
            ...defaultInvoice,
            ...body,
            userId: userId // Ensure userId is enforced
        });

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
