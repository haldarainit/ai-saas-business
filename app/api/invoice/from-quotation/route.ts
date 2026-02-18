import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import TechnoQuotation from '@/models/TechnoQuotation';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Available models in order of preference - gemini-2.5-flash is most accurate for data extraction
const AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    // "gemini-2.0-flash",
    // "gemini-1.5-flash",
    // "gemini-1.5-pro",
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
    if (quotation.title) {
        data.headings.push(quotation.title);
        data.rawTextContent += `QUOTATION TITLE: ${quotation.title}\n`;
    }

    if (quotation.contentBlocks && Array.isArray(quotation.contentBlocks)) {
        quotation.contentBlocks.forEach((block: any, index: number) => {
            if (block.type === 'heading') {
                data.headings.push(block.content);
                data.rawTextContent += `HEADING: ${block.content}\n`;
            } else if (block.type === 'paragraph') {
                // Filter out common placeholders to avoid AI confusion
                const content = (block.content || '').trim();
                const placeholders = ["New paragraph text...", "Type your text here", "Enter description"];
                if (content && !placeholders.includes(content)) {
                    data.paragraphs.push(content);
                    data.rawTextContent += `${content}\n`;
                }
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
                    rawData: [],
                    isTechnical: tableHeaders.some((h: string) => 
                        (h || '').toLowerCase().includes('compliance') || 
                        (h || '').toLowerCase().includes('requirement') || 
                        (h || '').toLowerCase().includes('offered') || 
                        (h || '').toLowerCase().includes('parameter') ||
                        (h || '').toLowerCase().includes('specification') ||
                        (h || '').toLowerCase().includes('technical')
                    ),
                    hasFinance: tableHeaders.some((h: string) => 
                        (h || '').toLowerCase().includes('rate') || 
                        (h || '').toLowerCase().includes('price') || 
                        (h || '').toLowerCase().includes('amount') || 
                        (h || '').toLowerCase().includes('cost') ||
                        (h || '').toLowerCase().includes('value') ||
                        (h || '').toLowerCase().includes('total')
                    )
                };

                // A table is billable if it's NOT explicitly technical OR it has finance headers
                tableData.isBillable = !tableData.isTechnical || tableData.hasFinance;
                
                // Extra check: if any row content has technical units like 460V, 900A, reject as technical if no finance headers
                if (!tableData.hasFinance && tableRows.length > 0) {
                    const techUnitRegex = /\b\d+\s*(v|a|ma|kv|hz|sqmm|hp|kw|rpm|ip|ph)\b/i;
                    const hasTechUnits = tableRows.some((row: string[]) => 
                        row.some(cell => techUnitRegex.test(String(cell)))
                    );
                    if (hasTechUnits) tableData.isTechnical = true;
                }

                // Convert table rows to readable format with headers as keys
                // CRITICAL FIX: Store original rows for fallback AND ensure all columns are captured
                tableData.originalRows = tableRows; // Store for fallback
                
                if (tableRows.length > 0) {
                    console.log(`[extractQuotationData] Processing table "${tableData.name}" with ${tableRows.length} rows`);
                    
                    tableRows.forEach((row: string[], rowIndex: number) => {
                        const rowData: any = {};
                        // Ensure we have enough headers, or generate generic ones
                        const maxCols = Math.max(tableHeaders.length, row.length);
                        
                        // CRITICAL FIX: Always include ALL columns, even if value is empty/undefined
                        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                            const header = tableHeaders[colIndex] || `Col-${colIndex + 1}`;
                            // Always set the value - use empty string if undefined to preserve column position
                            rowData[header] = row[colIndex] !== undefined ? row[colIndex] : '';
                        }
                        
                        // Debug: Log each row being processed
                        console.log(`[extractQuotationData] Row ${rowIndex}: ${JSON.stringify(rowData)}`);
                        
                        tableData.rawData.push(rowData);
                    });
                    
                    console.log(`[extractQuotationData] Total rawData rows: ${tableData.rawData.length}`);
                }
                
                data.allTables.push(tableData);
                data.rawTextContent += `TABLE (${tableData.name}):\n${JSON.stringify(tableData.rawData, null, 2)}\n`;
            }
        });
    }

    // Glocal Finance Check: Determine if the entire quotation has ANY financial data
    data.hasAnyFinance = data.allTables.some((t: any) => t.hasFinance);

    // Extract signature and footer
    if (quotation.footer) {
        const footerText = [quotation.footer.line1, quotation.footer.line2, quotation.footer.line3].filter(Boolean).join('\n');
        data.rawTextContent += `FOOTER TERMS:\n${footerText}\n`;
    }
    if (quotation.signature) {
        data.rawTextContent += `SIGNATURE: ${quotation.signature.name} (${quotation.signature.designation})\n`;
    }

    // Also handle legacy pages structure for backward compatibility (ONLY if no tables were found in contentBlocks)
    if ((!data.allTables || data.allTables.length === 0) && quotation.pages && Array.isArray(quotation.pages)) {
        quotation.pages.forEach((page: any, pageIndex: number) => {
            if (page.sections && Array.isArray(page.sections)) {
                page.sections.forEach((section: any) => {
                    // ... (existing section metadata logic)
                    if (section.type === 'table' && section.table) {
                        const tableHeaders = (section.table.columns || []).map((c: any) => c.name || c.id);
                        const tableData: any = {
                            blockIndex: 999 + pageIndex, // Higher index for legacy
                            name: section.table.name || section.heading || 'Table',
                            headers: tableHeaders,
                            rawData: [],
                            isTechnical: tableHeaders.some((h: string) => 
                                (h || '').toLowerCase().includes('compliance') || 
                                (h || '').toLowerCase().includes('parameter') || 
                                (h || '').toLowerCase().includes('requirement') || 
                                (h || '').toLowerCase().includes('offered') || 
                                (h || '').toLowerCase().includes('specification') || 
                                (h || '').toLowerCase().includes('technical')
                            ),
                            hasFinance: tableHeaders.some((h: string) => 
                                (h || '').toLowerCase().includes('rate') || 
                                (h || '').toLowerCase().includes('price') || 
                                (h || '').toLowerCase().includes('amount') || 
                                (h || '').toLowerCase().includes('cost') ||
                                (h || '').toLowerCase().includes('value') ||
                                (h || '').toLowerCase().includes('total')
                            )
                        };
                        
                        tableData.isBillable = !tableData.isTechnical || tableData.hasFinance;

                        // Convert table to readable format
                        if (section.table.rows && section.table.rows.length > 0) {
                            section.table.rows.forEach((row: any) => {
                                const rowData: any = {};
                                section.table.columns.forEach((col: any) => {
                                    if (row.cells && row.cells[col.id]) {
                                        rowData[col.name || col.id] = row.cells[col.id];
                                    }
                                });
                                tableData.rawData.push(rowData);
                            });
                        }

                        // Deduplicate: check if we already have this exact table from blocks
                        const isDuplicate = data.allTables.some((existing: any) => 
                            existing.name === tableData.name && 
                            existing.rawData.length === tableData.rawData.length
                        );

                        if (!isDuplicate) {
                            data.allTables.push(tableData);
                            data.rawTextContent += `LEGACY TABLE (${tableData.name}):\n${JSON.stringify(tableData.rawData, null, 2)}\n`;
                        }
                    }
                    data.allSections.push({ pageIndex, type: section.type, heading: section.heading });
                });
            }
        });
    }

    return data;
}

