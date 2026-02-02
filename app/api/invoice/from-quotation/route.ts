import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import TechnoQuotation from '@/models/TechnoQuotation';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
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
            address: quotation.companyDetails?.address || '',
            phone: quotation.companyDetails?.phone || '',
            email: quotation.companyDetails?.email || '',
            gstin: quotation.companyDetails?.gstin || '',
            logo: quotation.companyDetails?.logo || ''
        },
        // Client details
        clientDetails: quotation.clientDetails || {},
        // Quotation metadata
        title: quotation.title || '',
        refNo: quotation.refNo || '',
        date: quotation.date || '',
        subject: quotation.subject || '',
        greeting: quotation.greeting || '',
        // Sections and tables
        headings: [],
        paragraphs: [],
        lists: [],
        allSections: [],
        allTables: [],
        footer: quotation.footer || {},
        signature: quotation.signature || {},
        rawTextContent: ''
    };

    // Extract from contentBlocks (TechnoQuotation structure)
    if (quotation.contentBlocks && Array.isArray(quotation.contentBlocks)) {
        quotation.contentBlocks.forEach((block: any, index: number) => {
            if (block.type === 'heading') {
                data.headings.push(block.content);
                data.rawTextContent += `HEADING: ${block.content}\n`;
            } else if (block.type === 'paragraph') {
                data.paragraphs.push(block.content);
                data.rawTextContent += `${block.content}\n`;
            } else if (block.type === 'list') {
                data.lists.push(block.items || []);
                data.rawTextContent += `LIST:\n${(block.items || []).map((i: string) => `- ${i}`).join('\n')}\n`;
            } else if (block.type === 'table' && block.tableData) {
                const tableHeaders = block.tableData.headers || [];
                const tableRows = block.tableData.rows || [];
                
                const tableData: any = {
                    blockIndex: index,
                    name: block.content || 'Table',
                    headers: tableHeaders,
                    rawData: []
                };

                // Convert table rows to readable format with headers as keys
                if (tableRows.length > 0 && tableHeaders.length > 0) {
                    tableRows.forEach((row: string[]) => {
                        const rowData: any = {};
                        tableHeaders.forEach((header: string, colIndex: number) => {
                            if (row[colIndex] !== undefined) {
                                rowData[header] = row[colIndex];
                            }
                        });
                        tableData.rawData.push(rowData);
                    });
                }
                
                data.allTables.push(tableData);
                data.rawTextContent += `TABLE (${tableData.name}):\n${JSON.stringify(tableData.rawData, null, 2)}\n`;
            }
        });
    }

    // Extract signature and footer
    if (quotation.footer) {
        const footerText = [quotation.footer.line1, quotation.footer.line2, quotation.footer.line3].filter(Boolean).join('\n');
        data.rawTextContent += `FOOTER TERMS:\n${footerText}\n`;
    }
    if (quotation.signature) {
        data.rawTextContent += `SIGNATURE: ${quotation.signature.name} (${quotation.signature.designation})\n`;
    }

    // Also handle legacy pages structure for backward compatibility
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

        const today = new Date().toISOString().split('T')[0];
        const prompt = `You are an ELITE Financial Data Analyst and Invoice Architect. Your task is to transform technical quotation data into a professional, precise Tax Invoice.

=== TARGET INVOICE STRUCTURE (JSON) ===
{
    "companyDetails": {
        "name": "Exact seller name",
        "address": "Full street address",
        "city": "City",
        "state": "State",
        "pincode": "ZIP/Pincode",
        "email": "Official email",
        "phone": "Contact number",
        "gstin": "GSTIN (verify format)",
        "stateCode": "2-digit state code"
    },
    "clientDetails": {
        "name": "Full legal name of buyer",
        "address": "Billing address",
        "city": "Client city",
        "state": "Client state",
        "pincode": "Client pincode",
        "email": "Client email if found",
        "phone": "Client contact",
        "gstin": "Client GSTIN if available",
        "paymentMode": "Inferred or mentioned payment mode"
    },
    "items": [
        {
            "id": "1",
            "description": "Professional description from quotation",
            "hsnsac": "Extract HSN/SAC code if present",
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
        "placeOfSupply": "State of supply (important for GST)",
        "reverseCharge": "Yes/No",
        "deliveryNote": "Any delivery mention",
        "referenceNo": "Use Quotation Ref No",
        "termsOfDelivery": "Extract from sections"
    },
    "bankDetails": {
        "bankName": "Bank name",
        "accountNumber": "Account No",
        "ifscCode": "IFSC",
        "branch": "Branch",
        "upiId": "UPI"
    },
    "terms": {
        "notes": "Project summary/notes",
        "termsConditions": "Extract ALL terms found in quotation",
        "authorizedSignatory": "Signatory name",
        "declarationText": "Standard declaration"
    },
    "financials": {
        "shippingCharges": 0,
        "otherCharges": 0
    },
    "invoiceDate": "${today}",
    "dueDate": "30 days from now",
    "poNumber": "PO number if found"
}

=== QUOTATION SOURCE DATA ===
${JSON.stringify(quotationData, null, 2)}

=== CRITICAL EXTRACTION RULES ===
1. PRESERVE VALUES: Do NOT round off or modify rates and quantities found in tables. Use the EXACT numbers from the quotation.
2. TABLE MAPPING: Identify headers accurately. 'Particulars' or 'Items' -> description. 'Qty' -> quantity. 'Unit Price' or 'Rate' -> rate.
3. SMART GST DETECTION: Look for 'GST %', 'Tax', or separate SGST/CGST columns in tables. If total value is given in quotation, ensure rate * qty = taxable value.
4. CLIENT DATA: If client address is a single string, parse it into city, state, and pincode.
5. TAX CALCULATION: If tax is not mentioned per item, use 18% (9% CGST + 9% SGST) as standard for Indian Techno-Commercial invoices, UNLESS the quotation explicitly mentions a different rate.
6. COMPREHENSIVE TERMS: Scrape 'Terms and Conditions' or 'Payment Terms' from text sections and format them as a numbered list in the invoice.
7. PLACE OF SUPPLY: Determine the Place of Supply based on the Client's State.

Return ONLY the JSON. Verify it is valid JSON before finishing.`;

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const text = extractText(result);

        try {
            const parsed = JSON.parse(text);

            // POST-PROCESSING: Ensure mathematical consistency and exact data preservation
            if (parsed.items && Array.isArray(parsed.items)) {
                parsed.items = parsed.items.map((item: any, index: number) => {
                    const qty = parseFloat(item.quantity) || 1;
                    const rate = parseFloat(item.rate) || 0;
                    const discount = item.discount !== undefined ? parseFloat(item.discount) : 0;
                    
                    // If AI didn't find taxRate, default to 18
                    let taxRate = parseFloat(item.taxRate);
                    if (isNaN(taxRate)) taxRate = 18;

                    const subtotal = qty * rate;
                    const discountAmount = (subtotal * discount) / 100;
                    const taxableValue = subtotal - discountAmount;

                    // Indian GST standard split
                    const cgstPercent = taxRate / 2;
                    const sgstPercent = taxRate / 2;
                    const cgst = (taxableValue * cgstPercent) / 100;
                    const sgst = (taxableValue * sgstPercent) / 100;

                    return {
                        id: item.id || String(index + 1),
                        description: item.description || 'Service/Product',
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

            // Defaults for missing critical fields
            if (!parsed.invoiceDate) parsed.invoiceDate = today;
            if (!parsed.clientDetails?.name && quotationData.clientDetails?.name) {
                parsed.clientDetails = { ...parsed.clientDetails, name: quotationData.clientDetails.name };
            }

            return parsed;
        } catch (parseError) {
            console.error('JSON parse error in AI transformation:', parseError, 'Raw text:', text);
            // Fallback to extraction from markdown if JSON mode failed for some reason
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (_) {}
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
            address: quotationData.companyDetails?.address || '',
            city: '',
            state: '',
            pincode: '',
            email: quotationData.companyDetails?.email || '',
            phone: quotationData.companyDetails?.phone || '',
            gstin: quotationData.companyDetails?.gstin || '',
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
            notes: `Reference Quotation: ${quotationData.refNo || quotationData.title}`,
            termsConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.\n3. Subject to jurisdiction.',
            authorizedSignatory: quotationData.signature?.name || ''
        },
        orderDetails: {
            referenceNo: quotationData.refNo || ''
        },
        bankDetails: {},
        financials: {
            shippingCharges: 0,
            otherCharges: 0
        },
        invoiceDate: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0]
    };

    // Extract items from all processed tables
    quotationData.allTables?.forEach((table: any) => {
        if (table.rawData && table.rawData.length > 0) {
            table.rawData.forEach((rowData: any, rowIndex: number) => {
                let description = '';
                let quantity = 1;
                let rate = 0;
                let hsnsac = '';
                let taxRate = 18;

                Object.keys(rowData).forEach(key => {
                    const k = key.toLowerCase();
                    const v = rowData[key];

                    if (k.includes('desc') || k.includes('item') || k.includes('partic') || k.includes('product')) {
                        description = String(v);
                    } else if (k.includes('qty') || k.includes('quant') || k.includes('nos')) {
                        quantity = parseFloat(String(v)) || 1;
                    } else if (k.includes('rate') || k.includes('price') || k.includes('unit')) {
                        rate = parseFloat(String(v).replace(/[^\d.]/g, '')) || 0;
                    } else if (k.includes('hsn') || k.includes('sac')) {
                        hsnsac = String(v);
                    } else if (k.includes('gst') || k.includes('tax')) {
                        const tr = parseFloat(String(v).replace(/[^\d.]/g, ''));
                        if (!isNaN(tr)) taxRate = tr;
                    } else if ((k.includes('amount') || k.includes('total')) && rate === 0) {
                        const amount = parseFloat(String(v).replace(/[^\d.]/g, '')) || 0;
                        if (quantity > 0) rate = amount / quantity;
                    }
                });

                if (description || rate > 0) {
                    const taxableValue = quantity * rate;
                    const cgst = (taxableValue * (taxRate / 2)) / 100;
                    const sgst = (taxableValue * (taxRate / 2)) / 100;

                    result.items.push({
                        id: `${table.blockIndex}-${rowIndex + 1}`,
                        description,
                        quantity,
                        rate,
                        discount: 0,
                        taxRate,
                        cgstPercent: taxRate / 2,
                        sgstPercent: taxRate / 2,
                        cgst: Math.round(cgst * 100) / 100,
                        sgst: Math.round(sgst * 100) / 100,
                        totalGst: Math.round((cgst + sgst) * 100) / 100,
                        hsnsac
                    });
                }
            });
        }
    });

    // Extract more details from text paragraphs if items are still empty
    if (result.items.length === 0 && quotationData.paragraphs?.length > 0) {
        result.items.push({
            id: "1",
            description: quotationData.subject || quotationData.title || "Services per quotation",
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
        const { userId } = await getAuthenticatedUser(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        // Merge company details
        const finalCompanyDetails = {
            name: transformedData.companyDetails?.name || quotation.companyDetails?.name || '',
            address: transformedData.companyDetails?.address || quotation.companyDetails?.address || '',
            city: transformedData.companyDetails?.city || '',
            state: transformedData.companyDetails?.state || '',
            pincode: transformedData.companyDetails?.pincode || '',
            email: transformedData.companyDetails?.email || quotation.companyDetails?.email || '',
            phone: transformedData.companyDetails?.phone || quotation.companyDetails?.phone || '',
            gstin: transformedData.companyDetails?.gstin || '',
            stateCode: transformedData.companyDetails?.stateCode || '',
            logo: quotation.companyDetails?.logo || ''
        };

        // Calculate financials for consistent state
        const items = transformedData.items || [];
        let totalTaxable = 0;
        let totalGst = 0;
        
        items.forEach((item: any) => {
            const taxable = (item.quantity * item.rate) - ((item.quantity * item.rate * (item.discount || 0)) / 100);
            totalTaxable += taxable;
            totalGst += (item.totalGst || 0);
        });

        const shippingCharges = parseFloat(transformedData.financials?.shippingCharges) || 0;
        const otherCharges = parseFloat(transformedData.financials?.otherCharges) || 0;
        const grandTotal = Math.round(totalTaxable + totalGst + shippingCharges + otherCharges);

        // Determine Tax Type (GST vs IGST)
        const sellerState = (finalCompanyDetails.state || '').toLowerCase().trim();
        const buyerState = (transformedData.clientDetails?.state || '').toLowerCase().trim();
        let autodetectedTaxType: 'GST' | 'IGST' | 'None' = 'GST';
        
        if (sellerState && buyerState && sellerState !== buyerState) {
            autodetectedTaxType = 'IGST';
        }

        // Create the invoice
        const newInvoice = await Invoice.create({
            userId: userId,
            invoiceNumber: invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            title: transformedData.title || "TAX INVOICE",
            sourceQuotationId: quotationId,
            invoiceDate: transformedData.invoiceDate ? new Date(transformedData.invoiceDate) : new Date(),
            dueDate: transformedData.dueDate ? new Date(transformedData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            poNumber: transformedData.poNumber || '',
            poDate: transformedData.poDate ? new Date(transformedData.poDate) : null,
            companyDetails: finalCompanyDetails,
            clientDetails: {
                ...transformedData.clientDetails,
                name: transformedData.clientDetails?.name || quotation.clientDetails?.name || '',
                address: transformedData.clientDetails?.address || quotation.clientDetails?.address || ''
            },
            shipToDetails: {
                ...transformedData.shipToDetails,
                sameAsBillTo: true
            },
            orderDetails: {
                ...transformedData.orderDetails,
                placeOfSupply: transformedData.orderDetails?.placeOfSupply || transformedData.clientDetails?.state || '',
                referenceNo: transformedData.orderDetails?.referenceNo || quotation.refNo || ''
            },
            items: items,
            financials: {
                shippingCharges,
                otherCharges,
                totalTaxable,
                totalGst,
                grandTotal
            },
            bankDetails: transformedData.bankDetails || {},
            terms: {
                ...(transformedData.terms || {}),
                termsConditions: transformedData.terms?.termsConditions || "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
                authorizedSignatory: transformedData.terms?.authorizedSignatory || quotation.signature?.name || ''
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
                taxType: autodetectedTaxType,
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
