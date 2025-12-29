import mongoose from 'mongoose';

console.log('ManufacturingProduct model loading...');

// BOM (Bill of Materials) Item Schema - ingredients for a product
const bomItemSchema = new mongoose.Schema({
    rawMaterialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RawMaterial',
        required: true
    },
    rawMaterialName: {
        type: String,
        required: true
    },
    rawMaterialSku: {
        type: String,
        required: true
    },
    quantityRequired: {
        type: Number,
        required: true,
        min: 0.001
    },
    unit: {
        type: String,
        required: true,
        default: 'pcs'
    },
    costPerUnit: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

// Manufacturing Product Schema
const manufacturingProductSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
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
    // Bill of Materials - list of raw materials needed to make this product
    billOfMaterials: {
        type: [bomItemSchema],
        required: true,
        default: []
    },
    // Calculated raw material cost based on BOM
    rawMaterialCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    // Additional manufacturing costs (labor, overhead, etc.)
    manufacturingCost: {
        type: Number,
        required: false,
        default: 0
    },
    // Total cost = rawMaterialCost + manufacturingCost
    totalCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    // Selling price
    sellingPrice: {
        type: Number,
        required: true,
        min: 0
    },
    // Current stock of finished products
    finishedQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    // Minimum stock level for reorder alert
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
    // Production history
    lastProductionDate: {
        type: Date,
        default: null
    },
    totalProduced: {
        type: Number,
        default: 0
    },
    totalSold: {
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

// Virtual for profit per unit
manufacturingProductSchema.virtual('profitPerUnit').get(function () {
    return this.sellingPrice - this.totalCost;
});

// Virtual for total profit on current stock
manufacturingProductSchema.virtual('totalProfit').get(function () {
    return (this.sellingPrice - this.totalCost) * this.finishedQuantity;
});

// Virtual for profit margin percentage
manufacturingProductSchema.virtual('profitMargin').get(function () {
    if (this.sellingPrice === 0) return 0;
    return ((this.sellingPrice - this.totalCost) / this.sellingPrice) * 100;
});

// Virtual for stock value
manufacturingProductSchema.virtual('stockValue').get(function () {
    return this.sellingPrice * this.finishedQuantity;
});

// Virtual for checking if stock is low
manufacturingProductSchema.virtual('isLowStock').get(function () {
    return this.finishedQuantity <= this.minimumStock;
});

// Pre-save hook to calculate costs
manufacturingProductSchema.pre('save', function (next) {
    // Calculate raw material cost from BOM
    this.rawMaterialCost = this.billOfMaterials.reduce((total, item) => {
        return total + (item.quantityRequired * item.costPerUnit);
    }, 0);

    // Calculate total cost
    this.totalCost = this.rawMaterialCost + (this.manufacturingCost || 0);

    console.log('Saving manufacturing product:', this.name, 'Total Cost:', this.totalCost);
    next();
});

// Create indexes
manufacturingProductSchema.index({ userId: 1, sku: 1 }, { unique: true });
manufacturingProductSchema.index({ userId: 1 });
manufacturingProductSchema.index({ name: 'text', description: 'text' });

// Error handling for duplicate SKU
manufacturingProductSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('A manufacturing product with this SKU already exists'));
    } else {
        next(error);
    }
});

// Static method to find low stock products
manufacturingProductSchema.statics.findLowStock = function (userId) {
    return this.find({
        userId: userId,
        $expr: { $lte: ['$finishedQuantity', '$minimumStock'] }
    });
};

// Check if model exists to prevent recompilation
let ManufacturingProduct;
try {
    ManufacturingProduct = mongoose.model('ManufacturingProduct');
} catch (e) {
    if (e.name === 'MissingSchemaError') {
        console.log('Creating new ManufacturingProduct model...');
        ManufacturingProduct = mongoose.model('ManufacturingProduct', manufacturingProductSchema);
    } else {
        console.error('Error creating ManufacturingProduct model:', e);
        throw e;
    }
}

export default ManufacturingProduct;
