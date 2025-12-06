import React, { useState, useEffect } from 'react'
import { Briefcase, Clock, Code, Award, CheckCircle, FileText, Sparkles } from 'lucide-react'

export interface JobFormData {
  jobTitle: string
  jobType: string
  duration: string
  skillsRequired: string
  experienceRequired: string
  basicRequirements: string
  additionalNotes: string
}

interface JobPostingFormProps {
  initialData?: Partial<JobFormData>
  showPreview?: boolean
  onDataChange?: (data: JobFormData) => void
  className?: string
}

const JobPostingForm: React.FC<JobPostingFormProps> = ({
  initialData = {},
  showPreview = false,
  onDataChange,
  className = ''
}) => {
  const [jobTitle, setJobTitle] = useState(initialData.jobTitle || '')
  const [jobType, setJobType] = useState(initialData.jobType || '')
  const [duration, setDuration] = useState(initialData.duration || '')
  const [skillsRequired, setSkillsRequired] = useState(initialData.skillsRequired || '')
  const [experienceRequired, setExperienceRequired] = useState(initialData.experienceRequired || '')
  const [basicRequirements, setBasicRequirements] = useState(initialData.basicRequirements || '')
  const [additionalNotes, setAdditionalNotes] = useState(initialData.additionalNotes || '')
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        jobTitle,
        jobType,
        duration,
        skillsRequired,
        experienceRequired,
        basicRequirements,
        additionalNotes
      })
    }
  }, [jobTitle, jobType, duration, skillsRequired, experienceRequired, basicRequirements, additionalNotes, onDataChange])

  const isFormValid = jobTitle && jobType && skillsRequired && experienceRequired && basicRequirements

  return (
    <div className={className}>
      {/* Tabs (only show if preview is enabled) */}
      {showPreview && (
        <div className="border-b border-gray-200 bg-gray-50 -mx-6 px-6 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'form'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Job Details</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Preview</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {(!showPreview || activeTab === 'form') ? (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select job type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 6 months, Permanent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Experience */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Skills & Experience</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required <span className="text-red-500">*</span>
              </label>
              <textarea
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="e.g., JavaScript, React, Node.js, Python, SQL"
              />
              <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Separate skills with commas for better readability
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Required <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., 3-5 years, Entry level, Senior level"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Requirements & Notes</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basic Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                value={basicRequirements}
                onChange={(e) => setBasicRequirements(e.target.value)}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                placeholder="• Bachelor's degree in Computer Science or related field&#10;• Strong problem-solving skills&#10;• Excellent communication abilities&#10;• Team collaboration experience"
              />
              <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Use bullet points (•) for better formatting
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Any additional information about the role, company culture, benefits, remote work options, etc."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isFormValid ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{jobTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {jobType}
                  </span>
                  {duration && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {duration}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Code className="w-4 h-4 mr-2 text-purple-600" />
                  Skills Required
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">{skillsRequired}</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-orange-600" />
                  Experience Required
                </h4>
                <p className="text-gray-700">{experienceRequired}</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Basic Requirements
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">{basicRequirements}</p>
              </div>

              {additionalNotes && (
                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    Additional Notes
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{additionalNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h4>
              <p className="text-gray-500">Fill in the required fields to see a preview of your job posting</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JobPostingForm
export type { JobPostingFormProps }
