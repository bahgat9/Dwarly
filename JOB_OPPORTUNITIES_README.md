# Job Opportunities Feature

## Overview
The Job Opportunities feature allows coaches to browse and apply for coaching positions at football academies across Egypt. Academies can create job postings and manage applications through their dashboard.

## Features

### For Coaches (Public Users)
- **Browse Jobs**: View all available coaching positions with modern, responsive design
- **Search & Filter**: Search by job title, academy, or location. Filter by job type (full-time, part-time, contract, volunteer)
- **Job Details**: View comprehensive job information including:
  - Job title and description
  - Academy information with ratings
  - Location and job type
  - Age group and salary
  - Requirements and application deadline
- **Apply for Jobs**: Submit applications with:
  - Cover letter
  - Coaching experience
  - Qualifications and certifications
  - CV upload (PDF, DOC, DOCX up to 5MB)
- **Track Applications**: View application status (pending, approved, rejected)
- **Application History**: See all submitted applications in one place

### For Academies
- **Create Job Postings**: Post coaching positions with detailed requirements
- **Manage Jobs**: Edit, pause, close, or delete job postings
- **View Applications**: See all applications for each job posting
- **Review Applications**: Approve or reject applications with notes
- **Download CVs**: Access uploaded CVs from applicants

## Technical Implementation

### Frontend Components
- `JobOpportunities.jsx` - Main public page for browsing jobs
- `AcademyJobs.jsx` - Academy dashboard for managing job postings
- `JobApplicationModal` - Modal for submitting job applications
- `JobCard` - Individual job listing component
- `StatusBadge` - Application status indicator

### Backend API
- **Jobs API** (`/api/jobs`):
  - `GET /` - List all active jobs
  - `GET /:id` - Get specific job details
  - `POST /` - Create new job (academy only)
  - `PUT /:id` - Update job (academy only)
  - `DELETE /:id` - Delete job (academy only)
  - `GET /:id/applications` - Get applications for job (academy only)

- **Job Applications API** (`/api/job-applications`):
  - `GET /my` - Get user's applications
  - `GET /:id` - Get specific application
  - `POST /` - Submit new application
  - `PUT /:id` - Update application (applicant only)
  - `DELETE /:id` - Delete application (applicant only)
  - `GET /:id/cv` - Download CV file

### Database Models
- **Job Model**: Stores job postings with academy reference, requirements, and metadata
- **JobApplication Model**: Stores applications with CV references and status tracking

### File Storage
- CV files are stored in `server/uploads/cvs/` directory
- Files are served statically at `/uploads/cvs/`
- File naming uses UUID to prevent conflicts

## Usage

### For Coaches
1. Navigate to the "Find Jobs" page (replaces the old "Find Matches" page)
2. Browse available positions or use search/filter options
3. Click "Apply Now" on any job posting
4. Fill out the application form and upload your CV
5. Submit the application
6. Track your application status in the application history

### For Academies
1. Log in to your academy dashboard
2. Navigate to the "Jobs" section
3. Click "Create Job" to post a new position
4. Fill out job details and requirements
5. Publish the job posting
6. Monitor applications and review candidates
7. Approve or reject applications as needed

## Status System
- **Pending**: Application submitted, awaiting review
- **Approved**: Application accepted by academy
- **Rejected**: Application declined by academy

## Security Features
- File upload validation (type and size limits)
- Authentication required for all job management operations
- Academy ownership verification for job operations
- Application ownership verification for updates/deletions
- CV access restricted to applicants and academy members

## Future Enhancements
- Email notifications for application status changes
- Advanced filtering options (salary range, experience level)
- Application analytics and reporting
- Interview scheduling integration
- Reference checking system
- Job recommendation engine based on coach profile
