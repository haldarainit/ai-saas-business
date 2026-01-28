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
  "companyAddress1": "first line of address",
  "companyAddress2": "second line of address",
  "companyPhone": "phone number",
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
          "content": "client address from client_details answer"
        },
        {
          "id": "section-7",
          "type": "heading",
          "heading": "Project Details"
        },
        {
          "id": "section-8",
          "type": "text",
          "heading": "Project Type",
          "content": "from project_type answer"
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
          "items": ["extract key points from project_scope answer as array items"]
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
              {"id": "row-1", "cells": {"col-1": "1", "col-2": "extract from items_services", "col-3": "TBD"}}
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
1. Extract company name, address, and phone from company_details
2. Extract client name and address from client_details
3. Generate a professional reference number (e.g., "QT/2025/PROJECT/001")
4. Break down the project_scope into bullet points for the list
5. Create table rows from technical_specs and items_services
6. Break down terms_conditions into bullet points
7. Make sure all IDs are unique
8. Return ONLY valid JSON, no markdown formatting or explanations

Generate the quotation now:`;

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
