const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: String,
  location: String,
  description: String,
  jobType: String,
  category: String,
  url: String,
  postedDate: Date,
  sourceUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

jobSchema.index({ externalId: 1, sourceUrl: 1 });

module.exports = mongoose.model('Job', jobSchema);