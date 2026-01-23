import { NextResponse } from 'next/server';
import { getTrendingProducts } from '@/lib/geminiService';

// GET /api/debug-service
// Debug the geminiService directly
export async function GET(): Promise<NextResponse> {
    try {
        console.log('=== DEBUGGING GEMINI SERVICE ===');

        console.log('✅ Import successful');

        // Test with electronics
        console.log('Testing electronics category...');
        const result1 = await getTrendingProducts('electronics');
        console.log('✅ Electronics test successful:', result1.category);

        // Test with books
        console.log('Testing books category...');
        const result2 = await getTrendingProducts('books');
        console.log('✅ Books test successful:', result2.category);

        return NextResponse.json({
            success: true,
            message: 'All tests passed',
            electronics: result1.category,
            books: result2.category,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const err = error as Error;
        console.error('=== DEBUG ERROR ===');
        console.error('Error:', err.message);
        console.error('Stack:', err.stack);

        return NextResponse.json({
            success: false,
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
