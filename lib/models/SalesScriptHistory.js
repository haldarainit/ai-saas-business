const mongoose = require('mongoose');

const SalesScriptHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  script: {
    type: String,
    required: true
  },
  formData: {
    prospectName: String,
    prospectCompany: String,
    prospectRole: String,
    yourProduct: String,
    yourCompany: String,
    keyBenefits: String,
    objectionHandling: String,
    tone: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  version: {
    type: String,
    default: 'v1.0'
  },
  label: {
    type: String,
    default: 'Generated Script'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
SalesScriptHistorySchema.index({ userId: 1, timestamp: -1 });

// Method to get next version
SalesScriptHistorySchema.statics.getNextVersion = async function(userId) {
  const lastScript = await this.findOne({ userId })
    .sort({ timestamp: -1 })
    .select('version');
  
  if (!lastScript) return 'v1.0';
  
  const currentVersion = lastScript.version || 'v1.0';
  const match = currentVersion.match(/v(\d+)\.(\d+)/);
  
  if (match) {
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    return `v${major}.${minor + 1}`;
  }
  
  return 'v1.0';
};

// Prevent model overwrite error
module.exports = mongoose.models.SalesScriptHistory || mongoose.model('SalesScriptHistory', SalesScriptHistorySchema);
