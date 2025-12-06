'use client'

import React, { useState, useEffect, useContext, useCallback } from 'react'
import { Users, Sparkles, Shield,  Zap, Brain, Target } from 'lucide-react'
import { AuthContext } from '@/context/AuthContext'
import JobsGrid from '@/components/ui/dashboard/Jobsgrid'
import UploadResume from '@/components/ui/dashboard/UploadResume'
import ResumeResults from '@/components/ui/dashboard/ResumeResult'
import Sidebar from '@/components/ui/dashboard/Sidebar'
import Breadcrumb from '@/components/ui/dashboard/Breadcrumb'
import DashboardHome from '@/components/ui/dashboard/DashboardHome'
import EmailTemplates from '@/components/ui/dashboard/EmailTemplates'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

interface Resume {
  resumeId:        string
  name:            string
  email:           string
  filename:        string
  score:           number
  feedback?:       string
  status?:         'in-process' | 'accept' | 'reject'
}

interface Job {
  jobId: string
  description: string
  createdAt: string
  scoredResumes: Resume[]
}

type AppState = 'dashboard' | 'jobs' | 'upload' | 'results' | 'email-templates'

const HRInterviewApp = () => {
  const { user, ready } = useContext(AuthContext)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [currentState, setCurrentState] = useState<AppState>('dashboard')
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarSection, setSidebarSection] = useState('dashboard')

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    if (!user) return

    try {
      console.log('🔄 fetchJobs start')
      setLoading(true)
      const response = await fetch(`${API_BASE}/jobs`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      console.log('✅ fetchJobs got data', data)
      setJobs(data)
    } catch (error) {
      console.error('❌ fetchJobs error', error)
      setJobs([])
    } finally {
      console.log('🏁 fetchJobs done, clearing loading')
      setLoading(false)
    }
  }, [user])

  // Create new job with resumes
  const createJob = async (description: string, files: File[]) => {
    if (!user) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('description', description)
      files.forEach(file => formData.append('files', file))

      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!response.ok) throw new Error('Failed to create job')

      const newJob = await response.json()
      
      // Set the new job as selected and show processing state
      setSelectedJob(newJob)
      setCurrentState('results')
      setIsProcessing(true)
      
      // Fetch updated jobs list
      await fetchJobs()
      
      // Simulate processing time and then stop processing indicator
      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
      
      return newJob
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Error creating job. Please try again.')
      setCurrentState('jobs')
    } finally {
      setIsUploading(false)
    }
  }

  // Update existing job (description and/or add more resumes)
  const updateJob = async (jobId: string, description: string, files: File[]) => {
    if (!user || !selectedJob) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      
      // Only append description if it's different from current job description
      if (description !== selectedJob.description) {
        formData.append('description', description)
      }
      
      // Add files if any
      if (files.length > 0) {
        files.forEach(file => formData.append('files', file))
      }

      const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update job')
      }

      const updateResult = await response.json()
      console.log('✅ Job updated successfully', updateResult)

      setIsProcessing(true)
      setCurrentState('results')
      
      // Fetch updated jobs list to get the latest data
      await fetchJobs()
      
      // Simulate processing time
      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
      
      return updateResult
    } catch (error) {
      console.error('Error updating job:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Error updating job: ${(error as { message: string }).message}`)
      } else {
        alert('Error updating job.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Create job from Excel file using /jobs/excel API
  const createJobFromExcel = async (description: string, excelFile: File) => {
    if (!user) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('description', description)
      formData.append('excel_file', excelFile)

      const response = await fetch(`${API_BASE}/jobs/excel`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create job from Excel')
      }

      const newJob = await response.json()
      
      // Set the new job as selected and show processing state
      setSelectedJob(newJob)
      setCurrentState('results')
      setIsProcessing(true)
      
      // Fetch updated jobs list
      await fetchJobs()
      
      // Simulate processing time and then stop processing indicator
      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
      
      return newJob
    } catch (error) {
      console.error('Error creating job from Excel:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Error creating job from Excel: ${(error as { message: string }).message}`)
      } else {
        alert('Error creating job from Excel. Please try again.')
      }
      setCurrentState('jobs')
    } finally {
      setIsUploading(false)
    }
  }

  // Add candidates from Excel to existing job
  const addCandidatesFromExcel = async (jobId: string, description: string, excelFile: File) => {
    if (!user) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      if (description) {
        formData.append('description', description)
      }
      formData.append('excel_file', excelFile)

      const response = await fetch(`${API_BASE}/jobs/${jobId}/excel`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add candidates from Excel')
      }

      const result = await response.json()
      
      // Fetch updated jobs list
      await fetchJobs()
      
      // Update selected job
      const updatedJobs = await fetch(`${API_BASE}/jobs`, {
        credentials: 'include',
      }).then(res => res.json())
      
      const updatedJob = updatedJobs.find((j: Job) => j.jobId === jobId)
      if (updatedJob) {
        setSelectedJob(updatedJob)
      }
      
      alert(`Successfully added ${result.successCount} candidates from Excel!${result.errorCount > 0 ? ` (${result.errorCount} errors)` : ''}`)
      
      return result
    } catch (error) {
      console.error('Error adding candidates from Excel:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Error adding candidates from Excel: ${(error as { message: string }).message}`)
      } else {
        alert('Error adding candidates from Excel. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Create job from candidates data (from Excel parsing)
  const createJobFromCandidates = async (description: string, candidatesData: any[]) => {
    if (!user) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('description', description)
      formData.append('candidates_data', JSON.stringify(candidatesData))

      const response = await fetch(`${API_BASE}/jobs/candidates`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create job from candidates')
      }

      const newJob = await response.json()
      
      // Set the new job as selected and show processing state
      setSelectedJob(newJob)
      setCurrentState('results')
      setIsProcessing(true)
      
      // Fetch updated jobs list
      await fetchJobs()
      
      // Simulate processing time and then stop processing indicator
      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
      
      return newJob
    } catch (error) {
      console.error('Error creating job from candidates:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Error creating job from candidates: ${(error as { message: string }).message}`)
      } else {
        alert('Error creating job from candidates. Please try again.')
      }
      setCurrentState('jobs')
    } finally {
      setIsUploading(false)
    }
  }

  // Add candidates to existing job
  const addCandidatesToJob = async (jobId: string, description: string, candidatesData: any[]) => {
    if (!user || !selectedJob) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      
      // Only append description if it's different from current job description
      if (description !== selectedJob.description) {
        formData.append('description', description)
      }
      
      // Add candidates data
      formData.append('candidates_data', JSON.stringify(candidatesData))

      const response = await fetch(`${API_BASE}/jobs/${jobId}/candidates`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add candidates to job')
      }

      const updateResult = await response.json()
      console.log('✅ Candidates added to job successfully', updateResult)

      setIsProcessing(true)
      setCurrentState('results')
      
      // Fetch updated jobs list to get the latest data
      await fetchJobs()
      
      // Simulate processing time
      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
      
      return updateResult
    } catch (error) {
      console.error('Error adding candidates to job:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Error adding candidates to job: ${(error as { message: string }).message}`)
      } else {
        alert('Error adding candidates to job.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Handle upload submission - decides whether to create or update
  const handleUploadSubmit = async (description: string, files: File[], excelFile?: File) => {
    if (excelFile) {
      // Excel mode - use /jobs/excel API
      if (selectedJob) {
        // Add candidates from Excel to existing job
        await addCandidatesFromExcel(selectedJob.jobId, description, excelFile)
      } else {
        // Create new job from Excel file
        await createJobFromExcel(description, excelFile)
      }
    } else if (selectedJob) {
      // Update existing job with PDF files
      await updateJob(selectedJob.jobId, description, files)
    } else {
      // Create new job with PDF files
      await createJob(description, files)
    }
  }

  // Navigation handlers
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
    setCurrentState('results')
  }

  const handleNewJobClick = () => {
    setSelectedJob(null)
    setCurrentState('upload')
  }

  const handleBackToJobs = () => {
    setSelectedJob(null)
    setCurrentState('jobs')
    setIsProcessing(false)
  }

  const handleBackToDashboard = () => {
    setSelectedJob(null)
    setCurrentState('dashboard')
    setIsProcessing(false)
  }

  const handleNavigateToJobs = () => {
    setCurrentState('jobs')
    setSidebarSection('jobs')
  }

  const handleNavigateToEmailTemplates = () => {
    setCurrentState('email-templates')
    setSidebarSection('email-templates')
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!user) return

    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      // Remove job from local state
      setJobs(prevJobs => prevJobs.filter(job => job.jobId !== jobId))

      // If the deleted job was selected, go back to jobs list
      if (selectedJob?.jobId === jobId) {
        handleBackToJobs()
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      throw error
    }
  }

  const handleAddMoreResumes = () => {
    setCurrentState('upload')
  }

  useEffect(() => {
    if (ready && user) {
      fetchJobs()
    } else if (ready && !user) {
      setLoading(false)
    }
  }, [ready, user, fetchJobs])

  // Update selected job when jobs list changes
  useEffect(() => {
    if (selectedJob && jobs.length > 0) {
      const updatedJob = jobs.find(j => j.jobId === selectedJob.jobId)
      if (updatedJob) {
        setSelectedJob(updatedJob)
      }
    }
  }, [jobs, selectedJob])

  // Enhanced Loading state with modern design
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-200"></div>
          <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-400"></div>
        </div>
        
        <div className="text-center z-10 bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20 shadow-2xl">
          <div className="relative mb-8">
            {/* Multi-layer spinning loader */}
            <div className="w-20 h-20 border-4 border-white/30 rounded-full animate-spin border-t-white mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-spin border-r-blue-400 mx-auto animation-delay-150"></div>
            <div className="absolute inset-2 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-l-purple-400 mx-auto animation-delay-300"></div>
            
            {/* Floating icons */}
            <div className="absolute -top-4 -left-4 animate-bounce">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div className="absolute -top-4 -right-4 animate-bounce animation-delay-200">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce animation-delay-400">
              <Zap className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Initializing AI Portal</h3>
            <p className="text-white/80 text-lg">Preparing your intelligent interview dashboard...</p>
            
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse animation-delay-100"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse animation-delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced Authentication required with better design
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-200"></div>
          <div className="absolute bottom-32 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-400"></div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 text-center max-w-lg w-full z-10 relative overflow-hidden">
          {/* Subtle animated overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="mb-8">
              {/* Enhanced logo area with floating elements */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-xl">
                <Users className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-pulse opacity-75"></div>
                
                {/* Floating micro-animations */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                HR Interview AI Portal
              </h2>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                Experience next-generation candidate evaluation with AI-powered insights and streamlined interview management.
              </p>
            </div>
            
            {/* Enhanced feature showcase */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              <div className="flex items-center justify-center space-x-3 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Enterprise-Grade Security</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">AI-Powered Analysis</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <Target className="w-5 h-5 text-pink-400" />
                <span className="text-white font-medium">Precision Matching</span>
              </div>
            </div>
            
            {/* Call to action with enhanced styling */}
            <button
              onClick={() => (window.location.href = '/login')}
              className="group w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-2xl hover:shadow-3xl relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>Access Portal</span>
                <Zap className="w-5 h-5 group-hover:animate-pulse" />
              </span>
              
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
            
            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-white/60">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get breadcrumb items based on current state
  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; onClick?: () => void }> = [
      { label: 'Dashboard', onClick: handleBackToDashboard }
    ]
    
    if (currentState === 'jobs') {
      items.push({ label: 'Jobs' })
    } else if (currentState === 'email-templates') {
      items.push({ label: 'Email Templates' })
    } else if (currentState === 'upload') {
      if (selectedJob) {
        items.push({ label: 'Jobs', onClick: handleBackToJobs })
        items.push({ label: 'Add Resumes' })
      } else {
        items.push({ label: 'Create Job' })
      }
    } else if (currentState === 'results' && selectedJob) {
      items.push({ label: 'Jobs', onClick: handleBackToJobs })
      items.push({ label: 'Job Results' })
    }
    
    return items
  }

  // Render appropriate component based on current state
  const renderContent = () => {
    switch (currentState) {
      case 'dashboard':
        return (
          <DashboardHome
            user={user}
            jobs={jobs}
            onNavigateToJobs={handleNavigateToJobs}
            onCreateJob={handleNewJobClick}
          />
        )

      case 'jobs':
        return (
          <JobsGrid
            jobs={jobs}
            user={user}
            loading={loading}
            onJobSelect={handleJobSelect}
            onNewJobClick={handleNewJobClick}
            onDeleteJob={handleDeleteJob}
          />
        )
      
      case 'upload':
        return (
          <UploadResume
            user={user}
            selectedJob={selectedJob}
            isUploading={isUploading}
            onBack={handleBackToJobs}
            onSubmit={handleUploadSubmit}
          />
        )
      
      case 'results':
        if (!selectedJob) {
          // Fallback to jobs if no job is selected
          setCurrentState('jobs')
          return null
        }
        
        return (
          <ResumeResults
            user={user}
            job={selectedJob}
            isProcessing={isProcessing}
            onBack={handleBackToJobs}
            onAddMoreResumes={handleAddMoreResumes}
          />
        )

      case 'email-templates':
        return (
          <EmailTemplates user={user} />
        )
      
      default:
        return null
    }
  }

  // Main render with sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        currentSection={sidebarSection} 
        onSectionChange={(section) => {
          setSidebarSection(section)
          if (section === 'dashboard') {
            handleBackToDashboard()
          } else if (section === 'jobs') {
            handleNavigateToJobs()
          } else if (section === 'email-templates') {
            handleNavigateToEmailTemplates()
          }
        }}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb Bar */}
        {currentState !== 'dashboard' && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
        )}
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default HRInterviewApp