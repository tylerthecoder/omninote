import { ReactNode } from 'react'
import { IoMdCheckmark, IoMdTrash } from 'react-icons/io'

interface TodoItemListProps {
  title: string
  items: Array<{
    id: string
    text: string
    completed: boolean
  }>
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  className?: string
}

export function TodoItemList({ title, items, onToggle, onDelete, className = '' }: TodoItemListProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-gray-700">{title}</h2>
      <div className={`divide-y divide-gray-200 bg-white shadow ${className}`}>
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 group"
          >
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => onToggle(item.id, item.completed)}
                className={`w-5 h-5 rounded border ${
                  item.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                } flex items-center justify-center transition-colors`}
                aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {item.completed && <IoMdCheckmark className="w-4 h-4" />}
              </button>
              <span className={item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                {item.text}
              </span>
            </div>
            <button
              onClick={() => onDelete(item.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Delete todo"
            >
              <IoMdTrash className="w-5 h-5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No items
          </div>
        )}
      </div>
    </div>
  )
}