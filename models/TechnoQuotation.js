import mongoose from 'mongoose';

// Rich Text Style Schema - reusable for all styled text fields
const RichTextStyleSchema = new mongoose.Schema({
    fontSize: { type: Number, default: 11 },
    fontWeight: { type: String, default: 'normal' },  // 'normal' or 'bold'
    fontStyle: { type: String, default: 'normal' },   // 'normal' or 'italic'
    textDecoration: { type: String, default: 'none' }, // 'none' or 'underline'
    textAlign: { type: String, default: 'left' },     // 'left', 'center', 'right', 'justify'
    color: { type: String, default: '#1a1a1a' },
    fontFamily: { type: String, default: '' }         // Empty means use default font
}, { _id: false });

// Table Style Schema
const TableStyleSchema = new mongoose.Schema({
    headerBgColor: { type: String, default: 'transparent' },
    headerTextColor: { type: String, default: '#000000' },
    borderColor: { type: String, default: '#1a1a1a' },
    borderWidth: { type: Number, default: 1 },
    textColor: { type: String, default: '#1a1a1a' },
    alternateRowColor: { type: String, default: '#f9fafb' },
    fontSize: { type: Number, default: 10 }
}, { _id: false });

// Content Block Schema (for headings, paragraphs, lists, tables)
const ContentBlockSchema = new mongoose.Schema({
    id: String,
    type: { type: String, enum: ['heading', 'paragraph', 'list', 'table'] },
    content: String,
    style: RichTextStyleSchema,
    items: [String],
    tableData: {
        headers: [String],
        rows: [[String]],
        style: TableStyleSchema
    }
}, { _id: false });

const TechnoQuotationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    quotationType: {
        type: String,
        enum: ['manual', 'automated', 'ai-generated'],
        default: 'manual'
    },

    // Title
    title: { type: String, default: 'TECHNO COMMERCIAL QUOTATION' },
    titleStyle: RichTextStyleSchema,

    // Reference Number
    refNo: { type: String, default: '' },
    refNoStyle: RichTextStyleSchema,

    // Date
    date: { type: String, default: '' },
    dateStyle: RichTextStyleSchema,

    // Company Details
    companyDetails: {
        name: { type: String, default: 'Your Company Name' },
        nameStyle: RichTextStyleSchema,
        logo: { type: String, default: '' },
        logoWidth: { type: Number, default: 80 },
        logoHeight: { type: Number, default: 80 },
        gstin: { type: String, default: '' },
        gstinStyle: RichTextStyleSchema,
        phone: { type: String, default: '' },
        phoneStyle: RichTextStyleSchema,
        email: { type: String, default: '' },
        emailStyle: RichTextStyleSchema,
        address: { type: String, default: '' },
        addressStyle: RichTextStyleSchema,
        headerValueColor: { type: String, default: '#1a1a1a' },
        headerLineColor: { type: String, default: '#000000' }
    },

    // Client Details
    clientDetails: {
        name: { type: String, default: '' },
        nameStyle: RichTextStyleSchema,
        designation: { type: String, default: '' },
        designationStyle: RichTextStyleSchema,
        company: { type: String, default: '' },
        companyStyle: RichTextStyleSchema,
        address: { type: String, default: '' },
        addressStyle: RichTextStyleSchema
    },

    // Subject & Greeting
    subject: { type: String, default: '' },
    subjectStyle: RichTextStyleSchema,
    greeting: { type: String, default: '' },
    greetingStyle: RichTextStyleSchema,

    // Content Blocks (dynamic content)
    contentBlocks: [ContentBlockSchema],

    // Footer
    footer: {
        line1: { type: String, default: '' },
        line1Style: RichTextStyleSchema,
        line2: { type: String, default: '' },
        line2Style: RichTextStyleSchema,
        line3: { type: String, default: '' },
        line3Style: RichTextStyleSchema,
        lineColor: { type: String, default: '#000000' },
        textColor: { type: String, default: '#000000' }
    },

    // Signature
    signature: {
        name: { type: String, default: '' },
        nameStyle: RichTextStyleSchema,
        designation: { type: String, default: '' },
        designationStyle: RichTextStyleSchema
    },

    // Watermark
    watermark: {
        type: { type: String, enum: ['text', 'image', 'none'], default: 'none' },
        text: { type: String, default: 'CONFIDENTIAL' },
        color: { type: String, default: '#cccccc' },
        image: { type: String, default: '' },
        opacity: { type: Number, default: 0.15 },
        rotation: { type: Number, default: -30 },
        width: { type: Number, default: 300 },
        height: { type: Number, default: 200 }
    },

    // Default Font Family
    defaultFontFamily: { type: String, default: 'Times New Roman' },

    // Status
    status: {
        type: String,
        enum: ['draft', 'finalized'],
        default: 'draft'
    }
}, {
    timestamps: true,
    strict: false // Allow additional fields not defined in schema
});

// Prevent model overwrite error in development
if (mongoose.models.TechnoQuotation) {
    delete mongoose.models.TechnoQuotation;
}

export default mongoose.models.TechnoQuotation || mongoose.model('TechnoQuotation', TechnoQuotationSchema);
