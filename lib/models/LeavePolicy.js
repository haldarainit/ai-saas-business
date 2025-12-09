import mongoose from 'mongoose';

const leaveTypeRuleSchema = new mongoose.Schema({
  code: { type: String, required: true }, // e.g. 'sick', 'casual'
  name: { type: String, required: true }, // e.g. 'Sick Leave'
  yearlyQuota: { type: Number, required: true }, // days per year
  maxConsecutiveDays: { type: Number, default: null }, // null = no limit
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
});

const leavePolicySchema = new mongoose.Schema({
  companyId: { type: String, default: 'default', index: true },
  leaveTypes: { type: [leaveTypeRuleSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

leavePolicySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const LeavePolicy = mongoose.models.LeavePolicy || mongoose.model('LeavePolicy', leavePolicySchema);

export default LeavePolicy;
