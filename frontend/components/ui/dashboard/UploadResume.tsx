import React, { useState } from 'react'
import {
  Upload,
  Users,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'

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

interface CandidateData {
  name: string
  email: string
  resumeLink: string
}

interface UploadResumeProps {
  user: { name: string }
  selectedJob: Job | null
  isUploading: boolean
  onBack: () => void
  onSubmit: (description: string, files: File[], candidatesData?: CandidateData[]) => Promise<void>
}

const UploadResume: React.FC<UploadResumeProps> = ({
  user,
  selectedJob,
  isUploading,
  onBack,
  onSubmit
}) => {
  // const [newJobDescription, setNewJobDescription] = useState('') // Removed unused variable
  const [jobTitle, setJobTitle] = useState('')
  const [jobType, setJobType] = useState('')
  const [duration, setDuration] = useState('')
  const [skillsRequired, setSkillsRequired] = useState('')
  const [experienceRequired, setExperienceRequired] = useState('')
  const [basicRequirements, setBasicRequirements] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadMode, setUploadMode] = useState<'pdf' | 'excel'>('pdf')
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [candidatesData, setCandidatesData] = useState<CandidateData[]>([])
  const [isProcessingExcel, setIsProcessingExcel] = useState(false)
  const [excelError, setExcelError] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFile(file)
    setExcelError('')
    setIsProcessingExcel(true)

    try {
      const data = await parseExcelFile(file)
      setCandidatesData(data)
    } catch (error) {
      setExcelError(error instanceof Error ? error.message : 'Failed to parse Excel file')
      setCandidatesData([])
    } finally {
      setIsProcessingExcel(false)
    }
  }

  const parseExcelFile = (file: File): Promise<CandidateData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row')
          }

          const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim())

          // Find column indices for required fields
          const nameIndex = findColumnIndex(headers, ['name', 'full name', 'candidate name', 'applicant name'])
          const emailIndex = findColumnIndex(headers, ['email', 'email address', 'e-mail'])
          const resumeIndex = findColumnIndex(headers, ['resume', 'resume link', 'cv', 'cv link', 'resume url', 'cv url', 'link'])

          if (nameIndex === -1) {
            throw new Error('Could not find name column. Expected headers: name, full name, candidate name, or applicant name')
          }
          if (emailIndex === -1) {
            throw new Error('Could not find email column. Expected headers: email, email address, or e-mail')
          }
          if (resumeIndex === -1) {
            throw new Error('Could not find resume link column. Expected headers: resume, resume link, cv, cv link, resume url, cv url, or link')
          }

          const candidates: CandidateData[] = []

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            const name = String(row[nameIndex] || '').trim()
            const email = String(row[emailIndex] || '').trim()
            const resumeLink = String(row[resumeIndex] || '').trim()

            if (name && email && resumeLink) {
              // Validate email format
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (!emailRegex.test(email)) {
                console.warn(`Invalid email format for ${name}: ${email}`)
                continue
              }

              candidates.push({
                name,
                email,
                resumeLink
              })
            }
          }

          if (candidates.length === 0) {
            throw new Error('No valid candidate data found. Please ensure all rows have name, email, and resume link.')
          }

          resolve(candidates)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read Excel file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name))
      if (index !== -1) return index
    }
    return -1
  }

  const downloadSampleExcel = () => {
    const sampleData = [
      ['Name', 'Email', 'Resume Link'],
      ['John Doe', 'john.doe@example.com', 'https://example.com/resumes/john-doe.pdf'],
      ['Jane Smith', 'jane.smith@example.com', 'https://example.com/resumes/jane-smith.pdf'],
      ['Mike Johnson', 'mike.johnson@example.com', 'https://example.com/resumes/mike-johnson.pdf']
    ]

    const ws = XLSX.utils.aoa_to_sheet(sampleData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates')
    XLSX.writeFile(wb, 'candidate-template.xlsx')
  }

  // Prefill from draft saved in JobsGrid modal
  React.useEffect(() => {
    if (!selectedJob) {
      try {
        const raw = localStorage.getItem('draftJobForm')
        if (raw) {
          const draft = JSON.parse(raw) as Record<string, string>
          setJobTitle(draft.jobTitle || '')
          setJobType(draft.jobType || '')
          setDuration(draft.duration || '')
          setSkillsRequired(draft.skillsRequired || '')
          setExperienceRequired(draft.experienceRequired || '')
          setBasicRequirements(draft.basicRequirements || '')
          setAdditionalNotes(draft.additionalNotes || '')
          // setNewJobDescription(draft.description || '') // Removed unused variable
          localStorage.removeItem('draftJobForm')
        }
      } catch { }
    }
  }, [selectedJob])

  const handleSubmit = async () => {
    // Validation based on upload mode
    if (uploadMode === 'pdf') {
      if (selectedFiles.length === 0) {
        alert('Please select at least one resume file')
        return
      }
    } else {
      if (candidatesData.length === 0) {
        alert('Please upload and process an Excel file with candidate data')
        return
      }
    }

    if (!selectedJob) {
      // Validate required fields for new job creation
      if (!jobTitle.trim()) {
        alert('Please enter a Job Title')
        return
      }
      if (!jobType) {
        alert('Please select a Job Type')
        return
      }
      if (!skillsRequired.trim()) {
        alert('Please enter Skills Required')
        return
      }
      if (!experienceRequired.trim()) {
        alert('Please enter Experience Required')
        return
      }
      if (!basicRequirements.trim()) {
        alert('Please enter Basic Requirements')
        return
      }
    }

    const description = selectedJob ? selectedJob.description : `Job Title: ${jobTitle}
Job Type: ${jobType}
Duration: ${duration}
Skills Required: ${skillsRequired}
Experience Required: ${experienceRequired}
Basic Requirements: ${basicRequirements}
${additionalNotes ? `\nAdditional Notes: ${additionalNotes}` : ''}`

    // Pass candidates data if using Excel mode
    const candidates = uploadMode === 'excel' ? candidatesData : undefined
    await onSubmit(description, selectedFiles, candidates)

    // Reset form
    setJobTitle('')
    setJobType('')
    setDuration('')
    setSkillsRequired('')
    setExperienceRequired('')
    setBasicRequirements('')
    setAdditionalNotes('')
    setSelectedFiles([])
    setExcelFile(null)
    setCandidatesData([])
    setExcelError('')
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>

                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type *
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select job type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 6 months, Permanent, etc."
                    />
                  </div>

                  {/* Skills Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills Required *
                    </label>
                    <textarea
                      value={skillsRequired}
                      onChange={(e) => setSkillsRequired(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., JavaScript, React, Node.js, Python, SQL"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                  </div>

                  {/* Experience Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Required *
                    </label>
                    <input
                      type="text"
                      value={experienceRequired}
                      onChange={(e) => setExperienceRequired(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3-5 years, Entry level, Senior level"
                    />
                  </div>

                  {/* Basic Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Basic Requirements *
                    </label>
                    <textarea
                      value={basicRequirements}
                      onChange={(e) => setBasicRequirements(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="• Bachelor's degree in Computer Science or related field\n• Strong problem-solving skills\n• Excellent communication abilities\n• Team collaboration experience"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use bullet points (•) for better formatting</p>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional information about the role, company culture, benefits, etc."
                    />
                  </div>
                </div>
              )}

              {/* Preview Section for New Jobs */}
              {!selectedJob && (jobTitle || jobType || skillsRequired || experienceRequired || basicRequirements) && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Job Description Preview</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                    {`Job Title: ${jobTitle}
Job Type: ${jobType}
Duration: ${duration}
Skills Required: ${skillsRequired}
Experience Required: ${experienceRequired}
Basic Requirements: ${basicRequirements}
${additionalNotes ? `\nAdditional Notes: ${additionalNotes}` : ''}`}
                  </div>
                </div>
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
                      </div>
                    )}

                    {isProcessingExcel && (
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700">Processing Excel file...</span>
                      </div>
                    )}

                    {excelError && (
                      <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700">
                          <div className="font-medium">Error processing Excel file:</div>
                          <div>{excelError}</div>
                        </div>
                      </div>
                    )}

                    {candidatesData.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Parsed Candidates ({candidatesData.length}):
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                          {candidatesData.map((candidate, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{candidate.name}</div>
                                <div className="text-gray-500 truncate">{candidate.email}</div>
                              </div>
                              <div className="ml-2 text-blue-600 truncate max-w-20">
                                <a href={candidate.resumeLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  Resume
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Excel Format Requirements:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Must contain columns: <strong>Name</strong>, <strong>Email</strong>, <strong>Resume Link</strong></li>
                        <li>• Column names can be variations (e.g., "Full Name", "Email Address", "CV Link")</li>
                        <li>• Resume links should be direct URLs to PDF files</li>
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
                    (uploadMode === 'excel' && candidatesData.length === 0)
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
                          : (selectedJob ? 'Add Candidates' : 'Process Candidates')
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