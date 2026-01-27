
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICounter extends Document {
    userId: string;
    entity: string; // 'invoice', 'quotation', etc.
    seq: number;
}

const CounterSchema = new Schema<ICounter>({
    userId: { type: String, required: true },
    entity: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// Compound index for uniqueness per user perentity
CounterSchema.index({ userId: 1, entity: 1 }, { unique: true });

const Counter: Model<ICounter> = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

export default Counter;
