// client/src/pages/JobOpportunities.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Plus,
  Building,
  GraduationCap,
  DollarSign,
  FileText,
  Send
} from 'lucide-react'
import { api } from '../api'
import { useLanguage } from '../context/LanguageContext'

// Job Application Status Badge Component
function StatusBadge({ status }) {
  const statusConfig = {
    pending: {
      icon: <AlertCircle className="w-4 h-4" />,
      text: "Pending",
      className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    },
    approved: {
      icon: <CheckCircle className="w-4 h-4" />,
      text: "Approved",
      className: "bg-green-500/20 text-green-300 border-green-500/30"
    },
    rejected: {
      icon: <XCircle className="w-4 h-4" />,
      text: "Rejected",
      className: "bg-red-500/20 text-red-300 border-red-500/30"
    }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${config.className}`}>
      {config.icon}
      {config.text}
    </div>
  )
}

// Job Card Component
function JobCard({ job, onApply, userApplications }) {
  // Find the most recent application for this job
  const jobApplication = userApplications?.find(app => app.job?._id === job._id)
  const applicationStatus = jobApplication?.status
  
  // User has applied if they have a pending or approved application
  // Rejected applications allow reapplication
  const hasApplied = jobApplication && (applicationStatus === 'pending' || applicationStatus === 'approved')
  const isDeadlinePassed = job.applicationDeadline && new Date() > new Date(job.applicationDeadline)
  

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-200"
    >
      {/* Academy Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden border-2 border-white/20 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex-shrink-0">
            {job.academy?.logo ? (
              <img
                src={job.academy.logo}
                alt={`${job.academy.name} Logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
              style={{ display: job.academy?.logo ? 'none' : 'flex' }}
            >
              {job.academy?.name?.charAt(0) || 'A'}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg md:text-xl font-bold text-white truncate">{job.academy?.name}</h3>
            {job.academy?.nameAr && (
              <p className="text-white/70 text-xs md:text-sm truncate">{job.academy.nameAr}</p>
            )}
            <div className="flex items-center gap-1 md:gap-2 mt-1">
              <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400 text-xs md:text-sm font-semibold">
                {job.academy?.rating || '4.5'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Application Status */}
        {hasApplied && (
          <div className="flex-shrink-0 ml-2">
            <StatusBadge status={applicationStatus} />
          </div>
        )}
      </div>

      {/* Job Details */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <h4 className="text-base md:text-lg font-semibold text-white mb-2">{job.title}</h4>
          <p className="text-white/80 text-xs md:text-sm leading-relaxed line-clamp-3">{job.description}</p>
        </div>

        {/* Job Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm">{job.type}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Users className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm">{job.ageGroup}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <DollarSign className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm truncate">{job.salary || 'Negotiable'}</span>
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-white mb-2">Requirements:</h5>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((req, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Posted Date and Deadline */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <Calendar className="w-3 h-3" />
            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
          {job.applicationDeadline && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Clock className="w-3 h-3" />
              <span>Apply by {new Date(job.applicationDeadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <div className="mt-6 pt-4 border-t border-white/10">
        {hasApplied ? (
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">You have applied for this position</p>
            <StatusBadge status={applicationStatus} />
          </div>
        ) : jobApplication && applicationStatus === 'rejected' ? (
          <div className="text-center">
            <button
              onClick={() => onApply(job)}
              className="w-full py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Rejected (Can reapply)
            </button>
          </div>
        ) : isDeadlinePassed ? (
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">Application deadline has passed</p>
            <button
              disabled
              className="w-full py-3 px-4 bg-gray-600 text-gray-400 font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Clock className="w-5 h-5" />
              Deadline Passed
            </button>
          </div>
        ) : (
          <button
            onClick={() => onApply(job)}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Briefcase className="w-5 h-5" />
            Apply Now
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Job Application Modal
function JobApplicationModal({ job, isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    coverLetter: '',
    cvFile: null,
    cvPreview: null,
    experience: '',
    qualifications: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Handle CV file upload
  const handleCvUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('CV file size must be less than 5MB')
        return
      }
      setForm(prev => ({ ...prev, cvFile: file }))
      const url = URL.createObjectURL(file)
      setForm(prev => ({ ...prev, cvPreview: url }))
    }
  }

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (form.cvPreview) {
        URL.revokeObjectURL(form.cvPreview)
      }
    }
  }, [form.cvPreview])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.coverLetter.trim()) {
      setError('Please write a cover letter')
      return
    }
    
    if (!form.cvFile) {
      setError('Please upload your CV')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('jobId', job._id)
      formData.append('coverLetter', form.coverLetter)
      formData.append('experience', form.experience)
      formData.append('qualifications', form.qualifications)
      formData.append('cv', form.cvFile)

      await api('/api/job-applications', {
        method: 'POST',
        body: formData
      })

      // Show success message
      alert('Application submitted successfully!')
      onSubmit()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Apply for Position</h2>
              <p className="text-white/70 text-sm">{job?.title} at {job?.academy?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Cover Letter *
            </label>
            <textarea
              value={form.coverLetter}
              onChange={(e) => setForm(prev => ({ ...prev, coverLetter: e.target.value }))}
              placeholder="Tell us why you're the perfect fit for this position..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              required
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Coaching Experience
            </label>
            <textarea
              value={form.experience}
              onChange={(e) => setForm(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="Describe your coaching experience and achievements..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Qualifications & Certifications
            </label>
            <textarea
              value={form.qualifications}
              onChange={(e) => setForm(prev => ({ ...prev, qualifications: e.target.value }))}
              placeholder="List your coaching licenses, certifications, and relevant qualifications..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
            />
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Upload CV *
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvUpload}
                className="hidden"
                id="cv-upload"
              />
              <label htmlFor="cv-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-white/60 mx-auto mb-2" />
                <p className="text-white/80 text-sm mb-1">
                  {form.cvFile ? form.cvFile.name : 'Click to upload your CV'}
                </p>
                <p className="text-white/60 text-xs">PDF, DOC, or DOCX (max 5MB)</p>
              </label>
            </div>
            {form.cvPreview && (
              <div className="mt-2 p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>CV uploaded successfully</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main Component
export default function JobOpportunities() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [userApplications, setUserApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  // Load jobs and user applications
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      // Always load jobs
      const jobsData = await api('/api/jobs')
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      
      // Try to load user applications, but don't fail if not authenticated
      try {
        const applicationsData = await api('/api/job-applications/my')
        setUserApplications(Array.isArray(applicationsData) ? applicationsData : [])
      } catch (authError) {
        // User is not authenticated, set empty applications
        setUserApplications([])
      }
      
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter jobs based on search and type
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchQuery === '' || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.academy?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = filterType === 'all' || job.type === filterType
      
      return matchesSearch && matchesType
    })
  }, [jobs, searchQuery, filterType])

  const handleApply = (job) => {
    // Check if application deadline has passed
    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      alert('The application deadline for this job has passed')
      return
    }
    
    setSelectedJob(job)
    setShowApplicationModal(true)
  }

  const handleApplicationSubmit = () => {
    loadData() // Refresh data to show updated application status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading job opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 px-4">
            {t("jobs.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto px-4">
            {t("jobs.subtitle")}
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 md:mb-8"
        >
          <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/60" />
                  <input
                    type="text"
                    placeholder={t("jobs.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="w-full sm:w-48 md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/60" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none text-sm md:text-base"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="all" className="bg-slate-800 text-white">{t("jobs.allTypes")}</option>
                    <option value="full-time" className="bg-slate-800 text-white">{t("jobs.fullTime")}</option>
                    <option value="part-time" className="bg-slate-800 text-white">{t("jobs.partTime")}</option>
                    <option value="contract" className="bg-slate-800 text-white">{t("jobs.contract")}</option>
                    <option value="volunteer" className="bg-slate-800 text-white">{t("jobs.volunteer")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{jobs.length}</div>
                <div className="text-blue-300 text-sm">Available Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {new Set(jobs.map(job => job.academy?._id)).size}
                </div>
                <div className="text-green-300 text-sm">Participating Academies</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{userApplications.length}</div>
                <div className="text-purple-300 text-sm">Your Applications</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Jobs Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6"
        >
          <AnimatePresence>
            {filteredJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onApply={handleApply}
                userApplications={userApplications}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No Jobs Message */}
        {filteredJobs.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-12 h-12 text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-white/70">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Check back later for new opportunities'
              }
            </p>
          </motion.div>
        )}
      </div>

      {/* Application Modal */}
      <JobApplicationModal
        job={selectedJob}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSubmit={handleApplicationSubmit}
      />
    </div>
  )
}
