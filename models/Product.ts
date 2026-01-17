import mongoose, { Document, Model, Schema } from 'mongoose';
import dbConnect from '@/lib/mongodb';

console.log('Product model loading...');

// Main Product interface
export interface IProduct extends Document {
    userId: string;
    name: string;
    description: string;
    sku: string;
    category: string;
    price: number;
    cost: number;
    quantity: number;
    shelf: string;
    expiryDate?: Date;
    supplier: string;
    supplierContact: string;
    gstin: string;
    hsnCode: string;
    gstPercentage: number;
    invoiceNumber: string;
    invoiceDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // Virtuals
    profit: number;
    isAboutToExpire: boolean;
    isExpired: boolean;
}

// Interface for static methods
export interface IProductModel extends Model<IProduct> {
    findExpiringSoon(userId: string, days?: number): Promise<IProduct[]>;
}

// Schema definition
const productSchema = new Schema<IProduct, IProductModel>({
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
    price: {
        type: Number,
        required: true,
        min: 0
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
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

// Calculate profit (virtual field)
productSchema.virtual('profit').get(function (this: IProduct) {
    return (this.price - this.cost) * this.quantity;
});

// Virtual for checking if product is about to expire
productSchema.virtual('isAboutToExpire').get(function (this: IProduct) {
    if (!this.expiryDate) return false;
    const expiry = new Date(this.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 15 && daysUntilExpiry >= 0;
});

// Virtual for checking if product is expired
productSchema.virtual('isExpired').get(function (this: IProduct) {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
});

// Create indexes - SKU must be unique per user, not globally
productSchema.index({ userId: 1, sku: 1 }, { unique: true });
productSchema.index({ userId: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Middleware for validation
productSchema.pre('save', function (next) {
    console.log('Saving product:', this);
    next();
});

// Error handling middleware
productSchema.post('save', function (error: Error & { code?: number }, doc: IProduct, next: (err?: Error) => void) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('A product with this SKU already exists'));
    } else {
        next(error);
    }
});

// Static method to find products expiring soon for a specific user
productSchema.statics.findExpiringSoon = function (userId: string, days: number = 15) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.find({
        userId: userId,
        expiryDate: {
            $exists: true,
            $ne: null,
            $gte: new Date(),
            $lte: futureDate
        }
    });
};

// Check if model exists to prevent recompilation
let Product: IProductModel;
try {
    Product = mongoose.model<IProduct, IProductModel>('Product');
} catch (e) {
    const error = e as Error;
    if (error.name === 'MissingSchemaError') {
        console.log('Creating new Product model...');
        Product = mongoose.model<IProduct, IProductModel>('Product', productSchema);
    } else {
        console.error('Error creating Product model:', e);
        throw e;
    }
}

// Test connection and model
if (process.env.NODE_ENV === 'development') {
    (async () => {
        try {
            await dbConnect();
            console.log('Product model connected to MongoDB');

            // Test query to verify the model works
            const count = await Product.countDocuments();
            console.log(`Product model test: Found ${count} products in the database`);
        } catch (error) {
            console.error('Error testing Product model connection:', error);
        }
    })();
}

export default Product;
