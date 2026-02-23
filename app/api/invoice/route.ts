import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import CompanyProfile from '@/models/CompanyProfile';
import Counter from '@/models/Counter';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// Helper to get next sequence number
async function getNextSequence(userId: string, entity: string) {
    const ret = await Counter.findOneAndUpdate(
        { userId, entity },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return ret.seq;
}

// GET: List all invoices for the user with Pagination
export async function GET(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const invoices = await Invoice.find({ userId })
            .select('invoiceNumber clientDetails companyDetails invoiceDate financials items updatedAt status sourceQuotationId')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Invoice.countDocuments({ userId });

        return NextResponse.json({ 
            invoices,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
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

        // 1. Generate Sequential Invoice Number
        let invoiceNumber = body.invoiceNumber;
        if (!invoiceNumber) {
            const seq = await getNextSequence(userId, 'invoice');
            // Format: INV-0001
            invoiceNumber = `INV-${seq.toString().padStart(4, '0')}`;
        }

        // 2. Fetch User's Company Profile (Default or First)
        const companyProfile = await CompanyProfile.findOne({ 
            userId, 
            $or: [{ isDefault: true }, {}] 
        }).sort({ isDefault: -1, createdAt: -1 });

        // Default initial structure
        const defaultInvoice = {
            userId: userId,
            invoiceNumber: invoiceNumber,
            title: body.title || "TAX INVOICE",
            // Populate from Company Profile if available (including legal & statutory details)
            companyDetails: companyProfile ? {
                name: companyProfile.name,
                address: [companyProfile.address1, companyProfile.address2].filter(Boolean).join(', '),
                city: '',
                state: '', 
                pincode: '', 
                email: companyProfile.email || '',
                phone: companyProfile.phone || '',
                gstin: companyProfile.gstin || '',
                pan: companyProfile.pan || '',
                cin: companyProfile.cin || '',
                tan: companyProfile.tan || '',
                stateCode: companyProfile.stateCode || '',
                msmeNumber: companyProfile.msmeNumber || '',
                logo: companyProfile.logo || ''
            } : {
                name: 'Your Company Name'
            },
            bankDetails: companyProfile ? {
                bankName: companyProfile.bankName,
                accountNumber: companyProfile.bankAccountNo,
                ifscCode: companyProfile.bankIFSC,
                branch: companyProfile.bankBranch
            } : {},
            // Default Items with 0 Tax (Smart Logic)
            items: [{
                id: "1",
                description: "",
                quantity: 1,
                rate: 0,
                discount: 0,
                // Defaulting to 0 tax as requested
                taxRate: 0,
                cgstPercent: 0,
                sgstPercent: 0,
                cgst: 0,
                sgst: 0,
                totalGst: 0
            }],
            settings: {
                // Toggle IGST vs CGST/SGST defaults to 'None' or user pref, let's start with None or GST based on profile?
                // Request said "default tax fields to 0 ... Add a toggle". 
                // We set taxType to 'None' by default so user consciously enables it.
                taxType: 'None', 
                currency: 'INR',
                currencySymbol: '₹'
            },
            terms: {
                termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
                authorizedSignatory: companyProfile?.authorizedSignatory || ''
            }
        };

        const invoice = await Invoice.create({
            ...defaultInvoice,
            ...body, // Overwrite with any provided body params
            userId: userId,
            invoiceNumber: invoiceNumber, // Ensure generated number is used if not provided in body
            companyDetails: {
                 ...defaultInvoice.companyDetails,
                 ...(body.companyDetails || {})
            }
        });

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
