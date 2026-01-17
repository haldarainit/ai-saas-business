import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Interface for reminder items
export interface IPaymentReminderItem {
    name?: string;
    sku?: string;
    quantity?: number;
    unit?: string;
    costPerUnit?: number;
    basePrice?: number;
    totalCost?: number;
}

// Interface for supplier info
export interface IPaymentReminderSupplier {
    name?: string;
    gstin?: string;
}

// Main PaymentReminder interface
export interface IPaymentReminder extends Document {
    purchaseId: Types.ObjectId;
    userId: string;
    recipientEmail: string;
    recipientName: string;
    items: IPaymentReminderItem[];
    supplier: IPaymentReminderSupplier;
    totalValue: number;
    purchaseDate: Date;
    nextReminderDate: Date;
    reminderCount: number;
    lastReminderSent: Date | null;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

console.log('PaymentReminder model loading...');

// Schema for tracking payment reminders
const paymentReminderSchema = new Schema<IPaymentReminder>({
    // Reference to the purchase history
    purchaseId: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseHistory',
        required: true,
        index: true
    },
    // User who made the purchase
    userId: {
        type: String,
        required: true,
        index: true
    },
    // Email to send reminders to
    recipientEmail: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        default: 'User'
    },
    // Purchase details for the email
    items: [{
        name: String,
        sku: String,
        quantity: Number,
        unit: String,
        costPerUnit: Number,
        basePrice: Number,
        totalCost: Number
    }],
    supplier: {
        name: String,
        gstin: String
    },
    totalValue: {
        type: Number,
        required: true
    },
    purchaseDate: {
        type: Date,
        required: true
    },
    // Reminder scheduling
    nextReminderDate: {
        type: Date,
        required: true,
        index: true
    },
    reminderCount: {
        type: Number,
        default: 0
    },
    lastReminderSent: {
        type: Date,
        default: null
    },
    // Status: 'active' | 'completed' | 'cancelled'
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
        index: true
    },
    // When the reminder was created
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
paymentReminderSchema.index({ status: 1, nextReminderDate: 1 });
paymentReminderSchema.index({ purchaseId: 1, status: 1 });

// Check if model exists to prevent recompilation
let PaymentReminder: Model<IPaymentReminder>;
try {
    PaymentReminder = mongoose.model<IPaymentReminder>('PaymentReminder');
} catch (e) {
    const error = e as Error;
    if (error.name === 'MissingSchemaError') {
        console.log('Creating new PaymentReminder model...');
        PaymentReminder = mongoose.model<IPaymentReminder>('PaymentReminder', paymentReminderSchema);
    } else {
        console.error('Error creating PaymentReminder model:', e);
        throw e;
    }
}

export default PaymentReminder;
