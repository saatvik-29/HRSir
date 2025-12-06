import React from 'react'
import {
  Briefcase,
  Settings,
  Mail,
  BarChart3,
  FileText,
  Users,
  ChevronRight,
  Home
} from 'lucide-react'

interface SidebarProps {
  currentSection: string
  onSectionChange?: (section: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview & Jobs',
      available: true
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      description: 'Manage job postings',
      available: true
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
      description: 'View all candidates',
      available: false,
      comingSoon: true
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Hiring insights',
      available: false,
      comingSoon: true
    },
    {
      id: 'email-templates',
      label: 'Email Templates',
      icon: Mail,
      description: 'Customize emails',
      available: false,
      comingSoon: true
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'Generate reports',
      available: false,
      comingSoon: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account & preferences',
      available: false,
      comingSoon: true
    }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">HireHelper</h1>
            <p className="text-xs text-gray-500">Recruitment Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentSection === item.id
            const isClickable = item.available && onSectionChange

            return (
              <button
                key={item.id}
                onClick={() => isClickable && onSectionChange(item.id)}
                disabled={!item.available}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200'
                    : item.available
                    ? 'hover:bg-gray-50 border border-transparent'
                    : 'opacity-50 cursor-not-allowed border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-blue-100'
                        : item.available
                        ? 'bg-gray-100 group-hover:bg-gray-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-blue-600'
                          : item.available
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center space-x-2">
                      <p
                        className={`text-sm font-medium truncate ${
                          isActive
                            ? 'text-blue-900'
                            : item.available
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </p>
                      {item.comingSoon && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                </div>
                {item.available && (
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-blue-600 translate-x-0.5' : 'text-gray-400'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
          <p className="text-xs font-medium text-blue-900 mb-1">Need Help?</p>
          <p className="text-xs text-blue-700 mb-2">Check our documentation</p>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View Docs →
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
