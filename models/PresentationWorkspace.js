import mongoose from 'mongoose';

// Feature card schema for feature-type slides
const FeatureCardSchema = new mongoose.Schema({
    icon: { type: String },
    title: { type: String },
    description: { type: String },
}, { _id: false });

// Comparison column schema
const ComparisonColumnSchema = new mongoose.Schema({
    heading: { type: String },
    points: [{ type: String }],
}, { _id: false });

// Metric schema for metrics-type slides
const MetricSchema = new mongoose.Schema({
    value: { type: String },
    label: { type: String },
    description: { type: String },
}, { _id: false });

// Icon list item schema (for iconList layout where content has icon+text)
const IconListItemSchema = new mongoose.Schema({
    icon: { type: String },
    text: { type: String },
}, { _id: false });

const SlideSchema = new mongoose.Schema({
    title: { type: String, required: true },
    layoutType: {
        type: String,
        enum: ['title', 'comparison', 'features', 'imageRight', 'imageLeft', 'metrics', 'iconList', 'textOnly', 'closing'],
        default: 'imageRight'
    },
    // Content can be either an array of strings or an array of icon list items
    // Using Mixed type to support both formats
    content: { type: mongoose.Schema.Types.Mixed },
    subtitle: { type: String },
    comparison: {
        left: ComparisonColumnSchema,
        right: ComparisonColumnSchema,
    },
    features: [FeatureCardSchema],
    metrics: [MetricSchema],
    hasImage: { type: Boolean, default: true },
    imageKeyword: { type: String },
    imageUrl: { type: String },
    // New fields for image upload and resize functionality
    imagePublicId: { type: String }, // Cloudinary public ID for deletion
    imageSource: {
        type: String,
        enum: ['ai', 'upload'],
        default: 'ai'
    }, // Track whether image is AI-generated or user-uploaded
    imageSize: {
        width: { type: Number }, // Custom width percentage (10-100)
        height: { type: Number }, // Custom height percentage (10-100)
        objectFit: {
            type: String,
            enum: ['cover', 'contain', 'fill', 'none'],
            default: 'cover'
        }
    },
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
