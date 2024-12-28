import { ReactNode } from 'react'

interface ItemListProps {
  items: Array<{
    id: string
    title: ReactNode
    meta?: ReactNode
    actions?: ReactNode
  }>
  className?: string
}

export function ItemList({ items, className = '' }: ItemListProps) {
  return (
    <div className={`divide-y divide-gray-200 bg-white shadow ${className}`}>
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4"
        >
          <div className="flex-1">
            <h3 className="font-medium">{item.title}</h3>
            {item.meta && (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {item.meta}
              </div>
            )}
          </div>
          {item.actions && (
            <div className="flex items-center gap-2">
              {item.actions}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}