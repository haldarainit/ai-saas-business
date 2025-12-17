import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

interface Slide {
    title: string;
    content: string[];
    imageUrl?: string;
    layoutType?: string;
    hasImage?: boolean;
    comparison?: {
        left: { heading: string; points: string[] };
        right: { heading: string; points: string[] };
    };
}

interface PresentationData {
    title: string;
    subtitle: string;
    slides: Slide[];
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

// Clean markdown text
function cleanMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/`(.*?)`/g, '$1') // Code
        .replace(/### (.*?)$/gm, '$1') // Headers
        .replace(/## (.*?)$/gm, '$1') // Headers
        .replace(/# (.*?)$/gm, '$1') // Headers
        .replace(/^\- (.*?)$/gm, '$1') // List items
        .replace(/^\* (.*?)$/gm, '$1') // List items
        .trim();
}

// Generate theme styles
function generateThemeStyles(theme: Theme): string {
    return `
        body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 1920px;
            height: 1080px;
            overflow: hidden;
        }
        .slide {
            width: 1920px;
            height: 1080px;
            position: relative;
            display: flex;
            align-items: center;
            padding: 80px;
            box-sizing: border-box;
        }
        .title-slide {
            background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
            color: white;
            justify-content: center;
            text-align: center;
        }
        .content-slide {
            background: white;
            color: #1f2937;
        }
        .accent-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 16px;
            background-color: ${theme.colors.accent};
        }
        .side-accent {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 16px;
            background-color: ${theme.colors.primary};
        }
        .slide-number {
            position: absolute;
            top: 48px;
            left: 48px;
            width: 80px;
            height: 80px;
            background-color: ${theme.colors.primary};
            color: white;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
        }
        .bottom-accent {
            position: absolute;
            bottom: 64px;
            left: 48px;
            right: 48px;
            height: 4px;
            background-color: ${theme.colors.accent};
        }
        h1 {
            font-size: 72px;
            font-weight: bold;
            margin: 0 0 32px 0;
            line-height: 1.1;
        }
        h2 {
            font-size: 56px;
            font-weight: bold;
            margin: 0 0 48px 0;
            color: ${theme.colors.primary};
            line-height: 1.2;
        }
        .content-title {
            padding-left: 120px;
        }
        .subtitle {
            font-size: 32px;
            opacity: 0.9;
            margin: 0;
            line-height: 1.4;
        }
        .content-area {
            flex: 1;
            display: flex;
            gap: 64px;
            padding-left: 120px;
            align-items: flex-start;
        }
        .text-content {
            flex: 1;
        }
        .image-content {
            width: 40%;
            max-height: 600px;
        }
        .image-content img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 24px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 28px;
            line-height: 1.6;
        }
        li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-left: 0;
        }
        li::before {
            content: "•";
            color: ${theme.colors.secondary};
            font-size: 32px;
            margin-right: 16px;
            margin-top: -4px;
            flex-shrink: 0;
        }
        .comparison-container {
            display: flex;
            gap: 48px;
            width: 100%;
            padding-left: 120px;
        }
        .comparison-column {
            flex: 1;
            padding: 32px;
            border-radius: 16px;
            min-height: 400px;
        }
        .comparison-left {
            background-color: #fdf2f8;
        }
        .comparison-right {
            background-color: #faf5ff;
        }
        .comparison-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 24px;
            color: ${theme.colors.primary};
        }
        .comparison-list {
            font-size: 24px;
            line-height: 1.5;
        }
        .comparison-list li::before {
            color: ${theme.colors.accent};
            font-size: 28px;
        }
    `;
}

// Generate slide content without HTML wrapper
function generateSlideContent(slide: Slide, slideIndex: number, totalSlides: number, theme: Theme): string {
    const isFirstSlide = slideIndex === 0;
    const isLastSlide = slideIndex === totalSlides - 1;
    
    let slideContent = '';

    if (isFirstSlide || isLastSlide) {
        // Title/End slide
        slideContent = `
            <div class="slide title-slide">
                <div>
                    <h1>${cleanMarkdown(slide.title)}</h1>
                    ${slide.content && slide.content.length > 0 ? 
                        `<div class="subtitle">${slide.content.map(c => cleanMarkdown(c)).join('<br>')}</div>` 
                        : ''}
                </div>
            </div>
        `;
    } else {
        // Content slide
        if (slide.comparison) {
            // Comparison slide
            slideContent = `
                <div class="slide content-slide">
                    <div class="accent-bar"></div>
                    <div class="side-accent"></div>
                    <div class="slide-number">${slideIndex + 1}</div>
                    <div class="bottom-accent"></div>
                    
                    <div style="width: 100%;">
                        <h2 class="content-title">${cleanMarkdown(slide.title)}</h2>
                        <div class="comparison-container">
                            <div class="comparison-column comparison-left">
                                <div class="comparison-title">${slide.comparison.left.heading}</div>
                                <ul class="comparison-list">
                                    ${slide.comparison.left.points.map(point => 
                                        `<li>${cleanMarkdown(point)}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                            <div class="comparison-column comparison-right">
                                <div class="comparison-title">${slide.comparison.right.heading}</div>
                                <ul class="comparison-list">
                                    ${slide.comparison.right.points.map(point => 
                                        `<li>${cleanMarkdown(point)}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Regular content slide
            slideContent = `
                <div class="slide content-slide">
                    <div class="accent-bar"></div>
                    <div class="side-accent"></div>
                    <div class="slide-number">${slideIndex + 1}</div>
                    <div class="bottom-accent"></div>
                    
                    <div style="width: 100%;">
                        <h2 class="content-title">${cleanMarkdown(slide.title)}</h2>
                        <div class="content-area">
                            <div class="text-content">
                                <ul>
                                    ${(slide.content || []).map(point => 
                                        `<li>${cleanMarkdown(point)}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                            ${slide.imageUrl ? 
                                `<div class="image-content">
                                    <img src="${slide.imageUrl}" alt="${cleanMarkdown(slide.title)}">
                                </div>` 
                                : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    return slideContent;
}

// Generate HTML for slide preview
function generateSlideHTML(slide: Slide, slideIndex: number, totalSlides: number, theme: Theme): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                ${generateThemeStyles(theme)}
            </style>
        </head>
        <body>
            ${generateSlideContent(slide, slideIndex, totalSlides, theme)}
        </body>
        </html>
    `;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slides, title, theme } = body as PresentationData & { theme: Theme };

        if (!slides || !Array.isArray(slides)) {
            return NextResponse.json(
                { error: "Invalid presentation data" },
                { status: 400 }
            );
        }

        // Launch Puppeteer with more stable settings
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding'
            ],
            timeout: 30000
        });

        let page;
        try {
            page = await browser.newPage();
            
            // Set page size to match slide dimensions (16:9 ratio) 
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            });

            // Create a combined HTML with all slides for better performance
            const combinedHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 0; }
                        .slide-container { 
                            page-break-after: always; 
                            width: 1920px;
                            height: 1080px;
                            overflow: hidden;
                        }
                        .slide-container:last-child { page-break-after: auto; }
                        ${generateThemeStyles(theme)}
                    </style>
                </head>
                <body>
                    ${slides.map((slide, index) => `
                        <div class="slide-container">
                            ${generateSlideContent(slide, index, slides.length, theme)}
                        </div>
                    `).join('')}
                </body>
                </html>
            `;

            await page.setContent(combinedHTML, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Wait a bit for any images to load
            await new Promise(resolve => setTimeout(resolve, 1500));

            const finalPdf = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: 0, bottom: 0, left: 0, right: 0 },
                timeout: 30000
            });

            // Convert the PDF buffer to the correct format for NextResponse
            const pdfBuffer = Buffer.from(finalPdf);

            return new NextResponse(pdfBuffer, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
                },
            });

        } catch (pdfError) {
            console.error("PDF generation specific error:", pdfError);
            throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
        } finally {
            // Ensure browser is always closed
            if (page) {
                try {
                    await page.close();
                } catch (e) {
                    console.warn("Error closing page:", e);
                }
            }
            try {
                await browser.close();
            } catch (e) {
                console.warn("Error closing browser:", e);
            }
        }

    } catch (error: any) {
        console.error("PDF generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate PDF" },
            { status: 500 }
        );
    }
}