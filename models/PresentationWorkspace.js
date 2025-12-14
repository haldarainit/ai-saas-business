import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: [{ type: String }],
    imageKeyword: { type: String },
    imageUrl: { type: String },
}, { _id: false });

const PresentationDataSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slides: [SlideSchema],
}, { _id: false });

const PresentationWorkspaceSchema = new mongoose.Schema({
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
    prompt: {
        type: String,
        default: ''
    },
    slideCount: {
        type: Number,
        default: 8
    },
    theme: {
        type: String,
        default: 'modern'
    },
    status: {
        type: String,
        enum: ['draft', 'outline', 'generated', 'completed'],
        default: 'draft'
    },
    outline: PresentationDataSchema,
    presentation: PresentationDataSchema,
}, {
    timestamps: true
});

// Index for faster queries
PresentationWorkspaceSchema.index({ userId: 1, createdAt: -1 });
PresentationWorkspaceSchema.index({ userId: 1, status: 1 });

export default mongoose.models.PresentationWorkspace || mongoose.model('PresentationWorkspace', PresentationWorkspaceSchema);
