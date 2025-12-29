import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CompanyProfile from '@/models/CompanyProfile';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

export async function GET() {
    try {
        const { userId } = await getAuthenticatedUser();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const profiles = await CompanyProfile.find({ userId }).sort({ createdAt: -1 });

        return NextResponse.json({ profiles });
    } catch (error) {
        console.error('Error fetching company profiles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Validation: Name is required
        if (!body.name) {
            return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
        }

        await dbConnect();

        // If this is the first profile, make it default
        const count = await CompanyProfile.countDocuments({ userId });
        const isDefault = body.isDefault || count === 0;

        const profile = await CompanyProfile.create({
            userId,
            ...body,
            isDefault
        });

        return NextResponse.json({ profile }, { status: 201 });
    } catch (error) {
        console.error('Error saving company profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
