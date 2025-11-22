import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'ai', 'model', 'assistant']
    },
    content: {
        type: String,
        required: true
    }
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
    }
}, {
    timestamps: true
});

// Index for faster queries
WorkspaceSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
