// server/src/routes/jobApplications.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import JobApplication from '../models/JobApplication.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { safeHandler } from '../utils/safeHandler.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

// Test endpoint to check Cloudinary URL accessibility
router.get('/test-cloudinary/:id', auth(), safeHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  console.log('Testing Cloudinary URL:', application.cvUrl);
  
  try {
    const fileBuffer = await fetchFileFromUrl(application.cvUrl);
    res.json({
      success: true,
      url: application.cvUrl,
      size: fileBuffer.length,
      filename: application.cvFileName
    });
  } catch (error) {
    console.error('Cloudinary test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      url: application.cvUrl
    });
  }
}));

// Removed unused fetchFileFromUrl function - using direct redirects now

// Configure multer for CV uploads - Cloudinary only
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

if (!useCloudinary) {
  throw new Error('Cloudinary configuration is required. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
}

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// GET /api/job-applications/my - Get user's applications
router.get('/my', auth(), safeHandler(async (req, res) => {
  const applications = await JobApplication.find({ applicant: req.user.id })
    .populate('job', 'title academy location type ageGroup')
    .populate({
      path: 'job',
      populate: {
        path: 'academy',
        select: 'name nameAr logo'
      }
    })
    .sort({ createdAt: -1 });
  
  res.json(applications);
}));

// GET /api/job-applications/check/:jobId - Check if user can apply to a job
router.get('/check/:jobId', auth(), safeHandler(async (req, res) => {
  const { jobId } = req.params;
  
  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'active') {
    return res.json({ 
      canApply: false, 
      reason: 'This job is no longer accepting applications' 
    });
  }
  
  // Check if application deadline has passed
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return res.json({ 
      canApply: false, 
      reason: 'Application deadline has passed' 
    });
  }
  
  // Check for existing applications
  const applications = await JobApplication.find({
    job: jobId,
    applicant: req.user.id
  }).sort({ createdAt: -1 });
  
  const lastApplication = applications[0];
  
  if (lastApplication) {
    if (lastApplication.status === 'pending') {
      return res.json({ 
        canApply: false, 
        reason: 'You already have a pending application for this job',
        lastApplication: {
          status: lastApplication.status,
          appliedAt: lastApplication.createdAt
        }
      });
    } else if (lastApplication.status === 'approved') {
      return res.json({ 
        canApply: false, 
        reason: 'You have already been approved for this job',
        lastApplication: {
          status: lastApplication.status,
          appliedAt: lastApplication.createdAt,
          reviewedAt: lastApplication.reviewedAt
        }
      });
    }
    // If status is 'rejected', allow them to apply again
  }
  
  return res.json({ 
    canApply: true,
    lastApplication: lastApplication ? {
      status: lastApplication.status,
      appliedAt: lastApplication.createdAt,
      reviewedAt: lastApplication.reviewedAt
    } : null
  });
}));

// GET /api/job-applications/:id/cv - Download CV
router.get('/:id/cv', auth(), safeHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id).populate('job', 'academy');
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user can access this CV
  const isOwner = application.applicant.toString() === req.user.id;
  const isAcademyMember = req.user.role === 'academy';
  const isAdmin = req.user.role === 'admin';
  
  // For academy members, check if they own the job that this application is for
  let isJobOwner = false;
  if (isAcademyMember && application.job && req.user.academyId) {
    isJobOwner = application.job.academy.toString() === req.user.academyId.toString();
  }
  
  // Debug logging
  console.log('CV Download Authorization Debug:', {
    userId: req.user.id,
    userRole: req.user.role,
    userAcademyId: req.user.academyId,
    applicationId: application._id,
    applicantId: application.applicant,
    jobAcademyId: application.job?.academy,
    isOwner,
    isAcademyMember,
    isAdmin,
    isJobOwner
  });
  
  if (!isOwner && !isJobOwner && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to view this CV' });
  }
  
  // All CVs are now stored on Cloudinary - redirect to the URL directly
  if (!application.cvUrl || !/^https?:\/\//i.test(application.cvUrl)) {
    console.error('CV URL is not a valid Cloudinary URL:', application.cvUrl);
    return res.status(404).json({ error: 'CV file not found or invalid URL' });
  }

  console.log('CV Download - Redirecting to Cloudinary URL:', application.cvUrl);
  return res.redirect(302, application.cvUrl);
}));

// GET /api/job-applications/:id/cv/view - View CV in browser
router.get('/:id/cv/view', auth(), safeHandler(async (req, res) => {
  console.log('CV View endpoint hit - Application ID:', req.params.id);
  const application = await JobApplication.findById(req.params.id).populate('job', 'academy');
  
  console.log('CV View - Full application data:', {
    id: application?._id,
    cvUrl: application?.cvUrl,
    cvFileName: application?.cvFileName,
    hasApplication: !!application
  });
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user can access this CV
  const isOwner = application.applicant.toString() === req.user.id;
  const isAcademyMember = req.user.role === 'academy';
  const isAdmin = req.user.role === 'admin';
  
  // For academy members, check if they own the job that this application is for
  let isJobOwner = false;
  if (isAcademyMember && application.job && req.user.academyId) {
    isJobOwner = application.job.academy.toString() === req.user.academyId.toString();
  }
  
  // Debug logging
  console.log('CV View Authorization Debug:', {
    userId: req.user.id,
    userRole: req.user.role,
    userAcademyId: req.user.academyId,
    applicationId: application._id,
    applicantId: application.applicant,
    jobAcademyId: application.job?.academy,
    isOwner,
    isAcademyMember,
    isAdmin,
    isJobOwner
  });
  
  if (!isOwner && !isJobOwner && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to view this CV' });
  }
  
  // All CVs are now stored on Cloudinary - redirect to the URL directly
  if (!application.cvUrl || !/^https?:\/\//i.test(application.cvUrl)) {
    console.error('CV URL is not a valid Cloudinary URL:', application.cvUrl);
    return res.status(404).json({ error: 'CV file not found or invalid URL' });
  }

  console.log('CV View - Redirecting to Cloudinary URL:', application.cvUrl);
  return res.redirect(302, application.cvUrl);
}));

