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

const router = express.Router();

// Configure multer for CV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/cvs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

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
  
  // For academy members, check if they own the job that this application is for
  let isJobOwner = false;
  if (isAcademyMember && application.job) {
    isJobOwner = application.job.academy.toString() === req.user.academyId;
  }
  
  if (!isOwner && !isJobOwner) {
    return res.status(403).json({ error: 'Not authorized to view this CV' });
  }
  
  const cvPath = path.join(__dirname, '../../uploads/cvs', path.basename(application.cvUrl));
  
  console.log('CV Download - File path:', cvPath);
  console.log('CV Download - File exists:', fs.existsSync(cvPath));
  
  if (!fs.existsSync(cvPath)) {
    console.error('CV file not found at path:', cvPath);
    return res.status(404).json({ error: 'CV file not found' });
  }
  
  // Check file stats
  try {
    const stats = fs.statSync(cvPath);
    console.log('CV Download - File size:', stats.size, 'bytes');
    console.log('CV Download - File is file:', stats.isFile());
  } catch (err) {
    console.error('Error getting file stats:', err);
    return res.status(500).json({ error: 'Error accessing CV file' });
  }
  
  // Get file extension and set appropriate MIME type
  const ext = path.extname(application.cvFileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  
  // Set headers for proper download
  res.setHeader('Content-Type', mimeType);
  
  // Properly encode the filename for Content-Disposition header
  const encodedFilename = encodeURIComponent(application.cvFileName);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}; filename="${application.cvFileName}"`);
  res.setHeader('Cache-Control', 'no-cache');
  
  console.log('CV Download - Application ID:', req.params.id);
  console.log('CV Download - Original filename:', application.cvFileName);
  console.log('CV Download - Encoded filename:', encodedFilename);
  console.log('CV Download - Content-Disposition header:', `attachment; filename*=UTF-8''${encodedFilename}; filename="${application.cvFileName}"`);
  
  // Use res.download() for more reliable file serving
  try {
    res.download(cvPath, application.cvFileName, (err) => {
      if (err) {
        console.error('Error downloading CV file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading CV file' });
        }
      } else {
        console.log('CV file downloaded successfully');
      }
    });
  } catch (err) {
    console.error('Error in res.download:', err);
    res.status(500).json({ error: 'Error downloading CV file' });
  }
}));

// GET /api/job-applications/:id/cv/view - View CV in browser
router.get('/:id/cv/view', auth(), safeHandler(async (req, res) => {
  console.log('CV View endpoint hit - Application ID:', req.params.id);
  const application = await JobApplication.findById(req.params.id).populate('job', 'academy');
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user can access this CV
  const isOwner = application.applicant.toString() === req.user.id;
  const isAcademyMember = req.user.role === 'academy';
  
  // For academy members, check if they own the job that this application is for
  let isJobOwner = false;
  if (isAcademyMember && application.job) {
    isJobOwner = application.job.academy.toString() === req.user.academyId;
  }
  
  if (!isOwner && !isJobOwner) {
    return res.status(403).json({ error: 'Not authorized to view this CV' });
  }
  
  const cvPath = path.join(__dirname, '../../uploads/cvs', path.basename(application.cvUrl));
  
  console.log('CV View - File path:', cvPath);
  console.log('CV View - File exists:', fs.existsSync(cvPath));
  
  if (!fs.existsSync(cvPath)) {
    console.error('CV file not found at path:', cvPath);
    return res.status(404).json({ error: 'CV file not found' });
  }
  
  // Get file stats
  try {
    const stats = fs.statSync(cvPath);
    console.log('CV View - File size:', stats.size, 'bytes');
  } catch (err) {
    console.error('Error getting file stats:', err);
    return res.status(500).json({ error: 'Error accessing CV file' });
  }
  
  // Get file extension and set appropriate MIME type
  const ext = path.extname(application.cvFileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  
  console.log('CV View - MIME type:', mimeType);
  console.log('CV View - Original filename:', application.cvFileName);
  
  // Set headers for viewing in browser
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${application.cvFileName}"`);
  res.setHeader('Cache-Control', 'no-cache');
  
  // Use res.sendFile for more reliable file serving
  try {
    res.sendFile(cvPath, (err) => {
      if (err) {
        console.error('Error sending CV file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error sending CV file' });
        }
      } else {
        console.log('CV file sent successfully');
      }
    });
  } catch (err) {
    console.error('Error in res.sendFile:', err);
    res.status(500).json({ error: 'Error sending CV file' });
  }
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
  
  // Create CV URL
  const cvUrl = `/uploads/cvs/${req.file.filename}`;
  
  const application = new JobApplication({
    job: jobId,
    applicant: req.user.id,
    coverLetter,
    experience: experience || '',
    qualifications: qualifications || '',
    cvUrl,
    cvFileName: req.file.originalname
  });
  
  await application.save();
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
    // Delete old CV file
    const oldCvPath = path.join(__dirname, '../../uploads/cvs', path.basename(application.cvUrl));
    if (fs.existsSync(oldCvPath)) {
      fs.unlinkSync(oldCvPath);
    }
    
    application.cvUrl = `/uploads/cvs/${req.file.filename}`;
    application.cvFileName = req.file.originalname;
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
  
  // Delete CV file
  const cvPath = path.join(__dirname, '../../uploads/cvs', path.basename(application.cvUrl));
  if (fs.existsSync(cvPath)) {
    fs.unlinkSync(cvPath);
  }
  
  await JobApplication.findByIdAndDelete(req.params.id);
  
  res.json({ message: 'Application deleted successfully' });
}));

export default router;