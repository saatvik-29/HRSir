'use client'

import React, { useState } from 'react'
import {
  Users,
  ArrowLeft,
  Search,
  Download,
  Eye,
  Mail,
  Star,
  FileText,
  Send,
  CheckSquare,
  Square,
  Loader2,
  Filter,
  TrendingUp,
  Award,
  X,
  ChevronDown,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Target,
  MessageSquare
} from 'lucide-react'

interface ParsedJobDetails {
  jobTitle?: string
  jobType?: string
  duration?: string
  skillsRequired?: string[]
  experienceRequired?: string
  basicRequirements?: string
}

const parseJobDetails = (description: string): ParsedJobDetails => {
  const details: ParsedJobDetails = {}

  if (!description || typeof description !== 'string') {
    return details
  }

  const lines = description.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  const isKeyLine = (key: string) =>
    /title|job\s*title|type|employment\s*type|duration|skills|skills\s*required|required\s*skills|experience|experience\s*required|requirements|basic\s*requirements/i.test(
      key
    )

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const [rawKey, ...rest] = line.split(':')
    if (!rest.length) continue
    const value = rest.join(':').trim()
    const key = rawKey.trim().toLowerCase()

    if (key.includes('title')) {
      details.jobTitle = value
    } else if (key.includes('type')) {
      details.jobType = value
    } else if (key.includes('duration')) {
      details.duration = value
    } else if (key.includes('skill')) {
      const parts = value.split(/,|;|\|/).map(s => s.trim()).filter(Boolean)
      details.skillsRequired = parts.length ? parts : [value]
    } else if (key.includes('experience')) {
      details.experienceRequired = value
    } else if (key.includes('requirement')) {
      let req = value
      let j = i + 1
      while (j < lines.length && !isKeyLine(lines[j].split(':')[0] || '')) {
        if (/^[-*•]/.test(lines[j])) {
          req += `\n${lines[j]}`
        }
        j++
      }
      details.basicRequirements = req
    }
  }

  return details
}

interface Resume {
  name: string
  email: string
  filename: string
  score: number
  feedback?: string
  resumeId: string
  status?: 'in-process' | 'accept' | 'reject'
}

interface Job {
  jobId: string
  description: string
  createdAt: string
  scoredResumes: Resume[]
}

interface ResumeResultsProps {
  user: { name: string }
  job: Job
  isProcessing: boolean
  onBack: () => void
  onAddMoreResumes: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const ResumeResults: React.FC<ResumeResultsProps> = ({
  user,
  job,
  isProcessing,
  onBack,
  onAddMoreResumes
}) => {
  type SortOption = 'score' | 'name' | 'email'
  type ScoreFilter = 'all' | 'high' | 'medium' | 'low'
  type StatusFilter = 'all' | 'in-process' | 'accept' | 'reject'
  type TopFilter = 'all' | 'top10' | 'top20' | 'top30' | 'top50'

  const [searchTerm, setSearchTerm] = useState('')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [topFilter, setTopFilter] = useState<TopFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [selectedResumes, setSelectedResumes] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Sending emails state
  const [isSending, setIsSending] = useState(false)
  const [emailResults, setEmailResults] = useState<{
    sent: number
    failed: number
    errors?: Array<{ name: string; email: string; resume_id: string; error: string }>
  } | null>(null)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('shortlist-default')
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  // Resume viewing and downloading state
  const [isViewingResume, setIsViewingResume] = useState(false)
  const [isDownloadingResume, setIsDownloadingResume] = useState(false)
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null)

  // Candidate analytics popup state
  const [selectedCandidate, setSelectedCandidate] = useState<Resume | null>(null)
  const [candidateAnalytics, setCandidateAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Review'
  }

