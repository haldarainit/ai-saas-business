import { NextResponse } from 'next/server';

// GET /api/debug-service
// Debug the geminiService directly
export async function GET() {
  try {
    console.log('=== DEBUGGING GEMINI SERVICE ===');
    
    // Test import
    const { getTrendingProducts } = require('@/lib/geminiService');
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
    console.error('=== DEBUG ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
