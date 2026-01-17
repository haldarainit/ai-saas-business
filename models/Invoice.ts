import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Sub-interfaces for nested objects
export interface IInvoiceSettings {
    showBankDetails: boolean;
    showTerms: boolean;
    showJurisdiction: boolean;
    showDeclaration: boolean;
    showDiscount: boolean;
    showTaxColumns: boolean;
    showDueDate: boolean;
    showDeliveryDetails: boolean;
    showDispatchDetails: boolean;
    showRoundOff: boolean;
    showHSNSAC: boolean;
    currency: string;
    currencySymbol: string;
    taxType: 'GST' | 'IGST' | 'None';
    gstDisplayMode: 'simple' | 'split' | 'detailed';
}

export interface ICompanyDetails {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    stateCode?: string;
    logo?: string;
}

export interface IClientDetails {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    paymentMode?: string;
}

export interface IShipToDetails {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    sameAsBillTo: boolean;
}

export interface IOrderDetails {
    placeOfSupply?: string;
    reverseCharge?: string;
    hsnsac?: string;
    deliveryNote?: string;
    deliveryNoteDate?: string;
    referenceNo?: string;
    referenceDate?: string;
    otherReferences?: string;
    dispatchDocNo?: string;
    dispatchedThrough?: string;
    destination?: string;
    termsOfDelivery?: string;
}

export interface IInvoiceItem {
    id?: string;
    description?: string;
    quantity?: number;
    rate?: number;
    discount?: number;
    taxRate?: number;
    cgstPercent?: number;
    sgstPercent?: number;
    cgst?: number;
    sgst?: number;
    totalGst?: number;
    hsnsac?: string;
}

export interface IFinancials {
    shippingCharges: number;
    otherCharges: number;
}

export interface IBankDetails {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
}

export interface ITerms {
    notes?: string;
    termsConditions?: string;
    jurisdictionText?: string;
    authorizedSignatory?: string;
    declarationText?: string;
}

// Main Invoice interface
export interface IInvoice extends Document {
    userId: string;
    title: string;
    invoiceNumber: string;
    sourceQuotationId?: Types.ObjectId;
    invoiceDate?: Date;
    dueDate?: Date;
    poDate?: Date;
    poNumber?: string;
    settings: IInvoiceSettings;
    companyDetails: ICompanyDetails;
    clientDetails: IClientDetails;
    shipToDetails: IShipToDetails;
    orderDetails: IOrderDetails;
    items: IInvoiceItem[];
    financials: IFinancials;
    bankDetails: IBankDetails;
    terms: ITerms;
    updatedAt: Date;
    createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
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
    // Link to source quotation if created from one
    sourceQuotationId: {
        type: Schema.Types.ObjectId,
        ref: 'TechnoQuotation',
        default: null
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
        totalGst: Number,
        hsnsac: String
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

const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
