import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISavedTermsCondition extends Document {
    userId: string;
    label: string;          // Short label for dropdown display, e.g. "Standard T&C", "Payment 50/50"
    terms: string[];        // Array of individual term items
    category: string;       // Category: 'payment', 'delivery', 'warranty', 'general', 'custom'
    isDefault: boolean;     // Whether this is the default T&C preset
    isSystemPreset: boolean; // System-provided presets vs user-created
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const SavedTermsConditionSchema = new Schema<ISavedTermsCondition>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    label: { type: String, required: true },
    terms: [{ type: String }],
    category: {
        type: String,
        enum: ['payment', 'delivery', 'warranty', 'general', 'custom'],
        default: 'general'
    },
    isDefault: { type: Boolean, default: false },
    isSystemPreset: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

SavedTermsConditionSchema.index({ userId: 1, category: 1 });
SavedTermsConditionSchema.index({ userId: 1, isDefault: -1 });

// Prevent model overwrite in development
if (mongoose.models.SavedTermsCondition) {
    delete mongoose.models.SavedTermsCondition;
}

const SavedTermsCondition: Model<ISavedTermsCondition> = mongoose.models.SavedTermsCondition || mongoose.model<ISavedTermsCondition>('SavedTermsCondition', SavedTermsConditionSchema);

export default SavedTermsCondition;
