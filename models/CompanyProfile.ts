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
