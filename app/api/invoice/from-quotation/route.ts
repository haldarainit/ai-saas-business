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

// Extract ALL data from quotation comprehensively
function extractQuotationDataComprehensive(quotation: any) {
    const data: any = {
        // Company details from quotation
        companyDetails: {
            name: quotation.companyDetails?.name || '',
            address1: quotation.companyDetails?.address1 || '',
            address2: quotation.companyDetails?.address2 || '',
            phone: quotation.companyDetails?.phone || '',
            email: quotation.companyDetails?.email || '',
            logo: quotation.companyDetails?.logo || ''
        },
        // Client details
        clientDetails: quotation.clientDetails || {},
        // Quotation metadata
        title: quotation.title || '',
        mainTitle: quotation.mainTitle || '',
        companyId: quotation.companyId || '',
        companyDate: quotation.companyDate || '',
        // Footer info
        footer: quotation.footer || {},
        // All content
        allSections: [],
        allTables: [],
        rawTextContent: ''
    };

    // Extract everything from pages
    if (quotation.pages && Array.isArray(quotation.pages)) {
        quotation.pages.forEach((page: any, pageIndex: number) => {
            if (page.sections && Array.isArray(page.sections)) {
                page.sections.forEach((section: any) => {
                    // Add all section data
                    const sectionData: any = {
                        pageIndex,
                        type: section.type,
                        heading: section.heading || '',
                        content: section.content || '',
                        items: section.items || []
                    };

                    // Build raw text for AI analysis
                    if (section.heading) {
                        data.rawTextContent += `\n${section.heading}: `;
                    }
                    if (section.content) {
                        data.rawTextContent += section.content + '\n';
                    }
                    if (section.items && section.items.length > 0) {
                        data.rawTextContent += section.items.join(', ') + '\n';
                    }

                    // Handle tables specially
                    if (section.type === 'table' && section.table) {
                        const tableData: any = {
                            name: section.table.name || section.heading || 'Table',
                            columns: section.table.columns || [],
                            rows: section.table.rows || [],
                            rawData: []
                        };

                        // Convert table to readable format
                        if (tableData.rows.length > 0) {
                            tableData.rows.forEach((row: any) => {
                                const rowData: any = {};
                                tableData.columns.forEach((col: any) => {
                                    if (row.cells && row.cells[col.id]) {
                                        rowData[col.name || col.id] = row.cells[col.id];
                                    }
                                });
                                tableData.rawData.push(rowData);
                                // Add to raw text
                                data.rawTextContent += JSON.stringify(rowData) + '\n';
                            });
                        }

                        data.allTables.push(tableData);
                    }

                    data.allSections.push(sectionData);
                });
            }
        });
    }

    return data;
}

