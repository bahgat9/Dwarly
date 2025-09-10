// server/src/models/Job.js
import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'volunteer'],
    required: true
  },
  ageGroup: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'paused'],
    default: 'active'
  },
  applicationDeadline: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
jobSchema.index({ academy: 1, status: 1 });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema);
