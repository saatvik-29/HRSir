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
  Loader2
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
  type SortOption = 'score' | 'name'
  type ScoreFilter = 'all' | 'high' | 'medium' | 'low'

  const [searchTerm, setSearchTerm] = useState('')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [selectedResumes, setSelectedResumes] = useState<Set<string>>(new Set())

  // Sending emails state
  const [isSending, setIsSending] = useState(false)
  const [emailResults, setEmailResults] = useState<{
    sent: number
    failed: number
    errors?: Array<{ name: string; email: string; resume_id: string; error: string }>
  } | null>(null)

  // Resume viewing and downloading state
  const [isViewingResume, setIsViewingResume] = useState(false)
  const [isDownloadingResume, setIsDownloadingResume] = useState(false)
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null)

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
        resume.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesScoreFilter =
        scoreFilter === 'all' ||
        (scoreFilter === 'high' && resume.score >= 80) ||
        (scoreFilter === 'medium' && resume.score >= 60 && resume.score < 80) ||
        (scoreFilter === 'low' && resume.score < 60)

      return matchesSearch && matchesScoreFilter
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score
      }
      return a.name.localeCompare(b.name)
    })

  const averageScore =
    job.scoredResumes.length > 0
      ? job.scoredResumes.reduce((sum, r) => sum + r.score, 0) / job.scoredResumes.length
      : 0

  const scoreDistribution = {
    high: job.scoredResumes.filter(r => r.score >= 80).length,
    medium: job.scoredResumes.filter(r => r.score >= 60 && r.score < 80).length,
    low: job.scoredResumes.filter(r => r.score < 60).length
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
      // Call Mailjet email API
      const response = await fetch(`${API_BASE}/send-shortlist-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          job_id: job.jobId,
          resume_ids: Array.from(selectedResumes)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">HireHelper</h1>
                  <p className="text-sm text-gray-500">Welcome, {user.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onAddMoreResumes}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Add More Resumes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Send Email Button */}
        {selectedResumes.size > 0 && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedResumes.size} candidate{selectedResumes.size > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={handleSendEmails}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Shortlist Emails ({selectedResumes.size})</span>
                </>
              )}
            </button>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Excellent (80+)</span>
                <span className="font-medium">{scoreDistribution.high}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-600">Good (60-80)</span>
                <span className="font-medium">{scoreDistribution.medium}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600">Needs Review (&lt;60)</span>
                <span className="font-medium">{scoreDistribution.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={scoreFilter}
                onChange={e => setScoreFilter(e.target.value as ScoreFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Scores</option>
                <option value="high">Excellent (80+)</option>
                <option value="medium">Good (60-80)</option>
                <option value="low">Needs Review (&lt;60)</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="score">Resume Score</option>
                  <option value="name">Name</option>
                </select>
              </div>
              {filteredAndSortedResumes.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  {isAllFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Select All Filtered</span>
                </button>
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
                  <tr key={resume.resumeId || idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleResumeSelect(resume.resumeId)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {selectedResumes.has(resume.resumeId) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{resume.name}</div>
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
                          onClick={() => handleViewResume(resume)}
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
                          onClick={() => handleDownloadResume(resume)}
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
      </div>
    </div>
  )
}

export default ResumeResults
