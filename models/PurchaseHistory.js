import mongoose from 'mongoose';

console.log('PurchaseHistory model loading...');

// Schema for individual purchase items
const purchaseItemSchema = new mongoose.Schema({
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
const paymentDetailsSchema = new mongoose.Schema({
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
const supplierInfoSchema = new mongoose.Schema({
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
const purchaseHistorySchema = new mongoose.Schema({
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
let PurchaseHistory;
try {
    PurchaseHistory = mongoose.model('PurchaseHistory');
} catch (e) {
    if (e.name === 'MissingSchemaError') {
        console.log('Creating new PurchaseHistory model...');
        PurchaseHistory = mongoose.model('PurchaseHistory', purchaseHistorySchema);
    } else {
        console.error('Error creating PurchaseHistory model:', e);
        throw e;
    }
}

export default PurchaseHistory;
