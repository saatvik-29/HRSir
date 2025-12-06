import React from 'react'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Breadcrumb
