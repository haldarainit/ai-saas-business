import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'document'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        publicId: String,
        name: String,
        mimeType: String
    }]
}, { _id: false });

const HistoryEntrySchema = new mongoose.Schema({
    code: mongoose.Schema.Types.Mixed,
    timestamp: Number,
    source: { type: String, enum: ['ai', 'user'] },
    label: String,
    version: String,
    messages: [MessageSchema],
    userPrompt: String
}, { _id: false });

const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    messages: {
        type: [MessageSchema],
        default: []
    },
    fileData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    history: {
        type: [HistoryEntrySchema],
        default: []
    }
}, {
    timestamps: true
});

// Index for faster queries
WorkspaceSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
