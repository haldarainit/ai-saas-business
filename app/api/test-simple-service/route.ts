import { NextResponse, NextRequest } from 'next/server';
import { getTrendingProducts } from '@/lib/geminiServiceSimple';

// POST /api/test-simple-service
// Test the simplified gemini service
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { category } = body as { category?: string };

        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        const analysis = await getTrendingProducts(category);

        return NextResponse.json(analysis);

    } catch (error) {
        const err = error as Error;
        console.error('Test service error:', err);
        return NextResponse.json({
            error: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}

export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        status: 'Simple test service running',
        endpoint: '/api/test-simple-service',
        usage: 'POST with category parameter'
    });
}
