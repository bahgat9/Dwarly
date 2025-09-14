// server/src/models/JobApplication.js
import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  qualifications: {
    type: String,
    trim: true
  },
  cvUrl: {
    type: String,
    required: true
  },
  cvFileName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  cvDeleted: {
    type: Boolean,
    default: false
  },
  cvDeletedAt: {
    type: Date
  },
  cvDeletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cvDeletionReason: {
    type: String,
    enum: ['user_removed', 'academy_rejected_manual', 'academy_rejected_auto'],
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
jobApplicationSchema.index({ job: 1, applicant: 1 });
jobApplicationSchema.index({ applicant: 1, status: 1 });
jobApplicationSchema.index({ status: 1, createdAt: -1 });

// Ensure one pending or approved application per job per applicant
// Rejected applications are allowed to be recreated
jobApplicationSchema.index({ job: 1, applicant: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: { $in: ['pending', 'approved'] } } 
});

export default mongoose.model('JobApplication', jobApplicationSchema);