// Manual table extraction - DIRECTLY maps table data without AI (most reliable)
function manualTableExtraction(quotationData: any, invoiceNumber: string): any {
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

    // DIRECT TABLE EXTRACTION - Process each table with header-aware mapping
    if (quotationData.allTables && Array.isArray(quotationData.allTables)) {
        quotationData.allTables.forEach((table: any, tableIndex: number) => {
            const headers = (table.headers || []).map((h: string) => (h || '').toLowerCase().trim());
            
            // Identify column indices for description, quantity, and rate/price/amount
            let descIdx = -1, qtyIdx = -1, rateIdx = -1, amountIdx = -1, hsnIdx = -1, taxIdx = -1;
            
            // TECHNICAL TABLE DETECTION: Skip tables that look like Compliance, Specification, or Requirements
            const isTechnicalTable = headers.some((h: string) => 
                h.includes('compliance') || h.includes('parameter') || h.includes('requirement') || 
                h.includes('offered') || h.includes('specification') || h.includes('technical')
            );
            
            // If it's a technical table and has NO header for price/rate/amount, skip it for invoice items
            const hasFinancialHeader = headers.some((h: string) => 
                h.includes('rate') || h.includes('price') || h.includes('amount') || h.includes('cost') || h.includes('value')
            );

            if (isTechnicalTable && !hasFinancialHeader) {
                console.log(`[ManualExtraction] Skipping technical table: "${table.name || 'Table'}"`);
                return;
            }

            headers.forEach((h: string, idx: number) => {
                if (h.includes('desc') || h.includes('partic') || h.includes('item') || h.includes('product') || 
                    h.includes('service') || h.includes('name') || h.includes('detail') || h.includes('list') ||
                    h.includes('device') || h.includes('task') || h.includes('work')) {
                    if (descIdx === -1) descIdx = idx;
                }
                if (h.includes('qty') || h.includes('quant') || h.includes('nos') || h.includes('no.') || h.includes('unit') && !h.includes('price')) {
                    if (qtyIdx === -1) qtyIdx = idx;
                }
                if (h.includes('rate') || h.includes('price') || h.includes('unit price') || h.includes('unit cost')) {
                    if (rateIdx === -1) rateIdx = idx;
                }
                if (h.includes('amount') || h.includes('total') || h.includes('value')) {
                    if (amountIdx === -1) amountIdx = idx;
                }
                if (h.includes('hsn') || h.includes('sac')) {
                    if (hsnIdx === -1) hsnIdx = idx;
                }
                if (h.includes('gst') || h.includes('tax')) {
                    if (taxIdx === -1) taxIdx = idx;
                }
            });

            // Process each row from rawData
            if (table.rawData && Array.isArray(table.rawData)) {
                // Get the original headers as keys (they determine the row object keys)
                const headerKeys = table.headers || [];
                
                // ALSO keep the original rows array if available for fallback
                const originalRows = table.originalRows || [];
                
                table.rawData.forEach((row: any, rowIdx: number) => {
                    const rowKeys = Object.keys(row);
                    
                    let description = '';
                    let quantity = 1; // Default to 1 if not found
                    let rate = 0;
                    let hsnsac = '';
                    let taxRate = 18;
                    let quantityWasEmpty = false; // Track if quantity was actually found
                    
                    // FIX: Check if row has actual data - if not, try to get from original rows
                    const rowHasData = rowKeys.length > 0 && Object.values(row).some(v => v !== undefined && v !== null && String(v).trim() !== '');
                    
                    // FALLBACK: If row processing failed, try to rebuild from originalRows
                    let effectiveRow = row;
                    if (!rowHasData && originalRows[rowIdx]) {
                        console.log(`[ManualExtraction] Row ${rowIdx} appears empty, rebuilding from originalRows`);
                        const origRow = originalRows[rowIdx];
                        effectiveRow = {};
                        for (let ci = 0; ci < Math.max(headerKeys.length, origRow.length); ci++) {
                            const hkey = headerKeys[ci] || `Col-${ci + 1}`;
                            effectiveRow[hkey] = origRow[ci] !== undefined ? origRow[ci] : '';
                        }
                        console.log(`[ManualExtraction] Rebuilt row: ${JSON.stringify(effectiveRow)}`);
                    }
                    
                    // Debug: Log the row structure
                    console.log(`[ManualExtraction] Row ${rowIdx}: ${JSON.stringify(effectiveRow)}`);
                    console.log(`[ManualExtraction] Headers: ${JSON.stringify(headerKeys)}`);
                    console.log(`[ManualExtraction] Indices - descIdx:${descIdx}, qtyIdx:${qtyIdx}, rateIdx:${rateIdx}`);
                    console.log(`[ManualExtraction] Row has data: ${rowHasData}, rowKeys: ${rowKeys.length}`);

                    // STEP 1: Extract description - use header key directly
                    if (descIdx !== -1 && headerKeys[descIdx]) {
                        const headerKey = headerKeys[descIdx];
                        const val = effectiveRow[headerKey];
                        if (val !== undefined && val !== null) {
                            description = String(val).trim();
                        }
                    }
                    // If descIdx is -1, try first column
                    if (!description && headerKeys[0] && effectiveRow[headerKeys[0]]) {
                        const firstVal = String(effectiveRow[headerKeys[0]]).trim();
                        // Check if first column is NOT a number (likely description)
                        if (firstVal && isNaN(parseFloat(firstVal.replace(/[,₹$]/g, '')))) {
                            description = firstVal;
                        }
                    }

                    // STEP 2: Extract quantity - use header key directly
                    if (qtyIdx !== -1 && headerKeys[qtyIdx]) {
                        const headerKey = headerKeys[qtyIdx];
                        const qtyVal = effectiveRow[headerKey];
                        console.log(`[ManualExtraction] Quantity value at "${headerKey}": "${qtyVal}"`);
                        
                        if (qtyVal !== null && qtyVal !== undefined && String(qtyVal).trim() !== '') {
                            const qtyStr = String(qtyVal).replace(/[^0-9.]/g, '');
                            if (qtyStr) {
                                const parsedQty = parseFloat(qtyStr);
                                if (!isNaN(parsedQty) && parsedQty > 0) {
                                    quantity = parsedQty;
                                } else {
                                    quantityWasEmpty = true;
                                }
                            } else {
                                quantityWasEmpty = true;
                            }
                        } else {
                            quantityWasEmpty = true;
                        }
                    }

                    // STEP 3: Extract rate/price - use header key directly
                    if (rateIdx !== -1 && headerKeys[rateIdx]) {
                        const headerKey = headerKeys[rateIdx];
                        const rateVal = effectiveRow[headerKey];
                        console.log(`[ManualExtraction] Rate value at "${headerKey}": "${rateVal}"`);
                        
                        if (rateVal !== null && rateVal !== undefined && String(rateVal).trim() !== '') {
                            const rateStr = String(rateVal).replace(/[^0-9.]/g, '');
                            if (rateStr) {
                                rate = parseFloat(rateStr) || 0;
                            }
                        }
                    }
                    
                    // If rate still 0, try amount column using header key
                    if (rate === 0 && amountIdx !== -1 && headerKeys[amountIdx]) {
                        const headerKey = headerKeys[amountIdx];
                        const amtVal = effectiveRow[headerKey];
                        if (amtVal !== null && amtVal !== undefined && String(amtVal).trim() !== '') {
                            const amtStr = String(amtVal).replace(/[^0-9.]/g, '');
                            if (amtStr) {
                                const amount = parseFloat(amtStr) || 0;
                                rate = quantity > 0 ? amount / quantity : amount;
                            }
                        }
                    }
                    
                    // STEP 4: HSN/SAC and Tax Rate using header keys
                    if (hsnIdx !== -1 && headerKeys[hsnIdx] && effectiveRow[headerKeys[hsnIdx]]) {
                        hsnsac = String(effectiveRow[headerKeys[hsnIdx]]).trim();
                    }
                    if (taxIdx !== -1 && headerKeys[taxIdx] && effectiveRow[headerKeys[taxIdx]]) {
                        const taxStr = String(effectiveRow[headerKeys[taxIdx]]).replace(/[^0-9.]/g, '');
                        if (taxStr) taxRate = parseFloat(taxStr) || 18;
                    }

                    // STEP 5: Second pass - scan by key pattern if we don't have values
                    const effectiveRowKeys = Object.keys(effectiveRow);
                    effectiveRowKeys.forEach((key) => {
                        const k = key.toLowerCase();
                        const val = effectiveRow[key];
                        
                        if (!description && (k.includes('desc') || k.includes('item') || k.includes('partic') || 
                            k.includes('product') || k.includes('service') || k.includes('name') || k.includes('detail') ||
                            k.includes('device') || k.includes('task') || k.includes('list'))) {
                            description = String(val).trim();
                        }
                        if (quantity === 1 && !quantityWasEmpty && (k.includes('qty') || k.includes('quant') || k.includes('nos'))) {
                            const q = parseFloat(String(val).replace(/[^0-9.]/g, ''));
                            if (!isNaN(q) && q > 0) quantity = q;
                        }
                        if (rate === 0 && (k.includes('rate') || k.includes('price') || k.includes('unit'))) {
                            // DIRECT KEY MATCH - This is critical for "Price" column
                            if (val !== null && val !== undefined && String(val).trim() !== '') {
                                const r = parseFloat(String(val).replace(/[^0-9.]/g, ''));
                                console.log(`[ManualExtraction] Key "${key}" matched price pattern, value: "${val}", parsed: ${r}`);
                                if (!isNaN(r) && r > 0) rate = r;
                            }
                        }
                        if (rate === 0 && (k.includes('amount') || k.includes('total') || k.includes('value'))) {
                            if (val !== null && val !== undefined && String(val).trim() !== '') {
                                const a = parseFloat(String(val).replace(/[^0-9.]/g, ''));
                                if (!isNaN(a) && a > 0) rate = quantity > 0 ? a / quantity : a;
                            }
                        }
                    });

                    // STEP 6: SMART FALLBACK - Find price from numeric columns when header detection fails
                    // ONLY if the table was detected to have financial data
                    if (rate === 0 && (table.hasFinance || hasFinancialHeader)) {
                        // Collect ALL numeric values from the row with their column positions
                        const numericValuesWithPos: { value: number; pos: number }[] = [];
                        const rowValuesArr = Object.values(effectiveRow);
                        rowValuesArr.forEach((val: any, idx: number) => {
                            if (val !== null && val !== undefined && String(val).trim() !== '') {
                                // 1. Remove text in parentheses (often technical specs like "(900A DC)")
                                let text = String(val).replace(/\([^)]*\)/g, '');
                                
                                // 2. Strip technical units fused with numbers (like 900A, 460VDC, 2.5sqmm)
                                // We strip the WHOLE thing if it matches a tech unit pattern
                                text = text.replace(/\b\d+(\.\d+)?\s*(v|a|ma|kv|hz|sqmm|hp|kw|rpm|ip|ph|vdc|vac|v dc|v ac)\b/gi, '');
                                
                                const numStr = text.replace(/[^0-9.]/g, '');
                                if (numStr) {
                                    const num = parseFloat(numStr);
                                    if (!isNaN(num) && num > 0) {
                                        numericValuesWithPos.push({ value: num, pos: idx });
                                    }
                                }
                            }
                        });
                        
                        // STRATEGY: The LAST numeric column is usually Price/Amount
                        // ONLY PROCEED IF TABLE HAS FINANCE
                        if (!table.hasFinance && !hasFinancialHeader) {
                            rate = 0;
                            console.log(`[ManualExtraction] FORCING rate 0 because table has no finance documentation.`);
                        } else if (numericValuesWithPos.length > 0) {
                            if (quantityWasEmpty) {
                                // Quantity was empty, so the LAST numeric value is the price
                                rate = numericValuesWithPos[numericValuesWithPos.length - 1].value;
                                console.log(`[ManualExtraction] Using last numeric as price (qty was empty): ${rate}`);
                            } else if (numericValuesWithPos.length === 1) {
                                // Only one numeric value - it could be either qty or price
                                // CRITICAL: If only one number exists and it MATCHES quantity, it is NOT the price
                                if (numericValuesWithPos[0].value === quantity) {
                                    rate = 0;
                                    console.log(`[ManualExtraction] Rejected single number ${numericValuesWithPos[0].value} as rate because it matches quantity.`);
                                } else {
                                    rate = numericValuesWithPos[0].value;
                                }
                            } else if (numericValuesWithPos.length >= 2) {
                                // Multiple numeric values - find one that's NOT the quantity
                                // Usually: first numeric = qty, last numeric = price
                                for (let i = numericValuesWithPos.length - 1; i >= 0; i--) {
                                    if (numericValuesWithPos[i].value !== quantity) {
                                        rate = numericValuesWithPos[i].value;
                                        break;
                                    }
                                }
                                // If all are same as quantity, use 0 for safety in a non-finance table
                                if (rate === 0 || rate === quantity) {
                                    rate = 0;
                                }
                            }
                        }
                    }

                    // STEP 7: If STILL no description, find any text value
                    if (!description) {
                        const rowValuesArr = Object.values(effectiveRow);
                        for (const val of rowValuesArr) {
                            const strVal = String(val).trim();
                            // Accept string if it's not purely numeric and has some substance
                            if (strVal && strVal.length > 0) {
                                const numericPart = strVal.replace(/[^0-9.]/g, '');
                                const isNotJustNumber = numericPart !== strVal || isNaN(parseFloat(numericPart));
                                if (isNotJustNumber && strVal.length > 0) {
                                    description = strVal;
                                    break;
                                }
                            }
                        }
                    }

                    // STEP 8.5: LAST RESORT FALLBACK - Direct access to originalRows if rate still 0
                    // This specifically fixes the "last row not getting values" bug
                    if (rate === 0 && originalRows[rowIdx] && rateIdx !== -1) {
                        const directValue = originalRows[rowIdx][rateIdx];
                        console.log(`[ManualExtraction] Last resort: Direct originalRows[${rowIdx}][${rateIdx}] = "${directValue}"`);
                        if (directValue !== undefined && directValue !== null && String(directValue).trim() !== '') {
                            const directRate = parseFloat(String(directValue).replace(/[^0-9.]/g, ''));
                            if (!isNaN(directRate) && directRate > 0) {
                                rate = directRate;
                                console.log(`[ManualExtraction] Last resort succeeded! Rate = ${rate}`);
                            }
                        }
                    }
                    
                    // Also try amount column as last resort if rate still 0
                    if (rate === 0 && originalRows[rowIdx] && amountIdx !== -1) {
                        const directValue = originalRows[rowIdx][amountIdx];
                        console.log(`[ManualExtraction] Last resort amount: Direct originalRows[${rowIdx}][${amountIdx}] = "${directValue}"`);
                        if (directValue !== undefined && directValue !== null && String(directValue).trim() !== '') {
                            const directAmount = parseFloat(String(directValue).replace(/[^0-9.]/g, ''));
                            if (!isNaN(directAmount) && directAmount > 0) {
                                rate = quantity > 0 ? directAmount / quantity : directAmount;
                                console.log(`[ManualExtraction] Last resort amount succeeded! Rate = ${rate}`);
                            }
                        }
                    }

                    // STEP 8: Fallback description for items with valid rate
                    if (!description && rate > 0) {
                        description = table.name || `Item ${rowIdx + 1}`;
                    }

                    // STEP 9: Add item if we have either description or a valid rate
                    // Including items like "extra" with empty qty but valid price
                    if (description || rate > 0) {
                        const taxableValue = quantity * rate;
                        const cgst = (taxableValue * (taxRate / 2)) / 100;
                        const sgst = (taxableValue * (taxRate / 2)) / 100;

                        result.items.push({
                            id: `${tableIndex + 1}-${rowIdx + 1}`,
                            description: description || `Item ${rowIdx + 1}`,
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
    }

    // If still no items, try to create a single item from subject/title
    if (result.items.length === 0 && (quotationData.subject || quotationData.title)) {
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

// Smart AI transformation - uses Gemini 2.5 Flash with ultra-precise prompting
async function smartAITransformation(quotationData: any, invoiceNumber: string): Promise<any> {
    if (!genAI) {
        return manualTableExtraction(quotationData, invoiceNumber);
    }

    try {
        const modelName = await getWorkingModel();
        if (!modelName) {
            return manualTableExtraction(quotationData, invoiceNumber);
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Build an explicit ROW-BY-ROW mapping of all table data for the prompt
        let explicitTableRows = '';
        if (quotationData.allTables && quotationData.allTables.length > 0) {
            quotationData.allTables.forEach((table: any, tIdx: number) => {
                explicitTableRows += `\n--- TABLE ${tIdx + 1}: "${table.name || 'Items'}" ---\n`;
                explicitTableRows += `Headers: ${JSON.stringify(table.headers || [])}\n`;
                if (table.rawData && table.rawData.length > 0) {
                    table.rawData.forEach((row: any, rIdx: number) => {
                        explicitTableRows += `Row ${rIdx + 1}: ${JSON.stringify(row)}\n`;
                    });
                }
            });
        }

        const prompt = `You are a PRECISION DATA EXTRACTOR. Your ONLY task is to accurately extract invoice line items from a quotation.

=== ABSOLUTE RULES (FOLLOW EXACTLY) ===
1. DISTINGUISH BILLABLE VS TECHNICAL: 
   - IGNORE tables for "Technical Compliance", "Parameter", "Requirement", "Offered", or "Specifications".
   - ONLY extract line items from tables that represent Products, Services, or Labour.
   - If a table row says "Complied", "OK", "Suitable", or lists technical settings (460V, 900A, 2.5sqmm, 50Hz, 3Ph, IS 8623), it is NOT a billable item.
2. DEDUPLICATION (STRICT):
   - You MUST NOT return the same line item multiple times.
   - If a table row is split across multiple cells, MERGE them into ONE single item.
   - If the same item appears in one table and is then technical-detailed in another, ONLY extract the billable version.
3. PRICE AND QUANTITY VALIDITY (STRICT):
   - ONLY extract numbers as prices if they are in a column CLEARLY marked "Rate", "Price", "Amount", or "Cost".
   - NEVER extract prices from "Remarks", "Description", "Specifications", "Parameter", "SI No", or "Qty" columns.
   - Do NOT treat technical standards, voltages, dates, or ampere ratings (e.g., IS 8623, IEC 60947, 460, 220, 900) as prices.
   - **CRITICAL**: If a row has Quantity 3 and Price is missing, do NOT set rate to 3.00. Set rate=0.
   - **CRITICAL**: Copy quantities EXACTLY. If a row says 10, use 10. Do not use the SI No or other adjacent numbers.
   - If a table has no financial headers, set rate=0 for ALL its items.
4. EXTRACT EVERY BILLABLE ROW: For each row in the billable tables below, create ONE item. Do NOT skip rows from billable tables.
5. PRESERVE NUMBERS EXACTLY: Copy quantity and rate/price numbers EXACTLY as they appear.
6. IF NO PRICES FOUND: Return all items with rate: 0. NEVER create fake prices from quantities, dates, or specs.

=== SOURCE TABLE DATA ===
${explicitTableRows}

=== QUOTATION METADATA ===
Company: ${JSON.stringify(quotationData.companyDetails || {})}
Client: ${JSON.stringify(quotationData.clientDetails || {})}
Subject: ${quotationData.subject || ''}

=== YOUR OUTPUT FORMAT (JSON ONLY) ===
{
    "companyDetails": {
        "name": "exact company name",
        "address": "full address",
        "city": "", "state": "", "pincode": "",
        "email": "email", "phone": "phone",
        "gstin": "gstin if found", "stateCode": ""
    },
    "clientDetails": {
        "name": "client name",
        "address": "address",
        "city": "", "state": "", "pincode": "",
        "email": "", "phone": "", "gstin": "", "paymentMode": ""
    },
    "items": [
        {
            "id": "1",
            "description": "EXACT description from table",
            "quantity": EXACT_NUMBER_OR_1_IF_EMPTY,
            "rate": PRICE_ONLY_IF_CLEARLY_A_PRICE_OR_0,
            "hsnsac": "",
            "taxRate": 18,
            "discount": 0
        }
    ],
    "terms": {
        "notes": "",
        "termsConditions": "",
        "authorizedSignatory": ""
    },
    "orderDetails": {
        "referenceNo": "${quotationData.refNo || ''}",
        "placeOfSupply": ""
    },
    "bankDetails": {},
    "financials": { "shippingCharges": 0, "otherCharges": 0 },
    "invoiceDate": "${today}",
    "dueDate": ""
}

=== VERIFICATION CHECKLIST (CRITICAL) ===
Before responding, verify:
☐ I skipped all Technical Compliance/Specification tables.
☐ I did NOT turn standard numbers like "IS 8623" or "IEC 60947" into prices.
☐ If a billable row has no price, I used rate: 0.
☐ Number of items in my response = Number of billable rows found.
☐ Each rate is a real number from the source (NOT hallucinated).

Return ONLY the JSON object, nothing else.`;

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.1 // Very low temperature for precision
            }
        });

        const result = await model.generateContent(prompt);
        const text = extractText(result);

        try {
            const parsed = JSON.parse(text);

            // POST-PROCESSING: Validate and fix items using source data
            if (parsed.items && Array.isArray(parsed.items)) {
                parsed.items = parsed.items.map((item: any, index: number) => {
                    let qty = parseFloat(item.quantity || item.qty) || 1;
                    let rate = parseFloat(item.rate || item.price || item.unitPrice || item.amount || item.unit_price) || 0;
                    const discount = item.discount !== undefined ? parseFloat(item.discount) : 0;
                    
                    // RECOVERY AND VALIDATION: If AI returned 0 rate, try to find it. 
                    // ALSO: If AI returned a rate, validate it against technical constraints.
                    if (quotationData.allTables && quotationData.allTables.length > 0) {
                        let tableRowIndex = 0;
                        for (const table of quotationData.allTables) {
                            const isStrictlyTechnical = !table.hasFinance || (table.isTechnical && !table.hasFinance);
                            
                            if (table.rawData && index < tableRowIndex + table.rawData.length) {
                                // VALIDATION: If the table is strictly technical, rate MUST be 0
                                if (isStrictlyTechnical && rate > 0) {
                                    console.log(`[Validation] Clearing hallucinated rate ${rate} from technical table Row ${index + 1}`);
                                    rate = 0;
                                }

                                // RATE = QTY GUARD: If rate matches qty and we are unsure, it's likely a hallucination
                                if (rate > 0 && rate === qty && isStrictlyTechnical) {
                                    console.log(`[Validation] Clearing Rate ${rate} because it matches Qty ${qty} in technical context.`);
                                    rate = 0;
                                }

                                // RECOVERY: Only if rate is still 0 AND the table HAS finance
                                if (rate === 0 && table.hasFinance) {
                                    const localIdx = index - tableRowIndex;
                                    const rawRow = table.rawData[localIdx];
                                    if (rawRow) {
                                        const numericValues: { val: number; pos: number }[] = [];
                                        Object.values(rawRow).forEach((val, idx) => {
                                            if (val !== null && val !== undefined && String(val).trim() !== '') {
                                                let text = String(val).replace(/\([^)]*\)/g, '');
                                                text = text.replace(/\b\d+(\.\d+)?\s*(v|a|ma|kv|hz|sqmm|hp|kw|rpm|ip|ph|vdc|vac|v dc|v ac)\b/gi, '');
                                                const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                                                if (!isNaN(num) && num > 0) {
                                                    numericValues.push({ val: num, pos: idx });
                                                }
                                            }
                                        });
                                        
                                        if (numericValues.length > 0) {
                                            if (numericValues.length === 1) {
                                                rate = numericValues[0].val !== qty ? numericValues[0].val : 0;
                                            } else {
                                                for (let i = numericValues.length - 1; i >= 0; i--) {
                                                    if (numericValues[i].val !== qty) {
                                                        rate = numericValues[i].val;
                                                        break;
                                                    }
                                                }
                                                if (rate === qty) rate = 0;
                                            }
                                        }
                                    }
                                }
                                break;
                            }
                            tableRowIndex += (table.rawData?.length || 0);
                        }
                    }

                    // Tax calculation
                    let taxRate = parseFloat(item.taxRate) || 18;
                    const subtotal = qty * rate;
                    const discountAmount = (subtotal * discount) / 100;
                    const taxableValue = subtotal - discountAmount;
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

            // Verify item count matches source billable rows - if not, supplement with manual extraction
            const sourceBillableRowCount = quotationData.allTables?.reduce((sum: number, t: any) => {
                if (t.isBillable) return sum + (t.rawData?.length || 0);
                return sum;
            }, 0) || 0;

            if (parsed.items.length < sourceBillableRowCount) {
                console.log(`AI returned ${parsed.items.length} items but source has ${sourceBillableRowCount} billable rows. Supplementing.`);
                const manualResult = manualTableExtraction(quotationData, invoiceNumber);
                
                // Merge with normalization to prevent duplicates
                const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                const aiNormalized = parsed.items.map((i: any) => normalize(i.description));

                manualResult.items.forEach((manualItem: any) => {
                    const manualNorm = normalize(manualItem.description);
                    if (!manualNorm) return;

                    let found = aiNormalized.some((aiNorm: string) => aiNorm.includes(manualNorm) || manualNorm.includes(aiNorm));
                    
                    if (!found && (manualItem.rate > 0 || manualItem.description)) {
                        parsed.items.push(manualItem);
                    }
                });
            }

            // Ensure basic fields
            if (!parsed.invoiceDate) parsed.invoiceDate = today;
            if (!parsed.clientDetails?.name && quotationData.clientDetails?.name) {
                parsed.clientDetails = { ...parsed.clientDetails, name: quotationData.clientDetails.name };
            }

            return parsed;
        } catch (parseError) {
            console.error('JSON parse error in AI transformation:', parseError, 'Raw text:', text.slice(0, 500));
            // Try to extract JSON from markdown code blocks
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch (_) {}
            }
        }
    } catch (error) {
        console.error('AI transformation failed:', error);
    }

    // Fallback to manual extraction (most reliable)
    return manualTableExtraction(quotationData, invoiceNumber);
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

                    if (k.includes('desc') || k.includes('item') || k.includes('partic') || k.includes('product') || k.includes('list') || k.includes('name') || k.includes('service') || k.includes('task') || k.includes('device')) {
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
                    } else if (!description && isNaN(parseFloat(String(v)))) {
                        // Aggressive fallback: if we don't have a description yet and this value isn't a number, 
                        // it's likely the item name/description (e.g. from a column like "Details" or "S.No" if text)
                        description = String(v);
                    }
                });

                // Final description fallback: if still empty but we have a rate, use the table name/block info
                if (!description && rate > 0) {
                    description = table.name || `Item from ${table.blockIndex || 'Table'}`;
                }

                // Secondary discovery: if rate is still 0, look for ANY numeric value in the row that isn't the quantity
                if (rate === 0) {
                    Object.keys(rowData).forEach(key => {
                        const v = rowData[key];
                        const valStr = String(v).replace(/[^\d.]/g, '');
                        if (valStr && !isNaN(parseFloat(valStr))) {
                            const num = parseFloat(valStr);
                            // If it's not the quantity and it's a significant number, assume it's the rate
                            if (num > 0 && num !== quantity) {
                                rate = num;
                            } else if (num > 0 && rate === 0) {
                                // Last resort: even if it matches quantity, if rate is still 0, take it
                                rate = num;
                            }
                        }
                    });
                }

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

        const { quotationId, invoiceNumber, useAI = true, extractionMode = 'auto' } = body;
        // extractionMode options: 'auto' (default, uses AI with fallback), 'manual' (direct table mapping), 'ai' (force AI only)

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

        // Transform using the selected extraction mode
        let transformedData;
        let extractionMethodUsed = 'manual';
        
        if (extractionMode === 'manual') {
            // Direct table mapping - most reliable for exact values
            transformedData = manualTableExtraction(quotationData, invoiceNumber);
            extractionMethodUsed = 'manual';
        } else if (extractionMode === 'ai' || (useAI && API_KEY)) {
            // AI-based extraction with automatic fallback
            transformedData = await smartAITransformation(quotationData, invoiceNumber);
            extractionMethodUsed = 'ai';
        } else {
            // Fallback to enhanced basic transformation
            transformedData = enhancedBasicTransformation(quotationData, invoiceNumber);
            extractionMethodUsed = 'basic';
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
            usedAI: extractionMethodUsed === 'ai',
            extractionMethod: extractionMethodUsed, // 'manual', 'ai', or 'basic'
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
