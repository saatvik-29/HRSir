import React, { useState } from 'react'
import { Job } from '@/types/types'
import {
  FileText,
  Users,
  Calendar,
  Star,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Eye
} from 'lucide-react'

// interface Job {
//   jobId: string
//   description: string
//   createdAt: string
//   scoredResumes: Array<{
//     name: string
//     email: string
//     filename: string
//     score: number
//   }>
// }

interface JobsGridProps {
  jobs: Job[]
  user: { name: string }
  loading: boolean
  onJobSelect: (job: Job) => void
  onNewJobClick: () => void
  onDeleteJob?: (jobId: string) => Promise<void>
}

const JobsGrid: React.FC<JobsGridProps> = ({ 
  jobs, 
  user, 
  loading, 
  onJobSelect, 
  onNewJobClick,
  onDeleteJob
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filteredJobs = jobs.filter(job =>
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const handleDeleteClick = async (jobId: string) => {
    if (!onDeleteJob) return
    
    setDeletingJobId(jobId)
    try {
      await onDeleteJob(jobId)
      setShowDeleteConfirm(null)
      setOpenDropdown(null)
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('Failed to delete job. Please try again.')
    } finally {
      setDeletingJobId(null)
    }
  }

  const toggleDropdown = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(openDropdown === jobId ? null : jobId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">HireHelper</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            <button
              onClick={onNewJobClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search job descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.jobId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer relative group"
                onClick={() => onJobSelect(job)}
              >
                <div className="p-6">
                  {/* Header with dropdown */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 block truncate">
                          {job.description.split('\n')[0].replace('Job Title:', '').trim() || 'Job Posting'}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleDropdown(job.jobId, e)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      {openDropdown === job.jobId && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenDropdown(null)
                                onJobSelect(job)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            {onDeleteJob && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowDeleteConfirm(job.jobId)
                                  setOpenDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Job</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Job Description Preview */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {job.description.split('\n').slice(1).join(' ').substring(0, 120)}...
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{job.scoredResumes.length}</span>
                      </div>
                      {job.scoredResumes.length > 0 && (
                        <div className="flex items-center space-x-1.5">
                          <div className="w-6 h-6 bg-yellow-50 rounded-full flex items-center justify-center">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(job.scoredResumes.reduce((sum, r) => sum + r.score, 0) / job.scoredResumes.length).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No jobs match your search criteria.' : 'Get started by creating your first job posting.'}
            </p>
            <button
              onClick={onNewJobClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create New Job
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Job</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job posting? All associated resumes and data will be permanently removed.
            </p>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingJobId === showDeleteConfirm}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClick(showDeleteConfirm)}
                disabled={deletingJobId === showDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deletingJobId === showDeleteConfirm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobsGrid