import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import { analyzeImage } from '@/utils/gemini';

export const maxDuration = 60; // Allow up to 60 seconds for processing
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const inventoryType = formData.get('inventoryType') || 'trading'; // 'trading' or 'manufacturing'

        if (!file) {
            return NextResponse.json({ message: 'No file provided' }, { status: 400 });
        }

        // Check file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                message: 'Invalid file type. Please upload PDF or image files.'
            }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString('base64');

        // Determine MIME type
        const mimeType = file.type;

        // Build the prompt based on inventory type
        const systemPrompt = inventoryType === 'manufacturing'
            ? `You are an expert at extracting raw material and production supply information from invoices.
               Analyze this invoice and extract ALL raw materials/supplies with the following details:
               - name: Material/product name
               - sku: SKU or product code (generate if not found, format: RM-XXXX)
               - description: Brief description
               - category: Category (e.g., Metals, Chemicals, Fabrics, Electronics, Packaging, etc.)
               - unit: Unit of measurement (pcs, kg, g, ltr, ml, meter, cm, sqft, sqm, box, pack)
               - costPerUnit: Cost per unit (number only)
               - quantity: Quantity ordered (number only)
               - supplier: Supplier/vendor name
               - supplierContact: Supplier contact info if available
               
               IMPORTANT:
               - If SKU is not visible, generate a logical one based on the product name
               - If category is unclear, intelligently assign based on product type
               - If unit is not specified, infer from context
               - Be thorough - extract EVERY line item from the invoice`
            : `You are an expert at extracting product information from invoices.
               Analyze this invoice and extract ALL products with the following details:
               - name: Product name
               - sku: SKU or product code (generate if not found, format: PRD-XXXX)
               - description: Brief description
               - category: Category (e.g., Electronics, Clothing, Food, Furniture, etc.)
               - unit: Unit of measurement (pcs, kg, g, ltr, ml, meter, box, pack)
               - costPrice: Cost/purchase price per unit (number only)
               - sellingPrice: Suggested selling price (add 20-30% margin if not specified)
               - quantity: Quantity ordered (number only)
               - supplier: Supplier/vendor name
               - supplierContact: Supplier contact info if available
               
               IMPORTANT:
               - If SKU is not visible, generate a logical one based on the product name
               - If category is unclear, intelligently assign based on product type
               - If selling price is not shown, calculate with reasonable margin
               - Be thorough - extract EVERY line item from the invoice`;

        const responseFormat = inventoryType === 'manufacturing'
            ? `{
                "invoiceNumber": "string or null",
                "invoiceDate": "string or null",
                "supplier": {
                    "name": "string",
                    "contact": "string or null",
                    "address": "string or null"
                },
                "items": [
                    {
                        "name": "string",
                        "sku": "string",
                        "description": "string",
                        "category": "string",
                        "unit": "string",
                        "costPerUnit": number,
                        "quantity": number,
                        "totalCost": number,
                        "confidence": "high|medium|low"
                    }
                ],
                "totalAmount": number or null,
                "notes": "string or null"
            }`
            : `{
                "invoiceNumber": "string or null",
                "invoiceDate": "string or null",
                "supplier": {
                    "name": "string",
                    "contact": "string or null",
                    "address": "string or null"
                },
                "items": [
                    {
                        "name": "string",
                        "sku": "string",
                        "description": "string",
                        "category": "string",
                        "unit": "string",
                        "costPrice": number,
                        "sellingPrice": number,
                        "quantity": number,
                        "totalCost": number,
                        "confidence": "high|medium|low"
                    }
                ],
                "totalAmount": number or null,
                "notes": "string or null"
            }`;

        const fullPrompt = `${systemPrompt}

Respond ONLY with valid JSON in this exact format:
${responseFormat}

If you cannot read the invoice or find no items, return:
{"error": "reason", "items": []}`;

        // Use the existing gemini utility to analyze the image/document
        const textResponse = await analyzeImage(base64Data, mimeType, fullPrompt);

        if (!textResponse) {
            return NextResponse.json({
                message: 'No response from AI',
                items: []
            }, { status: 200 });
        }

        // Check if there was an error from the AI
        if (textResponse.startsWith('Error:')) {
            return NextResponse.json({
                message: textResponse,
                items: []
            }, { status: 200 });
        }

        // Parse the JSON response
        let parsedData;
        try {
            // Clean up the response (remove markdown code blocks if present)
            let cleanJson = textResponse.trim();
            if (cleanJson.startsWith('```json')) {
                cleanJson = cleanJson.slice(7);
            }
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.slice(3);
            }
            if (cleanJson.endsWith('```')) {
                cleanJson = cleanJson.slice(0, -3);
            }
            cleanJson = cleanJson.trim();

            // Find JSON object in the response
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanJson = jsonMatch[0];
            }

            parsedData = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', textResponse);
            return NextResponse.json({
                message: 'Failed to parse AI response',
                rawResponse: textResponse,
                items: []
            }, { status: 200 });
        }

        // Validate and enhance the extracted data
        if (parsedData.items && Array.isArray(parsedData.items)) {
            parsedData.items = parsedData.items.map((item, index) => {
                // Ensure all required fields exist
                const enhanced = {
                    ...item,
                    id: `temp-${Date.now()}-${index}`,
                    name: item.name || 'Unknown Product',
                    sku: item.sku || `${inventoryType === 'manufacturing' ? 'RM' : 'PRD'}-${String(Date.now()).slice(-4)}-${index + 1}`,
                    description: item.description || '',
                    category: item.category || 'Uncategorized',
                    unit: item.unit || 'pcs',
                    quantity: parseFloat(item.quantity) || 1,
                    confidence: item.confidence || 'medium',
                    needsReview: !item.name || !item.sku || item.confidence === 'low'
                };

                if (inventoryType === 'manufacturing') {
                    enhanced.costPerUnit = parseFloat(item.costPerUnit) || 0;
                    enhanced.totalCost = enhanced.costPerUnit * enhanced.quantity;
                } else {
                    enhanced.costPrice = parseFloat(item.costPrice) || 0;
                    enhanced.sellingPrice = parseFloat(item.sellingPrice) || enhanced.costPrice * 1.25;
                    enhanced.totalCost = enhanced.costPrice * enhanced.quantity;
                }

                return enhanced;
            });
        }

        return NextResponse.json({
            success: true,
            inventoryType,
            fileName: file.name,
            fileType: mimeType,
            ...parsedData
        });

    } catch (error) {
        console.error('Invoice scan error:', error);
        return NextResponse.json({
            message: error.message || 'Failed to process invoice',
            items: []
        }, { status: 500 });
    }
}
