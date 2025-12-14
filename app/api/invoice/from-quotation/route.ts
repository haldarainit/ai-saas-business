import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import TechnoQuotation from '@/models/TechnoQuotation';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Available models in order of preference
const AVAILABLE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
];

async function getWorkingModel() {
    if (!genAI) return null;

    for (const modelName of AVAILABLE_MODELS) {
        try {
            const result = await genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            });
            if (result) return modelName;
        } catch (error) {
            continue;
        }
    }
    return null;
}

function extractText(result: any): string {
    try {
        if (result?.response?.text) {
            return typeof result.response.text === "function"
                ? result.response.text()
                : result.response.text;
        }
        if (typeof result?.text === "function") {
            return result.text();
        }
        if (result?.output_text) {
            return result.output_text;
        }
        const parts =
            result?.response?.candidates?.[0]?.content?.parts ||
            result?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
            const joined = parts
                .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
                .join("")
                .trim();
            if (joined) return joined;
        }
    } catch (_) { }
    return "";
}

// Extract structured data from quotation pages
function extractQuotationData(quotation: any) {
    const data: any = {
        companyDetails: quotation.companyDetails || {},
        clientDetails: quotation.clientDetails || {},
        title: quotation.title || '',
        items: [],
        sections: [],
        tables: []
    };

    // Parse pages and sections
    if (quotation.pages && Array.isArray(quotation.pages)) {
        quotation.pages.forEach((page: any) => {
            if (page.sections && Array.isArray(page.sections)) {
                page.sections.forEach((section: any) => {
                    if (section.type === 'table' && section.table) {
                        data.tables.push({
                            name: section.table.name || section.heading || 'Table',
                            columns: section.table.columns || [],
                            rows: section.table.rows || []
                        });
                    } else if (section.type === 'text' || section.type === 'heading') {
                        data.sections.push({
                            heading: section.heading || '',
                            content: section.content || ''
                        });
                    } else if (section.type === 'list') {
                        data.sections.push({
                            heading: section.heading || '',
                            items: section.items || []
                        });
                    }
                });
            }
        });
    }

    return data;
}

// Transform quotation data to invoice format using AI
async function transformWithAI(quotationData: any, invoiceNumber: string): Promise<any> {
    if (!genAI) {
        // Fallback to basic transformation without AI
        return basicTransformation(quotationData, invoiceNumber);
    }

    try {
        const modelName = await getWorkingModel();
        if (!modelName) {
            return basicTransformation(quotationData, invoiceNumber);
        }

        const prompt = `You are an expert invoice generator. Transform this quotation data into a professional invoice format.

QUOTATION DATA:
${JSON.stringify(quotationData, null, 2)}

INVOICE NUMBER: ${invoiceNumber}

Generate a JSON response with the following structure:
{
    "clientDetails": {
        "name": "extracted or derived client name",
        "address": "full address",
        "city": "city name",
        "state": "state name",
        "pincode": "pincode if available",
        "email": "email if available",
        "phone": "phone if available",
        "gstin": "GSTIN if available",
        "paymentMode": "Online"
    },
    "items": [
        {
            "id": "1",
            "description": "item description - be detailed and professional",
            "quantity": 1,
            "rate": 0,
            "discount": 0,
            "taxRate": 18,
            "cgstPercent": 9,
            "sgstPercent": 9,
            "cgst": 0,
            "sgst": 0,
            "totalGst": 0
        }
    ],
    "terms": {
        "notes": "Professional notes based on quotation content",
        "termsConditions": "Standard terms and conditions"
    },
    "orderDetails": {
        "placeOfSupply": "derived place if available",
        "termsOfDelivery": "derived terms if available"
    }
}

RULES:
1. Extract item details from tables if present (look for columns like Item, Description, Qty, Price, Amount, Rate)
2. Calculate quantities and rates accurately from the quotation data
3. If no structured items found, create logical items from section content
4. Extract client information from Customer Details sections
5. Make item descriptions clear and professional
6. Use 18% GST rate (9% CGST + 9% SGST) as default unless specified otherwise
7. Preserve any pricing information found in the quotation
8. Return ONLY the JSON, no other text`;

        const result = await genAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = extractText(result);

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        }
    } catch (error) {
        console.error('AI transformation failed:', error);
    }

    return basicTransformation(quotationData, invoiceNumber);
}

