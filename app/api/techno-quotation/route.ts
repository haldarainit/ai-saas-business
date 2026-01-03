import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnoQuotation from '@/models/TechnoQuotation';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

export async function GET(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            console.log('GET /api/techno-quotation: Unauthorized - no userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const quotations = await TechnoQuotation.find({ userId })
            .select('id title updatedAt status quotationType companyDetails pages')
            .sort({ updatedAt: -1 });

        return NextResponse.json({ quotations });
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
                    content: new Date().toLocaleDateString()
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
                    content: 'Enter customer name'
                },
                {
                    id: 'section-6',
                    type: 'text',
                    heading: 'Customer Address',
                    content: 'Enter customer address'
                },
                {
                    id: 'section-7',
                    type: 'text',
                    heading: 'Contact Person',
                    content: 'Enter contact person name'
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

        // Extract company details from answers or use defaults
        const companyDetails = isAutomated && answers.company_name ? {
            name: answers.company_name || 'Your Company Name',
            address1: answers.company_address?.split('\n')[0] || 'Address Line 1',
            address2: answers.company_address?.split('\n').slice(1).join(', ') || 'City, State, Country',
            phone: answers.company_contact?.split(',')[0]?.trim() || '+91 XXXXX XXXXX',
            email: answers.company_contact?.split(',')[1]?.trim() || '',
            logo: aiData?.companyLogo || ''
        } : {
            name: aiData?.companyName || 'Your Company Name',
            address1: aiData?.companyAddress1 || 'Address Line 1',
            address2: aiData?.companyAddress2 || 'City, State, Country',
            phone: aiData?.companyPhone || '+91 XXXXX XXXXX'
        };

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
            companyDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' }),
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
                line1: 'Your Products | Your Services | Your Solutions',
                line2: 'Additional Services | Customized Solutions',
                line3: 'Authorized Submitter: Your Name - Your Position'
            }
        });

        return NextResponse.json({ quotation });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

