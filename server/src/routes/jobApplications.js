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
import cloudinary, { deleteCloudinaryFile, extractPublicIdFromUrl } from '../utils/cloudinary.js';

const router = express.Router();


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

// Test endpoint to check Cloudinary configuration - MUST be first
router.get('/test-cloudinary-config', auth(), safeHandler(async (req, res) => {
  try {
    // Test Cloudinary configuration
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
    };
    
    console.log('Cloudinary Config Test:', config);
    
    // Test upload a small text file
    const testResult = await cloudinary.uploader.upload('data:text/plain;base64,SGVsbG8gV29ybGQ=', {
      folder: 'dwarly/test',
      resource_type: 'raw',
      public_id: `test_${Date.now()}`
    });
    
    // Test the uploaded URL immediately
    let urlTest = null;
    try {
      const testResponse = await fetch(testResult.secure_url);
      urlTest = {
        status: testResponse.status,
        ok: testResponse.ok,
        statusText: testResponse.statusText
      };
    } catch (urlError) {
      urlTest = {
        error: urlError.message
      };
    }
    
    res.json({
      success: true,
      config: config,
      testUpload: {
        url: testResult.secure_url,
        public_id: testResult.public_id
      },
      urlTest: urlTest
    });
  } catch (error) {
    console.error('Cloudinary config test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
      }
    });
  }
}));

