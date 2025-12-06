import React, { useState, useRef } from 'react'
import {
  Mail,
  Edit,
  Eye,
  Save,
  X,
  Check,
  Copy,
  Sparkles,
  FileText,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
  RotateCcw
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  category: 'shortlist' | 'rejection' | 'interview' | 'custom'
  content: string
  variables: string[]
}

interface EmailTemplatesProps {
  user: { name: string }
}

const EmailTemplates: React.FC<EmailTemplatesProps> = ({ user }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [editedSubject, setEditedSubject] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Default templates based on the email_route_resend.py
  const defaultTemplates: EmailTemplate[] = [
    {
      id: 'shortlist-default',
      name: 'Shortlist Notification',
      subject: '🎉 Congratulations! You\'ve Been Shortlisted',
      description: 'Send to candidates who have been shortlisted for the position',
      category: 'shortlist',
      variables: ['{{candidate_name}}', '{{company_name}}', '{{interview_link}}'],
      content: `Dear {{candidate_name}},

We are pleased to inform you that after careful review of your application, you have been shortlisted for the position you applied for.

Your qualifications and experience have impressed our hiring team, and we would like to move forward with the next steps in our recruitment process.

What's Next?
• Our HR team will contact you within the next 2-3 business days
• We'll schedule a detailed interview to discuss the role further
• Please keep your phone accessible and check your email regularly

Ready to take the next step? Click the button below to access your interview portal:
{{interview_link}}

Thank you for your interest in joining our team. We look forward to speaking with you soon!

Best regards,
The {{company_name}} Team`
    },
    {
      id: 'rejection-polite',
      name: 'Polite Rejection',
      subject: 'Update on Your Application',
      description: 'Professional rejection email for candidates',
      category: 'rejection',
      variables: ['{{candidate_name}}', '{{company_name}}', '{{position}}'],
      content: `Dear {{candidate_name}},

Thank you for taking the time to apply for the {{position}} position at {{company_name}} and for your interest in joining our team.

After careful consideration of all applications, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We were impressed by your background and experience, and we encourage you to apply for future openings that match your skills and career goals.

We wish you all the best in your job search and future professional endeavors.

Best regards,
The {{company_name}} Team`
    },
    {
      id: 'interview-invitation',
      name: 'Interview Invitation',
      subject: 'Interview Invitation - {{position}}',
      description: 'Invite candidates for an interview',
      category: 'interview',
      variables: ['{{candidate_name}}', '{{company_name}}', '{{position}}', '{{interview_date}}', '{{interview_time}}', '{{interview_link}}'],
      content: `Dear {{candidate_name}},

We are pleased to invite you for an interview for the {{position}} position at {{company_name}}.

Interview Details:
• Date: {{interview_date}}
• Time: {{interview_time}}
• Format: Online Interview
• Link: {{interview_link}}

Please confirm your availability by replying to this email. If the proposed time doesn't work for you, please suggest alternative times.

We look forward to speaking with you!

Best regards,
The {{company_name}} Team`
    },
    {
      id: 'follow-up',
      name: 'Application Follow-up',
      subject: 'Thank You for Your Application',
      description: 'Acknowledge receipt of application',
      category: 'custom',
      variables: ['{{candidate_name}}', '{{company_name}}', '{{position}}'],
      content: `Dear {{candidate_name}},

Thank you for your application for the {{position}} position at {{company_name}}.

We have received your application and our hiring team is currently reviewing all submissions. We appreciate your interest in joining our team.

You can expect to hear from us within the next 5-7 business days regarding the next steps in the recruitment process.

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
The {{company_name}} Team`
    }
  ]

  // Load templates from backend
  const loadTemplates = async () => {
    try {
      setLoading(true)
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email-templates?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) throw new Error('Failed to load templates')
      const data = await response.json()
      console.log('[EmailTemplates] Loaded templates for user:', user.name, 'Count:', data.length)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
      // Fallback to default templates
      setTemplates(defaultTemplates)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadTemplates()
  }, [])

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditedContent(template.content)
    setEditedSubject(template.subject)
    setIsEditing(true)
    setPreviewMode(false)
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditedContent(template.content)
    setEditedSubject(template.subject)
    setPreviewMode(true)
    setIsEditing(false)
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          subject: editedSubject,
          content: editedContent
        })
      })

      if (!response.ok) throw new Error('Failed to save template')

      // Update local state
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, subject: editedSubject, content: editedContent }
          : t
      ))

      // Update selected template
      setSelectedTemplate({ ...selectedTemplate, subject: editedSubject, content: editedContent })

      alert('✅ Template saved successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('❌ Failed to save template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetTemplates = async () => {
    if (!confirm('Are you sure you want to reset all templates to default? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email-templates/reset`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to reset templates')

      alert('✅ Templates reset to default successfully!')
      await loadTemplates()
      setSelectedTemplate(null)
      setIsEditing(false)
    } catch (error) {
      console.error('Error resetting templates:', error)
      alert('❌ Failed to reset templates. Please try again.')
    }
  }

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(editedContent)
    alert('Template copied to clipboard!')
  }

  // Text formatting functions
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editedContent.substring(start, end)
    const beforeText = editedContent.substring(0, start)
    const afterText = editedContent.substring(end)

    const newText = beforeText + before + selectedText + after + afterText
    setEditedContent(newText)

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const formatBold = () => insertFormatting('**', '**')
  const formatItalic = () => insertFormatting('*', '*')
  const formatUnderline = () => insertFormatting('<u>', '</u>')
  const formatHeading1 = () => insertFormatting('# ')
  const formatHeading2 = () => insertFormatting('## ')
  const formatBulletList = () => insertFormatting('• ')
  const formatNumberedList = () => insertFormatting('1. ')
  const formatLink = () => insertFormatting('[', '](url)')
  const formatCode = () => insertFormatting('`', '`')

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'shortlist':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rejection':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'interview':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shortlist':
        return <Check className="w-4 h-4" />
      case 'rejection':
        return <X className="w-4 h-4" />
      case 'interview':
        return <Mail className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
        <p className="text-gray-600">Customize email templates for candidate communication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Templates</h2>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                      <span className="capitalize">{template.category}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Variables Reference */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Available Variables</span>
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-blue-800"><code className="bg-white px-1 rounded">{'{{candidate_name}}'}</code> - Candidate's name</p>
              <p className="text-blue-800"><code className="bg-white px-1 rounded">{'{{company_name}}'}</code> - Company name</p>
              <p className="text-blue-800"><code className="bg-white px-1 rounded">{'{{position}}'}</code> - Job position</p>
              <p className="text-blue-800"><code className="bg-white px-1 rounded">{'{{interview_link}}'}</code> - Interview URL</p>
              <p className="text-blue-800"><code className="bg-white px-1 rounded">{'{{interview_date}}'}</code> - Interview date</p>
              <p className="text-blue-800"><code className="bg-white px-1 rounded">{'{{interview_time}}'}</code> - Interview time</p>
            </div>
          </div>
        </div>

        {/* Template Editor/Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Editor Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h2>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => handleEditTemplate(selectedTemplate)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={handleCopyTemplate}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={handleSaveTemplate}
                          disabled={saving}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-medium">{editedSubject}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editor/Preview Content */}
              <div className="p-6">
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                    
                    {/* Formatting Toolbar */}
                    <div className="bg-gray-50 border border-gray-300 rounded-t-lg p-2 flex flex-wrap items-center gap-1">
                      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                        <button
                          type="button"
                          onClick={formatBold}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Bold (Ctrl+B)"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={formatItalic}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Italic (Ctrl+I)"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={formatUnderline}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Underline (Ctrl+U)"
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                        <button
                          type="button"
                          onClick={formatHeading1}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Heading 1"
                        >
                          <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={formatHeading2}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Heading 2"
                        >
                          <Heading2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                        <button
                          type="button"
                          onClick={formatBulletList}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Bullet List"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={formatNumberedList}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Numbered List"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={formatLink}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Insert Link"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={formatCode}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Code"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={20}
                      className="w-full px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                      placeholder="Enter your email template content..."
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          if (e.key === 'b') {
                            e.preventDefault()
                            formatBold()
                          } else if (e.key === 'i') {
                            e.preventDefault()
                            formatItalic()
                          } else if (e.key === 'u') {
                            e.preventDefault()
                            formatUnderline()
                          }
                        }
                      }}
                    />
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">Formatting Guide</p>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p><code className="bg-white px-1 rounded">**text**</code> = <strong>Bold</strong></p>
                          <p><code className="bg-white px-1 rounded">*text*</code> = <em>Italic</em></p>
                          <p><code className="bg-white px-1 rounded">&lt;u&gt;text&lt;/u&gt;</code> = <u>Underline</u></p>
                          <p><code className="bg-white px-1 rounded"># text</code> = Heading 1</p>
                          <p><code className="bg-white px-1 rounded">## text</code> = Heading 2</p>
                          <p><code className="bg-white px-1 rounded">• text</code> = Bullet point</p>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">Template Variables</p>
                            <p className="text-xs text-yellow-800 mt-1">
                              Use variables like <code className="bg-white px-1 rounded">{'{{candidate_name}}'}</code> in your template. 
                              They will be automatically replaced with actual values when sending emails.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Preview</h3>
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{previewMode ? 'Show Raw' : 'Show Preview'}</span>
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                      <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                        {editedContent}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
              <p className="text-gray-600">Choose a template from the list to view or edit it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailTemplates
