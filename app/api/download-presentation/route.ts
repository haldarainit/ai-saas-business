import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';

interface Slide {
    title: string;
    content: string[];
    imageKeyword: string;
    imageUrl?: string;
}

interface Theme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

interface PresentationData {
    title: string;
    slides: Slide[];
    theme?: Theme;
}

// Helper function to download image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');

        // Determine content type
        const contentType = response.headers.get('content-type') || 'image/png';

        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const body: PresentationData = await req.json();
        const { title, slides, theme } = body;

        if (!title || !slides || slides.length === 0) {
            return NextResponse.json(
                { error: 'Invalid presentation data' },
                { status: 400 }
            );
        }

        const pptx = new pptxgen();

        // Set presentation properties
        pptx.author = "BusinessAI";
        pptx.company = "BusinessAI SaaS";
        pptx.title = title;
        pptx.subject = "AI Generated Presentation";

        // Set layout to widescreen 16:9
        pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
        pptx.layout = 'LAYOUT_16x9';

        // Theme colors
        const primaryColor = theme?.colors?.primary?.replace('#', '') || '1e40af';
        const secondaryColor = theme?.colors?.secondary?.replace('#', '') || '3b82f6';
        const accentColor = theme?.colors?.accent?.replace('#', '') || '60a5fa';

        // Pre-fetch all images in parallel
        console.log('Fetching images for slides...');
        const imagePromises = slides.map(async (slide) => {
            if (slide.imageUrl || slide.imageKeyword) {
                const imageUrl = slide.imageUrl ||
                    `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imageKeyword)}?width=800&height=600&nologo=true`;
                return await fetchImageAsBase64(imageUrl);
            }
            return null;
        });

        const images = await Promise.all(imagePromises);
        console.log(`Fetched ${images.filter(Boolean).length} images successfully`);

        // Create Slides
        for (let i = 0; i < slides.length; i++) {
            const slideData = slides[i];
            const slide = pptx.addSlide();
            const isFirstSlide = i === 0;
            const isLastSlide = i === slides.length - 1;
            const imageBase64 = images[i];

            if (isFirstSlide) {
                // ==================== TITLE SLIDE ====================
                slide.background = { color: primaryColor };

                // Decorative accent line at bottom
                slide.addShape('rect', {
                    x: 0,
                    y: 4.8,
                    w: 10,
                    h: 0.05,
                    fill: { color: accentColor },
                });

                // Main Title
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 1.2,
                    w: 5.5,
                    h: 1.5,
                    fontSize: 40,
                    bold: true,
                    color: 'FFFFFF',
                    fontFace: 'Arial',
                    valign: 'middle',
                });

                // Subtitle from content
                if (slideData.content && slideData.content.length > 0) {
                    slide.addText(slideData.content.join(' '), {
                        x: 0.5,
                        y: 2.8,
                        w: 5.5,
                        h: 1.2,
                        fontSize: 16,
                        color: 'FFFFFF',
                        fontFace: 'Arial',
                        valign: 'top',
                    });
                }

                // Image on right side
                if (imageBase64) {
                    slide.addImage({
                        data: imageBase64,
                        x: 6.2,
                        y: 0.5,
                        w: 3.3,
                        h: 4.2,
                        rounding: true,
                    });
                }

                // Footer branding
                slide.addText("Generated by BusinessAI", {
                    x: 0.5,
                    y: 5.2,
                    w: 4,
                    fontSize: 9,
                    color: 'FFFFFF',
                    fontFace: 'Arial',
                });

            } else if (isLastSlide) {
                // ==================== CLOSING SLIDE ====================
                slide.background = { color: primaryColor };

                // Thank You Title
                slide.addText(slideData.title, {
                    x: 0,
                    y: 1.8,
                    w: 10,
                    h: 1.2,
                    fontSize: 44,
                    bold: true,
                    color: 'FFFFFF',
                    fontFace: 'Arial',
                    align: 'center',
                    valign: 'middle',
                });

                // Content/Contact info
                if (slideData.content && slideData.content.length > 0) {
                    slide.addText(slideData.content.join('\n'), {
                        x: 1,
                        y: 3.2,
                        w: 8,
                        h: 1.5,
                        fontSize: 16,
                        color: 'FFFFFF',
                        fontFace: 'Arial',
                        align: 'center',
                        valign: 'top',
                    });
                }

                // Decorative line
                slide.addShape('rect', {
                    x: 3,
                    y: 3,
                    w: 4,
                    h: 0.02,
                    fill: { color: accentColor },
                });

            } else {
                // ==================== CONTENT SLIDES ====================
                slide.background = { color: 'FFFFFF' };

                // Top accent bar
                slide.addShape('rect', {
                    x: 0,
                    y: 0,
                    w: 10,
                    h: 0.06,
                    fill: { color: primaryColor },
                });

                // Slide number indicator
                slide.addShape('rect', {
                    x: 0,
                    y: 0.25,
                    w: 0.4,
                    h: 0.4,
                    fill: { color: secondaryColor },
                });
                slide.addText(String(i + 1), {
                    x: 0,
                    y: 0.25,
                    w: 0.4,
                    h: 0.4,
                    fontSize: 12,
                    bold: true,
                    color: 'FFFFFF',
                    fontFace: 'Arial',
                    align: 'center',
                    valign: 'middle',
                });

                // Slide Title
                slide.addText(slideData.title, {
                    x: 0.6,
                    y: 0.25,
                    w: 9,
                    h: 0.5,
                    fontSize: 24,
                    bold: true,
                    color: '1f2937',
                    fontFace: 'Arial',
                    valign: 'middle',
                });

                // Horizontal divider line
                slide.addShape('rect', {
                    x: 0.5,
                    y: 0.9,
                    w: 9,
                    h: 0.01,
                    fill: { color: 'e5e7eb' },
                });

                // Content area - adjust width based on whether we have an image
                const contentWidth = imageBase64 ? 5 : 9;

                // Content bullets
                if (slideData.content && slideData.content.length > 0) {
                    const textItems = slideData.content.map((text) => ({
                        text: text,
                        options: {
                            fontSize: 14,
                            color: '374151',
                            bullet: {
                                type: 'bullet' as const,
                                color: secondaryColor
                            },
                            breakLine: true,
                            paraSpaceBefore: 6,
                            paraSpaceAfter: 6,
                        },
                    }));

                    slide.addText(textItems, {
                        x: 0.5,
                        y: 1.1,
                        w: contentWidth,
                        h: 3.8,
                        fontFace: 'Arial',
                        valign: 'top',
                    });
                }

                // Image on right (if available)
                if (imageBase64) {
                    slide.addImage({
                        data: imageBase64,
                        x: 5.8,
                        y: 1.1,
                        w: 3.8,
                        h: 3.5,
                        rounding: true,
                    });
                }

                // Footer with presentation title and page number
                slide.addText(title, {
                    x: 0.5,
                    y: 5.2,
                    w: 6,
                    fontSize: 8,
                    color: '9ca3af',
                    fontFace: 'Arial',
                });

                slide.addText(`${i + 1} / ${slides.length}`, {
                    x: 8,
                    y: 5.2,
                    w: 1.5,
                    fontSize: 8,
                    color: '9ca3af',
                    fontFace: 'Arial',
                    align: 'right',
                });
            }
        }

        // Generate the PPTX as base64
        console.log('Generating PPTX file...');
        const pptxBase64 = await pptx.write({ outputType: 'base64' }) as string;

        // Convert base64 to buffer
        const buffer = Buffer.from(pptxBase64, 'base64');

        console.log(`PPTX generated successfully: ${buffer.length} bytes`);

        // Return as downloadable file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.pptx"`,
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('Error generating PPTX:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate presentation file' },
            { status: 500 }
        );
    }
}
