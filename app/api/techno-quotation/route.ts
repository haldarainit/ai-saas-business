import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnoQuotation from '@/models/TechnoQuotation';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-ignore
        if (!session || !session.userId) {
            console.log('GET /api/techno-quotation: Unauthorized session:', session);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.userId;

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
        const session = await getServerSession(authOptions);

        // @ts-ignore
        if (!session || !session.userId) {
            console.log('POST /api/techno-quotation: Unauthorized session:', session);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.userId;

        await dbConnect();
        const body = await req.json();

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

        const quotation = await TechnoQuotation.create({
            userId: userId,
            quotationType: body.type || 'manual',
            title: body.title || 'New Quotation',
            mainTitle: 'TECHNO COMMERCIAL QUOTATION',
            companyDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' }),
            logoLetter: 'G',
            pages: body.pages || defaultPages,
            answers: body.answers || {},
            companyDetails: {
                name: 'Your Company Name',
                address1: 'Address Line 1',
                address2: 'City, State, Country',
                phone: '+91 XXXXX XXXXX'
            },
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