// Basic transformation without AI
function basicTransformation(quotationData: any, invoiceNumber: string): any {
    const result: any = {
        clientDetails: {
            name: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            email: '',
            phone: '',
            gstin: '',
            paymentMode: 'Online'
        },
        items: [],
        terms: {
            notes: '',
            termsConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.'
        },
        orderDetails: {}
    };

    // Extract client details from sections
    quotationData.sections.forEach((section: any) => {
        const heading = section.heading?.toLowerCase() || '';
        const content = section.content || '';

        if (heading.includes('customer name') || heading.includes('client name')) {
            result.clientDetails.name = content;
        } else if (heading.includes('customer address') || heading.includes('client address') || heading.includes('address')) {
            result.clientDetails.address = content;
        } else if (heading.includes('contact number') || heading.includes('phone') || heading.includes('mobile')) {
            result.clientDetails.phone = content;
        } else if (heading.includes('email')) {
            result.clientDetails.email = content;
        }
    });

    // Extract items from tables
    quotationData.tables.forEach((table: any, tableIndex: number) => {
        if (table.rows && table.rows.length > 0) {
            // Try to find column indices
            const columns = table.columns || [];
            let descIdx = -1, qtyIdx = -1, rateIdx = -1, amountIdx = -1;

            columns.forEach((col: any, idx: number) => {
                const colName = col.name?.toLowerCase() || '';
                if (colName.includes('description') || colName.includes('item') || colName.includes('particular')) {
                    descIdx = idx;
                } else if (colName.includes('qty') || colName.includes('quantity')) {
                    qtyIdx = idx;
                } else if (colName.includes('rate') || colName.includes('price') || colName.includes('unit')) {
                    rateIdx = idx;
                } else if (colName.includes('amount') || colName.includes('total')) {
                    amountIdx = idx;
                }
            });

            // Extract items from rows
            table.rows.forEach((row: any, rowIndex: number) => {
                const cells = row.cells || {};
                const item: any = {
                    id: `${tableIndex + 1}-${rowIndex + 1}`,
                    description: '',
                    quantity: 1,
                    rate: 0,
                    discount: 0,
                    taxRate: 18,
                    cgstPercent: 9,
                    sgstPercent: 9,
                    cgst: 0,
                    sgst: 0,
                    totalGst: 0
                };

                // Get values by column index
                if (descIdx !== -1) {
                    const colId = columns[descIdx]?.id;
                    item.description = cells[colId] || '';
                }
                if (qtyIdx !== -1) {
                    const colId = columns[qtyIdx]?.id;
                    item.quantity = parseFloat(cells[colId]) || 1;
                }
                if (rateIdx !== -1) {
                    const colId = columns[rateIdx]?.id;
                    item.rate = parseFloat(cells[colId]?.replace(/[₹,]/g, '')) || 0;
                }
                if (amountIdx !== -1 && rateIdx === -1 && item.quantity > 0) {
                    const colId = columns[amountIdx]?.id;
                    const amount = parseFloat(cells[colId]?.replace(/[₹,]/g, '')) || 0;
                    item.rate = amount / item.quantity;
                }

                // Only add if there's meaningful data
                if (item.description || item.rate > 0) {
                    result.items.push(item);
                }
            });
        }
    });

    // Add default item if no items extracted
    if (result.items.length === 0) {
        result.items.push({
            id: "1",
            description: quotationData.title || "Services as per quotation",
            quantity: 1,
            rate: 0,
            discount: 0,
            taxRate: 18,
            cgstPercent: 9,
            sgstPercent: 9,
            cgst: 0,
            sgst: 0,
            totalGst: 0
        });
    }

    return result;
}

// POST: Create invoice from quotation
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-ignore
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.userId;

        await dbConnect();
        const body = await req.json();

        const { quotationId, invoiceNumber, useAI = true } = body;

        if (!quotationId) {
            return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 });
        }

        // Fetch the quotation
        const quotation = await TechnoQuotation.findOne({
            _id: quotationId,
            userId: userId
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        // Extract data from quotation
        const quotationData = extractQuotationData(quotation);

        // Transform using AI or basic method
        let transformedData;
        if (useAI && API_KEY) {
            transformedData = await transformWithAI(quotationData, invoiceNumber);
        } else {
            transformedData = basicTransformation(quotationData, invoiceNumber);
        }

        // Create the invoice
        const newInvoice = await Invoice.create({
            userId: userId,
            invoiceNumber: invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            title: "TAX INVOICE",
            sourceQuotationId: quotationId,
            companyDetails: quotation.companyDetails ? {
                name: quotation.companyDetails.name || '',
                address: quotation.companyDetails.address1 || '',
                city: '',
                state: '',
                pincode: '',
                email: quotation.companyDetails.email || '',
                phone: quotation.companyDetails.phone || '',
                gstin: '',
                stateCode: '',
                logo: quotation.companyDetails.logo || ''
            } : {},
            clientDetails: transformedData.clientDetails || {},
            items: transformedData.items || [{
                id: "1",
                description: "",
                quantity: 1,
                rate: 0,
                discount: 0,
                taxRate: 18,
                cgstPercent: 9,
                sgstPercent: 9,
                cgst: 0,
                sgst: 0,
                totalGst: 0
            }],
            terms: transformedData.terms || {
                termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
            },
            orderDetails: transformedData.orderDetails || {},
            settings: {
                showBankDetails: true,
                showTerms: true,
                showJurisdiction: true,
                showDeclaration: false,
                showDiscount: true,
                showTaxColumns: true,
                showDueDate: true,
                showDeliveryDetails: false,
                showDispatchDetails: false,
                showRoundOff: true,
                showHSNSAC: true,
                currency: 'INR',
                currencySymbol: '₹',
                taxType: 'GST',
                gstDisplayMode: 'split'
            }
        });

        return NextResponse.json({
            invoice: newInvoice,
            usedAI: useAI && !!API_KEY,
            sourceQuotation: {
                id: quotation._id,
                title: quotation.title
            }
        });

    } catch (error) {
        console.error('Error creating invoice from quotation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
