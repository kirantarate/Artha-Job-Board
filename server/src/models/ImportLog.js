const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  fileName: { type: String, required: true }, // Source URL
  timestamp: { type: Date, default: Date.now },
  totalFetched: { type: Number, default: 0 },
  totalImported: { type: Number, default: 0 },
  newJobs: { type: Number, default: 0 },
  updatedJobs: { type: Number, default: 0 },
  failedJobs: { type: Number, default: 0 },
  failures: [{
    job: Object,
    reason: String,
    error: String,
  }],
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  duration: Number, // in milliseconds
});

// Explicitly set collection name to 'import_logs' as per assignment requirements
module.exports = mongoose.model('ImportLog', importLogSchema, 'import_logs');