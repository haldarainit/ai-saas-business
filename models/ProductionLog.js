import mongoose from 'mongoose';

console.log('ProductionLog model loading...');

// Consumed material record
const consumedMaterialSchema = new mongoose.Schema({
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
    quantityConsumed: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    costPerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

// Production Log Schema - tracks each production batch
const productionLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManufacturingProduct',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productSku: {
        type: String,
        required: true
    },
    // Production details
    quantityProduced: {
        type: Number,
        required: true,
        min: 1
    },
    batchNumber: {
        type: String,
        required: false,
        default: ''
    },
    // Cost breakdown
    materialsConsumed: {
        type: [consumedMaterialSchema],
        required: true,
        default: []
    },
    totalRawMaterialCost: {
        type: Number,
        required: true,
        min: 0
    },
    manufacturingCost: {
        type: Number,
        required: false,
        default: 0
    },
    totalProductionCost: {
        type: Number,
        required: true,
        min: 0
    },
    costPerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    // Status
    status: {
        type: String,
        enum: ['completed', 'cancelled', 'partial'],
        default: 'completed'
    },
    notes: {
        type: String,
        default: ''
    },
    productionDate: {
        type: Date,
        default: Date.now
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

// Create indexes
productionLogSchema.index({ userId: 1 });
productionLogSchema.index({ productId: 1 });
productionLogSchema.index({ productionDate: -1 });
productionLogSchema.index({ userId: 1, productionDate: -1 });

// Static methods for reporting
productionLogSchema.statics.getProductionSummary = function (userId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                userId: userId,
                productionDate: { $gte: startDate, $lte: endDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$productId',
                productName: { $first: '$productName' },
                totalProduced: { $sum: '$quantityProduced' },
                totalCost: { $sum: '$totalProductionCost' },
                avgCostPerUnit: { $avg: '$costPerUnit' },
                batches: { $sum: 1 }
            }
        }
    ]);
};

// Check if model exists to prevent recompilation
let ProductionLog;
try {
    ProductionLog = mongoose.model('ProductionLog');
} catch (e) {
    if (e.name === 'MissingSchemaError') {
        console.log('Creating new ProductionLog model...');
        ProductionLog = mongoose.model('ProductionLog', productionLogSchema);
    } else {
        console.error('Error creating ProductionLog model:', e);
        throw e;
    }
}

export default ProductionLog;