// Smart AI transformation - extracts EVERYTHING
async function smartAITransformation(quotationData: any, invoiceNumber: string): Promise<any> {
    if (!genAI) {
        return enhancedBasicTransformation(quotationData, invoiceNumber);
    }

    try {
        const modelName = await getWorkingModel();
        if (!modelName) {
            return enhancedBasicTransformation(quotationData, invoiceNumber);
        }

        const prompt = `You are an EXPERT invoice data extractor and transformer. Your job is to analyze a quotation document and extract EVERY possible piece of information to create a complete, professional invoice.

=== QUOTATION DATA TO ANALYZE ===
${JSON.stringify(quotationData, null, 2)}

=== YOUR TASK ===
Analyze the quotation data thoroughly and extract ALL information to fill the invoice fields. Be intelligent - infer missing data from context when possible.

Return a COMPLETE JSON with this EXACT structure (fill every field you can find or logically derive):

{
    "companyDetails": {
        "name": "Extract company/seller name",
        "address": "Full street address",
        "city": "City name (extract from address if needed)",
        "state": "State name (extract from address if needed)",
        "pincode": "Pincode/ZIP (extract from address if needed)",
        "email": "Company email",
        "phone": "Company phone number",
        "gstin": "GST number if found (format: 22AAAAA0000A1Z5)",
        "stateCode": "State code from GSTIN or derive from state"
    },
    "clientDetails": {
        "name": "Customer/client/buyer name",
        "address": "Customer full address",
        "city": "Customer city",
        "state": "Customer state",
        "pincode": "Customer pincode",
        "email": "Customer email",
        "phone": "Customer phone/mobile/contact",
        "gstin": "Customer GSTIN if available",
        "paymentMode": "Payment mode mentioned or 'Online'"
    },
    "items": [
        {
            "id": "1",
            "description": "Detailed item description - make it professional and complete",
            "hsnsac": "HSN/SAC code if mentioned",
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
    "orderDetails": {
        "placeOfSupply": "State/place of supply",
        "reverseCharge": "Yes or No",
        "hsnsac": "Default HSN/SAC",
        "deliveryNote": "Delivery note if mentioned",
        "referenceNo": "Reference number from quotation",
        "termsOfDelivery": "Delivery terms if mentioned",
        "destination": "Delivery destination if mentioned"
    },
    "bankDetails": {
        "bankName": "Bank name if mentioned",
        "accountNumber": "Account number if mentioned",
        "ifscCode": "IFSC code if mentioned",
        "branch": "Branch name if mentioned",
        "upiId": "UPI ID if mentioned"
    },
    "terms": {
        "notes": "Any special notes or remarks from the quotation",
        "termsConditions": "Extract terms and conditions, or create professional ones based on the quotation content",
        "jurisdictionText": "Jurisdiction clause if mentioned",
        "authorizedSignatory": "Signatory name from footer if available",
        "declarationText": "Any declaration text"
    },
    "financials": {
        "shippingCharges": 0,
        "otherCharges": 0
    },
    "invoiceDate": "Today's date in YYYY-MM-DD format",
    "dueDate": "30 days from today in YYYY-MM-DD format",
    "poNumber": "PO number if mentioned",
    "poDate": "PO date if mentioned"
}

=== EXTRACTION RULES ===
1. ITEMS: Look in tables for products/services. Extract description, quantity, rate/price, amount. Calculate GST (9% CGST + 9% SGST = 18% total unless specified otherwise).
2. CLIENT: Look for "Customer", "Client", "Buyer", "Bill To", "Party", etc. in sections.  
3. COMPANY: Use the company details provided, but also look for additional info in sections/footer.
4. PRICING: Parse numbers correctly - remove currency symbols (₹, $), commas. If only total is given, calculate rate from quantity.
5. GST CALCULATION: For each item, calculate: taxableValue = qty * rate - discount, cgst = taxableValue * 0.09, sgst = taxableValue * 0.09, totalGst = cgst + sgst
6. DATES: Use format YYYY-MM-DD. Today is ${new Date().toISOString().split('T')[0]}.
7. INFER: If city/state/pincode are not separate, parse from full address intelligently.
8. TERMS: If no specific terms found, create professional ones relevant to the quotation content.
9. REFERENCE: Use quotation reference number, date, or ID as reference in invoice.

Return ONLY valid JSON, no explanations or markdown.`;

        const result = await genAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = extractText(result);

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);

                // Ensure all required item fields exist and calculate GST
                if (parsed.items && Array.isArray(parsed.items)) {
                    parsed.items = parsed.items.map((item: any, index: number) => {
                        const qty = parseFloat(item.quantity) || 1;
                        const rate = parseFloat(item.rate) || 0;
                        const discount = parseFloat(item.discount) || 0;
                        const taxRate = parseFloat(item.taxRate) || 18;

                        const subtotal = qty * rate;
                        const discountAmount = (subtotal * discount) / 100;
                        const taxableValue = subtotal - discountAmount;

                        const cgstPercent = taxRate / 2;
                        const sgstPercent = taxRate / 2;
                        const cgst = (taxableValue * cgstPercent) / 100;
                        const sgst = (taxableValue * sgstPercent) / 100;

                        return {
                            id: item.id || String(index + 1),
                            description: item.description || '',
                            hsnsac: item.hsnsac || '',
                            quantity: qty,
                            rate: rate,
                            discount: discount,
                            taxRate: taxRate,
                            cgstPercent: cgstPercent,
                            sgstPercent: sgstPercent,
                            cgst: Math.round(cgst * 100) / 100,
                            sgst: Math.round(sgst * 100) / 100,
                            totalGst: Math.round((cgst + sgst) * 100) / 100
                        };
                    });
                }

                return parsed;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
            }
        }
    } catch (error) {
        console.error('AI transformation failed:', error);
    }

    return enhancedBasicTransformation(quotationData, invoiceNumber);
}

