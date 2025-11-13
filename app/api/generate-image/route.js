import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, base64Image } = await request.json();

    // Using Pollinations.ai free API for image generation
    // This is a free service that generates images based on prompts
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    
    console.log('Generating image with prompt:', prompt);
    
    // Fetch the generated image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }
    
    const imageBlob = await imageResponse.blob();
    
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });

    /* 
    Alternative: If you want to use DALL-E (requires OpenAI API key):
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      })
    });

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
    */

  } catch (error) {
    console.error('Error in image generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error.message },
      { status: 500 }
    );
  }
}
