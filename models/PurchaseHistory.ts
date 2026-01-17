import mongoose, { Document, Model, Schema } from 'mongoose';

console.log('PurchaseHistory model loading...');

// Interface for purchase items
export interface IPurchaseItem {
    name: string;
    sku: string;
    quantity: number;
    unit: string;
    basePrice: number;
    costPerUnit: number;
    gstPercentage: number;
    gstAmount: number;
    totalCost: number;
    category: string;
    hsnCode: string;
}

// Interface for payment details
export interface IPaymentDetails {
    method: 'cash' | 'card' | 'upi' | 'bank' | 'cheque';
    transactionId: string;
    bankName: string;
    accountNumber: string;
    chequeNumber: string;
    chequeDate: Date | null;
    upiId: string;
    notes: string;
}

// Interface for supplier info
export interface ISupplierInfo {
    name: string;
    gstin: string;
    contact: string;
    address: string;
}

// Main PurchaseHistory interface
export interface IPurchaseHistory extends Document {
    userId: string;
    purchaseType: 'manufacturing' | 'trading';
    items: IPurchaseItem[];
    itemCount: number;
    totalValue: number;
    supplier: ISupplierInfo;
    isPaid: boolean;
    paymentDetails?: IPaymentDetails;
    invoiceNumber: string;
    invoiceDate: Date | null;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

// Schema for individual purchase items
const purchaseItemSchema = new Schema<IPurchaseItem>({
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        default: ''
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        default: 'pcs'
    },
    basePrice: {
        type: Number,
        default: 0
    },
    costPerUnit: {
        type: Number,
        default: 0
    },
    gstPercentage: {
        type: Number,
        default: 0
    },
    gstAmount: {
        type: Number,
        default: 0
    },
    totalCost: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        default: 'Uncategorized'
    },
    hsnCode: {
        type: String,
        default: ''
    }
}, { _id: false });

// Schema for payment details
const paymentDetailsSchema = new Schema<IPaymentDetails>({
    method: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank', 'cheque'],
        required: true
    },
    transactionId: {
        type: String,
        default: ''
    },
    bankName: {
        type: String,
        default: ''
    },
    accountNumber: {
        type: String,
        default: ''
    },
    chequeNumber: {
        type: String,
        default: ''
    },
    chequeDate: {
        type: Date,
        default: null
    },
    upiId: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    }
}, { _id: false });

// Schema for supplier info
const supplierInfoSchema = new Schema<ISupplierInfo>({
    name: {
        type: String,
        default: ''
    },
    gstin: {
        type: String,
        default: ''
    },
    contact: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    }
}, { _id: false });

// Main Purchase History Schema
const purchaseHistorySchema = new Schema<IPurchaseHistory>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    purchaseType: {
        type: String,
        enum: ['manufacturing', 'trading'],
        default: 'manufacturing'
    },
    items: [purchaseItemSchema],
    itemCount: {
        type: Number,
        required: true
    },
    totalValue: {
        type: Number,
        required: true
    },
    supplier: supplierInfoSchema,
    isPaid: {
        type: Boolean,
        default: false
    },
    paymentDetails: paymentDetailsSchema,
    invoiceNumber: {
        type: String,
        default: ''
    },
    invoiceDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

// Indexes for efficient querying
purchaseHistorySchema.index({ userId: 1, createdAt: -1 });
purchaseHistorySchema.index({ userId: 1, purchaseType: 1 });
purchaseHistorySchema.index({ userId: 1, isPaid: 1 });

// Check if model exists to prevent recompilation
let PurchaseHistory: Model<IPurchaseHistory>;
try {
    PurchaseHistory = mongoose.model<IPurchaseHistory>('PurchaseHistory');
} catch (e) {
    const error = e as Error;
    if (error.name === 'MissingSchemaError') {
        console.log('Creating new PurchaseHistory model...');
        PurchaseHistory = mongoose.model<IPurchaseHistory>('PurchaseHistory', purchaseHistorySchema);
    } else {
        console.error('Error creating PurchaseHistory model:', e);
        throw e;
    }
}

export default PurchaseHistory;
