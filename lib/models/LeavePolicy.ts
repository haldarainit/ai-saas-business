import mongoose from 'mongoose';

// Type definitions for nested objects
export interface ILeaveTypeRule {
    code: string; // e.g. 'sick', 'casual'
    name: string; // e.g. 'Sick Leave'
    yearlyQuota: number; // days per year
    maxConsecutiveDays?: number | null; // null = no limit
    description: string;
    isActive: boolean;
}

export interface ILeavePolicy extends mongoose.Document {
    companyId: string;
    leaveTypes: ILeaveTypeRule[];
    createdAt: Date;
    updatedAt: Date;
}

const leaveTypeRuleSchema = new mongoose.Schema<ILeaveTypeRule>({
    code: { type: String, required: true }, // e.g. 'sick', 'casual'
    name: { type: String, required: true }, // e.g. 'Sick Leave'
    yearlyQuota: { type: Number, required: true }, // days per year
    maxConsecutiveDays: { type: Number, default: null }, // null = no limit
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
});

const leavePolicySchema = new mongoose.Schema<ILeavePolicy>({
    companyId: { type: String, default: 'default', index: true },
    leaveTypes: { type: [leaveTypeRuleSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

leavePolicySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const LeavePolicy = mongoose.models.LeavePolicy || mongoose.model<ILeavePolicy>('LeavePolicy', leavePolicySchema);

export default LeavePolicy;
