import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import dbConnect from '@/lib/mongodb';
import CompanyProfile from '@/models/CompanyProfile';

// GET - Fetch all company profiles for the current user
export async function GET(request: NextRequest) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            console.log('GET /api/company-profile: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const profiles = await CompanyProfile.find({ userId })
            .sort({ isDefault: -1, name: 1 })
            .lean();

        return NextResponse.json({ profiles });
    } catch (error) {
        console.error('Error fetching company profiles:', error);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
}

// POST - Create a new company profile
export async function POST(request: NextRequest) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            console.log('POST /api/company-profile: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('Creating company profile for userId:', userId, 'with name:', body.name);

        const {
            name, address1, address2, phone, email, logo, isDefault,
            gstin, pan, website,
            cin, tan, msmeNumber, msmeCategory, incorporationDate,
            incorporationCertUrl, moaUrl, aoaUrl, gstCertUrl, msmeCertUrl, stateCode,
            bankName, bankAccountNo, bankIFSC, bankBranch,
            authorizedSignatory, signatoryDesignation,
            footerLine1, footerLine2, footerLine3,
            headerLineColor, headerValueColor, footerLineColor, footerTextColor
        } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
        }

        await dbConnect();

        // If this is set as default, unset any existing default
        if (isDefault) {
            await CompanyProfile.updateMany(
                { userId },
                { isDefault: false }
            );
        }

        const profile = await CompanyProfile.create({
            userId,
            name: name.trim(),
            address1,
            address2,
            phone,
            email,
            logo,
            gstin,
            pan,
            website,
            // Legal & Statutory
            cin,
            tan,
            msmeNumber,
            msmeCategory,
            incorporationDate,
            incorporationCertUrl,
            moaUrl,
            aoaUrl,
            gstCertUrl,
            msmeCertUrl,
            stateCode,
            // Bank
            bankName,
            bankAccountNo,
            bankIFSC,
            bankBranch,
            authorizedSignatory,
            signatoryDesignation,
            footerLine1,
            footerLine2,
            footerLine3,
            headerLineColor: headerLineColor || '#000000',
            headerValueColor: headerValueColor || '#1a1a1a',
            footerLineColor: footerLineColor || '#000000',
            footerTextColor: footerTextColor || '#1a1a1a',
            isDefault: isDefault || false
        });

        console.log('Company profile created successfully:', profile._id);
        return NextResponse.json({ profile }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating company profile:', error);

        // Handle duplicate key error (if old index still exists)
        if (error.code === 11000) {
            // Try to update existing instead
            console.log('Duplicate key error - company with same name may exist');
            return NextResponse.json({
                error: 'A company with this name already exists. Please use a different name or update the existing company.'
            }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to create profile: ' + error.message }, { status: 500 });
    }
}


