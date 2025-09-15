// server/src/routes/jobs.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import Academy from '../models/Academy.js';
import User from '../models/User.js';
import { auth, requireRole } from '../middleware/auth.js';
import { safeHandler } from '../utils/safeHandler.js';
import { deleteCloudinaryFile, extractPublicIdFromUrl } from '../utils/cloudinary.js';

const router = express.Router();

// Multer configuration removed - CV uploads now handled in jobApplications.js with Cloudinary

// GET /api/jobs - Get all active jobs
router.get('/', safeHandler(async (req, res) => {
  const { type, academy, search } = req.query;
  
  let query = { status: 'active' };
  
  if (type && type !== 'all') {
    query.type = type;
  }
  
  if (academy) {
    query.academy = academy;
  }
  
  const jobs = await Job.find(query)
    .populate('academy', 'name nameAr logo rating phone')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  
  // Filter by search term if provided
  let filteredJobs = jobs;
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filteredJobs = jobs.filter(job => 
      job.title.match(searchRegex) ||
      job.academy.name.match(searchRegex) ||
      job.location.match(searchRegex) ||
      job.description.match(searchRegex)
    );
  }
  
  res.json(filteredJobs);
}));

// GET /api/jobs/:id - Get specific job
router.get('/:id', safeHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('academy', 'name nameAr logo rating phone address')
    .populate('createdBy', 'name email phone');
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
}));

// POST /api/jobs - Create new job (academy only)
router.post('/', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    type,
    ageGroup,
    salary,
    requirements,
    applicationDeadline
  } = req.body;
  
  // Validate required fields
  if (!title || !description || !location || !type || !ageGroup) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const job = new Job({
    academy: req.user.academyId,
    title,
    description,
    location,
    type,
    ageGroup,
    salary: salary || undefined,
    requirements: requirements || [],
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
    createdBy: req.user.id
  });
  
  await job.save();
  await job.populate('academy', 'name nameAr logo rating phone');
  
  res.status(201).json(job);
}));

// PUT /api/jobs/:id - Update job (academy only)
router.put('/:id', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Check if user owns this job
  if (job.academy.toString() !== req.user.academyId) {
    return res.status(403).json({ error: 'Not authorized to update this job' });
  }
  
  const {
    title,
    description,
    location,
    type,
    ageGroup,
    salary,
    requirements,
    status,
    applicationDeadline
  } = req.body;
  
  // Update fields
  if (title) job.title = title;
  if (description) job.description = description;
  if (location) job.location = location;
  if (type) job.type = type;
  if (ageGroup) job.ageGroup = ageGroup;
  if (salary !== undefined) job.salary = salary;
  if (requirements) job.requirements = requirements;
  if (status) job.status = status;
  if (applicationDeadline) job.applicationDeadline = new Date(applicationDeadline);
  
  await job.save();
  await job.populate('academy', 'name nameAr logo rating phone');
  
  res.json(job);
}));

// DELETE /api/jobs/:id - Delete job (academy only)
router.delete('/:id', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Check if user owns this job
  if (job.academy.toString() !== req.user.academyId) {
    return res.status(403).json({ error: 'Not authorized to delete this job' });
  }
  
  // Also delete all applications for this job
  await JobApplication.deleteMany({ job: job._id });
  
  await Job.findByIdAndDelete(req.params.id);
  
  res.json({ message: 'Job deleted successfully' });
}));

// GET /api/jobs/:id/applications - Get applications for a job (academy only)
router.get('/:id/applications', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Check if user owns this job
  if (job.academy.toString() !== req.user.academyId) {
    return res.status(403).json({ error: 'Not authorized to view applications for this job' });
  }
  
  const applications = await JobApplication.find({ 
    job: req.params.id,
    hiddenFromAcademy: { $ne: true } // Filter out hidden applications
  })
    .populate('applicant', 'name email phone')
    .sort({ createdAt: -1 });
  
  res.json(applications);
}));

// PUT /api/jobs/:id/applications/:applicationId/status - Update application status
router.put('/:id/applications/:applicationId/status', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const { status, reviewNotes, deleteCv } = req.body;
  
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Check if user owns this job
  if (job.academy.toString() !== req.user.academyId) {
    return res.status(403).json({ error: 'Not authorized to update applications for this job' });
  }
  
  const application = await JobApplication.findById(req.params.applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  application.status = status;
  application.reviewedBy = req.user.id;
  application.reviewedAt = new Date();
  if (reviewNotes) application.reviewNotes = reviewNotes;
  
  // No CV deletion logic here - use the separate DELETE endpoint for complete deletion
  
  await application.save();
  
  // Log the application state for debugging
  console.log('Application after save:', {
    id: application._id,
    status: application.status,
    cvDeleted: application.cvDeleted,
    cvUrl: application.cvUrl,
    cvFileName: application.cvFileName
  });
  
  res.json(application);
}));


// DELETE /api/jobs/:id/applications/:applicationId - Delete entire application (academy only)
router.delete('/:id/applications/:applicationId', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Check if user owns this job
  if (job.academy.toString() !== req.user.academyId) {
    return res.status(403).json({ error: 'Not authorized to delete applications for this job' });
  }
  
  const application = await JobApplication.findById(req.params.applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  try {
    // Delete CV from Cloudinary if it exists
    if (application.cvUrl) {
      const publicId = extractPublicIdFromUrl(application.cvUrl);
      if (publicId) {
        await deleteCloudinaryFile(publicId);
        console.log('CV deleted from Cloudinary during application hiding:', publicId);
      }
    }
    
    // Hide application from academy and mark as rejected
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      req.params.applicationId,
      { 
        $unset: { cvUrl: "", cvFileName: "" },
        $set: {
          status: 'rejected',
          cvDeleted: true,
          cvDeletedAt: new Date(),
          cvDeletedBy: req.user.id,
          cvDeletionReason: 'academy_rejected_manual',
          hiddenFromAcademy: true,
          hiddenAt: new Date(),
          reviewedBy: req.user.id,
          reviewedAt: new Date()
        }
      },
      { new: true }
    );
    
    console.log('Application hidden from academy and marked as rejected:', req.params.applicationId);
    res.json({ message: 'Application removed from your view successfully', application: updatedApplication });
  } catch (error) {
    console.error('Error hiding application:', error);
    res.status(500).json({ error: 'Failed to remove application' });
  }
}));

export default router;
