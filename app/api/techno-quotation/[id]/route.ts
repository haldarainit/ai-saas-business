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
        console.log('=== GET /api/techno-quotation ===');
        console.log('Loading companyDetails.logo:', quotation.companyDetails?.logo ? 'URL present' : 'NO LOGO');
        console.log('Loading contentBlocks count:', quotation.contentBlocks?.length || 0);
        console.log('Loading contentBlocks order:', quotation.contentBlocks?.map((b: any) => `${b.id}:${b.type}`) || 'NONE');
        console.log('Loading footer.line1Style:', JSON.stringify(quotation.footer?.line1Style || 'NOT SET'));
        console.log('Loading companyDetails.nameStyle.fontSize:', quotation.companyDetails?.nameStyle?.fontSize || 'NOT SET');

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
        console.log('=== PUT /api/techno-quotation ===');
        console.log('Saving companyDetails.logo:', body.companyDetails?.logo ? 'URL present' : 'NO LOGO');
        console.log('Saving contentBlocks count:', body.contentBlocks?.length || 0);
        console.log('Saving contentBlocks order:', body.contentBlocks?.map((b: any) => `${b.id}:${b.type}`) || 'NONE');
        console.log('Saving footer.line1Style:', JSON.stringify(body.footer?.line1Style || 'NOT SET'));
        console.log('Saving companyDetails.nameStyle:', JSON.stringify(body.companyDetails?.nameStyle || 'NOT SET'));

        const quotation = await TechnoQuotation.findOneAndUpdate(
            { _id: id, userId: userId },
            { $set: body },
            { new: true, runValidators: false }
        );

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        // Debug: Log what was saved (from DB)
        console.log('=== SAVED TO DB ===');
        console.log('Saved contentBlocks count:', quotation.contentBlocks?.length || 0);
        console.log('Saved companyDetails.logo:', quotation.companyDetails?.logo ? 'URL present' : 'NO LOGO');
        console.log('Saved companyDetails.nameStyle.fontSize:', quotation.companyDetails?.nameStyle?.fontSize || 'NOT SET');

        return NextResponse.json({ quotation });
    } catch (error) {
        console.error('Error updating quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/techno-quotation/[id] → Duplicate/Copy a quotation
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await dbConnect();

        const original = await TechnoQuotation.findOne({ _id: id, userId });
        if (!original) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

        const originalObj = original.toObject();
        delete originalObj._id;
        delete originalObj.__v;
        originalObj.title = `Copy of ${original.title}`;
        originalObj.userId = userId;
        originalObj.createdAt = new Date();
        originalObj.updatedAt = new Date();
        originalObj.status = 'draft';

        const copy = await TechnoQuotation.create(originalObj);
        return NextResponse.json({ quotation: copy });
    } catch (error) {
        console.error('Error duplicating quotation:', error);
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