  const filteredAndSortedResumes = job.scoredResumes
    .filter(resume => {
      const matchesSearch =
        resume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.filename.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesScoreFilter =
        scoreFilter === 'all' ||
        (scoreFilter === 'high' && resume.score >= 80) ||
        (scoreFilter === 'medium' && resume.score >= 60 && resume.score < 80) ||
        (scoreFilter === 'low' && resume.score < 60)

      const matchesStatusFilter =
        statusFilter === 'all' ||
        (resume.status || 'in-process') === statusFilter

      return matchesSearch && matchesScoreFilter && matchesStatusFilter
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score
      } else if (sortBy === 'email') {
        return a.email.localeCompare(b.email)
      }
      return a.name.localeCompare(b.name)
    })
    .slice(0, topFilter === 'all' ? undefined : 
      topFilter === 'top10' ? 10 :
      topFilter === 'top20' ? 20 :
      topFilter === 'top30' ? 30 : 50)

  const averageScore =
    job.scoredResumes.length > 0
      ? job.scoredResumes.reduce((sum, r) => sum + r.score, 0) / job.scoredResumes.length
      : 0

  const scoreDistribution = {
    high: job.scoredResumes.filter(r => r.score >= 80).length,
    medium: job.scoredResumes.filter(r => r.score >= 60 && r.score < 80).length,
    low: job.scoredResumes.filter(r => r.score < 60).length
  }

  // Email templates
  const emailTemplates = [
    {
      id: 'shortlist-default',
      name: 'Shortlist Notification',
      description: 'Congratulatory email for shortlisted candidates',
      subject: '🎉 Congratulations! You\'ve Been Shortlisted'
    },
    {
      id: 'rejection-polite',
      name: 'Polite Rejection',
      description: 'Professional rejection email',
      subject: 'Update on Your Application'
    },
    {
      id: 'interview-invitation',
      name: 'Interview Invitation',
      description: 'Invite candidates for an interview',
      subject: 'Interview Invitation'
    },
    {
      id: 'follow-up',
      name: 'Application Follow-up',
      description: 'Acknowledge receipt of application',
      subject: 'Thank You for Your Application'
    }
  ]

  const getTemplateName = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId)
    return template ? template.name : 'Default Template'
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

  const handleResumeSelect = (resumeId: string) => {
    const newSelected = new Set(selectedResumes)
    if (newSelected.has(resumeId)) newSelected.delete(resumeId)
    else newSelected.add(resumeId)
    setSelectedResumes(newSelected)
  }

  const handleSelectAll = () => {
    const filteredIds = new Set(filteredAndSortedResumes.map(r => r.resumeId))
    const allSelected = filteredAndSortedResumes.every(r =>
      selectedResumes.has(r.resumeId)
    )
    const newSelected = new Set(selectedResumes)
    if (allSelected) {
      filteredIds.forEach(id => newSelected.delete(id))
    } else {
      filteredIds.forEach(id => newSelected.add(id))
    }
    setSelectedResumes(newSelected)
  }

  const isAllFilteredSelected =
    filteredAndSortedResumes.length > 0 &&
    filteredAndSortedResumes.every(r => selectedResumes.has(r.resumeId))

  // Send shortlist emails via Mailjet API
  const handleSendEmails = async () => {
    if (selectedResumes.size === 0) {
      alert('Please select at least one resume to send emails.')
      return
    }

    setIsSending(true)
    setEmailResults(null)

    try {
      // Call Mailjet email API with selected template
      const response = await fetch(`${API_BASE}/send-shortlist-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          job_id: job.jobId,
          resume_ids: Array.from(selectedResumes),
          template_id: selectedEmailTemplate
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to send emails (${response.status})`)
      }

      const result = await response.json()
      setEmailResults(result)

      // Show success notification
      if (result.sent > 0) {
        alert(`✅ Successfully sent ${result.sent} shortlist email${result.sent > 1 ? 's' : ''}!`)
      }

      // Clear selections after successful send
      setSelectedResumes(new Set())
    } catch (error: unknown) {
      console.error('Email sending error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send emails'
      alert(`❌ ${errorMessage}`)
    } finally {
      setIsSending(false)
    }
  }

  // Handle opening candidate analytics popup
  const handleOpenCandidateAnalytics = async (resume: Resume) => {
    setSelectedCandidate(resume)
    setLoadingAnalytics(true)
    
    try {
      // Fetch detailed candidate analytics
      const response = await fetch(`${API_BASE}/candidate-analytics/${resume.resumeId}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCandidateAnalytics(data)
      } else {
        // If endpoint doesn't exist, use basic data
        setCandidateAnalytics({
          metadata: {
            name: resume.name,
            email: resume.email,
            filename: resume.filename,
            score: resume.score,
            status: resume.status || 'in-process'
          },
          feedback: resume.feedback || 'No detailed feedback available',
          interview_results: null
        })
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Fallback to basic data
      setCandidateAnalytics({
        metadata: {
          name: resume.name,
          email: resume.email,
          filename: resume.filename,
          score: resume.score,
          status: resume.status || 'in-process'
        },
        feedback: resume.feedback || 'No detailed feedback available',
        interview_results: null
      })
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Handle viewing resume
  const handleViewResume = async (resume: Resume) => {
    try {
      setIsViewingResume(true)
      setCurrentResumeId(resume.resumeId)

      const response = await fetch(`${API_BASE}/resume/${resume.resumeId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resume')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank')

      setTimeout(() => URL.revokeObjectURL(url), 1000)

    } catch (error) {
      console.error('Error viewing resume:', error)
      alert('Failed to view resume. Please try again.')
    } finally {
      setIsViewingResume(false)
      setCurrentResumeId(null)
    }
  }

  // Handle downloading resume
  const handleDownloadResume = async (resume: Resume) => {
    try {
      setIsDownloadingResume(true)
      setCurrentResumeId(resume.resumeId)

      const response = await fetch(`${API_BASE}/resume/${resume.resumeId}/download`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to download resume')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = resume.filename || `${resume.name}_resume.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => URL.revokeObjectURL(url), 1000)

    } catch (error) {
      console.error('Error downloading resume:', error)
      alert('Failed to download resume. Please try again.')
    } finally {
      setIsDownloadingResume(false)
      setCurrentResumeId(null)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidate Results</h1>
            <p className="text-gray-600 mt-1">Review and manage candidates for this job</p>
          </div>
        </div>
        <button
          onClick={onAddMoreResumes}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Add More Resumes</span>
        </button>
      </div>

      <div>
        {/* Email Results */}
        {emailResults && (
          <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Send className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Email Results</h3>
            </div>
            <div className="text-sm text-blue-800">
              <p>✅ Successfully sent: {emailResults.sent} emails</p>
              {emailResults.failed > 0 && (
                <p>❌ Failed to send: {emailResults.failed} emails</p>
              )}
              {emailResults.errors && emailResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc list-inside">
                    {emailResults.errors.map((err, i) => (
                      <li key={i} className="text-red-600">{err.name}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send Email Button with Template Selector */}
        {selectedResumes.size > 0 && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedResumes.size} candidate{selectedResumes.size > 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Using template: <span className="font-medium">{getTemplateName(selectedEmailTemplate)}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Template</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showTemplateSelector && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowTemplateSelector(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-medium text-gray-500 uppercase">Select Email Template</p>
                        </div>
                        {emailTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setSelectedEmailTemplate(template.id)
                              setShowTemplateSelector(false)
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              selectedEmailTemplate === template.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  selectedEmailTemplate === template.id ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {template.name}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">{template.description}</p>
                              </div>
                              {selectedEmailTemplate === template.id && (
                                <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                <button
                  onClick={handleSendEmails}
                  disabled={isSending}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Emails ({selectedResumes.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Info & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <span>{formatDate(job.createdAt)}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {(() => {
                const details = parseJobDetails(job.description || '')
                const hasAny =
                  details.jobTitle ||
                  details.jobType ||
                  details.duration ||
                  (details.skillsRequired && details.skillsRequired.length > 0) ||
                  details.experienceRequired ||
                  details.basicRequirements
                if (!hasAny) {
                  return (
                    <p className="text-gray-700 text-sm">
                      {job.description || 'No job description available'}
                    </p>
                  )
                }
                return (
                  <div className="text-sm text-gray-700 space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">Job Title</span>
                        <span className="text-gray-900 font-medium text-right">{details.jobTitle || '—'}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="text-gray-900 text-right">{details.jobType || '—'}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="text-gray-900 text-right">{details.duration || '—'}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">Skills Required</span>
                        <span className="text-gray-900 text-right">
                          {details.skillsRequired && details.skillsRequired.length > 0
                            ? (
                              <span className="flex flex-wrap gap-1 justify-end">
                                {details.skillsRequired.slice(0, 6).map((skill, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs">{skill}</span>
                                ))}
                                {details.skillsRequired.length > 6 && (
                                  <span className="text-xs text-gray-500">+{details.skillsRequired.length - 6} more</span>
                                )}
                              </span>
                            ) : '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">Experience Required</span>
                        <span className="text-gray-900 text-right">{details.experienceRequired || '—'}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">Basic Requirements</span>
                        <span className="text-gray-900 text-right whitespace-pre-wrap max-w-[60%]">{details.basicRequirements || '—'}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Resumes</span>
                <span className="font-medium">{job.scoredResumes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Score</span>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{averageScore.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected</span>
                <span className="font-medium text-green-600">{selectedResumes.size}</span>
              </div>
              {isProcessing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Filters</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setScoreFilter('high')
                  setTopFilter('top20')
                  setSortBy('score')
                }}
                className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-200 transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Top 20 Excellent</span>
                </div>
                <span className="text-sm font-bold text-green-600">{scoreDistribution.high}</span>
              </button>

              <button
                onClick={() => {
                  setScoreFilter('medium')
                  setTopFilter('top30')
                  setSortBy('score')
                }}
                className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Top 30 Good</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">{scoreDistribution.medium}</span>
              </button>

              <button
                onClick={() => {
                  setTopFilter('top50')
                  setScoreFilter('all')
                  setSortBy('score')
                }}
                className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Top 50 Overall</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{Math.min(50, job.scoredResumes.length)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Main Filter Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or filename..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Top Candidates Filter */}
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={topFilter}
                    onChange={e => setTopFilter(e.target.value as TopFilter)}
                    className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white font-medium text-sm"
                  >
                    <option value="all">All Candidates</option>
                    <option value="top10">Top 10</option>
                    <option value="top20">Top 20</option>
                    <option value="top30">Top 30</option>
                    <option value="top50">Top 50</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Score Filter */}
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={scoreFilter}
                    onChange={e => setScoreFilter(e.target.value as ScoreFilter)}
                    className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white font-medium text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">Excellent (80+)</option>
                    <option value="medium">Good (60-80)</option>
                    <option value="low">Needs Review (&lt;60)</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white font-medium text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="in-process">In Process</option>
                    <option value="accept">Accepted</option>
                    <option value="reject">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* More Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors ${
                    showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>More</span>
                </button>
              </div>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="score">Score (High to Low)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="email">Email (A-Z)</option>
                  </select>
                </div>

                {filteredAndSortedResumes.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium transition-colors"
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>Select All ({filteredAndSortedResumes.length})</span>
                  </button>
                )}

                {/* Clear Filters */}
                {(searchTerm || scoreFilter !== 'all' || statusFilter !== 'all' || topFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setScoreFilter('all')
                      setStatusFilter('all')
                      setTopFilter('all')
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-blue-900">
                  Showing {filteredAndSortedResumes.length} of {job.scoredResumes.length} candidates
                </span>
                {selectedResumes.size > 0 && (
                  <span className="text-blue-700">
                    • {selectedResumes.size} selected
                  </span>
                )}
              </div>
              {filteredAndSortedResumes.length > 0 && (
                <span className="text-blue-700">
                  Avg Score: {(filteredAndSortedResumes.reduce((sum, r) => sum + r.score, 0) / filteredAndSortedResumes.length).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSelectAll}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isAllFilteredSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span>Select</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedResumes.map((resume, idx) => (
                  <tr key={resume.resumeId || idx} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResumeSelect(resume.resumeId)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {selectedResumes.has(resume.resumeId) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td 
                      className="px-6 py-4"
                      onClick={() => handleOpenCandidateAnalytics(resume)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{resume.name}</span>
                          <BarChart3 className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{resume.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(
                            resume.score
                          )}`}
                        >
                          {resume.score.toFixed(1)}
                        </div>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(
                          resume.score
                        )}`}
                      >
                        {getScoreLabel(resume.score)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{resume.filename}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewResume(resume)
                          }}
                          disabled={isViewingResume && currentResumeId === resume.resumeId}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="View Resume"
                        >
                          {isViewingResume && currentResumeId === resume.resumeId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadResume(resume)
                          }}
                          disabled={isDownloadingResume && currentResumeId === resume.resumeId}
                          className="text-green-600 hover:text-green-800 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Download Resume"
                        >
                          {isDownloadingResume && currentResumeId === resume.resumeId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedResumes.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h3>
              <p className="text-gray-500">
                {searchTerm || scoreFilter !== 'all'
                  ? 'No resumes match your current filters.'
                  : 'No resumes have been uploaded yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Candidate Analytics Popup */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCandidate.name}</h2>
                    <p className="text-blue-100 text-sm">{selectedCandidate.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setCandidateAnalytics(null)
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                {loadingAnalytics ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading analytics...</span>
                  </div>
                ) : candidateAnalytics ? (
                  <div className="p-6 space-y-6">
                    {/* Score Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Match Score</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">
                              {selectedCandidate.score.toFixed(1)}
                            </p>
                          </div>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreColor(selectedCandidate.score)}`}>
                            <Star className="w-8 h-8" />
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">{getScoreLabel(selectedCandidate.score)}</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Status</p>
                            <p className="text-lg font-bold text-green-900 mt-1 capitalize">
                              {selectedCandidate.status || 'In Process'}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                            {selectedCandidate.status === 'accept' ? (
                              <CheckCircle className="w-6 h-6 text-green-700" />
                            ) : selectedCandidate.status === 'reject' ? (
                              <XCircle className="w-6 h-6 text-red-700" />
                            ) : (
                              <Clock className="w-6 h-6 text-yellow-700" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Resume File</p>
                            <p className="text-xs font-medium text-purple-900 mt-1 truncate max-w-[150px]">
                              {selectedCandidate.filename}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-purple-700" />
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewResume(selectedCandidate)
                            }}
                            className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadResume(selectedCandidate)
                            }}
                            className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
                          >
                            <Download className="w-3 h-3 inline mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Resume Summary / Feedback */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Resume Analysis</h3>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {candidateAnalytics.feedback || selectedCandidate.feedback || 'No detailed analysis available for this candidate.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    {candidateAnalytics.metadata && (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center space-x-2 mb-4">
                          <Briefcase className="w-5 h-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Candidate Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {candidateAnalytics.metadata.phone && (
                            <div className="flex items-start space-x-3">
                              <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{candidateAnalytics.metadata.phone}</p>
                              </div>
                            </div>
                          )}
                          {candidateAnalytics.metadata.location && (
                            <div className="flex items-start space-x-3">
                              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm font-medium text-gray-900">{candidateAnalytics.metadata.location}</p>
                              </div>
                            </div>
                          )}
                          {candidateAnalytics.metadata.experience && (
                            <div className="flex items-start space-x-3">
                              <Briefcase className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Experience</p>
                                <p className="text-sm font-medium text-gray-900">{candidateAnalytics.metadata.experience}</p>
                              </div>
                            </div>
                          )}
                          {candidateAnalytics.metadata.education && (
                            <div className="flex items-start space-x-3">
                              <GraduationCap className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Education</p>
                                <p className="text-sm font-medium text-gray-900">{candidateAnalytics.metadata.education}</p>
                              </div>
                            </div>
                          )}
                          {candidateAnalytics.metadata.skills && (
                            <div className="flex items-start space-x-3 md:col-span-2">
                              <Target className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Key Skills</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {candidateAnalytics.metadata.skills.split(',').map((skill: string, idx: number) => (
                                    <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {skill.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interview Results */}
                    {candidateAnalytics.interview_results && (
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 p-5">
                        <div className="flex items-center space-x-2 mb-4">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-lg font-semibold text-indigo-900">Interview Results</h3>
                        </div>
                        <div className="space-y-3">
                          {candidateAnalytics.interview_results.date && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm text-indigo-900">
                                <span className="font-medium">Date:</span> {new Date(candidateAnalytics.interview_results.date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {candidateAnalytics.interview_results.score && (
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm text-indigo-900">
                                <span className="font-medium">Interview Score:</span> {candidateAnalytics.interview_results.score}/100
                              </span>
                            </div>
                          )}
                          {candidateAnalytics.interview_results.feedback && (
                            <div className="mt-3 bg-white bg-opacity-50 rounded p-3">
                              <p className="text-sm text-indigo-900 whitespace-pre-wrap">
                                {candidateAnalytics.interview_results.feedback}
                              </p>
                            </div>
                          )}
                          {candidateAnalytics.interview_results.status && (
                            <div className="flex items-center space-x-2">
                              {candidateAnalytics.interview_results.status === 'passed' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              )}
                              <span className="text-sm font-medium text-indigo-900 capitalize">
                                {candidateAnalytics.interview_results.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          handleResumeSelect(selectedCandidate.resumeId)
                          setSelectedCandidate(null)
                          setCandidateAnalytics(null)
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {selectedResumes.has(selectedCandidate.resumeId) ? 'Deselect' : 'Select for Email'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCandidate(null)
                          setCandidateAnalytics(null)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumeResults
