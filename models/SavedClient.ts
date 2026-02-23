import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISavedClient extends Document {
    userId: string;
    name: string;           // Contact person name
    company: string;        // Company/Organization name
    designation: string;    // Designation
    address: string;        // Full address
    phone: string;          // Phone number
    email: string;          // Email address
    gstin: string;          // GSTIN if available
    notes: string;          // Any additional notes
    usageCount: number;     // Track how often this client is used
    lastUsedAt: Date;       // When this client was last used
    createdAt: Date;
    updatedAt: Date;
}

const SavedClientSchema = new Schema<ISavedClient>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: { type: String, default: '' },
    company: { type: String, default: '' },
    designation: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    gstin: { type: String, default: '' },
    notes: { type: String, default: '' },
    usageCount: { type: Number, default: 1 },
    lastUsedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound index for efficient lookups
SavedClientSchema.index({ userId: 1, company: 1 });
SavedClientSchema.index({ userId: 1, lastUsedAt: -1 });

// Prevent model overwrite in development
if (mongoose.models.SavedClient) {
    delete mongoose.models.SavedClient;
}

const SavedClient: Model<ISavedClient> = mongoose.models.SavedClient || mongoose.model<ISavedClient>('SavedClient', SavedClientSchema);

export default SavedClient;
