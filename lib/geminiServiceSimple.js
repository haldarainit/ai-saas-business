// Simplified market data service for debugging
export async function getTrendingProducts(category) {
  console.log(`Getting market trends for category: ${category}`);
  
  try {
    // Try Gemini API first
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('No API key found');
    }

    console.log('Attempting Gemini API...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `List 5 trending ${category} products in India. Return as JSON: {"category":"${category}","viralProducts":[{"productName":"name","brand":"brand","trendReason":"reason","estimatedDemandLevel":"High","priceRange":"₹X-₹Y","topCompetitors":["comp1","comp2"],"popularityScore":85}],"summary":"summary"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API success');
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      parsedData.generatedAt = new Date().toISOString();
      return parsedData;
    }
    
    throw new Error('No JSON found');
    
  } catch (error) {
    console.error('Gemini API failed:', error.message);
    
    // Simple fallback
    return {
      category: category,
      generatedAt: new Date().toISOString(),
      viralProducts: [
        {
          productName: `${category.charAt(0).toUpperCase() + category.slice(1)} Product 1`,
          brand: 'Popular Brand',
          trendReason: 'Market trend',
          estimatedDemandLevel: 'High',
          priceRange: '₹500-₹2,000',
          topCompetitors: ['Brand A', 'Brand B'],
          popularityScore: 85
        }
      ],
      summary: `Market analysis for ${category} category.`,
      dataSource: 'simple-fallback'
    };
  }
}
