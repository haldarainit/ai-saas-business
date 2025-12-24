import mongoose from 'mongoose';

const CompanyProfileSchema = new mongoose.Schema({
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

// Compound index for faster lookups
CompanyProfileSchema.index({ userId: 1, name: 1 }, { unique: true });

// Prevent model overwrite error in development
if (mongoose.models.CompanyProfile) {
    delete mongoose.models.CompanyProfile;
}

export default mongoose.models.CompanyProfile || mongoose.model('CompanyProfile', CompanyProfileSchema);

