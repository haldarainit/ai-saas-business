import { NextResponse } from 'next/server';

// POST /api/market-analyst
// Get trending products for a category using Gemini AI
export async function POST(request) {
  try {
    const { category } = await request.json();

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Category is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`Analyzing market trends for category: ${category}`);

    // Get trending products using Gemini AI
    const { getTrendingProducts } = require('@/lib/geminiService');
    const analysis = await getTrendingProducts(category.trim());

    console.log(`Successfully generated analysis for ${category}. Found ${analysis.viralProducts.length} trending products.`);

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error in market analyst API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze market trends',
        details: error.message,
        suggestion: 'Please try again or check if the category is valid'
      },
      { status: 500 }
    );
  }
}

// GET /api/market-analyst
// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'Market Analyst API is running',
    version: '2.0',
    features: ['Dynamic AI analysis', 'Gemini integration', 'Fallback data'],
    timestamp: new Date().toISOString()
  });
}
