import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILegalDocument extends Document {
    userId: string;
    companyProfileId?: string;
    category: string;
    documentName: string;
    description?: string;
    fileUrl: string;
    publicId: string;         // Cloudinary public ID for deletion
    fileName: string;
    fileSize: number;
    mimeType: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Document categories matching the statutory requirements
export const DOCUMENT_CATEGORIES = [
    { value: 'certificate_of_incorporation', label: 'Certificate of Incorporation', description: 'Official proof of company formation issued by MCA' },
    { value: 'pan_card', label: 'PAN Card', description: 'Tax identification for income tax compliance' },
    { value: 'tan_card', label: 'TAN Certificate', description: 'Tax Deduction Account Number for TDS compliance' },
    { value: 'moa', label: 'Memorandum of Association (MOA)', description: 'Defines company objectives and structure' },
    { value: 'aoa', label: 'Articles of Association (AOA)', description: 'Defines operational rules and regulations' },
    { value: 'cin_details', label: 'CIN Details', description: 'Corporate Identification Number issued by ROC' },
    { value: 'gst_certificate', label: 'GST Registration Certificate', description: 'Confirms GST compliance and tax registration' },
    { value: 'msme_udyam', label: 'MSME / Udyam Registration', description: 'Recognition for MSME benefits' },
    { value: 'statutory_register', label: 'Statutory Register', description: 'Registers of Members, Directors, Share Allotment, Transfers, Loans & Investments' },
    { value: 'minutes_book', label: 'Minutes Book', description: 'Records of Board Meetings and AGM decisions' },
    { value: 'other', label: 'Other Document', description: 'Any other legal or statutory document' },
] as const;

const LegalDocumentSchema = new Schema<ILegalDocument>({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    companyProfileId: {
        type: String,
        index: true,
    },
    category: {
        type: String,
        required: true,
        enum: DOCUMENT_CATEGORIES.map(c => c.value),
    },
    documentName: {
        type: String,
        required: true,
    },
    description: String,
    fileUrl: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    tags: [String],
}, {
    timestamps: true,
});

// Compound indexes for fast retrieval
LegalDocumentSchema.index({ userId: 1, category: 1 });
LegalDocumentSchema.index({ userId: 1, companyProfileId: 1 });
LegalDocumentSchema.index({ userId: 1, createdAt: -1 });

// Prevent model overwrite in dev
if (mongoose.models.LegalDocument) {
    delete mongoose.models.LegalDocument;
}

const LegalDocument: Model<ILegalDocument> = mongoose.models.LegalDocument || mongoose.model<ILegalDocument>('LegalDocument', LegalDocumentSchema);

export default LegalDocument;