// Enhanced basic transformation (fallback)
function enhancedBasicTransformation(quotationData: any, invoiceNumber: string): any {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);

    const result: any = {
        companyDetails: {
            name: quotationData.companyDetails?.name || '',
            address: quotationData.companyDetails?.address1 || '',
            city: '',
            state: '',
            pincode: '',
            email: quotationData.companyDetails?.email || '',
            phone: quotationData.companyDetails?.phone || '',
            gstin: '',
            stateCode: ''
        },
        clientDetails: {
            name: quotationData.clientDetails?.name || '',
            address: quotationData.clientDetails?.address || '',
            city: '',
            state: '',
            pincode: '',
            email: '',
            phone: quotationData.clientDetails?.contact || '',
            gstin: '',
            paymentMode: 'Online'
        },
        items: [],
        terms: {
            notes: `Based on Quotation: ${quotationData.title}`,
            termsConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.\n3. Subject to jurisdiction.',
            authorizedSignatory: quotationData.footer?.line3?.replace('Authorized Submitter:', '').trim() || ''
        },
        orderDetails: {
            referenceNo: quotationData.companyId || ''
        },
        bankDetails: {},
        financials: {
            shippingCharges: 0,
            otherCharges: 0
        },
        invoiceDate: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0]
    };

    // Extract client details from sections
    quotationData.allSections?.forEach((section: any) => {
        const heading = section.heading?.toLowerCase() || '';
        const content = section.content || '';

        if (heading.includes('customer name') || heading.includes('client name') || heading.includes('party name')) {
            result.clientDetails.name = content;
        } else if (heading.includes('address')) {
            result.clientDetails.address = content;
        } else if (heading.includes('contact') || heading.includes('phone') || heading.includes('mobile')) {
            result.clientDetails.phone = content;
        } else if (heading.includes('email')) {
            result.clientDetails.email = content;
        } else if (heading.includes('gstin') || heading.includes('gst')) {
            result.clientDetails.gstin = content;
        }
    });

    // Extract items from tables
    quotationData.allTables?.forEach((table: any, tableIndex: number) => {
        if (table.rawData && table.rawData.length > 0) {
            table.rawData.forEach((rowData: any, rowIndex: number) => {
                // Find description, quantity, rate from different possible column names
                let description = '';
                let quantity = 1;
                let rate = 0;

                Object.keys(rowData).forEach(key => {
                    const keyLower = key.toLowerCase();
                    const value = rowData[key];

                    if (keyLower.includes('description') || keyLower.includes('item') || keyLower.includes('particular') || keyLower.includes('product') || keyLower.includes('service')) {
                        description = value;
                    } else if (keyLower.includes('qty') || keyLower.includes('quantity') || keyLower.includes('nos')) {
                        quantity = parseFloat(value) || 1;
                    } else if (keyLower.includes('rate') || keyLower.includes('price') || keyLower.includes('unit')) {
                        rate = parseFloat(String(value).replace(/[₹,$,]/g, '')) || 0;
                    } else if ((keyLower.includes('amount') || keyLower.includes('total')) && rate === 0) {
                        const amount = parseFloat(String(value).replace(/[₹,$,]/g, '')) || 0;
                        if (quantity > 0) {
                            rate = amount / quantity;
                        }
                    }
                });

                if (description || rate > 0) {
                    const taxableValue = quantity * rate;
                    const cgst = taxableValue * 0.09;
                    const sgst = taxableValue * 0.09;

                    result.items.push({
                        id: `${tableIndex + 1}-${rowIndex + 1}`,
                        description: description,
                        quantity: quantity,
                        rate: rate,
                        discount: 0,
                        taxRate: 18,
                        cgstPercent: 9,
                        sgstPercent: 9,
                        cgst: Math.round(cgst * 100) / 100,
                        sgst: Math.round(sgst * 100) / 100,
                        totalGst: Math.round((cgst + sgst) * 100) / 100
                    });
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

// POST: Create invoice from quotation with SMART AI
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

        // Fetch the quotation with ALL data
        const quotation = await TechnoQuotation.findOne({
            _id: quotationId,
            userId: userId
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        // Extract comprehensive data from quotation
        const quotationData = extractQuotationDataComprehensive(quotation);

        // Transform using Smart AI or enhanced basic method
        let transformedData;
        if (useAI && API_KEY) {
            transformedData = await smartAITransformation(quotationData, invoiceNumber);
        } else {
            transformedData = enhancedBasicTransformation(quotationData, invoiceNumber);
        }

        // Merge company details - prefer AI-extracted if available
        const finalCompanyDetails = {
            name: transformedData.companyDetails?.name || quotation.companyDetails?.name || '',
            address: transformedData.companyDetails?.address || quotation.companyDetails?.address1 || '',
            city: transformedData.companyDetails?.city || '',
            state: transformedData.companyDetails?.state || '',
            pincode: transformedData.companyDetails?.pincode || '',
            email: transformedData.companyDetails?.email || quotation.companyDetails?.email || '',
            phone: transformedData.companyDetails?.phone || quotation.companyDetails?.phone || '',
            gstin: transformedData.companyDetails?.gstin || '',
            stateCode: transformedData.companyDetails?.stateCode || '',
            logo: quotation.companyDetails?.logo || ''
        };

        // Create the invoice with ALL extracted data
        const newInvoice = await Invoice.create({
            userId: userId,
            invoiceNumber: invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            title: "TAX INVOICE",
            sourceQuotationId: quotationId,
            invoiceDate: transformedData.invoiceDate ? new Date(transformedData.invoiceDate) : new Date(),
            dueDate: transformedData.dueDate ? new Date(transformedData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            poNumber: transformedData.poNumber || '',
            poDate: transformedData.poDate ? new Date(transformedData.poDate) : null,
            companyDetails: finalCompanyDetails,
            clientDetails: transformedData.clientDetails || {},
            shipToDetails: {
                sameAsBillTo: true
            },
            orderDetails: transformedData.orderDetails || {},
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
            financials: transformedData.financials || {
                shippingCharges: 0,
                otherCharges: 0
            },
            bankDetails: transformedData.bankDetails || {},
            terms: transformedData.terms || {
                termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
            },
            settings: {
                showBankDetails: !!(transformedData.bankDetails?.bankName),
                showTerms: true,
                showJurisdiction: true,
                showDeclaration: false,
                showDiscount: true,
                showTaxColumns: true,
                showDueDate: true,
                showDeliveryDetails: !!(transformedData.orderDetails?.deliveryNote),
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
            extractedFields: {
                companyDetails: !!finalCompanyDetails.name,
                clientDetails: !!transformedData.clientDetails?.name,
                items: transformedData.items?.length || 0,
                bankDetails: !!transformedData.bankDetails?.bankName,
                terms: !!transformedData.terms?.termsConditions
            },
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
