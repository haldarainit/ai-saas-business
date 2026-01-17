import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for attachments
export interface IAttachment {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    publicId?: string;
    name?: string;
    mimeType?: string;
}

// Interface for messages
export interface IMessage {
    role: string;
    content: string;
    attachments?: IAttachment[];
}

// Interface for history entries
export interface IHistoryEntry {
    code?: unknown;
    timestamp?: number;
    source?: 'ai' | 'user';
    label?: string;
    version?: string;
    messages?: IMessage[];
    userPrompt?: string;
}

// Main Workspace interface
export interface IWorkspace extends Document {
    name: string;
    subdomain?: string;
    userId: string;
    messages: IMessage[];
    fileData: Record<string, unknown>;
    history: IHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
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

const HistoryEntrySchema = new Schema<IHistoryEntry>({
    code: Schema.Types.Mixed,
    timestamp: Number,
    source: { type: String, enum: ['ai', 'user'] },
    label: String,
    version: String,
    messages: [MessageSchema],
    userPrompt: String
}, { _id: false });

const WorkspaceSchema = new Schema<IWorkspace>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    subdomain: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
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
        type: Schema.Types.Mixed,
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

const Workspace: Model<IWorkspace> = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

export default Workspace;
