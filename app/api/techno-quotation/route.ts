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

        // Helper to convert AI sections to Content Blocks
        const convertToContentBlocks = (sections: any[]) => {
            return sections
                .filter(section => !['sec-ref', 'sec-ref-content', 'sec-customer', 'sec-customer-content', 'sec-project', 'sec-project-desc'].includes(section.id))
                .map(section => {
                    const block: any = {
                        id: section.id,
                        type: section.type === 'text' ? 'paragraph' : section.type,
                        content: section.heading || '', // For headings, use the heading text. For paragraphs, we might need content.
                        style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left', lineHeight: 1.5, color: '#1a1a1a' }
                    };

                    if (section.type === 'text') {
                        block.content = section.content;
                    } else if (section.type === 'list') {
                        block.items = section.items;
                    } else if (section.type === 'table' && section.table) {
                        const colIds = section.table.columns.map((c: any) => c.id);
                        block.tableData = {
                            headers: section.table.columns.map((c: any) => c.name),
                            rows: section.table.rows.map((r: any) => colIds.map((cid: string) => r.cells[cid] || '')),
                            style: {
                                headerBgColor: 'transparent',
                                headerTextColor: '#000000',
                                borderColor: '#1a1a1a',
                                borderWidth: 1,
                                textColor: '#1a1a1a',
                                alternateRowColor: '#f9fafb',
                                fontSize: 10
                            }
                        };
                    } else if (section.type === 'heading') {
                        block.content = section.heading;
                        block.style.fontSize = 14;
                        block.style.fontWeight = 'bold';
                        block.style.textDecoration = 'underline';
                    }

                    return block;
                });
        };

        let contentBlocks = [];
        if (aiData && aiData.pages && aiData.pages[0] && aiData.pages[0].sections) {
            contentBlocks = convertToContentBlocks(aiData.pages[0].sections);
        } else if (body.contentBlocks) {
            contentBlocks = body.contentBlocks;
        } else {
            // Fallback default content
            contentBlocks = [{
                id: "1",
                type: "paragraph",
                content: "We thank you for the opportunity to submit our techno-commercial quotation.",
                style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left', lineHeight: 1.5, color: '#1a1a1a' }
            }];
        }

        // Ensure consistent reference number
        const refNo = isAutomated && aiData?.pages?.[0]?.sections?.find((s: any) => s.id === 'sec-ref-content')?.content?.match(/Ref: (.*?) \|/)?.[1] ||
            'REF-' + Date.now().toString().slice(-6);

        const quotation = await TechnoQuotation.create({
            userId: userId,
            quotationType: body.type || 'manual',
            title: userTitle,
            mainTitle: userTitle.toUpperCase(),
            companyDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' }),
            logoLetter: userTitle.charAt(0).toUpperCase() || 'Q',
            refNo: refNo, // Save the parsed Ref No
            contentBlocks: contentBlocks, // SAVE CONTENT BLOCKS
            answers: answers,
            subject: answers.project_subject || userTitle,
            projectDescription: answers.project_description || '',
            scopeOfWork: answers.scope_of_work || '',
            itemsBoq: answers.items_boq || '',
            technicalSpecs: answers.technical_specs || '',
            termsConditions: answers.terms_conditions || '',
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

