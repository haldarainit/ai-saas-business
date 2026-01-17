import mongoose, { Document, Model, Schema } from 'mongoose';

// Rich Text Style interface - reusable for all styled text fields
export interface IRichTextStyle {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    color: string;
    fontFamily: string;
}

// Table Style interface
export interface ITableStyle {
    headerBgColor: string;
    headerTextColor: string;
    borderColor: string;
    borderWidth: number;
    textColor: string;
    alternateRowColor: string;
    fontSize: number;
}

// Table Data interface
export interface ITableData {
    headers?: string[];
    rows?: string[][];
    style?: ITableStyle;
}

// Content Block interface (for headings, paragraphs, lists, tables)
export interface IContentBlock {
    id?: string;
    type?: 'heading' | 'paragraph' | 'list' | 'table';
    content?: string;
    style?: IRichTextStyle;
    items?: string[];
    tableData?: ITableData;
}

// Company Details interface
export interface IQuotationCompanyDetails {
    name: string;
    nameStyle?: IRichTextStyle;
    logo: string;
    logoWidth: number;
    logoHeight: number;
    gstin: string;
    gstinStyle?: IRichTextStyle;
    phone: string;
    phoneStyle?: IRichTextStyle;
    email: string;
    emailStyle?: IRichTextStyle;
    address: string;
    addressStyle?: IRichTextStyle;
    headerValueColor: string;
    headerLineColor: string;
}

// Client Details interface
export interface IQuotationClientDetails {
    name: string;
    nameStyle?: IRichTextStyle;
    designation: string;
    designationStyle?: IRichTextStyle;
    company: string;
    companyStyle?: IRichTextStyle;
    address: string;
    addressStyle?: IRichTextStyle;
}

// Footer interface
export interface IQuotationFooter {
    line1: string;
    line1Style?: IRichTextStyle;
    line2: string;
    line2Style?: IRichTextStyle;
    line3: string;
    line3Style?: IRichTextStyle;
    lineColor: string;
    textColor: string;
}

// Signature interface
export interface IQuotationSignature {
    name: string;
    nameStyle?: IRichTextStyle;
    designation: string;
    designationStyle?: IRichTextStyle;
}

// Watermark interface
export interface IQuotationWatermark {
    type: 'text' | 'image' | 'none';
    text: string;
    color: string;
    image: string;
    opacity: number;
    rotation: number;
    width: number;
    height: number;
}

// Main TechnoQuotation interface
export interface ITechnoQuotation extends Document {
    userId: string;
    quotationType: 'manual' | 'automated' | 'ai-generated';
    title: string;
    titleStyle?: IRichTextStyle;
    refNo: string;
    refNoStyle?: IRichTextStyle;
    date: string;
    dateStyle?: IRichTextStyle;
    companyDetails: IQuotationCompanyDetails;
    clientDetails: IQuotationClientDetails;
    subject: string;
    subjectStyle?: IRichTextStyle;
    greeting: string;
    greetingStyle?: IRichTextStyle;
    contentBlocks: IContentBlock[];
    footer: IQuotationFooter;
    signature: IQuotationSignature;
    watermark: IQuotationWatermark;
    defaultFontFamily: string;
    status: 'draft' | 'finalized';
    createdAt: Date;
    updatedAt: Date;
}

// Rich Text Style Schema - reusable for all styled text fields
const RichTextStyleSchema = new Schema<IRichTextStyle>({
    fontSize: { type: Number, default: 11 },
    fontWeight: { type: String, default: 'normal' },  // 'normal' or 'bold'
    fontStyle: { type: String, default: 'normal' },   // 'normal' or 'italic'
    textDecoration: { type: String, default: 'none' }, // 'none' or 'underline'
    textAlign: { type: String, default: 'left' },     // 'left', 'center', 'right', 'justify'
    color: { type: String, default: '#1a1a1a' },
    fontFamily: { type: String, default: '' }         // Empty means use default font
}, { _id: false });

// Table Style Schema
const TableStyleSchema = new Schema<ITableStyle>({
    headerBgColor: { type: String, default: 'transparent' },
    headerTextColor: { type: String, default: '#000000' },
    borderColor: { type: String, default: '#1a1a1a' },
    borderWidth: { type: Number, default: 1 },
    textColor: { type: String, default: '#1a1a1a' },
    alternateRowColor: { type: String, default: '#f9fafb' },
    fontSize: { type: Number, default: 10 }
}, { _id: false });

// Content Block Schema (for headings, paragraphs, lists, tables)
const ContentBlockSchema = new Schema<IContentBlock>({
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

const TechnoQuotationSchema = new Schema<ITechnoQuotation>({
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

const TechnoQuotation: Model<ITechnoQuotation> = mongoose.models.TechnoQuotation || mongoose.model<ITechnoQuotation>('TechnoQuotation', TechnoQuotationSchema);

export default TechnoQuotation;
