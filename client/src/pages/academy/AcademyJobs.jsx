// client/src/pages/academy/AcademyJobs.jsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Eye, 
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  FileText
} from 'lucide-react'
import { api } from '../../api'

// Get the API base URL (same as used in api.js)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000"

// Job Status Badge
function JobStatusBadge({ status }) {
  const statusConfig = {
    active: {
      icon: <CheckCircle className="w-4 h-4" />,
      text: "Active",
      className: "bg-green-500/20 text-green-300 border-green-500/30"
    },
    closed: {
      icon: <XCircle className="w-4 h-4" />,
      text: "Closed",
      className: "bg-red-500/20 text-red-300 border-red-500/30"
    },
    paused: {
      icon: <AlertCircle className="w-4 h-4" />,
      text: "Paused",
      className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    }
  }

  const config = statusConfig[status] || statusConfig.active

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${config.className}`}>
      {config.icon}
      {config.text}
    </div>
  )
}

// Application Status Badge
function StatusBadge({ status }) {
  const statusConfig = {
    pending: {
      icon: <Clock className="w-4 h-4" />,
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
function JobCard({ job, onEdit, onDelete, onViewApplications }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/2 rounded-3xl p-6 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      {/* Job Details */}
      <div className="space-y-3 mb-4">
        <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
          {job.description}
        </p>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="w-4 h-4" />
            <span>{job.type}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Users className="w-4 h-4" />
            <span>{job.ageGroup}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2 text-white/70">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-4 h-4" />
            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <button
          onClick={() => onViewApplications(job)}
          className="flex-1 py-2 px-3 bg-blue-500/20 text-blue-300 font-semibold rounded-xl hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Applications
        </button>
        <button
          onClick={() => onEdit(job)}
          className="p-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-xl transition-all"
          title="Edit job"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(job)}
          className="p-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-all"
          title="Delete job"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Applications Modal
function ApplicationsModal({ job, isOpen, onClose }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && job) {
      loadApplications()
    }
  }, [isOpen, job])

  async function loadApplications() {
    try {
      setLoading(true)
      setError('')
      const data = await api(`/api/jobs/${job._id}/applications`)
      setApplications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await api(`/api/jobs/${job._id}/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      loadApplications() // Refresh the list
    } catch (err) {
      console.error('Failed to update application status:', err)
      alert('Failed to update application status')
    }
  }

  const downloadCV = async (applicationId) => {
    try {
      // Open CV in browser instead of downloading to avoid corruption issues
      // Use the same base URL as API calls for consistency
      const viewUrl = `${API_BASE}/api/job-applications/${applicationId}/cv/view`
      console.log('Opening CV in browser:', viewUrl)
      
      // Open in new tab
      window.open(viewUrl, '_blank')
      
    } catch (err) {
      console.error('Failed to open CV:', err)
      alert('Failed to open CV')
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
        className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Job Applications</h2>
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

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/70">Loading applications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">⚠️</div>
              <p className="text-red-300">{error}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-white/70">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div
                  key={application._id}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {application.applicant?.name || 'Anonymous'}
                      </h3>
                      <p className="text-white/70 text-sm">
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                      {application.applicant?.email && (
                        <p className="text-white/60 text-xs mt-1">
                          {application.applicant.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={application.status} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Cover Letter */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Cover Letter</h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {application.coverLetter}
                      </p>
                    </div>

                    {/* Experience */}
                    {application.experience && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Experience</h4>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {application.experience}
                        </p>
                      </div>
                    )}

                    {/* Qualifications */}
                    {application.qualifications && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Qualifications</h4>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {application.qualifications}
                        </p>
                      </div>
                    )}

                    {/* CV Download */}
                    {application.cvUrl && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">CV</h4>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => downloadCV(application._id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            View CV
                          </button>
                          <span className="text-white/60 text-sm">
                            {application.cvFileName || 'CV File'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {application.status === 'pending' && (
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleStatusUpdate(application._id, 'approved')}
                        className="flex-1 py-2 px-4 bg-green-500/20 text-green-300 font-semibold rounded-xl hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(application._id, 'rejected')}
                        className="flex-1 py-2 px-4 bg-red-500/20 text-red-300 font-semibold rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Create/Edit Job Modal
function JobModal({ job, isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    type: 'full-time',
    ageGroup: '',
    salary: '',
    requirements: [],
    applicationDeadline: '',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [newRequirement, setNewRequirement] = useState('')

  // Initialize form when job changes
  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || '',
        description: job.description || '',
        location: job.location || '',
        type: job.type || 'full-time',
        ageGroup: job.ageGroup || '',
        salary: job.salary || '',
        requirements: job.requirements || [],
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
        status: job.status || 'active'
      })
    } else {
      setForm({
        title: '',
        description: '',
        location: '',
        type: 'full-time',
        ageGroup: '',
        salary: '',
        requirements: [],
        applicationDeadline: '',
        status: 'active'
      })
    }
  }, [job])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.title || !form.description || !form.location || !form.ageGroup) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : undefined
      }

      if (job) {
        await api(`/api/jobs/${job._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      } else {
        await api('/api/jobs', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }

      onSubmit()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save job')
    } finally {
      setSubmitting(false)
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
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
        className="w-full max-w-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {job ? 'Edit Job' : 'Create New Job'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Youth Coach, Head Coach, Assistant Coach"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Job Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              required
            />
          </div>

          {/* Location and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Location *
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Cairo, Giza, Alexandria"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Job Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                style={{ colorScheme: 'dark' }}
                required
              >
                <option value="full-time" className="bg-slate-800 text-white">Full-time</option>
                <option value="part-time" className="bg-slate-800 text-white">Part-time</option>
                <option value="contract" className="bg-slate-800 text-white">Contract</option>
                <option value="volunteer" className="bg-slate-800 text-white">Volunteer</option>
              </select>
            </div>
          </div>

          {/* Age Group and Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Age Group *
              </label>
              <input
                type="text"
                value={form.ageGroup}
                onChange={(e) => setForm(prev => ({ ...prev, ageGroup: e.target.value }))}
                placeholder="e.g., U12-U16, Youth, Senior"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Salary
              </label>
              <input
                type="text"
                value={form.salary}
                onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="e.g., 5000-8000 EGP, Negotiable"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Requirements
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
                >
                  Add
                </button>
              </div>
              {form.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.requirements.map((req, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-sm"
                    >
                      {req}
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-white/60 hover:text-white"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Application Deadline and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={form.applicationDeadline}
                onChange={(e) => setForm(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                style={{ colorScheme: 'dark' }}
              >
                <option value="active" className="bg-slate-800 text-white">Active</option>
                <option value="paused" className="bg-slate-800 text-white">Paused</option>
                <option value="closed" className="bg-slate-800 text-white">Closed</option>
              </select>
            </div>
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
                  Saving...
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  {job ? 'Update Job' : 'Create Job'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Main Component
export default function AcademyJobs({ session }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedJobForApplications, setSelectedJobForApplications] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    try {
      setLoading(true)
      const data = await api('/api/jobs')
      setJobs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const handleCreateJob = () => {
    setSelectedJob(null)
    setShowJobModal(true)
  }

  const handleEditJob = (job) => {
    setSelectedJob(job)
    setShowJobModal(true)
  }

  const handleDeleteJob = async (job) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return
    
    try {
      await api(`/api/jobs/${job._id}`, { method: 'DELETE' })
      await loadJobs()
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('Failed to delete job. Please try again.')
    }
  }

  const handleViewApplications = (job) => {
    setSelectedJobForApplications(job)
    setShowApplicationsModal(true)
  }

  const handleJobSubmit = () => {
    loadJobs()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading jobs...</p>
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Management</h1>
            <p className="text-white/70">Create and manage coaching job postings</p>
          </div>
          <button
            onClick={handleCreateJob}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Job
          </button>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="all" className="bg-slate-800 text-white">All Status</option>
                    <option value="active" className="bg-slate-800 text-white">Active</option>
                    <option value="paused" className="bg-slate-800 text-white">Paused</option>
                    <option value="closed" className="bg-slate-800 text-white">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Jobs Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filteredJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onViewApplications={handleViewApplications}
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
            <p className="text-white/70 mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first job posting to get started'
              }
            </p>
            {(!searchQuery && filterStatus === 'all') && (
              <button
                onClick={handleCreateJob}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Create Your First Job
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Job Modal */}
      <JobModal
        job={selectedJob}
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        onSubmit={handleJobSubmit}
      />

      {/* Applications Modal */}
      <ApplicationsModal
        job={selectedJobForApplications}
        isOpen={showApplicationsModal}
        onClose={() => setShowApplicationsModal(false)}
      />
    </div>
  )
}
