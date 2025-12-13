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
            .select('id title updatedAt status quotationType')
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

        // Default initial structure
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
                }
            ]
        }];

        const quotation = await TechnoQuotation.create({
            userId: userId,
            quotationType: body.type || 'manual',
            title: body.title || 'New Quotation',
            pages: body.pages || defaultPages,
            answers: body.answers || {},
            companyDetails: {
                name: 'GREEN ENERGY PVT. LTD'
            }
        });

        return NextResponse.json({ quotation });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
