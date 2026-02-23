import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for CompanyProfile document
export interface ICompanyProfile extends Document {
    userId: string;
    name: string;
    address1?: string;
    address2?: string;
    phone?: string;
    email?: string;
    logo?: string;
    gstin?: string;
    pan?: string;
    website?: string;
    // Legal & Statutory Fields
    cin?: string;                    // Corporate Identification Number (21-char, issued by ROC)
    tan?: string;                    // Tax Deduction Account Number (for TDS compliance)
    msmeNumber?: string;             // Udyam Registration Number (e.g., UDYAM-XX-00-0000000)
    msmeCategory?: string;           // Micro / Small / Medium
    incorporationDate?: Date;        // Date of company incorporation from Certificate
    incorporationCertUrl?: string;   // Uploaded Certificate of Incorporation file URL
    moaUrl?: string;                 // Uploaded MOA document URL
    aoaUrl?: string;                 // Uploaded AOA document URL
    gstCertUrl?: string;             // Uploaded GST Registration Certificate URL
    msmeCertUrl?: string;            // Uploaded MSME/Udyam Certificate URL
    stateCode?: string;              // State code for GST (e.g., 27 for Maharashtra)
    // Bank Details
    bankName?: string;
    bankAccountNo?: string;
    bankIFSC?: string;
    bankBranch?: string;
    // Signature/Footer
    authorizedSignatory?: string;
    signatoryDesignation?: string;
    footerLine1?: string;
    footerLine2?: string;
    footerLine3?: string;
    // Header styling
    headerLineColor: string;
    headerValueColor: string;
    footerLineColor: string;
    footerTextColor: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CompanyProfileSchema = new Schema<ICompanyProfile>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    address1: String,
    address2: String,
    phone: String,
    email: String,
    logo: String,
    gstin: String,
    pan: String,
    website: String,
    // Legal & Statutory Fields
    cin: String,
    tan: String,
    msmeNumber: String,
    msmeCategory: { type: String, enum: ['Micro', 'Small', 'Medium', ''], default: '' },
    incorporationDate: Date,
    incorporationCertUrl: String,
    moaUrl: String,
    aoaUrl: String,
    gstCertUrl: String,
    msmeCertUrl: String,
    stateCode: String,
    // Bank Details
    bankName: String,
    bankAccountNo: String,
    bankIFSC: String,
    bankBranch: String,
    // Signature/Footer
    authorizedSignatory: String,
    signatoryDesignation: String,
    footerLine1: String,
    footerLine2: String,
    footerLine3: String,
    // Header styling
    headerLineColor: {
        type: String,
        default: '#000000'
    },
    headerValueColor: {
        type: String,
        default: '#1a1a1a'
    },
    footerLineColor: {
        type: String,
        default: '#000000'
    },
    footerTextColor: {
        type: String,
        default: '#1a1a1a'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster lookups by userId (NOT unique on name)
CompanyProfileSchema.index({ userId: 1, createdAt: -1 });

// Prevent model overwrite error in development
if (mongoose.models.CompanyProfile) {
    delete mongoose.models.CompanyProfile;
}

const CompanyProfile: Model<ICompanyProfile> = mongoose.models.CompanyProfile || mongoose.model<ICompanyProfile>('CompanyProfile', CompanyProfileSchema);

export default CompanyProfile;
