import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnoQuotation from '@/models/TechnoQuotation';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const quotation = await TechnoQuotation.findOne({
            _id: id,
            userId: userId
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        // Debug: Log what's being loaded
        console.log('GET /api/techno-quotation - Loading companyDetails.logo:', quotation.companyDetails?.logo ? 'URL present' : 'NO LOGO');
        console.log('GET /api/techno-quotation - companyDetails:', quotation.companyDetails ? JSON.stringify(Object.keys(quotation.companyDetails)) : 'none');

        return NextResponse.json({ quotation });
    } catch (error) {
        console.error('Error fetching quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const body = await req.json();

        // Debug: Log what's being saved
        console.log('PUT /api/techno-quotation - Saving companyDetails.logo:', body.companyDetails?.logo ? 'URL present' : 'NO LOGO');
        console.log('PUT /api/techno-quotation - companyDetails keys:', body.companyDetails ? Object.keys(body.companyDetails) : 'none');

        const quotation = await TechnoQuotation.findOneAndUpdate(
            { _id: id, userId: userId },
            { $set: body },
            { new: true }
        );

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        // Debug: Log what was saved
        console.log('PUT /api/techno-quotation - Saved companyDetails.logo:', quotation.companyDetails?.logo ? 'URL present' : 'NO LOGO');

        return NextResponse.json({ quotation });
    } catch (error) {
        console.error('Error updating quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const quotation = await TechnoQuotation.findOneAndDelete({
            _id: id,
            userId: userId
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error('Error deleting quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
