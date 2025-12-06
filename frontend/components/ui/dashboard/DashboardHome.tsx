import React from 'react'
import {
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react'

interface Job {
  jobId: string
  description: string
  createdAt: string
  scoredResumes: Array<{
    name: string
    email: string
    filename: string
    score: number
    status?: 'in-process' | 'accept' | 'reject'
  }>
}

interface DashboardHomeProps {
  user: { name: string }
  jobs: Job[]
  onNavigateToJobs: () => void
  onCreateJob: () => void
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  jobs,
  onNavigateToJobs,
  onCreateJob
}) => {
  // Calculate statistics
  const totalJobs = jobs.length
  const totalCandidates = jobs.reduce((sum, job) => sum + job.scoredResumes.length, 0)
  const acceptedCandidates = jobs.reduce(
    (sum, job) => sum + job.scoredResumes.filter(r => r.status === 'accept').length,
    0
  )
  const inProcessCandidates = jobs.reduce(
    (sum, job) => sum + job.scoredResumes.filter(r => r.status === 'in-process' || !r.status).length,
    0
  )
  const averageScore = totalCandidates > 0
    ? jobs.reduce((sum, job) => 
        sum + job.scoredResumes.reduce((s, r) => s + r.score, 0), 0
      ) / totalCandidates
    : 0

  // Recent jobs (last 5)
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600">Here's what's happening with your recruitment today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center text-sm text-green-600 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalJobs}</h3>
          <p className="text-sm text-gray-600">Total Jobs</p>
        </div>

        {/* Total Candidates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="flex items-center text-sm text-green-600 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              8%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalCandidates}</h3>
          <p className="text-sm text-gray-600">Total Candidates</p>
        </div>

        {/* Accepted */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="flex items-center text-sm text-green-600 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              15%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{acceptedCandidates}</h3>
          <p className="text-sm text-gray-600">Accepted</p>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="flex items-center text-sm text-red-600 font-medium">
              <ArrowDownRight className="w-4 h-4" />
              3%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{averageScore.toFixed(1)}</h3>
          <p className="text-sm text-gray-600">Avg Score</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
            <button
              onClick={onNavigateToJobs}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>

          {recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={onNavigateToJobs}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {job.description.split('\n')[0].replace('Job Title:', '').trim() || 'Job Posting'}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {job.scoredResumes.length} candidates
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.scoredResumes.length > 0 && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-700">
                          {(job.scoredResumes.reduce((sum, r) => sum + r.score, 0) / job.scoredResumes.length).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-500 mb-4">Create your first job to get started</p>
              <button
                onClick={onCreateJob}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Job
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-700">In Process</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{inProcessCandidates}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">Accepted</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{acceptedCandidates}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">Success Rate</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {totalCandidates > 0 ? ((acceptedCandidates / totalCandidates) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
            <p className="text-blue-100 text-sm mb-4">Start recruiting today</p>
            <button
              onClick={onCreateJob}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Create New Job</span>
            </button>
          </div>

          {/* Activity Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            <div className="flex items-end justify-between h-32 space-x-2">
              {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
                <div key={i} className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors" style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
