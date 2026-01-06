import mongoose from 'mongoose';

console.log('PaymentReminder model loading...');

// Schema for tracking payment reminders
const paymentReminderSchema = new mongoose.Schema({
    // Reference to the purchase history
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
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
let PaymentReminder;
try {
    PaymentReminder = mongoose.model('PaymentReminder');
} catch (e) {
    if (e.name === 'MissingSchemaError') {
        console.log('Creating new PaymentReminder model...');
        PaymentReminder = mongoose.model('PaymentReminder', paymentReminderSchema);
    } else {
        console.error('Error creating PaymentReminder model:', e);
        throw e;
    }
}

export default PaymentReminder;
