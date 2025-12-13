import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: "TAX INVOICE"
    },
    invoiceNumber: {
        type: String,
        required: true
    },
    invoiceDate: Date,
    dueDate: Date,
    poDate: Date,
    poNumber: String,

    // Toggles / Meta
    settings: {
        showBankDetails: { type: Boolean, default: true },
        showTerms: { type: Boolean, default: true },
        showJurisdiction: { type: Boolean, default: true },
        showDeclaration: { type: Boolean, default: false },
        showDiscount: { type: Boolean, default: true },
        showTaxColumns: { type: Boolean, default: true },
        showDueDate: { type: Boolean, default: true },
        showDeliveryDetails: { type: Boolean, default: false },
        showDispatchDetails: { type: Boolean, default: false },
        showRoundOff: { type: Boolean, default: true },
        showHSNSAC: { type: Boolean, default: true },
        currency: { type: String, default: 'INR' },
        currencySymbol: { type: String, default: '₹' },
        taxType: { type: String, enum: ['GST', 'IGST', 'None'], default: 'GST' },
        gstDisplayMode: { type: String, enum: ['simple', 'split', 'detailed'], default: 'split' }
    },

    // Company (Seller)
    companyDetails: {
        name: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        email: String,
        phone: String,
        gstin: String,
        stateCode: String,
        logo: String // Base64 or URL
    },

    // Client (Buyer)
    clientDetails: {
        name: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        email: String,
        phone: String,
        gstin: String,
        paymentMode: String
    },

    // Ship To
    shipToDetails: {
        name: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        sameAsBillTo: { type: Boolean, default: true }
    },

    // Additional Details
    orderDetails: {
        placeOfSupply: String,
        reverseCharge: String,
        hsnsac: String,
        deliveryNote: String,
        deliveryNoteDate: String,
        referenceNo: String,
        referenceDate: String,
        otherReferences: String,
        dispatchDocNo: String,
        dispatchedThrough: String,
        destination: String,
        termsOfDelivery: String
    },

    // Items
    items: [{
        id: String,
        description: String,
        quantity: Number,
        rate: Number,
        discount: Number,
        taxRate: Number,
        cgstPercent: Number,
        sgstPercent: Number,
        cgst: Number,
        sgst: Number,
        totalGst: Number
    }],

    // Financials
    financials: {
        shippingCharges: { type: Number, default: 0 },
        otherCharges: { type: Number, default: 0 }
    },

    // Bank Details
    bankDetails: {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        branch: String,
        upiId: String
    },

    // Terms & Footer
    terms: {
        notes: String,
        termsConditions: String,
        jurisdictionText: String,
        authorizedSignatory: String,
        declarationText: String
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
InvoiceSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
