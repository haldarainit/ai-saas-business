import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();

    console.log('Generating quotation with answers:', answers);

    // Import the Gemini utility (same as other API routes)
    const geminiModule = await import('../../../utils/gemini');
    const gemini = geminiModule.default || geminiModule;

    const prompt = `You are a professional quotation generator. Based on the following information provided by the user, generate a detailed techno-commercial quotation in JSON format.

User's Answers:
${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n')}

Generate a quotation with the following structure:
{
  "companyName": "extracted from answers",
  "companyAddress1": "first line of address from company_address",
  "companyAddress2": "second line of address from company_address",
  "companyPhone": "phone number extracted from company_contact",
  "pages": [
    {
      "id": "page-1",
      "sections": [
        {
          "id": "section-1",
          "type": "heading",
          "heading": "Reference Information"
        },
        {
          "id": "section-2",
          "type": "text",
          "heading": "Ref No",
          "content": "Generate a reference number like QT/2025/PROJECT/001"
        },
        {
          "id": "section-3",
          "type": "text",
          "heading": "Date",
          "content": "${new Date().toLocaleDateString()}"
        },
        {
          "id": "section-4",
          "type": "heading",
          "heading": "Customer Details"
        },
        {
          "id": "section-5",
          "type": "text",
          "heading": "Customer Name",
          "content": "extracted from client_name answer"
        },
        {
          "id": "section-6",
          "type": "text",
          "heading": "Address",
          "content": "client address from client_address answer"
        },
        {
          "id": "section-7",
          "type": "heading",
          "heading": "Project Details"
        },
        {
          "id": "section-8",
          "type": "text",
          "heading": "Project Description",
          "content": "from project_description answer (use project_subject as title if helpful)"
        },
        {
          "id": "section-9",
          "type": "heading",
          "heading": "Scope of Work"
        },
        {
          "id": "section-10",
          "type": "list",
          "heading": "Project Scope",
          "items": ["extract key points from scope_of_work answer as array items"]
        },
        {
          "id": "section-11",
          "type": "heading",
          "heading": "Technical Specifications"
        },
        {
          "id": "section-12",
          "type": "table",
          "heading": "Technical Compliance",
          "table": {
            "id": "table-1",
            "name": "Technical Specifications",
            "columns": [
              {"id": "col-1", "name": "Parameter"},
              {"id": "col-2", "name": "Specification"},
              {"id": "col-3", "name": "Compliance"}
            ],
            "rows": [
              {"id": "row-1", "cells": {"col-1": "extract from technical_specs", "col-2": "value", "col-3": "Yes/No"}}
            ]
          }
        },
        {
          "id": "section-13",
          "type": "heading",
          "heading": "Bill of Quantity"
        },
        {
          "id": "section-14",
          "type": "table",
          "heading": "Items & Services",
          "table": {
            "id": "table-2",
            "name": "Bill of Quantity",
            "columns": [
              {"id": "col-1", "name": "S.No"},
              {"id": "col-2", "name": "Description"},
              {"id": "col-3", "name": "Quantity"}
            ],
            "rows": [
              {"id": "row-1", "cells": {"col-1": "1", "col-2": "extract from items_boq", "col-3": "TBD"}}
            ]
          }
        },
        {
          "id": "section-15",
          "type": "heading",
          "heading": "Terms & Conditions"
        },
        {
          "id": "section-16",
          "type": "list",
          "heading": "General Terms",
          "items": ["extract from terms_conditions answer as array items"]
        }
      ]
    }
  ]
}

Important:
1. Extract company name from company_name, address from company_address, and phone/email from company_contact
2. Extract client name, contact, and address from client_name, client_contact, client_address
3. Generate a professional reference number (e.g., "QT/2025/PROJECT/001")
4. Break down the scope_of_work into bullet points for the list
5. Create table rows from technical_specs and items_boq
6. Break down terms_conditions into bullet points
7. Make sure all IDs are unique
8. Return ONLY valid JSON, no markdown formatting or explanations

Generate the quotation now:`;

    console.log('Sending prompt to Gemini AI...');

    // Generate AI response using the same utility as other routes
    const aiResponse = await gemini.generateAIResponse(prompt);

    if (!aiResponse || typeof aiResponse !== 'string') {
      console.warn('AI Response is null or invalid — using fallback');
    }

    // Try to parse AI JSON response
    if (aiResponse && typeof aiResponse === 'string') {
      console.log('AI Response received:', aiResponse.substring(0, 200));
      try {
        let jsonStr = aiResponse.trim();
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const quotation = JSON.parse(jsonStr);
        console.log('Successfully parsed quotation');
        return NextResponse.json({ success: true, quotation });
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw AI Response:', aiResponse.substring(0, 500));
        // Fall through to build smart fallback below
      }
    }

    // Smart fallback — build structured quotation from the user's answers directly
    const termsRaw: string = answers.terms_conditions || '';
    const termsItems: string[] = termsRaw
      ? termsRaw.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean)
      : [
          'Payment: 50% advance, 50% on delivery',
          'Delivery: 4-6 weeks from order confirmation',
          'Warranty: 12 months from installation',
          'Validity: 30 days from date of quotation',
          'Taxes: GST as applicable'
        ];

    const fallbackQuotation = {
      companyName: answers.company_name || 'Your Company',
      companyAddress1: answers.company_address?.split('\n')[0] || '',
      companyAddress2: answers.company_address?.split('\n')[1] || '',
      companyPhone: answers.company_contact?.match(/\+?\d[\d\s-]+/)?.[0] || '',
      pages: [
        {
          id: 'page-1',
          sections: [
            { id: 'section-1', type: 'heading', heading: 'Reference Information' },
            {
              id: 'section-2',
              type: 'text',
              heading: 'Ref No',
              content: `QT/${new Date().getFullYear()}/AUTO/${Math.floor(Math.random() * 1000)}`
            },
            { id: 'section-3', type: 'text', heading: 'Date', content: new Date().toLocaleDateString() },
            { id: 'section-4', type: 'heading', heading: 'Customer Details' },
            { id: 'section-5', type: 'text', heading: 'Customer Name', content: answers.client_name || 'Client Name' },
            { id: 'section-6', type: 'text', heading: 'Address', content: answers.client_address || '' },
            { id: 'section-7', type: 'heading', heading: 'Project Details' },
            {
              id: 'section-8',
              type: 'text',
              heading: 'Project Description',
              content: answers.project_description || answers.project_subject || ''
            },
            { id: 'section-9', type: 'heading', heading: 'Scope of Work' },
            { id: 'section-10', type: 'text', heading: 'Project Scope', content: answers.scope_of_work || '' },
            { id: 'section-11', type: 'heading', heading: 'Technical Specifications' },
            {
              id: 'section-12',
              type: 'text',
              heading: 'Technical Requirements',
              content: answers.technical_specs || ''
            },
            { id: 'section-13', type: 'heading', heading: 'Items & Services' },
            { id: 'section-14', type: 'text', heading: 'Included Items', content: answers.items_boq || '' },
            { id: 'section-15', type: 'heading', heading: 'Terms & Conditions' },
            { id: 'section-16', type: 'list', heading: 'General Terms', items: termsItems }
          ]
        }
      ]
    };

    console.log('Using smart fallback quotation structure');
    return NextResponse.json({ success: true, quotation: fallbackQuotation });
  } catch (error: any) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quotation', details: error.message },
      { status: 500 }
    );
  }
}
