import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();

    console.log('Generating quotation with answers:', answers);

    // Import the Gemini utility (same as other API routes)
    const geminiModule = await import('../../../utils/gemini.js');
    const gemini = geminiModule.default || geminiModule;

    const prompt = `You are a professional quotation generator. User has provided details for a techno-commercial quotation.
    
    User's Data (Answers):
    ${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n')}
    
    OBJECTIVE:
    Generate a highly detailed, professional techno-commercial quotation in JSON format that matches the structure of a real industrial quotation.
    The output must strictly follow the structure below, using TABLES for technical compliance and BOQ data.
    
    REQUIRED JSON STRUCTURE:
    {
      "companyName": "extracted from answers.company_name",
      "companyGstin": "extracted or generated GSTIN",
      "companyContact": "extracted from answers.company_contact",
      "quotationTitle": "TECHNO-COMMERCIAL QUOTATION",
      "refNo": "QT/${new Date().getFullYear()}/AUTO/${Math.floor(Math.random() * 1000)}",
      "date": "${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}",
      "clientName": "extracted from answers.client_name",
      "clientContact": "extracted from answers.client_contact",
      "clientAddress": "extracted from answers.client_address",
      "subject": "extracted from answers.project_subject",
      "introduction": "We thank you for the opportunity to submit our techno-commercial quotation for the mentioned project. We confirm full compliance to technical requirements, scope & standards mentioned in the specifications.",
      "scopeOfWork": "extracted and formatted from answers.scope_of_work",
      "pages": [
        {
          "id": "page-1",
          "sections": [
            {
              "id": "sec-header",
              "type": "heading",
              "heading": "${answers.company_name || 'COMPANY NAME'}"
            },
            {
              "id": "sec-ref-info",
              "type": "text",
              "heading": "Reference Information",
              "content": "Ref No.: QT/${new Date().getFullYear()}/AUTO/${Math.floor(Math.random() * 1000)} | Date: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}"
            },
            {
              "id": "sec-client",
              "type": "text",
              "heading": "To",
              "content": "M/s ${answers.client_name || '[Client Name]'}\\n${answers.client_contact || '[Contact Person]'}\\n${answers.client_address || '[Client Address]'}"
            },
            {
              "id": "sec-subject",
              "type": "text",
              "heading": "Sub",
              "content": "${answers.project_subject || '[Project Subject]'}"
            },
            {
              "id": "sec-intro",
              "type": "text",
              "heading": "Introduction",
              "content": "Dear Sir, We thank you for the opportunity to submit our techno-commercial quotation for the mentioned project. We confirm full compliance to technical requirements, scope & standards mentioned in the specifications."
            },
            {
              "id": "sec-scope",
              "type": "text",
              "heading": "Scope of Supply",
              "content": "Supply, engineering, wiring, testing, documentation & FAT of:"
            },
            {
              "id": "sec-scope-table",
              "type": "table",
              "heading": "Scope Details",
              "table": {
                "id": "table-scope",
                "name": "Scope of Work",
                "columns": [
                  {"id": "col-item", "name": "Item/Service"},
                  {"id": "col-qty", "name": "Qty"},
                  {"id": "col-remarks", "name": "Remarks/Specifications"}
                ],
                "rows": [
                  // Generate rows from answers.scope_of_work and answers.items_boq
                  {"id": "row-scope-1", "cells": {"col-item": "Main Equipment", "col-qty": "1 Set", "col-remarks": "As per specifications"}}
                ]
              }
            },
            {
              "id": "sec-tech-compliance",
              "type": "table",
              "heading": "Technical Compliance",
              "table": {
                "id": "table-tech",
                "name": "Technical Compliance Matrix",
                "columns": [
                  {"id": "col-param", "name": "Parameter"},
                  {"id": "col-req", "name": "Requirement"},
                  {"id": "col-offered", "name": "Offered"}
                ],
                "rows": [
                  // Generate rows from answers.technical_specs
                  {"id": "row-tech-1", "cells": {"col-param": "System Voltage", "col-req": "415V AC", "col-offered": "Complied"}},
                  {"id": "row-tech-2", "cells": {"col-param": "Control Voltage", "col-req": "24V DC", "col-offered": "Complied"}},
                  {"id": "row-tech-3", "cells": {"col-param": "Standards", "col-req": "IS/IEC", "col-offered": "Complied"}}
                ]
              }
            },
            {
              "id": "sec-boq",
              "type": "table",
              "heading": "Bill of Quantities",
              "table": {
                "id": "table-boq",
                "name": "Bill of Quantities Summary",
                "columns": [
                  {"id": "col-sno", "name": "S.No"},
                  {"id": "col-desc", "name": "Description"},
                  {"id": "col-qty", "name": "Qty"},
                  {"id": "col-unit", "name": "Unit"}
                ],
                "rows": [
                  // Generate rows from answers.items_boq with proper formatting
                  {"id": "row-boq-1", "cells": {"col-sno": "1", "col-desc": "Control Panel", "col-qty": "2", "col-unit": "Nos"}}
                ]
              }
            },
            {
              "id": "sec-terms",
              "type": "list",
              "heading": "Terms & Conditions",
              "items": [
                // Generate list from answers.terms_conditions
                "Payment Terms: 50% advance, 50% on delivery",
                "Delivery: 4-6 weeks from order confirmation",
                "Warranty: 12 months from date of commissioning",
                "Validity: 30 days from quotation date"
              ]
            }
          ]
        }
      ]
    }
    
    IMPORTANT RULES:
    1. EXTRACT DATA: Intelligently extract and map user answers to the relevant sections.
    2. PROFESSIONAL FORMAT: Generate a real industrial quotation format with proper sections
    3. TECHNICAL COMPLIANCE: Must be a TABLE with Parameter, Requirement, Offered columns
    4. BOQ: Must be a TABLE with S.No, Description, Qty, Unit columns
    5. SCOPE: Must be a TABLE with Item/Service, Qty, Remarks columns
    6. TERMS: Must be a LIST (array of strings) for terms and conditions
    7. USE REAL DATA: Extract actual data from answers, don't use placeholders
    8. JSON ONLY: Return strictly valid JSON code. No markdown formatting.
    
    Generate the JSON now:`;

    console.log('Sending prompt to Gemini AI...');

    // Generate AI response using the same utility as other routes
    const aiResponse = await gemini.generateAIResponse(prompt);

    // Check if AI response is valid
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('AI Response is null or invalid:', aiResponse);
      throw new Error('AI failed to generate a response. Please try again.');
    }

    console.log('AI Response received:', aiResponse.substring(0, 200));

    // Parse the JSON response
    try {
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const quotation = JSON.parse(jsonStr);

      console.log('Successfully parsed quotation');

      return NextResponse.json({ success: true, quotation });
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw AI Response:', aiResponse);

      // Fallback: create a basic quotation structure
      const fallbackQuotation = {
        companyName: answers.company_name || 'Your Company',
        companyAddress1: answers.company_details?.split('\n')[0] || '',
        companyAddress2: answers.company_details?.split('\n')[1] || '',
        companyPhone: answers.company_details?.match(/\+?\d[\d\s-]+/)?.[0] || '',
        pages: [
          {
            id: 'page-1',
            sections: [
              {
                id: 'section-1',
                type: 'heading',
                heading: 'Reference Information'
              },
              {
                id: 'section-2',
                type: 'text',
                heading: 'Ref No',
                content: `QT/${new Date().getFullYear()}/AUTO/${Math.floor(Math.random() * 1000)}`
              },
              {
                id: 'section-3',
                type: 'text',
                heading: 'Date',
                content: new Date().toLocaleDateString()
              },
              {
                id: 'section-4',
                type: 'heading',
                heading: 'Customer Details'
              },
              {
                id: 'section-5',
                type: 'text',
                heading: 'Customer Name',
                content: answers.client_name || 'Client Name'
              },
              {
                id: 'section-6',
                type: 'text',
                heading: 'Address',
                content: answers.client_details || ''
              },
              {
                id: 'section-7',
                type: 'heading',
                heading: 'Project Details'
              },
              {
                id: 'section-8',
                type: 'text',
                heading: 'Project Type',
                content: answers.project_type || ''
              },
              {
                id: 'section-9',
                type: 'heading',
                heading: 'Scope of Work'
              },
              {
                id: 'section-10',
                type: 'text',
                heading: 'Project Scope',
                content: answers.project_scope || ''
              },
              {
                id: 'section-11',
                type: 'heading',
                heading: 'Technical Specifications'
              },
              {
                id: 'section-12',
                type: 'text',
                heading: 'Technical Requirements',
                content: answers.technical_specs || ''
              },
              {
                id: 'section-13',
                type: 'heading',
                heading: 'Items & Services'
              },
              {
                id: 'section-14',
                type: 'text',
                heading: 'Included Items',
                content: answers.items_services || ''
              },
              {
                id: 'section-15',
                type: 'heading',
                heading: 'Terms & Conditions'
              },
              {
                id: 'section-16',
                type: 'text',
                heading: 'General Terms',
                content: answers.terms_conditions || ''
              }
            ]
          }
        ]
      };

      return NextResponse.json({ success: true, quotation: fallbackQuotation });
    }
  } catch (error: any) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quotation', details: error.message },
      { status: 500 }
    );
  }
}
