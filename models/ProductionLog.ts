import mongoose, { Document, Model, Schema, Types } from 'mongoose';

console.log('ProductionLog model loading...');

// Interface for consumed material record
export interface IConsumedMaterial {
    rawMaterialId: Types.ObjectId;
    rawMaterialName: string;
    rawMaterialSku: string;
    quantityConsumed: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
}

// Main ProductionLog interface
export interface IProductionLog extends Document {
    userId: string;
    productId: Types.ObjectId;
    productName: string;
    productSku: string;
    quantityProduced: number;
    batchNumber: string;
    materialsConsumed: IConsumedMaterial[];
    totalRawMaterialCost: number;
    manufacturingCost: number;
    totalProductionCost: number;
    costPerUnit: number;
    status: 'completed' | 'cancelled' | 'partial';
    notes: string;
    productionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for production summary result
export interface IProductionSummary {
    _id: Types.ObjectId;
    productName: string;
    totalProduced: number;
    totalCost: number;
    avgCostPerUnit: number;
    batches: number;
}

// Interface for static methods
export interface IProductionLogModel extends Model<IProductionLog> {
    getProductionSummary(userId: string, startDate: Date, endDate: Date): Promise<IProductionSummary[]>;
}

// Consumed material record
const consumedMaterialSchema = new Schema<IConsumedMaterial>({
    rawMaterialId: {
        type: Schema.Types.ObjectId,
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
const productionLogSchema = new Schema<IProductionLog, IProductionLogModel>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    productId: {
        type: Schema.Types.ObjectId,
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
productionLogSchema.statics.getProductionSummary = function (userId: string, startDate: Date, endDate: Date) {
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
let ProductionLog: IProductionLogModel;
try {
    ProductionLog = mongoose.model<IProductionLog, IProductionLogModel>('ProductionLog');
} catch (e) {
    const error = e as Error;
    if (error.name === 'MissingSchemaError') {
        console.log('Creating new ProductionLog model...');
        ProductionLog = mongoose.model<IProductionLog, IProductionLogModel>('ProductionLog', productionLogSchema);
    } else {
        console.error('Error creating ProductionLog model:', e);
        throw e;
    }
}

export default ProductionLog;
