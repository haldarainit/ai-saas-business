import mongoose from 'mongoose';

console.log('RawMaterial model loading...');

// Schema definition for Raw Materials
const rawMaterialSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    sku: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: false,
        default: 'Uncategorized'
    },
    unit: {
        type: String,
        required: true,
        default: 'pcs',
        trim: true,
        lowercase: true  // Automatically normalize to lowercase
    },
    costPerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    minimumStock: {
        type: Number,
        required: false,
        default: 10
    },
    shelf: {
        type: String,
        required: true,
        default: 'Default'
    },
    expiryDate: {
        type: Date,
        required: false
    },
    supplier: {
        type: String,
        default: ''
    },
    supplierContact: {
        type: String,
        default: ''
    },
    gstin: {
        type: String,
        default: ''
    },
    hsnCode: {
        type: String,
        default: ''
    },
    gstPercentage: {
        type: Number,
        default: 0
    },
    invoiceNumber: {
        type: String,
        default: ''
    },
    invoiceDate: {
        type: Date,
        default: null
    },
    lastPurchaseDate: {
        type: Date,
        default: null
    },
    lastPurchasePrice: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

// Virtual for total value of stock
rawMaterialSchema.virtual('totalValue').get(function () {
    return this.costPerUnit * this.quantity;
});

// Virtual for checking if stock is low
rawMaterialSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.minimumStock;
});

// Virtual for checking if expired
rawMaterialSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
});

// Virtual for checking if about to expire (15 days)
rawMaterialSchema.virtual('isAboutToExpire').get(function () {
    if (!this.expiryDate) return false;
    const expiry = new Date(this.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 15 && daysUntilExpiry >= 0;
});

// Create indexes
rawMaterialSchema.index({ userId: 1, sku: 1 }, { unique: true });
rawMaterialSchema.index({ name: 'text', description: 'text' });

// Error handling for duplicate SKU
rawMaterialSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('A raw material with this SKU already exists'));
    } else {
        next(error);
    }
});

// Static method to find low stock materials
rawMaterialSchema.statics.findLowStock = function (userId) {
    return this.find({
        userId: userId,
        $expr: { $lte: ['$quantity', '$minimumStock'] }
    });
};

// Check if model exists to prevent recompilation
let RawMaterial;
try {
    RawMaterial = mongoose.model('RawMaterial');
} catch (e) {
    if (e.name === 'MissingSchemaError') {
        console.log('Creating new RawMaterial model...');
        RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);
    } else {
        console.error('Error creating RawMaterial model:', e);
        throw e;
    }
}

export default RawMaterial;
