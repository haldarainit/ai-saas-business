import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for feature card
export interface IFeatureCard {
    icon?: string;
    title?: string;
    description?: string;
}

// Interface for comparison column
export interface IComparisonColumn {
    heading?: string;
    points?: string[];
}

// Interface for metric
export interface IMetric {
    value?: string;
    label?: string;
    description?: string;
}

// Interface for icon list item
export interface IIconListItem {
    icon?: string;
    text?: string;
}

// Interface for image size
export interface IImageSize {
    width?: number;
    height?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

// Interface for slide
export interface ISlide {
    title: string;
    layoutType: 'title' | 'comparison' | 'features' | 'imageRight' | 'imageLeft' | 'metrics' | 'iconList' | 'textOnly' | 'closing';
    content?: string[] | IIconListItem[];
    subtitle?: string;
    comparison?: {
        left?: IComparisonColumn;
        right?: IComparisonColumn;
    };
    features?: IFeatureCard[];
    metrics?: IMetric[];
    hasImage?: boolean;
    imageKeyword?: string;
    imageUrl?: string;
    imagePublicId?: string;
    imageSource?: 'ai' | 'upload';
    imageSize?: IImageSize;
}

// Interface for presentation data
export interface IPresentationData {
    title: string;
    slides?: ISlide[];
}

// Main PresentationWorkspace interface
export interface IPresentationWorkspace extends Document {
    name: string;
    userId: string;
    prompt: string;
    slideCount: number;
    theme: string;
    status: 'draft' | 'outline' | 'generated' | 'completed';
    outline?: IPresentationData;
    presentation?: IPresentationData;
    createdAt: Date;
    updatedAt: Date;
}

// Feature card schema for feature-type slides
const FeatureCardSchema = new Schema<IFeatureCard>({
    icon: { type: String },
    title: { type: String },
    description: { type: String },
}, { _id: false });

// Comparison column schema
const ComparisonColumnSchema = new Schema<IComparisonColumn>({
    heading: { type: String },
    points: [{ type: String }],
}, { _id: false });

// Metric schema for metrics-type slides
const MetricSchema = new Schema<IMetric>({
    value: { type: String },
    label: { type: String },
    description: { type: String },
}, { _id: false });

// Icon list item schema (for iconList layout where content has icon+text)
const IconListItemSchema = new Schema<IIconListItem>({
    icon: { type: String },
    text: { type: String },
}, { _id: false });

const SlideSchema = new Schema<ISlide>({
    title: { type: String, required: true },
    layoutType: {
        type: String,
        enum: ['title', 'comparison', 'features', 'imageRight', 'imageLeft', 'metrics', 'iconList', 'textOnly', 'closing'],
        default: 'imageRight'
    },
    // Content can be either an array of strings or an array of icon list items
    // Using Mixed type to support both formats
    content: { type: Schema.Types.Mixed },
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

const PresentationDataSchema = new Schema<IPresentationData>({
    title: { type: String, required: true },
    slides: [SlideSchema],
}, { _id: false });

const PresentationWorkspaceSchema = new Schema<IPresentationWorkspace>({
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

const PresentationWorkspace: Model<IPresentationWorkspace> = mongoose.models.PresentationWorkspace || mongoose.model<IPresentationWorkspace>('PresentationWorkspace', PresentationWorkspaceSchema);

export default PresentationWorkspace;
