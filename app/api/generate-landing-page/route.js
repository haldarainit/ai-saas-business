import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const businessName = formData.get('businessName');
    const businessDescription = formData.get('businessDescription');
    const targetAudience = formData.get('targetAudience');
    const colorScheme = formData.get('colorScheme');
    const companyLogo = formData.get('companyLogo');

    if (!businessName || !businessDescription) {
      return Response.json(
        {
          success: false,
          error: "Business name and description are required",
        },
        { status: 400 }
      );
    }

    let logoUrl = null;

    // Handle logo upload if provided
    if (companyLogo && companyLogo instanceof File) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = companyLogo.name;
        const extension = originalName.split('.').pop();
        const filename = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${extension}`;
        const filepath = join(uploadsDir, filename);

        // Convert file to buffer and save
        const bytes = await companyLogo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Set the logo URL
        logoUrl = `/uploads/${filename}`;

        console.log(`Logo uploaded successfully: ${logoUrl}`);
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
        // Continue without logo if upload fails
      }
    }

    console.log("Generating landing page for:", {
      businessName,
      businessDescription,
      targetAudience,
      colorScheme,
      logoUrl,
    });

    // Generate the landing page HTML using Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;

    const prompt = `
You are an expert web developer and designer. Create a complete, professional landing page HTML document for a business.

Business Name: "${businessName}"
Business Description: "${businessDescription}"
${targetAudience ? `Target Audience: "${targetAudience}"` : ''}
${colorScheme ? `Color Scheme: "${colorScheme}" (use this as primary color inspiration)` : ''}
${logoUrl ? `Logo URL: "${logoUrl}" (include this logo prominently at the top of the page)` : ''}

CRITICAL REQUIREMENTS:
- Return ONLY valid HTML code, nothing else
- Include <!DOCTYPE html> declaration
- Include <html>, <head>, and <body> tags
- Include proper meta tags for responsive design
- Use modern CSS with Tailwind-like utility classes (provide the CSS in a <style> tag)
- Make it mobile-responsive
- Include a hero section, features section, and footer
- Use professional colors and typography
- Include placeholder content based on the business description
- Make it conversion-focused with clear call-to-action buttons
- Use semantic HTML
- Include proper alt text for any images (use placeholder URLs)
- Tailor content to the target audience if provided
- Incorporate the requested color scheme into the design

The HTML should be complete and ready to be opened in a browser.

Generate the HTML now:`;

    const result = await gemini.generateAIResponse(prompt);

    if (result && !result.includes("Error")) {
      return Response.json({
        success: true,
        html: result,
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result || "Failed to generate landing page",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-landing-page API:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
