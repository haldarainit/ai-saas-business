import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnoQuotation from '@/models/TechnoQuotation';
import CompanyProfile from '@/models/CompanyProfile';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

export async function GET(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            console.log('GET /api/techno-quotation: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const quotations = await TechnoQuotation.find({ userId })
            .select('id title updatedAt status quotationType companyDetails pages')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await TechnoQuotation.countDocuments({ userId });

        return NextResponse.json({ 
            quotations,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            console.log('POST /api/techno-quotation: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const userTitle = body.title || 'New Quotation';
        const answers = body.answers || {};
        const aiData = body.aiData;
        const isAutomated = body.type === 'automated';

        // Fetch user's company profile
        const userProfile = await CompanyProfile.findOne({ 
            userId, 
            $or: [{ isDefault: true }, {}] 
        }).sort({ isDefault: -1, createdAt: -1 });

        // Default initial structure with customer details
        const defaultPages = [{
            id: 'page-1',
            sections: [
                {
                    id: 'section-1',
                    type: 'heading',
                    heading: 'Reference Information'
                },
                {
                    id: 'section-2',
                    type: 'text',
                    heading: 'Ref No',
                    content: 'REF-' + Date.now().toString().slice(-6)
                },
                {
                    id: 'section-3',
                    type: 'text',
                    heading: 'Date',
                    content: new Date().toLocaleDateString('en-IN')
                },
                {
                    id: 'section-4',
                    type: 'heading',
                    heading: 'Customer Details'
                },
                {
                    id: 'section-5',
                    type: 'text',
                    heading: 'Customer Name',
                    content: answers.client_name || 'Enter customer name'
                },
                {
                    id: 'section-6',
                    type: 'text',
                    heading: 'Customer Address',
                    content: answers.client_address || 'Enter customer address'
                },
                {
                    id: 'section-7',
                    type: 'text',
                    heading: 'Contact Person',
                    content: answers.client_contact || 'Enter contact person name'
                },
                {
                    id: 'section-8',
                    type: 'text',
                    heading: 'Contact Number',
                    content: 'Enter contact number'
                }
            ]
        }];

        // Use AI data if available, otherwise use defaults
        const pagesData = aiData?.pages || body.pages || defaultPages;

        // Determine Company Details
        // Priority: 1. AI Answers (if automated), 2. AI Data (company details), 3. User Profile (DB), 4. Fallback defaults
        let companyDetails;

        if (isAutomated && answers.company_name) {
            // Case 1: Provided via AI Wizard
            companyDetails = {
                name: answers.company_name,
                address1: answers.company_address?.split('\n')[0] || '',
                address2: answers.company_address?.split('\n').slice(1).join(', ') || '',
                phone: answers.company_contact?.split(',')[0]?.trim() || '',
                email: answers.company_contact?.split(',')[1]?.trim() || '',
                logo: aiData?.companyLogo || userProfile?.logo || ''
            };
        } else if (userProfile) {
            // Case 2: Use Saved Profile
            companyDetails = {
                name: userProfile.name,
                address1: userProfile.address1 || '',
                address2: userProfile.address2 || '',
                phone: userProfile.phone || '',
                email: userProfile.email || '',
                logo: userProfile.logo || ''
            };
        } else {
            // Case 3: Fallback / AI Defaults
            companyDetails = {
                name: aiData?.companyName || 'Your Company Name',
                address1: aiData?.companyAddress1 || 'Address Line 1',
                address2: aiData?.companyAddress2 || 'City, State, Country',
                phone: aiData?.companyPhone || '+91 XXXXX XXXXX',
                email: '',
                logo: ''
            };
        }

        // Extract client details from answers for automated quotations
        const clientDetails = isAutomated && answers.client_name ? {
            name: answers.client_name || '',
            company: answers.client_name || '',
            contact: answers.client_contact || '',
            address: answers.client_address || ''
        } : {};

        const quotation = await TechnoQuotation.create({
            userId: userId,
            quotationType: body.type || 'manual',
            title: userTitle,
            mainTitle: userTitle.toUpperCase(),
            companyDate: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' }),
            logoLetter: userTitle.charAt(0).toUpperCase() || 'Q',
            pages: pagesData,
            answers: answers,
            companyDetails: companyDetails,
            clientDetails: body.clientDetails || clientDetails,
            subject: answers.project_subject || body.subject || userTitle,
            projectDescription: answers.project_description || '',
            scopeOfWork: answers.scope_of_work || '',
            itemsBoq: answers.items_boq || '',
            technicalSpecs: answers.technical_specs || '',
            termsConditions: answers.terms_conditions || '',
            contentBlocks: body.contentBlocks || [],
            footer: {
                line1: userProfile?.footerLine1 || 'Your Products | Your Services | Your Solutions',
                line2: userProfile?.footerLine2 || 'Additional Services | Customized Solutions',
                line3: userProfile?.footerLine3 || (userProfile?.authorizedSignatory ? `Authorized Signatory: ${userProfile.authorizedSignatory}` : 'Authorized Submitter: Your Name')
            }
        });

        return NextResponse.json({ quotation });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

