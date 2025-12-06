import React, { useState } from 'react'
import {
  Upload,
  Users,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react'
import JobPostingForm from './JobPostingForm'

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

  // Safety check: if description is undefined or null, return empty details
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
interface Job {
  jobId: string
  description: string
  createdAt: string
  scoredResumes: Array<{
    name: string
    email: string
    filename: string
    score: number
  }>
}

interface UploadResumeProps {
  user: { name: string }
  selectedJob: Job | null
  isUploading: boolean
  onBack: () => void
  onSubmit: (description: string, files: File[], excelFile?: File) => Promise<void>
}

const UploadResume: React.FC<UploadResumeProps> = ({
  user,
  selectedJob,
  isUploading,
  onBack,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobType: '',
    duration: '',
    skillsRequired: '',
    experienceRequired: '',
    basicRequirements: '',
    additionalNotes: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadMode, setUploadMode] = useState<'pdf' | 'excel'>('pdf')
  const [excelFile, setExcelFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleExcelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelFile(file)
  }

  const downloadSampleExcel = () => {
    // Create a simple CSV-like content for download
    const csvContent = `Name,Email,Drive Link
John Doe,john.doe@example.com,https://drive.google.com/file/d/YOUR_FILE_ID_1/view
Jane Smith,jane.smith@example.com,https://drive.google.com/file/d/YOUR_FILE_ID_2/view
Mike Johnson,mike.johnson@example.com,https://drive.google.com/file/d/YOUR_FILE_ID_3/view`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'candidate-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // No need for draft logic anymore - users come directly to this page

  const handleSubmit = async () => {
    // Validation based on upload mode
    if (uploadMode === 'pdf') {
      if (selectedFiles.length === 0) {
        alert('Please select at least one resume file')
        return
      }
    } else {
      if (!excelFile) {
        alert('Please upload an Excel file with candidate data')
        return
      }
    }

    if (!selectedJob) {
      // Validate required fields for new job creation
      if (!formData.jobTitle.trim()) {
        alert('Please enter a Job Title')
        return
      }
      if (!formData.jobType) {
        alert('Please select a Job Type')
        return
      }
      if (!formData.skillsRequired.trim()) {
        alert('Please enter Skills Required')
        return
      }
      if (!formData.experienceRequired.trim()) {
        alert('Please enter Experience Required')
        return
      }
      if (!formData.basicRequirements.trim()) {
        alert('Please enter Basic Requirements')
        return
      }
    }

    const description = selectedJob ? selectedJob.description : `Job Title: ${formData.jobTitle}
Job Type: ${formData.jobType}
Duration: ${formData.duration}
Skills Required: ${formData.skillsRequired}
Experience Required: ${formData.experienceRequired}
Basic Requirements: ${formData.basicRequirements}
${formData.additionalNotes ? `\nAdditional Notes: ${formData.additionalNotes}` : ''}`

    // Pass Excel file if using Excel mode
    const excelFileToUpload = uploadMode === 'excel' && excelFile ? excelFile : undefined
    await onSubmit(description, selectedFiles, excelFileToUpload)

    // Reset form
    setFormData({
      jobTitle: '',
      jobType: '',
      duration: '',
      skillsRequired: '',
      experienceRequired: '',
      basicRequirements: '',
      additionalNotes: ''
    })
    setSelectedFiles([])
    setExcelFile(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedJob ? 'Add More Resumes' : 'Create New Job'}
            </h1>
            <p className="text-gray-600 mt-1">
              {selectedJob ? 'Upload additional candidates to this job' : 'Fill in job details and upload candidate resumes'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Description Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedJob ? 'Job Description' : 'Create New Job'}
              </h2>

              {selectedJob ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      const details = parseJobDetails(selectedJob.description || '')
                      const hasAny =
                        details.jobTitle ||
                        details.jobType ||
                        details.duration ||
                        (details.skillsRequired && details.skillsRequired.length > 0) ||
                        details.experienceRequired ||
                        details.basicRequirements
                      if (!hasAny) {
                        return (
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                        )
                      }
                      return (
                        <div className="text-sm text-gray-700 space-y-2">
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

                  {selectedJob.scoredResumes.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Scored Resumes ({selectedJob.scoredResumes.length})</h3>
                      <div className="space-y-2">
                        {selectedJob.scoredResumes.map((resume, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{resume.name}</p>
                              <p className="text-sm text-gray-500">{resume.email}</p>
                              <p className="text-xs text-gray-400">{resume.filename}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(resume.score)}`}>
                              {resume.score.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <JobPostingForm
                  initialData={formData}
                  showPreview={false}
                  onDataChange={setFormData}
                />
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Resume Data</h3>
              <p className="text-sm text-gray-600 mb-6">
                {selectedJob ? 'Add more resumes to this job' : 'Upload resumes or candidate data to get started'}
              </p>

              {/* Upload Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('pdf')}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${uploadMode === 'pdf'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <FileText className="w-5 h-5 mb-2" />
                    <div className="font-medium text-sm">PDF Files</div>
                    <div className="text-xs text-gray-500">Upload individual resume PDFs</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('excel')}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${uploadMode === 'excel'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mb-2" />
                    <div className="font-medium text-sm">Excel File</div>
                    <div className="text-xs text-gray-500">Upload candidate data from job sites</div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {uploadMode === 'pdf' ? (
                  <>
                    {/* PDF Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Resume Files
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </div>
                        <div className="text-xs text-gray-500">
                          PDF files only, max 100 resumes
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length}):</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">PDF Upload Notes:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Ensure resume files are in PDF format</li>
                        <li>• Maximum 100 resumes per upload</li>
                        <li>• Files will be automatically scored against the job description</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Excel Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Upload Excel File
                        </label>
                        <button
                          type="button"
                          onClick={downloadSampleExcel}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Template</span>
                        </button>
                      </div>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Click to upload Excel file with candidate data
                        </div>
                        <div className="text-xs text-gray-500">
                          .xlsx or .xls files only
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {excelFile && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Excel File:</p>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700 truncate">{excelFile.name}</span>
                          <span className="text-xs text-gray-500">{(excelFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          File will be processed on the server after upload
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Excel Format Requirements:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Must contain columns: <strong>name</strong>, <strong>email</strong>, <strong>drive</strong></li>
                        <li>• Column names can be variations (e.g., "candidate_name", "email_address", "driveUrl")</li>
                        <li>• Drive links should be Google Drive URLs with public access</li>
                        <li>• Format: https://drive.google.com/file/d/FILE_ID/view</li>
                        <li>• All rows must have valid data in all three columns</li>
                      </ul>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isUploading ||
                    (uploadMode === 'pdf' && selectedFiles.length === 0) ||
                    (uploadMode === 'excel' && !excelFile)
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadMode === 'pdf'
                          ? (selectedJob ? 'Add Resumes' : 'Upload & Process')
                          : (selectedJob ? 'Add Candidates from Excel' : 'Upload & Process Excel')
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadResume