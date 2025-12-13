import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
    id: String,
    type: { type: String, enum: ['text', 'list', 'table', 'heading'] },
    heading: String,
    content: String,
    items: [String],
    table: {
        id: String,
        name: String,
        columns: [{
            id: String,
            name: String,
            width: String
        }],
        rows: [{
            id: String,
            cells: { type: mongoose.Schema.Types.Mixed }
        }]
    }
}, { _id: false });

const PageSchema = new mongoose.Schema({
    id: String,
    sections: [SectionSchema]
}, { _id: false });

const TechnoQuotationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    quotationType: {
        type: String,
        enum: ['manual', 'automated', 'ai-generated'],
        default: 'manual'
    },
    companyDetails: {
        name: String,
        address1: String,
        address2: String,
        phone: String,
        logo: String,
        email: String
    },
    clientDetails: {
        name: String,
        address: String,
        contact: String
    },
    title: {
        type: String,
        default: 'New Quotation'
    },
    pages: [PageSchema],
    answers: { type: mongoose.Schema.Types.Mixed }, // Store questionnaire answers
    status: {
        type: String,
        enum: ['draft', 'finalized'],
        default: 'draft'
    }
}, {
    timestamps: true
});

export default mongoose.models.TechnoQuotation || mongoose.model('TechnoQuotation', TechnoQuotationSchema);
