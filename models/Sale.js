import mongoose from 'mongoose';

console.log('Sale model loading...');

// Schema definition for Sales
const saleSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    // Invoice/Receipt Number
    invoiceNumber: {
        type: String,
        required: true,
        trim: true
    },
    // Customer Information
    customer: {
        name: { type: String, default: 'Walk-in Customer' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        gstin: { type: String, default: '' }
    },
    // Items Sold
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productSku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: 'pcs' },
        costPrice: { type: Number, required: true, min: 0 }, // Original purchase cost
        sellingPrice: { type: Number, required: true, min: 0 }, // Actual selling price
        discount: { type: Number, default: 0, min: 0 }, // Discount applied
        tax: { type: Number, default: 0, min: 0 }, // Tax amount
        totalPrice: { type: Number, required: true } // Final price after discount + tax
    }],
    // Financial Summary
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    totalDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTax: {
        type: Number,
        default: 0,
        min: 0
    },
    grandTotal: {
        type: Number,
        required: true,
        min: 0
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0 // Total cost of goods sold
    },
    profit: {
        type: Number,
        required: true // Grand Total - Total Cost
    },
    profitMargin: {
        type: Number,
        default: 0 // (Profit / Grand Total) * 100
    },
    // Payment Information
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit', 'cheque', 'other'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'pending', 'refunded'],
        default: 'paid'
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    amountDue: {
        type: Number,
        default: 0,
        min: 0
    },
    // Sale Details
    saleDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['completed', 'cancelled', 'returned'],
        default: 'completed'
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes
saleSchema.index({ userId: 1, saleDate: -1 });
saleSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ 'customer.name': 'text', 'customer.phone': 'text', invoiceNumber: 'text' });

// Pre-save middleware to update timestamps and calculations
saleSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Calculate totals if items exist
    if (this.items && this.items.length > 0) {
        this.subtotal = this.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        this.totalDiscount = this.items.reduce((sum, item) => sum + (item.discount || 0), 0);
        this.totalTax = this.items.reduce((sum, item) => sum + (item.tax || 0), 0);
        this.grandTotal = this.subtotal - this.totalDiscount + this.totalTax;
        this.totalCost = this.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        this.profit = this.grandTotal - this.totalCost;
        this.profitMargin = this.grandTotal > 0 ? (this.profit / this.grandTotal) * 100 : 0;
        this.amountDue = Math.max(0, this.grandTotal - this.amountPaid);
    }

    next();
});

// Generate unique invoice number
saleSchema.statics.generateInvoiceNumber = async function (userId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.countDocuments({
        userId,
        saleDate: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
        }
    });
    return `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);

export default Sale;
