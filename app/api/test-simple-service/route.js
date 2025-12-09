import { NextResponse } from 'next/server';

// POST /api/test-simple-service
// Test the simplified gemini service
export async function POST(request) {
  try {
    const { category } = await request.json();
    
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    
    const { getTrendingProducts } = require('@/lib/geminiServiceSimple');
    const analysis = await getTrendingProducts(category);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Test service error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Simple test service running',
    endpoint: '/api/test-simple-service',
    usage: 'POST with category parameter'
  });
}
