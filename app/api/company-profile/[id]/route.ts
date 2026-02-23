import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import dbConnect from '@/lib/mongodb';
import CompanyProfile from '@/models/CompanyProfile';

// PUT - Update a company profile
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            console.log('PUT /api/company-profile/[id]: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
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

        await dbConnect();

        // Verify ownership
        const existingProfile = await CompanyProfile.findOne({
            _id: params.id,
            userId
        });

        if (!existingProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // If setting as default, unset others
        if (isDefault) {
            await CompanyProfile.updateMany(
                { userId, _id: { $ne: params.id } },
                { isDefault: false }
            );
        }

        const updatedProfile = await CompanyProfile.findByIdAndUpdate(
            params.id,
            {
                name: name?.trim() || existingProfile.name,
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
                headerLineColor: headerLineColor || existingProfile.headerLineColor,
                headerValueColor: headerValueColor || existingProfile.headerValueColor,
                footerLineColor: footerLineColor || existingProfile.footerLineColor,
                footerTextColor: footerTextColor || existingProfile.footerTextColor,
                isDefault: isDefault || false
            },
            { new: true }
        );

        return NextResponse.json({ profile: updatedProfile });
    } catch (error: any) {
        console.error('Error updating company profile:', error);

        if (error.code === 11000) {
            return NextResponse.json({ error: 'A company with this name already exists' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

// DELETE - Delete a company profile
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            console.log('DELETE /api/company-profile/[id]: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const result = await CompanyProfile.findOneAndDelete({
            _id: params.id,
            userId
        });

        if (!result) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting company profile:', error);
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }
}