// GET /api/job-applications/:id - Get specific application
router.get('/:id', auth(), safeHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id)
    .populate('job', 'title academy location type ageGroup description')
    .populate({
      path: 'job',
      populate: {
        path: 'academy',
        select: 'name nameAr logo phone'
      }
    })
    .populate('applicant', 'name email phone');
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user owns this application or is from the academy
  const isOwner = application.applicant._id.toString() === req.user.id;
  const isAcademyMember = req.user.role === 'academy' && 
    application.job.academy._id.toString() === req.user.academyId;
  
  if (!isOwner && !isAcademyMember) {
    return res.status(403).json({ error: 'Not authorized to view this application' });
  }
  
  res.json(application);
}));

// POST /api/job-applications - Create new application
router.post('/', auth(), upload.single('cv'), safeHandler(async (req, res) => {
  const { jobId, coverLetter, experience, qualifications } = req.body;
  
  if (!jobId || !coverLetter || !req.file) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'active') {
    return res.status(400).json({ error: 'This job is no longer accepting applications' });
  }
  
  // Check if application deadline has passed
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return res.status(400).json({ error: 'Application deadline has passed' });
  }
  
  // Check if user already has an application for this job
  const existingApplication = await JobApplication.findOne({
    job: jobId,
    applicant: req.user.id
  });
  
  if (existingApplication) {
    if (existingApplication.status === 'pending') {
      return res.status(400).json({ error: 'You already have a pending application for this job' });
    } else if (existingApplication.status === 'approved') {
      return res.status(400).json({ error: 'You have already been approved for this job' });
    }
    // If status is 'rejected', allow them to apply again
  }
  
  // Create CV URL (Cloudinary or local)
  let cvUrl = ''
  let originalName = req.file.originalname
  
  console.log('CV Upload Debug:', {
    originalName: originalName,
    filename: req.file.filename,
    useCloudinary: useCloudinary,
    fileSize: req.file.size
  });
  
  // Upload to Cloudinary (required)
  try {
    const result = await cloudinary.uploader.upload(req.file.buffer, {
      folder: 'dwarly/cvs',
      resource_type: 'raw',
      public_id: `cv_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    });
    
    if (result && result.secure_url) {
      cvUrl = result.secure_url;
      console.log('CV Upload - Cloudinary URL:', cvUrl);
    } else {
      throw new Error('No secure_url returned from Cloudinary');
    }
  } catch (error) {
    console.error('CV Upload - Cloudinary upload failed:', error);
    throw new Error(`Failed to upload CV to Cloudinary: ${error.message}`);
  }
  
  const application = new JobApplication({
    job: jobId,
    applicant: req.user.id,
    coverLetter,
    experience: experience || '',
    qualifications: qualifications || '',
    cvUrl,
    cvFileName: originalName
  });
  
  await application.save();
  
  console.log('CV Upload - Saved application:', {
    id: application._id,
    cvFileName: application.cvFileName,
    cvUrl: application.cvUrl
  });
  
  await application.populate('job', 'title academy location type ageGroup');
  await application.populate({
    path: 'job',
    populate: {
      path: 'academy',
      select: 'name nameAr logo'
    }
  });
  
  res.status(201).json(application);
}));

// PUT /api/job-applications/:id - Update application (applicant only)
router.put('/:id', auth(), upload.single('cv'), safeHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user owns this application
  if (application.applicant.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this application' });
  }
  
  // Check if application can still be updated (not yet reviewed)
  if (application.status !== 'pending') {
    return res.status(400).json({ error: 'Cannot update application that has been reviewed' });
  }
  
  const { coverLetter, experience, qualifications } = req.body;
  
  if (coverLetter) application.coverLetter = coverLetter;
  if (experience !== undefined) application.experience = experience;
  if (qualifications !== undefined) application.qualifications = qualifications;
  
  // Update CV if new one provided
  if (req.file) {
    // Upload new CV to Cloudinary
    try {
      const result = await cloudinary.uploader.upload(req.file.buffer, {
        folder: 'dwarly/cvs',
        resource_type: 'raw',
        public_id: `cv_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      });
      
      if (result && result.secure_url) {
        application.cvUrl = result.secure_url;
        application.cvFileName = req.file.originalname;
        console.log('CV Update - New Cloudinary URL:', result.secure_url);
      } else {
        throw new Error('No secure_url returned from Cloudinary');
      }
    } catch (error) {
      console.error('CV Update - Cloudinary upload failed:', error);
      return res.status(500).json({ error: 'Failed to upload new CV to Cloudinary. Please try again.' });
    }
  }
  
  await application.save();
  await application.populate('job', 'title academy location type ageGroup');
  await application.populate({
    path: 'job',
    populate: {
      path: 'academy',
      select: 'name nameAr logo'
    }
  });
  
  res.json(application);
}));

// DELETE /api/job-applications/:id - Delete application (applicant only)
router.delete('/:id', auth(), safeHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user owns this application
  if (application.applicant.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this application' });
  }
  
  // CV files are stored on Cloudinary - no local file deletion needed
  // Note: Cloudinary files will remain unless manually deleted from the dashboard
  
  await JobApplication.findByIdAndDelete(req.params.id);
  
  res.json({ message: 'Application deleted successfully' });
}));

export default router;