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
  
  const applications = await JobApplication.find({ job: req.params.id })
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
  
  // Handle CV deletion when rejecting
  if (status === 'rejected' && deleteCv && !application.cvDeleted) {
    try {
      // Delete CV from Cloudinary
      const publicId = extractPublicIdFromUrl(application.cvUrl);
      if (publicId) {
        await deleteCloudinaryFile(publicId);
        console.log('CV deleted from Cloudinary by academy:', publicId);
      }
      
      // Mark CV as deleted
      application.cvDeleted = true;
      application.cvDeletedAt = new Date();
      application.cvDeletedBy = req.user.id;
      application.cvDeletionReason = 'academy_rejected_manual';
      application.cvUrl = ''; // Clear the URL
      application.cvFileName = ''; // Clear the filename
    } catch (error) {
      console.error('Error deleting CV during rejection:', error);
      // Continue with status update even if CV deletion fails
    }
  }
  
  await application.save();
  
  res.json(application);
}));

// POST /api/jobs/:id/applications/:applicationId/schedule-cv-deletion - Schedule CV deletion for rejected application
router.post('/:id/applications/:applicationId/schedule-cv-deletion', auth(), requireRole('academy'), safeHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Check if user owns this job
  if (job.academy.toString() !== req.user.academyId) {
    return res.status(403).json({ error: 'Not authorized to schedule CV deletion for this job' });
  }
  
  const application = await JobApplication.findById(req.params.applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Only schedule deletion for rejected applications
  if (application.status !== 'rejected') {
    return res.status(400).json({ error: 'Can only schedule CV deletion for rejected applications' });
  }
  
  // Check if CV is already deleted
  if (application.cvDeleted) {
    return res.status(400).json({ error: 'CV has already been deleted' });
  }
  
  // Schedule CV deletion for 15 minutes from now
  const deletionTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  // For now, we'll just mark it for automatic deletion
  // In a production environment, you'd use a job queue like Bull or Agenda
  application.cvDeletionReason = 'academy_rejected_auto';
  application.cvDeletedAt = deletionTime;
  
  await application.save();
  
  // In a real implementation, you would schedule a job here
  // For now, we'll use setTimeout as a simple solution
  setTimeout(async () => {
    try {
      const updatedApplication = await JobApplication.findById(req.params.applicationId);
      if (updatedApplication && !updatedApplication.cvDeleted && updatedApplication.status === 'rejected') {
        // Delete CV from Cloudinary
        const publicId = extractPublicIdFromUrl(updatedApplication.cvUrl);
        if (publicId) {
          await deleteCloudinaryFile(publicId);
          console.log('CV automatically deleted from Cloudinary:', publicId);
        }
        
        // Mark CV as deleted
        updatedApplication.cvDeleted = true;
        updatedApplication.cvDeletedBy = req.user.id;
        updatedApplication.cvUrl = '';
        updatedApplication.cvFileName = '';
        
        await updatedApplication.save();
        console.log('CV automatically deleted for application:', req.params.applicationId);
      }
    } catch (error) {
      console.error('Error in automatic CV deletion:', error);
    }
  }, 15 * 60 * 1000); // 15 minutes
  
  res.json({ 
    message: 'CV deletion scheduled for 15 minutes from now',
    deletionTime: deletionTime
  });
}));

export default router;
