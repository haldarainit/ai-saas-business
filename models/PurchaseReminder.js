const mongoose = require('mongoose');

const PurchaseReminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        default: 'User'
    },
    purchaseId: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        name: String,
        sku: String,
        quantity: Number,
        unit: String,
        costPerUnit: Number,
        totalCost: Number
    }],
    supplier: {
        name: String,
        gstin: String,
        contact: String
    },
    totalValue: {
        type: Number,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paymentDate: {
        type: Date
    },
    reminderSchedule: {
        initialEmailSent: {
            type: Boolean,
            default: false
        },
        initialEmailDate: {
            type: Date
        },
        lastReminderSent: {
            type: Date
        },
        nextReminderDue: {
            type: Date
        },
        reminderCount: {
            type: Number,
            default: 0
        },
        totalRemindersSent: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Index for efficient querying of due reminders
PurchaseReminderSchema.index({ 'reminderSchedule.nextReminderDue': 1, 'reminderSchedule.isActive': 1 });
PurchaseReminderSchema.index({ userId: 1, status: 1 });

// Method to calculate next reminder date (5 days from last reminder)
PurchaseReminderSchema.methods.calculateNextReminderDate = function() {
    const lastReminder = this.reminderSchedule.lastReminderSent || this.purchaseDate;
    const nextReminder = new Date(lastReminder);
    nextReminder.setDate(nextReminder.getDate() + 5);
    return nextReminder;
};

// Method to update reminder schedule after sending email
PurchaseReminderSchema.methods.updateReminderSchedule = function() {
    this.reminderSchedule.lastReminderSent = new Date();
    this.reminderSchedule.nextReminderDue = this.calculateNextReminderDate();
    this.reminderSchedule.totalRemindersSent += 1;
    this.reminderSchedule.reminderCount = this.reminderSchedule.totalRemindersSent;
    
    // Deactivate after 10 reminders (50 days) to avoid spam
    if (this.reminderSchedule.totalRemindersSent >= 10) {
        this.reminderSchedule.isActive = false;
    }
    
    return this.save();
};

// Method to mark as paid
PurchaseReminderSchema.methods.markAsPaid = function() {
    this.isPaid = true;
    this.paymentDate = new Date();
    this.status = 'paid';
    this.reminderSchedule.isActive = false;
    return this.save();
};

module.exports = mongoose.models.PurchaseReminder || mongoose.model('PurchaseReminder', PurchaseReminderSchema);