// Test endpoint to check a specific Cloudinary URL directly
router.get('/test-direct-url', auth(), safeHandler(async (req, res) => {
  try {
    const testUrl = 'https://res.cloudinary.com/dd3fgcbgb/raw/upload/v1757800087/dwarly/cvs/cv_1757800086444_Bahgat_s_CV__1_.pdf';
    
    console.log('Testing direct URL:', testUrl);
    
    const response = await fetch(testUrl);
    
    res.json({
      success: true,
      url: testUrl,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('Direct URL test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      url: 'https://res.cloudinary.com/dd3fgcbgb/raw/upload/v1757800087/dwarly/cvs/cv_1757800086444_Bahgat_s_CV__1_.pdf'
    });
  }
}));

// Test endpoint to generate signed URL for the problematic file
router.get('/test-signed-url', auth(), safeHandler(async (req, res) => {
  try {
    const publicId = 'dwarly/cvs/cv_1757800086444_Bahgat_s_CV__1_';
    
    console.log('Generating signed URL for public_id:', publicId);
    
    // Generate signed URL
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      sign_url: true
    });
    
    console.log('Generated signed URL:', signedUrl);
    
    // Test the signed URL
    const response = await fetch(signedUrl);
    
    res.json({
      success: true,
      publicId: publicId,
      signedUrl: signedUrl,
      testResult: {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      }
    });
  } catch (error) {
    console.error('Signed URL test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// List all applications for debugging - MUST be first
router.get('/list-all', auth(), safeHandler(async (req, res) => {
  try {
    const applications = await JobApplication.find({})
      .populate('job', 'title academy')
      .populate('applicant', 'name email')
      .select('_id cvUrl cvFileName createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      count: applications.length,
      applications: applications.map(app => ({
        id: app._id,
        cvUrl: app.cvUrl,
        cvFileName: app.cvFileName,
        createdAt: app.createdAt,
        jobTitle: app.job?.title,
        applicantName: app.applicant?.name
      }))
    });
  } catch (error) {
    console.error('List applications failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Test endpoint to check specific CV URL - MUST be first
router.get('/test-cv-url/:id', auth(), safeHandler(async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    console.log('Testing CV URL:', application.cvUrl);
    
    // Test if the URL is accessible
    const response = await fetch(application.cvUrl);
    if (response.ok) {
      res.json({
        success: true,
        url: application.cvUrl,
        status: response.status,
        filename: application.cvFileName
      });
    } else {
      res.status(500).json({
        success: false,
        url: application.cvUrl,
        status: response.status,
        statusText: response.statusText,
        error: `HTTP ${response.status}: ${response.statusText}`
      });
    }
  } catch (error) {
    console.error('CV URL test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      url: application?.cvUrl || 'Unknown'
    });
  }
}));

// Test endpoint to upload a new CV and test it immediately
router.post('/test-upload-cv', auth(), upload.single('cv'), safeHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Test CV Upload - Starting...', {
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname
    });

    // Convert buffer to base64 data URI for Cloudinary
    const base64String = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64String}`;
    
    const uploadOptions = {
      folder: 'dwarly/test-cvs',
      resource_type: 'raw',
      public_id: `test_cv_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      use_filename: false,
      unique_filename: true,
      overwrite: false
    };
    
    console.log('Test CV Upload - Upload options:', uploadOptions);
    
    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);
    
    console.log('Test CV Upload - Cloudinary response:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes
    });
    
    if (result && result.secure_url) {
      // Test the URL immediately after upload
      try {
        const testResponse = await fetch(result.secure_url);
        console.log('Test CV Upload - URL test result:', {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText
        });
        
        res.json({
          success: true,
          uploadResult: {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            bytes: result.bytes
          },
          urlTest: {
            status: testResponse.status,
            ok: testResponse.ok,
            statusText: testResponse.statusText
          }
        });
      } catch (testError) {
        res.json({
          success: true,
          uploadResult: {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            bytes: result.bytes
          },
          urlTest: {
            error: testError.message
          }
        });
      }
    } else {
      throw new Error('No secure_url returned from Cloudinary');
    }
  } catch (error) {
    console.error('Test CV Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        message: error.message,
        status: error.http_code,
        name: error.name
      }
    });
  }
}));

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
  
  // All CVs are now stored on Cloudinary - generate signed URL for access
  if (!application.cvUrl || !/^https?:\/\//i.test(application.cvUrl)) {
    console.error('CV URL is not a valid Cloudinary URL:', application.cvUrl);
    return res.status(404).json({ error: 'CV file not found or invalid URL' });
  }

  try {
    // Extract public_id from the URL
    const urlParts = application.cvUrl.split('/');
    const publicId = urlParts[urlParts.length - 1].replace('.pdf', '');
    
    // Generate signed URL for secure access
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      sign_url: true
    });
    
    console.log('CV Download - Generated signed URL:', signedUrl);
    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error('CV Download - Error generating signed URL:', error);
    // Fallback to original URL
    console.log('CV Download - Fallback to original URL:', application.cvUrl);
    return res.redirect(302, application.cvUrl);
  }
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
  
  // All CVs are now stored on Cloudinary - generate signed URL for access
  if (!application.cvUrl || !/^https?:\/\//i.test(application.cvUrl)) {
    console.error('CV URL is not a valid Cloudinary URL:', application.cvUrl);
    return res.status(404).json({ error: 'CV file not found or invalid URL' });
  }

  try {
    // Extract public_id from the URL
    const urlParts = application.cvUrl.split('/');
    const publicId = urlParts[urlParts.length - 1].replace('.pdf', '');
    
    // Generate signed URL for secure access
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      sign_url: true
    });
    
    console.log('CV View - Generated signed URL:', signedUrl);
    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error('CV View - Error generating signed URL:', error);
    // Fallback to original URL
    console.log('CV View - Fallback to original URL:', application.cvUrl);
    return res.redirect(302, application.cvUrl);
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
    // Validate file buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      throw new Error('Invalid file buffer');
    }
    
    // Convert buffer to base64 data URI for Cloudinary
    const base64String = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64String}`;
    
    console.log('CV Upload - Uploading to Cloudinary...', {
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: originalName,
      bufferLength: req.file.buffer.length
    });
    
    const uploadOptions = {
      folder: 'dwarly/cvs',
      resource_type: 'raw',
      public_id: `cv_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      use_filename: false,
      unique_filename: true,
      overwrite: false
    };
    
    console.log('CV Upload - Upload options:', uploadOptions);
    
    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);
    
    console.log('CV Upload - Cloudinary response:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes
    });
    
    if (result && result.secure_url) {
      cvUrl = result.secure_url;
      console.log('CV Upload - Success! Cloudinary URL:', cvUrl);
      
      // Test the URL immediately after upload
      try {
        const testResponse = await fetch(cvUrl);
        console.log('CV Upload - URL test result:', {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText
        });
        
        if (!testResponse.ok) {
          console.warn('CV Upload - URL test failed, but upload succeeded:', testResponse.status);
        }
      } catch (testError) {
        console.warn('CV Upload - URL test error:', testError.message);
      }
    } else {
      console.error('CV Upload - No secure_url in result:', result);
      throw new Error('No secure_url returned from Cloudinary');
    }
  } catch (error) {
    console.error('CV Upload - Cloudinary upload failed:', error);
    console.error('CV Upload - Error details:', {
      message: error.message,
      status: error.http_code,
      name: error.name,
      stack: error.stack
    });
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
      // Validate file buffer
      if (!req.file.buffer || req.file.buffer.length === 0) {
        throw new Error('Invalid file buffer');
      }
      
      // Convert buffer to base64 data URI for Cloudinary
      const base64String = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64String}`;
      
      console.log('CV Update - Uploading to Cloudinary...', {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname
      });
      
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'dwarly/cvs',
        resource_type: 'raw',
        public_id: `cv_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        use_filename: false,
        unique_filename: true
      });
      
      if (result && result.secure_url) {
        application.cvUrl = result.secure_url;
        application.cvFileName = req.file.originalname;
        console.log('CV Update - Success! New Cloudinary URL:', result.secure_url);
      } else {
        throw new Error('No secure_url returned from Cloudinary');
      }
    } catch (error) {
      console.error('CV Update - Cloudinary upload failed:', error);
      return res.status(500).json({ error: `Failed to upload new CV to Cloudinary: ${error.message}` });
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

// DELETE /api/job-applications/:id/cv - Delete CV from application (applicant only)
router.delete('/:id/cv', auth(), safeHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Check if user owns this application
  if (application.applicant.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete CV from this application' });
  }
  
  // Check if CV is already deleted
  if (application.cvDeleted) {
    return res.status(400).json({ error: 'CV has already been deleted' });
  }
  
  // Check if application is already reviewed (can't delete CV after review)
  if (application.status !== 'pending') {
    return res.status(400).json({ error: 'Cannot delete CV from reviewed applications' });
  }
  
  try {
    // Delete CV from Cloudinary
    const publicId = extractPublicIdFromUrl(application.cvUrl);
    if (publicId) {
      await deleteCloudinaryFile(publicId);
      console.log('CV deleted from Cloudinary:', publicId);
    }
    
    // Update application to mark CV as deleted and remove fields from database
    application.cvDeleted = true;
    application.cvDeletedAt = new Date();
    application.cvDeletedBy = req.user.id;
    application.cvDeletionReason = 'user_removed';
    application.unset('cvUrl'); // Remove from database
    application.unset('cvFileName'); // Remove from database
    
    await application.save();
    
    res.json({ message: 'CV deleted successfully' });
  } catch (error) {
    console.error('Error deleting CV:', error);
    res.status(500).json({ error: 'Failed to delete CV' });
  }
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
  
  // Delete CV from Cloudinary if not already deleted
  if (!application.cvDeleted && application.cvUrl) {
    try {
      const publicId = extractPublicIdFromUrl(application.cvUrl);
      if (publicId) {
        await deleteCloudinaryFile(publicId);
        console.log('CV deleted from Cloudinary during application deletion:', publicId);
      }
    } catch (error) {
      console.error('Error deleting CV during application deletion:', error);
      // Continue with application deletion even if CV deletion fails
    }
  }
  
  await JobApplication.findByIdAndDelete(req.params.id);
  
  res.json({ message: 'Application deleted successfully' });
}));

export default router;