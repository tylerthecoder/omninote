import React from 'react'

interface ListCardProps {
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
  meta?: React.ReactNode
}

export function ListCard({ title, children, actions, meta }: ListCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
        {meta && (
          <div className="text-sm text-gray-600 flex flex-wrap gap-2">
            {meta}
          </div>
        )}
        {children && (
          <div className="text-gray-700">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}