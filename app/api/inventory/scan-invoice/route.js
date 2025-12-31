import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import { analyzeImage } from '@/utils/gemini';

export const maxDuration = 120; // Allow up to 120 seconds for multi-file processing
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const files = formData.getAll('files'); // Support multiple files
        const singleFile = formData.get('file'); // Backward compatibility
        const inventoryType = formData.get('inventoryType') || 'trading';

        // Collect all files to process
        const filesToProcess = [];
        if (files && files.length > 0) {
            filesToProcess.push(...files.filter(f => f instanceof File));
        }
        if (singleFile && singleFile instanceof File) {
            filesToProcess.push(singleFile);
        }

        if (filesToProcess.length === 0) {
            return NextResponse.json({ message: 'No files provided' }, { status: 400 });
        }

        // Check file types
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        for (const file of filesToProcess) {
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json({
                    message: `Invalid file type: ${file.name}. Please upload PDF or image files.`
                }, { status: 400 });
            }
        }

        // Comprehensive category lists for smart categorization
        const tradingCategories = [
            'Plumbing', 'Sanitary Ware', 'Pipes & Fittings', 'Valves & Taps', 'Bathroom Accessories',
            'Electrical', 'Wires & Cables', 'Switches & Sockets', 'Lighting', 'Electrical Fittings',
            'Construction Materials', 'Cement & Concrete', 'Tiles & Flooring', 'Paints & Coatings', 'Adhesives & Sealants',
            'Hardware', 'Fasteners', 'Tools & Equipment', 'Locks & Security', 'Door & Window Fittings',
            'Furniture', 'Home Decor', 'Kitchen & Dining', 'Storage & Organization',
            'Industrial Supplies', 'Safety Equipment', 'Machinery Parts', 'Bearings & Belts',
            'Electronics', 'Automotive', 'Clothing & Textiles', 'Food & Beverages', 'Office Supplies',
            'Stationery', 'Packaging Materials', 'Chemicals', 'Agricultural', 'Medical Supplies',
            'Sports & Fitness', 'Toys & Games', 'Pet Supplies', 'Gardening', 'Other'
        ];

        const manufacturingCategories = [
            'Metals', 'Steel', 'Aluminum', 'Copper', 'Brass', 'Iron',
            'Plastics', 'Polymers', 'Rubber', 'PVC', 'CPVC', 'HDPE', 'ABS',
            'Cement', 'Sand & Aggregates', 'Bricks & Blocks', 'Tiles', 'Glass', 'Wood & Timber',
            'Chemicals', 'Solvents', 'Adhesives', 'Paints', 'Coatings', 'Lubricants',
            'Electronics Components', 'Electrical Components', 'Mechanical Parts', 'Fasteners',
            'Bearings', 'Springs', 'Gaskets & Seals',
            'Fabrics', 'Textiles', 'Threads & Yarns', 'Leather',
            'Packaging', 'Consumables', 'Safety Gear', 'Tools', 'Hardware',
            'Plumbing Components', 'Pipe Fittings', 'Valves', 'Connectors', 'Other'
        ];

        const categoryList = inventoryType === 'manufacturing' ? manufacturingCategories : tradingCategories;

        // Build the prompt based on inventory type - UPDATED with smart categorization
        const systemPrompt = inventoryType === 'manufacturing'
            ? `You are an expert at extracting raw material and production supply information from invoices.
               Analyze this invoice (including ALL PAGES if multi-page PDF) and extract ALL raw materials/supplies.
               
               CRITICAL - GST/TAX HANDLING:
               - The costPerUnit should be the FINAL COST INCLUDING ALL TAXES (GST, IGST, CGST, SGST, etc.)
               - If invoice shows base price + GST separately, ADD them together for costPerUnit
               - If invoice shows inclusive price, use that as costPerUnit
               - Extract the GST percentage and amount separately for reference
               
               SMART CATEGORIZATION - YOU MUST CHOOSE FROM THESE CATEGORIES:
               ${categoryList.join(', ')}
               
               Category Guidelines:
               - CPVC Pipe, PVC Pipe, HDPE Pipe → "CPVC", "PVC", or "Pipes & Fittings"
               - Elbow, Tee, Socket, Reducer → "Pipe Fittings" or "Plumbing Components"
               - Commode, Basin, Urinal → "Sanitary Ware"
               - Tap, Valve, Cock → "Valves"
               - Solvent, Adhesive → "Solvents" or "Adhesives"
               - Brass items → "Brass"
               - If product doesn't fit any category, use "Other"
               
               Extract the following details for EACH item:
               - name: Material/product name
               - sku: SKU or product code (generate if not found, format: RM-XXXX)
               - description: Brief description
               - category: MUST be one from the list above - choose the best match
               - unit: Unit of measurement (pcs, kg, g, ltr, ml, meter, cm, sqft, sqm, box, pack, set, pair, roll)
               - basePrice: Base price per unit BEFORE tax (number only)
               - gstPercentage: GST/Tax percentage (number only, e.g., 18 for 18%)
               - gstAmount: GST/Tax amount per unit (number only)
               - costPerUnit: FINAL cost per unit INCLUDING ALL TAXES (basePrice + gstAmount)
               - quantity: Quantity ordered (number only)
               - supplier: Supplier/vendor name
               - supplierContact: Supplier contact info if available
               - hsnCode: HSN/SAC code if available
               
               IMPORTANT:
               - Scan ALL PAGES of the document
               - If SKU is not visible, generate a logical one based on the product name
               - ALWAYS choose the most specific category from the list
               - If unit is not specified, infer from context
               - Always calculate costPerUnit = basePrice + gstAmount
               - Be thorough - extract EVERY line item from ALL pages of the invoice`
            : `You are an expert at extracting product information from invoices.
               Analyze this invoice (including ALL PAGES if multi-page PDF) and extract ALL products.
               
               CRITICAL - GST/TAX HANDLING:
               - The costPrice should be the FINAL COST INCLUDING ALL TAXES (GST, IGST, CGST, SGST, etc.)
               - If invoice shows base price + GST separately, ADD them together for costPrice
               - If invoice shows inclusive price, use that as costPrice
               - Extract the GST percentage and amount separately for reference
               
               SMART CATEGORIZATION - YOU MUST CHOOSE FROM THESE CATEGORIES:
               ${categoryList.join(', ')}
               
               Category Guidelines:
               - CPVC Pipe, PVC Pipe, HDPE Pipe → "Pipes & Fittings"
               - Elbow, Tee, Socket, Reducer, Connector → "Pipes & Fittings"
               - Commode, Basin, Urinal, Toilet → "Sanitary Ware"
               - Tap, Valve, Cock, Faucet → "Valves & Taps"
               - Solvent, Adhesive, Glue → "Adhesives & Sealants"
               - Paint, Primer, Thinner → "Paints & Coatings"
               - Wire, Cable → "Wires & Cables"
               - Switch, Socket, Board → "Switches & Sockets"
               - Brass items, Copper items → "Hardware" or specific material
               - If product doesn't fit any category, use "Other"
               
               Extract the following details for EACH item:
               - name: Product name
               - sku: SKU or product code (generate if not found, format: PRD-XXXX)
               - description: Brief description
               - category: MUST be one from the list above - choose the best match
               - unit: Unit of measurement (pcs, kg, g, ltr, ml, meter, box, pack, set, pair, roll)
               - basePrice: Base price per unit BEFORE tax (number only)
               - gstPercentage: GST/Tax percentage (number only, e.g., 18 for 18%)
               - gstAmount: GST/Tax amount per unit (number only)
               - costPrice: FINAL cost per unit INCLUDING ALL TAXES (basePrice + gstAmount)
               - sellingPrice: Suggested selling price (add 20-30% margin on costPrice)
               - quantity: Quantity ordered (number only)
               - supplier: Supplier/vendor name
               - supplierContact: Supplier contact info if available
               - hsnCode: HSN/SAC code if available
               
               IMPORTANT:
               - Scan ALL PAGES of the document
               - If SKU is not visible, generate a logical one based on the product name
               - ALWAYS choose the most specific category from the list
               - If selling price is not shown, calculate with reasonable margin on GST-inclusive cost
               - Always calculate costPrice = basePrice + gstAmount
               - Be thorough - extract EVERY line item from ALL pages of the invoice`;

        const responseFormat = inventoryType === 'manufacturing'
            ? `{
                "invoiceNumber": "string or null",
                "invoiceDate": "string or null",
                "supplier": {
                    "name": "string",
                    "contact": "string or null",
                    "address": "string or null",
                    "gstin": "string or null"
                },
                "items": [
                    {
                        "name": "string",
                        "sku": "string",
                        "description": "string",
                        "category": "string",
                        "unit": "string",
                        "hsnCode": "string or null",
                        "basePrice": number,
                        "gstPercentage": number,
                        "gstAmount": number,
                        "costPerUnit": number,
                        "quantity": number,
                        "totalCost": number,
                        "confidence": "high|medium|low"
                    }
                ],
                "subtotal": number or null,
                "totalGst": number or null,
                "totalAmount": number or null,
                "notes": "string or null"
            }`
            : `{
                "invoiceNumber": "string or null",
                "invoiceDate": "string or null",
                "supplier": {
                    "name": "string",
                    "contact": "string or null",
                    "address": "string or null",
                    "gstin": "string or null"
                },
                "items": [
                    {
                        "name": "string",
                        "sku": "string",
                        "description": "string",
                        "category": "string",
                        "unit": "string",
                        "hsnCode": "string or null",
                        "basePrice": number,
                        "gstPercentage": number,
                        "gstAmount": number,
                        "costPrice": number,
                        "sellingPrice": number,
                        "quantity": number,
                        "totalCost": number,
                        "confidence": "high|medium|low"
                    }
                ],
                "subtotal": number or null,
                "totalGst": number or null,
                "totalAmount": number or null,
                "notes": "string or null"
            }`;

        const fullPrompt = `${systemPrompt}

Respond ONLY with valid JSON in this exact format:
${responseFormat}

If you cannot read the invoice or find no items, return:
{"error": "reason", "items": []}`;

        // Process all files and combine results
        let allItems = [];
        let supplierInfo = null;
        let invoiceNumber = null;
        let invoiceDate = null;
        let totalGst = 0;
        let subtotal = 0;
        let grandTotal = 0;
        const processedFiles = [];

        for (const file of filesToProcess) {
            try {
                // Convert file to base64
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const base64Data = buffer.toString('base64');
                const mimeType = file.type;

                // Use the existing gemini utility to analyze the image/document
                const textResponse = await analyzeImage(base64Data, mimeType, fullPrompt);

                if (!textResponse || textResponse.startsWith('Error:')) {
                    console.error(`Failed to process ${file.name}:`, textResponse);
                    processedFiles.push({ name: file.name, status: 'error', error: textResponse });
                    continue;
                }

                // Parse the JSON response
                let parsedData;
                try {
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

                    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        cleanJson = jsonMatch[0];
                    }

                    parsedData = JSON.parse(cleanJson);
                } catch (parseError) {
                    console.error(`Failed to parse response for ${file.name}:`, textResponse);
                    processedFiles.push({ name: file.name, status: 'parse_error' });
                    continue;
                }

                // Extract supplier info from first successful file
                if (!supplierInfo && parsedData.supplier) {
                    supplierInfo = parsedData.supplier;
                }
                if (!invoiceNumber && parsedData.invoiceNumber) {
                    invoiceNumber = parsedData.invoiceNumber;
                }
                if (!invoiceDate && parsedData.invoiceDate) {
                    invoiceDate = parsedData.invoiceDate;
                }

                // Add totals
                if (parsedData.totalGst) totalGst += parsedData.totalGst;
                if (parsedData.subtotal) subtotal += parsedData.subtotal;
                if (parsedData.totalAmount) grandTotal += parsedData.totalAmount;

                // Add items from this file
                if (parsedData.items && Array.isArray(parsedData.items)) {
                    allItems.push(...parsedData.items);
                }

                processedFiles.push({ name: file.name, status: 'success', itemCount: parsedData.items?.length || 0 });

            } catch (fileError) {
                console.error(`Error processing file ${file.name}:`, fileError);
                processedFiles.push({ name: file.name, status: 'error', error: fileError.message });
            }
        }

        // Validate and enhance the extracted data
        if (allItems.length > 0) {
            allItems = allItems.map((item, index) => {
                // Calculate GST-inclusive cost if not already
                let finalCost, basePrice, gstAmount, gstPercentage;

                if (inventoryType === 'manufacturing') {
                    basePrice = parseFloat(item.basePrice) || 0;
                    gstPercentage = parseFloat(item.gstPercentage) || 0;
                    gstAmount = parseFloat(item.gstAmount) || (basePrice * gstPercentage / 100);
                    finalCost = parseFloat(item.costPerUnit) || (basePrice + gstAmount);

                    // If costPerUnit seems to be without GST, add it
                    if (finalCost === basePrice && gstAmount > 0) {
                        finalCost = basePrice + gstAmount;
                    }
                } else {
                    basePrice = parseFloat(item.basePrice) || 0;
                    gstPercentage = parseFloat(item.gstPercentage) || 0;
                    gstAmount = parseFloat(item.gstAmount) || (basePrice * gstPercentage / 100);
                    finalCost = parseFloat(item.costPrice) || (basePrice + gstAmount);

                    // If costPrice seems to be without GST, add it
                    if (finalCost === basePrice && gstAmount > 0) {
                        finalCost = basePrice + gstAmount;
                    }
                }

                const quantity = parseFloat(item.quantity) || 1;

                const enhanced = {
                    ...item,
                    id: `temp-${Date.now()}-${index}`,
                    name: item.name || 'Unknown Product',
                    sku: item.sku || `${inventoryType === 'manufacturing' ? 'RM' : 'PRD'}-${String(Date.now()).slice(-4)}-${index + 1}`,
                    description: item.description || '',
                    category: item.category || 'Uncategorized',
                    unit: item.unit || 'pcs',
                    hsnCode: item.hsnCode || '',
                    basePrice: basePrice,
                    gstPercentage: gstPercentage,
                    gstAmount: gstAmount,
                    quantity: quantity,
                    confidence: item.confidence || 'medium',
                    needsReview: !item.name || !item.sku || item.confidence === 'low'
                };

                if (inventoryType === 'manufacturing') {
                    enhanced.costPerUnit = finalCost;
                    enhanced.totalCost = finalCost * quantity;
                } else {
                    enhanced.costPrice = finalCost;
                    enhanced.sellingPrice = parseFloat(item.sellingPrice) || (finalCost * 1.25);
                    enhanced.totalCost = finalCost * quantity;
                }

                return enhanced;
            });
        }

        return NextResponse.json({
            success: true,
            inventoryType,
            filesProcessed: processedFiles,
            invoiceNumber,
            invoiceDate,
            supplier: supplierInfo,
            subtotal,
            totalGst,
            totalAmount: grandTotal,
            items: allItems
        });

    } catch (error) {
        console.error('Invoice scan error:', error);
        return NextResponse.json({
            message: error.message || 'Failed to process invoice',
            items: []
        }, { status: 500 });
    }
}
